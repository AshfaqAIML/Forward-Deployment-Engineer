"""data.py — the approved-content source of truth for the pipeline.

Loads the platform's content package (seed/content.json — the same reviewed
material the website serves) and resolves each book's chapters against the
full lesson corpus via books/<slug>/book.json. Provides exercises_for,
glossary and references to the builders.
"""
import json
import os

from .chapter import Chapter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_SEED = os.environ.get(
    "FDE_CONTENT", os.path.join(ROOT, "..", "fde-academy-backend", "seed", "content.json"))


class BookData:
    def __init__(self, spec, corpus):
        self.spec = spec
        self.corpus = corpus
        self.lessons_by_code = {l["code"]: l for l in corpus["lessons"]}
        self.chapters = []
        for i, c in enumerate(spec["chapters"], 1):
            first = c["lessons"][0]
            if len(c["lessons"]) == 1 and not first.startswith("project:"):
                lesson = self.lessons_by_code[first]
                title = c.get("title") or lesson["title"]
                ch = Chapter(i, title, lesson)
            else:
                ch = self._composite(i, c)
            self.chapters.append(ch)

    class _CompositeLesson(dict):
        """A chapter composed of several approved sources, presented as one
        lesson-shaped object (title, objectives, content, quiz)."""

    def _composite(self, i, c):
        content = []
        objectives = []
        quiz = []
        title = c.get("title") or f"Chapter {i}"
        for src in c["lessons"]:
            if src.startswith("project:"):
                _, flt = src.split(":", 1)
                lo, hi = (int(x) for x in flt.split("-"))
                for p in self.corpus["projects"]:
                    if lo <= p["level"] <= hi:
                        content.append({"t": "p", "x": f"{p['title']} — {p['customer']}. {p['brief']}"})
                        for st in p.get("steps", []):
                            content.append({"t": "ul", "items": [st]})
                        if p.get("deliverables"):
                            content.append({"t": "p", "x": "Deliverables: " + "; ".join(p["deliverables"])})
                continue
            lesson = self.lessons_by_code[src]
            title = c.get("title") or title if len(c["lessons"]) == 1 else c.get("title", title)
            content.extend(lesson["content"])
            objectives.extend(lesson.get("objectives", []))
            quiz.extend(lesson.get("quiz", []))
        # de-duplicate consecutive identical blocks from overlapping sources
        seen = set()
        uniq = []
        for b in content:
            key = json.dumps(b, sort_keys=True, ensure_ascii=False)
            if key in seen:
                continue
            seen.add(key)
            uniq.append(b)
        lesson = {"code": "composite-" + title.lower().replace(" ", "-")[:24],
                  "title": title, "objectives": objectives[:6], "content": uniq, "quiz": quiz}
        return Chapter(i, title, self._CompositeLesson(lesson))

    def exercises_for(self, lesson_code):
        """Linked platform exercises (coding + math) for a lesson, if any."""
        out = []
        for e in self.corpus.get("codingExercises", []):
            if e.get("linkedLessonCode") == lesson_code:
                sol = next((s["content"] for s in self.corpus.get("exerciseSolutions", [])
                            if s.get("ownerCode") == e["code"]), None)
                out.append(({**e, "solution": e.get("solution") or sol}, "coding"))
        for e in self.corpus.get("mathExercises", []):
            if e.get("linkedLessonCode") == lesson_code:
                out.append((e, "math"))
        return out

    def glossary(self):
        cats = set(self.spec.get("glossaryCategories", []))
        terms = [g for g in self.corpus["glossary"] if not cats or g.get("category") in cats]
        return sorted(terms, key=lambda t: t["term"].lower())

    @property
    def references(self):
        return self.spec.get("references", [])

    def filename(self):
        """Consistent, filesystem-safe names: FDE_Mathematics_Logic_and_Proof_v1"""
        import re
        def clean(s):
            s = s.replace(" & ", " and ").replace("&", " and ")
            s = re.sub(r"[:'’]", "", s)
            s = re.sub(r"\s+", "_", s)
            return re.sub(r"[^A-Za-z0-9_]", "", s)
        sub = clean(self.spec["subject"])
        title = clean(self.spec["title"])
        v = self.spec["version"].split(".")[0]
        return f"FDE_{sub}_{title}_v{v}"


def load(book_slug):
    corpus = json.load(open(BACKEND_SEED, encoding="utf-8"))
    spec = json.load(open(os.path.join(ROOT, "books", book_slug, "book.json"), encoding="utf-8"))
    return spec, BookData(spec, corpus)


def load_all():
    corpus = json.load(open(BACKEND_SEED, encoding="utf-8"))
    books = []
    for slug in ("fm", "alg", "log", "gph", "ps", "hb"):
        spec = json.load(open(os.path.join(ROOT, "books", slug, "book.json"), encoding="utf-8"))
        books.append((spec, BookData(spec, corpus)))
    return books
