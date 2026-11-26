#!/usr/bin/env python3
"""Project 6.2 - Legal Document Search (with offline lexical fallback).

Chunks the firm's memos, embeds the chunks with an embeddings endpoint, and
answers queries with cosine similarity. Without an endpoint configured it
falls back to TF-IDF lexical vectors - same interface, lower quality, honest.

Usage:
    python doc_search.py "retention period for matter documents" --offline
    python doc_search.py "how long do we keep client files"
"""
import argparse
import math
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
DOCS_DIR = os.path.join(HERE, "..", "datasets", "legal_docs")
MAX_CHUNK_CHARS = 600


def load_documents(docs_dir):
    """Read every .txt file as {name, text}."""
    documents = []
    for name in sorted(os.listdir(docs_dir)):
        if name.endswith(".txt"):
            text = open(os.path.join(docs_dir, name), "r",
                        encoding="utf-8").read()
            documents.append({"name": name, "text": text})
    return documents


def chunk_text(text):
    """Split a memo into chunks of roughly MAX_CHUNK_CHARS at sentence ends."""
    sentences = re.split(r"(?<=[.!?])\s+", text.replace("\n", " ").strip())
    chunks, current = [], ""
    for sentence in sentences:
        if current and len(current) + len(sentence) > MAX_CHUNK_CHARS:
            chunks.append(current.strip())
            current = ""
        current += sentence + " "
    if current.strip():
        chunks.append(current.strip())
    return chunks


def tokenize(text):
    return re.findall(r"[a-z0-9]+", text.lower())


def build_lexical_index(token_lists):
    """Build TF-IDF vectors with one shared IDF table, plus a query encoder.

    Sharing the corpus IDF between chunks and queries is what makes lexical
    retrieval meaningful; each side must weight terms the same way.
    """
    n = len(token_lists)
    df = {}
    for tokens in token_lists:
        for term in set(tokens):
            df[term] = df.get(term, 0) + 1
    idf = {term: math.log(n / c) + 1.0 for term, c in df.items()}

    def encode(tokens):
        counts = {}
        for t in tokens:
            counts[t] = counts.get(t, 0) + 1
        return {t: (1 + math.log(c)) * idf.get(t, 1.0) for t, c in counts.items()}

    return [encode(tokens) for tokens in token_lists], encode


def cosine(a, b):
    dot = sum(w * b.get(t, 0.0) for t, w in a.items())
    na = math.sqrt(sum(w * w for w in a.values()))
    nb = math.sqrt(sum(w * w for w in b.values()))
    return dot / (na * nb) if na and nb else 0.0


def embed_texts(texts):
    """Call an OpenAI-compatible embeddings endpoint via environment config."""
    import requests
    response = requests.post(
        os.environ["EMBED_API_URL"],
        headers={"Authorization": "Bearer " + os.environ["EMBED_API_KEY"]},
        json={"model": os.environ.get("EMBED_MODEL", "text-embedding-3-small"),
              "input": texts}, timeout=60)
    response.raise_for_status()
    data = response.json()["data"]
    return [item["embedding"] for item in data]


def vector_cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(x * x for x in b))
    return dot / (na * nb) if na and nb else 0.0


def search(query, chunks, mode):
    """Return [(chunk, score)], best first."""
    if mode == "embeddings":
        query_vec = embed_texts([query])[0]
        chunk_vecs = embed_texts([c["text"] for c in chunks])
        scored = [(c, vector_cosine(query_vec, v))
                  for c, v in zip(chunks, chunk_vecs)]
    else:
        q_vec = chunks["query_vec"]
        scored = [(c, cosine(q_vec, c["vec"])) for c in chunks["list"]]
    scored.sort(key=lambda pair: pair[1], reverse=True)
    return scored


def main():
    parser = argparse.ArgumentParser(description="Legal document search")
    parser.add_argument("query")
    parser.add_argument("--docs", default=DOCS_DIR)
    parser.add_argument("--offline", action="store_true",
                        help="use lexical TF-IDF instead of embeddings")
    parser.add_argument("--top", type=int, default=3)
    args = parser.parse_args()

    mode = "lexical" if args.offline else "embeddings"
    documents = load_documents(args.docs)
    chunks = []
    for doc in documents:
        for part in chunk_text(doc["text"]):
            chunks.append({"text": part, "doc": doc["name"]})

    if mode == "lexical":
        token_lists = [tokenize(c["text"]) for c in chunks]
        vectors, encode_query = build_lexical_index(token_lists)
        for c, vec in zip(chunks, vectors):
            c["vec"] = vec
        chunk_bundle = {"list": chunks, "query_vec": encode_query(
            tokenize(args.query))}
        results = search(args.query, chunk_bundle, mode)[:args.top]
    else:
        results = search(args.query, chunks, mode)[:args.top]

    print(f"mode: {mode} | chunks searched: {len(chunks)}")
    for chunk, score in results:
        print(f"[{score:.3f}] {chunk['doc']}")
        print("        " + chunk["text"][:140].strip() + "...")


if __name__ == "__main__":
    main()
