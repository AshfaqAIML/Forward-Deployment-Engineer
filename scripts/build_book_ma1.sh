#!/bin/bash
# Build chain for Book MA-1: Everyday Mathematics for Future Engineers.
set -e
DOC=/home/z/my-project/download/Everyday_Mathematics_for_Future_Engineers.docx
SK=/home/z/my-project/skills/docx/scripts
S=/home/z/my-project/scripts

echo "== 0. Arithmetic verification =="
python3 $S/verify_math_ma1.py

echo "== 1. Generate DOCX =="
node $S/docgen/generate_book_ma1.js

echo "== 2. TOC placeholders =="
python3 $SK/add_toc_placeholders.py "$DOC" --auto

echo "== 3. Footer/page-number patch =="
python3 $S/patch_docx.py "$DOC"

echo "== 4. TOC field cleanup =="
python3 $S/patch_toc_stray.py "$DOC"
python3 $S/patch_toc_depth.py "$DOC"
python3 $S/patch_toc_rebuild.py "$DOC" "Welcome and How to Use This Book" "1"
python3 $S/patch_toc_dedup.py "$DOC"

echo "== 5. Postcheck =="
python3 $SK/postcheck.py "$DOC"

echo "== 6. Structural verification =="
python3 $S/verify_docx.py "$DOC"

echo "== 7. PDF (pass 1) =="
cd /home/z/my-project/download && soffice --headless --convert-to pdf "$(basename $DOC)"

echo "== 8. Correct TOC page numbers from the rendered PDF =="
PDF="${DOC%.docx}.pdf"
python3 $S/patch_toc_pages.py "$DOC" "$PDF" 2

echo "== 9. PDF (pass 2, final) =="
cd /home/z/my-project/download && soffice --headless --convert-to pdf "$(basename $DOC)"

echo "== 10. Final postcheck =="
python3 $SK/postcheck.py "$DOC" | tail -3

echo "BUILD COMPLETE: $DOC"
