"""Endpoints admin de la chaîne « Analyses + résultats » (voir services/analyses.py)."""

from typing import Any

from fastapi import APIRouter, BackgroundTasks, Body, Depends, HTTPException, Response, UploadFile
from sqlalchemy.orm import Session

from ..auth import require_admin
from ..db import get_db
from ..models import Analysis, Audit
from ..schemas import AnalysisOut, AnalysisSummary
from ..services import analyses as service

router = APIRouter(tags=["analyses"], dependencies=[Depends(require_admin)])


def _get(db: Session, analysis_id: str) -> Analysis:
    analysis = db.get(Analysis, analysis_id)
    if not analysis:
        raise HTTPException(404, "Analyse introuvable")
    return analysis


def _out(db: Session, analysis: Analysis) -> AnalysisOut:
    audit = db.get(Audit, analysis.audit_id)
    out = AnalysisOut.model_validate(analysis)
    if audit:
        out.audit_file_name, out.audit_token = audit.file_name, audit.token
    return out


def _audit(db: Session, analysis: Analysis) -> Audit:
    audit = db.get(Audit, analysis.audit_id)
    if not audit:
        raise HTTPException(404, "Audit introuvable")
    return audit


def _guard(exc: service.AuditError) -> HTTPException:
    return HTTPException(409, str(exc))


@router.get("/analyses", response_model=list[AnalysisSummary], response_model_by_alias=True)
def list_analyses(db: Session = Depends(get_db)) -> list[AnalysisSummary]:
    rows = db.query(Analysis).order_by(Analysis.created_at.desc()).all()
    names = {a.id: a.file_name for a in db.query(Audit).filter(
        Audit.id.in_([r.audit_id for r in rows])).all()} if rows else {}
    out = []
    for r in rows:
        s = AnalysisSummary.model_validate(r)
        s.audit_file_name = names.get(r.audit_id)
        out.append(s)
    return out


@router.post("/audit/{audit_id}/analysis", response_model=AnalysisOut, response_model_by_alias=True)
def order_analysis(audit_id: str, db: Session = Depends(get_db)) -> AnalysisOut:
    """Commande l'analyse d'un audit livré (idempotent)."""
    audit = db.get(Audit, audit_id)
    if not audit:
        raise HTTPException(404, "Audit introuvable")
    try:
        return _out(db, service.create(db, audit))
    except service.AuditError as exc:
        raise _guard(exc) from exc


@router.get("/analyses/{analysis_id}", response_model=AnalysisOut, response_model_by_alias=True)
def get_analysis(analysis_id: str, db: Session = Depends(get_db)) -> AnalysisOut:
    return _out(db, _get(db, analysis_id))


@router.put("/analyses/{analysis_id}/instructions", response_model=AnalysisOut,
            response_model_by_alias=True)
def put_instructions(analysis_id: str, text: str = Body(..., embed=True),
                     db: Session = Depends(get_db)) -> AnalysisOut:
    return _out(db, service.set_instructions(db, _get(db, analysis_id), text))


@router.post("/analyses/{analysis_id}/base", response_model=AnalysisOut,
             response_model_by_alias=True)
def upload_base(analysis_id: str, file: UploadFile, db: Session = Depends(get_db)) -> AnalysisOut:
    try:
        return _out(db, service.save_base(db, _get(db, analysis_id), file.file,
                                          file.filename or "base.xlsx"))
    except service.AuditError as exc:
        raise _guard(exc) from exc


@router.delete("/analyses/{analysis_id}/base", response_model=AnalysisOut,
               response_model_by_alias=True)
def delete_base(analysis_id: str, db: Session = Depends(get_db)) -> AnalysisOut:
    """Revient à la base de l'audit."""
    try:
        return _out(db, service.drop_base(db, _get(db, analysis_id)))
    except service.AuditError as exc:
        raise _guard(exc) from exc


@router.post("/analyses/{analysis_id}/plan/generate", response_model=AnalysisOut,
             response_model_by_alias=True, status_code=202)
def generate_plan(analysis_id: str, background: BackgroundTasks,
                  db: Session = Depends(get_db)) -> AnalysisOut:
    """Nettoyage et plan proposés par l'IA (contre-audit si base corrigée déposée), en
    tâche de fond."""
    analysis = _get(db, analysis_id)
    try:
        job_id = service.claim(db, analysis, "plan")
    except service.AuditError as exc:
        raise _guard(exc) from exc
    background.add_task(service.run_planning, analysis.id, job_id)
    return _out(db, analysis)


@router.put("/analyses/{analysis_id}/plan", response_model=AnalysisOut,
            response_model_by_alias=True)
def put_plan(analysis_id: str, plan: dict[str, Any] = Body(...),
             db: Session = Depends(get_db)) -> AnalysisOut:
    """Plan écrit ou corrigé à la main (validé avant d'être gardé)."""
    try:
        analysis = _get(db, analysis_id)
        return _out(db, service.save_plan(db, analysis, _audit(db, analysis), plan))
    except service.AuditError as exc:
        raise _guard(exc) from exc


@router.post("/analyses/{analysis_id}/compute", response_model=AnalysisOut,
             response_model_by_alias=True, status_code=202)
def validate_and_compute(analysis_id: str, background: BackgroundTasks,
                         db: Session = Depends(get_db)) -> AnalysisOut:
    """Plan validé : calculs puis rédaction, en tâche de fond."""
    analysis = _get(db, analysis_id)
    try:
        job_id = service.claim(db, analysis, "compute")
    except service.AuditError as exc:
        raise _guard(exc) from exc
    background.add_task(service.run_computing, analysis.id, job_id)
    return _out(db, analysis)


@router.post("/analyses/{analysis_id}/deliver", response_model=AnalysisOut,
             response_model_by_alias=True)
def deliver(analysis_id: str, db: Session = Depends(get_db)) -> AnalysisOut:
    analysis = _get(db, analysis_id)
    try:
        return _out(db, service.deliver(db, analysis, _audit(db, analysis)))
    except service.AuditError as exc:
        raise _guard(exc) from exc


def file_response(analysis: Analysis, audit: Audit, kind: str) -> Response:
    if kind not in service.DELIVERABLES:
        raise HTTPException(404, "Livrable inconnu")
    try:
        content, media = service.build_deliverable(analysis, audit, kind)
    except service.AuditError as exc:
        raise HTTPException(404, str(exc)) from exc
    return Response(content=content, media_type=media,
                    headers={"Content-Disposition": f'attachment; filename="{kind}"'})


@router.get("/analyses/{analysis_id}/{kind}")
def download(analysis_id: str, kind: str, db: Session = Depends(get_db)) -> Response:
    analysis = _get(db, analysis_id)
    return file_response(analysis, _audit(db, analysis), kind)
