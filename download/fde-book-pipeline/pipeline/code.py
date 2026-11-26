"""code.py — minimal, dependency-free syntax highlighting for the print
listings (JavaScript, SQL, HTTP). Tokenises into colored runs for python-docx.
"""
import re

KEYWORDS_JS = {"let", "const", "var", "function", "return", "if", "else", "for",
               "while", "of", "in", "new", "class", "this", "true", "false",
               "null", "undefined", "typeof", "=>", "console", "Math"}
KEYWORDS_SQL = {"SELECT", "FROM", "WHERE", "GROUP", "BY", "ORDER", "JOIN", "ON",
                "INSERT", "INTO", "VALUES", "UPDATE", "SET", "CREATE", "TABLE",
                "COUNT", "SUM", "AVG", "AS", "AND", "OR", "LIMIT", "WITH"}

INK = "1F2430"; KW = "1E3A5F"; STR = "2E7D74"; NUM = "B45309"; COM = "8A94A3"


def tokens_for(code, lang):
    """Yield (text, color) pairs. Comment/string-aware, keyword-colored."""
    lang_l = (lang or "").lower()
    kws = KEYWORDS_SQL if "sql" in lang_l else KEYWORDS_JS
    out = []
    pattern = re.compile(
        r"(//[^\n]*|--[^\n]*|#[^\n]*)"          # comments
        r"|(\"(?:[^\"\\\\]|\\\\.)*\"|'(?:[^'\\\\]|\\\\.)*')"   # strings
        r"|(\b\d+(?:\.\d+)?\b)"                 # numbers
        r"|([A-Za-z_][A-Za-z0-9_]*)"            # words
        r"|(\s+|.)", re.S)
    for m in pattern.finditer(code):
        com, string, num, word, other = m.groups()
        if com:
            out.append((com, COM))
        elif string:
            out.append((string, STR))
        elif num:
            out.append((num, NUM))
        elif word:
            if word in kws or word.upper() in kws:
                out.append((word, KW))
            else:
                out.append((word, INK))
        else:
            out.append((other, INK))
    return out
