#!/bin/bash
# Build chain for the FDE Project Handbook.
set -e
DOC=/home/z/my-project/download/FDE_Project_Handbook.docx
SK=/home/z/my-project/skills/docx/scripts
S=/home/z/my-project/scripts

echo "== 0. Project code verification =="
python3 $S/verify_proj_code.py | tail -2

echo "== 1. Generate DOCX =="
node $S/docgen/generate_proj_handbook.js

echo "== 2. TOC placeholders =="
python3 $SK/add_toc_placeholders.py "$DOC" --auto

echo "== 3. Footer/page-number patch =="
python3 $S/patch_docx.py "$DOC"

echo "== 4. TOC field cleanup =="
python3 $S/patch_toc_stray.py "$DOC"
python3 $S/patch_toc_depth.py "$DOC"
python3 $S/patch_toc_rebuild.py "$DOC" "Welcome and How to Use This Handbook" "1"
python3 $S/patch_toc_dedup.py "$DOC"

echo "== 5. Postcheck =="
python3 $SK/postcheck.py "$DOC"

echo "== 6. Structural verification =="
python3 $S/verify_docx.py "$DOC"

echo "== 7. PDF (pass 1) =="
cd /home/z/my-project/download && soffice --headless --convert-to pdf "$(basename $DOC)"

echo "== 8. Correct TOC page numbers =="
PDF="${DOC%.docx}.pdf"
python3 $S/patch_toc_pages.py "$DOC" "$PDF" 2
python3 $S/patch_toc_wrapped.py "$DOC" "$PDF" 2

echo "== 9. PDF (pass 2, final) =="
cd /home/z/my-project/download && soffice --headless --convert-to pdf "$(basename $DOC)"

echo "== 10. Final postcheck =="
python3 $SK/postcheck.py "$DOC" | tail -3

echo "BUILD COMPLETE: $DOC"
