"""Le plan d'analyse : JSON fermé, proposé par l'IA, validé (et modifiable) par Dr Hamza,
exécuté par le code. Aucune analyse hors de ces types ; le moteur choisit le test exact
selon les données (normalité, effectifs attendus)."""

from __future__ import annotations

from typing import Annotated, Literal

from pydantic import BaseModel, Field, field_validator

from .expr import ExprError, columns_used

VarType = Literal["quantitative", "categorical", "binary"]


class Exclusion(BaseModel):
    """Motif d'exclusion : les lignes où `expr` est vraie sortent de l'analyse (jamais
    supprimées : `INCLUS_ANALYSE` = 0 et le motif, pour le diagramme de flux)."""
    label: str
    expr: str


class Population(BaseModel):
    description: str = ""
    exclusions: list[Exclusion] = []


class Derived(BaseModel):
    """Colonne calculée, ajoutée à la base d'analyse (le fichier d'origine ne change pas)."""
    name: str
    label: str = ""
    kind: Literal["formula", "recode", "bins", "parse_number", "pct_change"]
    type: VarType = "quantitative"
    rationale: str = ""
    expr: str | None = None                          # formula
    source: str | None = None                        # recode, bins, parse_number
    mapping: dict[str, str | float | int | None] = {}  # recode : valeur lue → valeur
    cuts: list[float] = []                           # bins : bornes, intervalles [a, b[
    labels: list[str] = []                           # bins : un libellé par intervalle
    baseline: str | None = None                      # pct_change
    follow_up: str | None = None                     # pct_change


class Variable(BaseModel):
    name: str
    label: str = ""
    type: VarType


class Describe(BaseModel):
    kind: Literal["describe"]
    id: str
    title: str
    variables: list[Variable]
    by_group: bool = True


class Proportion(BaseModel):
    kind: Literal["proportion"]
    id: str
    title: str
    variable: str
    event: str | float | int                         # valeur qui compte comme « événement »
    event_label: str = ""                            # « Succès complet »


class Compare(BaseModel):
    kind: Literal["compare"]
    id: str
    title: str
    variables: list[Variable]
    group: str | None = None                         # défaut : plan.groups.variable


class Paired(BaseModel):
    kind: Literal["paired"]
    id: str
    title: str
    label: str                                       # « SpO2 (%) »
    times: list[str]                                 # libellés : « J0 », « J1 », « J3 »
    variables: list[str]                             # une colonne par temps, même ordre


class Correlation(BaseModel):
    kind: Literal["correlation"]
    id: str
    title: str
    x: str
    y: str


class Logistic(BaseModel):
    kind: Literal["logistic"]
    id: str
    title: str
    outcome: str
    event: str | float | int
    covariates: list[Variable]


Analysis = Annotated[Describe | Proportion | Compare | Paired | Correlation | Logistic,
                     Field(discriminator="kind")]


class Groups(BaseModel):
    variable: str
    label: str = ""


class AnalysisPlan(BaseModel):
    title: str = "Plan d'analyse"
    population: Population = Population()
    derived: list[Derived] = []
    groups: Groups | None = None
    analyses: list[Analysis] = []
    primary: str | None = None                       # id de l'analyse du critère principal
    not_supported: list[str] = []                    # à faire par le biostatisticien
    questions: list[str] = []                        # points à trancher avant de calculer
    alpha: float = 0.05

    @field_validator("analyses")
    @classmethod
    def _unique_ids(cls, v: list) -> list:
        ids = [a.id for a in v]
        if len(ids) != len(set(ids)):
            raise ValueError("identifiants d'analyses en double")
        return v


def plan_problems(plan: AnalysisPlan, columns: list[str]) -> list[str]:
    """Vérifie un plan sans l'exécuter : colonnes connues, expressions valides, analyse
    principale existante. Retourne la liste des problèmes (vide si le plan est sain)."""
    known = set(columns)
    problems: list[str] = []

    def need(name: str | None, where: str) -> None:
        if name and name not in known:
            problems.append(f"{where} : colonne inconnue « {name} »")

    def check_expr(expr: str | None, where: str) -> None:
        if not expr:
            problems.append(f"{where} : expression vide")
            return
        try:
            for c in columns_used(expr):
                need(c, where)
        except ExprError as exc:
            problems.append(f"{where} : {exc}")

    for e in plan.population.exclusions:
        check_expr(e.expr, f"exclusion « {e.label} »")
    for d in plan.derived:
        where = f"colonne calculée « {d.name} »"
        if d.kind == "formula":
            check_expr(d.expr, where)
        elif d.kind == "pct_change":
            need(d.baseline, where)
            need(d.follow_up, where)
        else:
            need(d.source, where)
        if d.kind == "bins" and (len(d.cuts) < 2 or len(d.labels) != len(d.cuts) - 1):
            problems.append(f"{where} : il faut n bornes et n − 1 libellés")
        known.add(d.name)  # utilisable par les suivantes
    if plan.groups:
        need(plan.groups.variable, "groupes")
    for a in plan.analyses:
        where = f"analyse « {a.id} »"
        if isinstance(a, Describe | Compare):
            for v in a.variables:
                need(v.name, where)
            if isinstance(a, Compare) and not (a.group or plan.groups):
                problems.append(f"{where} : aucun groupe de comparaison")
            if isinstance(a, Compare):
                need(a.group, where)
        elif isinstance(a, Proportion):
            need(a.variable, where)
        elif isinstance(a, Paired):
            for col in a.variables:
                need(col, where)
            if len(a.variables) < 2 or len(a.variables) != len(a.times):
                problems.append(f"{where} : un libellé par temps, au moins deux temps")
        elif isinstance(a, Correlation):
            need(a.x, where)
            need(a.y, where)
        elif isinstance(a, Logistic):
            need(a.outcome, where)
            for v in a.covariates:
                need(v.name, where)
    if plan.primary and plan.primary not in {a.id for a in plan.analyses}:
        problems.append(f"analyse principale « {plan.primary} » absente du plan")
    return problems
