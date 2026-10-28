"""Schéma public de la fiche de mission d'une thèse (formulaire de l'étudiant et de
l'admin). C'est le JSON de Dr Hamza, servi tel quel : aucune donnée personnelle."""

from typing import Any

from fastapi import APIRouter

from ..theses import fiche

router = APIRouter(prefix="/theses", tags=["theses"])


@router.get("/fiche-schema")
def fiche_schema() -> dict[str, Any]:
    return {"version": fiche.schema().get("version"), "champs": fiche.fields()}
