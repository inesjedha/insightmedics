"""Purge manuelle des audits expirés (le serveur la lance aussi tout seul).

Usage, depuis backend/ :  python -m scripts.purge_expired
"""

from app.db import SessionLocal, init_db
from app.services.retention import purge_expired


def main() -> None:
    init_db()
    with SessionLocal() as db:
        report = purge_expired(db)
    print(f"{report.audits} audit(s) purgé(s), {report.orphan_dirs} dossier(s) orphelin(s).")


if __name__ == "__main__":
    main()
