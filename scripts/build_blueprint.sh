#!/bin/bash
# Full reproducible build chain for the FDE Academy Master Project Blueprint.
set -e
GEN=/home/z/my-project/scripts/docgen/generate_blueprint.js
DOCX=/home/z/my-project/download/FDE_Academy_Master_Blueprint.docx
SK=/home/z/my-project/skills/docx/scripts

echo "== 1. generate =="
cd /home/z/my-project/scripts/docgen && node "$GEN"

echo "== 2. TOC placeholders =="
python3 "$SK/add_toc_placeholders.py" "$DOCX" --auto

echo "== 3. footer + pgNumType patch =="
python3 /home/z/my-project/scripts/patch_docx.py

echo "== 4. TOC stray-run cleanup =="
python3 /home/z/my-project/scripts/patch_toc_stray.py

echo "== 5. TOC field paragraph rebuild =="
python3 /home/z/my-project/scripts/patch_toc_rebuild.py "$DOCX"

echo "== 5b. TOC dedup =="
python3 /home/z/my-project/scripts/patch_toc_dedup.py "$DOCX"

echo "== 6. postcheck =="
python3 "$SK/postcheck.py" "$DOCX"

echo "== 7. python-docx verification =="
python3 /home/z/my-project/scripts/verify_docx.py

echo "== 8. PDF + page render =="
cd /home/z/my-project/download
soffice --headless --convert-to pdf FDE_Academy_Master_Blueprint.docx >/dev/null 2>&1
rm -rf /tmp/render && mkdir -p /tmp/render
pdftoppm -r 60 -jpeg -jpegopt quality=60 FDE_Academy_Master_Blueprint.pdf /tmp/render/page
ls /tmp/render | wc -l
echo "== build chain complete =="
