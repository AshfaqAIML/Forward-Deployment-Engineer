# FDE Project Handbook - Source Code and Datasets

Companion package for the FDE Academy Project Handbook (Levels 1-7).
Every code listing printed in the handbook is read from these files, so
book and code always match. All Python projects run on the standard
library unless a requirements.txt says otherwise; the verifier in the
Academy sandbox runs 48 automated checks over this package.

## Layout

- datasets/           practice data used by projects 3-7
    sales_data_raw.csv      DIRTY on purpose: casing chaos, missing units,
                            duplicates, impossible dates (144 rows)
    sales_data_clean.csv    produced by level3/clean_sales.py (132 rows)
    feedback_tickets.csv    90 support tickets with ratings (Project 4.2)
    faq_support.md          8-question FAQ knowledge base (Project 6.1)
    legal_docs/             six invented training memos (Project 6.2)
- level2/             Python CLI projects
    expense_tracker.py      Project 2.1 (JSON persistence, 4 commands)
    sales_report.py         Project 2.2 (CSV in, dated report out)
- level3/             Data and databases
    clean_sales.py          Project 3.1 (rules + audit log + conservation)
    build_sales_db.py       Project 3.2 (loads clean CSV into SQLite)
    queries.sql             Project 3.2 (eight verified reporting queries)
- level4/             Applications (FastAPI + SQLite + static page)
    task_app/               Project 4.1 (CRUD API, health endpoint, page)
    feedback_app/           Project 4.2 (stats API + dashboard page)
- level5/             Cloud and deployment
    Dockerfile              Project 5.1 (non-root, volume, pinned deps)
    docker-compose.yml      Project 5.1 (api + nginx, healthcheck)
    nginx.conf              Project 5.1 (reverse proxy config)
    ops/backup_db.py        Project 5.2 (SQLite online backup + rotation)
    ops/uptime_monitor.sh   Project 5.2 (health check, log, alert rule)
- level6/             AI engineering
    faq_assistant.py        Project 6.1 (TF-IDF retrieval + grounded LLM)
    eval_faq.json           Project 6.1 (10-probe evaluation set)
    doc_search.py           Project 6.2 (chunking, embeddings, offline
                            lexical fallback)
- level7/             (no new code: engagements 7.1-7.3 extend Level 6
                       patterns; code listings appear in the handbook)

## Honesty note

Level 5 packaging (Dockerfile, compose, nginx) is written and lint-checked
but was NOT executed in the Academy sandbox (no Docker binary); the handbook
says so. Run those on your own machine and mark the runbook lines as tested.
The AI projects' retrieval, fallbacks, and evaluation sets run fully offline;
live LLM/embeddings calls need your own endpoint via environment variables.

## Verify everything

    python scripts/verify_proj_code.py     (in the Academy sandbox)
