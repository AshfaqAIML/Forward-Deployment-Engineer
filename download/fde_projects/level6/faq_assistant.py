#!/usr/bin/env python3
"""Project 6.1 - Support FAQ Assistant.

Retrieves the best FAQ entries with TF-IDF cosine similarity (stdlib only),
then asks an LLM to answer using ONLY those entries. If no LLM endpoint is
configured, or retrieval confidence is low, it falls back to showing the FAQ
text itself - the assistant must never invent policy.

Usage:
    python faq_assistant.py "Where is my order?" --offline   (no network)
    python faq_assistant.py "Where is my order?"             (needs LLM_API_URL
                                                              and LLM_API_KEY)
"""
import argparse
import json
import math
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
FAQ_PATH = os.path.join(HERE, "..", "datasets", "faq_support.md")
CONFIDENCE_THRESHOLD = 0.10  # best similarity below this -> fallback mode
# Function words that appear in almost every sentence carry no meaning for
# retrieval; question words (where, how, when...) are KEPT because they help.
STOPWORDS = {"a", "an", "the", "and", "or", "of", "to", "for", "with", "is",
             "are", "do", "does", "did", "i", "my", "me", "we", "our", "you",
             "your", "it", "in", "on", "at", "be", "this", "that", "was"}


def load_faq(path):
    """Split the FAQ markdown into {question, answer} records."""
    records = []
    current_q = None
    current_a = []
    for line in open(path, "r", encoding="utf-8"):
        if line.startswith("Q: "):
            if current_q:
                records.append({"question": current_q,
                                "answer": " ".join(current_a).strip()})
            current_q = line[3:].strip()
            current_a = []
        elif line.startswith("A: "):
            current_a.append(line[3:].strip())
        elif current_q and line.strip():
            current_a.append(line.strip())
    if current_q:
        records.append({"question": current_q,
                        "answer": " ".join(current_a).strip()})
    return records


def tokenize(text):
    return [t for t in re.findall(r"[a-z0-9]+", text.lower())
            if t not in STOPWORDS]


def build_lexical_index(token_lists):
    """Build TF-IDF vectors with one shared IDF table, plus a query encoder.

    Sharing the corpus IDF between the FAQ records and the question is what
    makes retrieval meaningful; both sides must weight terms the same way.
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
    dot = sum(weight * b.get(term, 0.0) for term, weight in a.items())
    na = math.sqrt(sum(w * w for w in a.values()))
    nb = math.sqrt(sum(w * w for w in b.values()))
    return dot / (na * nb) if na and nb else 0.0


def retrieve(question, records, vectors, encode_query, top=3):
    """Return the [(record, score)] list, best first."""
    q_vec = encode_query(tokenize(question))
    scored = [(rec, cosine(q_vec, vec)) for rec, vec in zip(records, vectors)]
    scored.sort(key=lambda pair: pair[1], reverse=True)
    return scored[:top]


def build_prompt(question, hits):
    """Assemble the grounded prompt: the model may only use these facts."""
    context = "\n\n".join(
        f"[{i + 1}] Q: {rec['question']}\nA: {rec['answer']}"
        for i, (rec, score) in enumerate(hits))
    return (
        "You are BrightCart's support assistant. Answer the customer's "
        "question using ONLY the context below. If the context does not "
        "contain the answer, say exactly: "
        "'I need to check that with a colleague - a human will follow up.'\n\n"
        f"Context:\n{context}\n\nCustomer question: {question}\nAnswer:")


def call_llm(prompt):
    """Call an OpenAI-compatible chat endpoint configured via environment."""
    import requests
    url = os.environ["LLM_API_URL"]
    payload = {
        "model": os.environ.get("LLM_MODEL", "gpt-4o-mini"),
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.2,
        "max_tokens": 300,
    }
    response = requests.post(
        url, json=payload, timeout=30,
        headers={"Authorization": "Bearer " + os.environ["LLM_API_KEY"]})
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"].strip()


def main():
    parser = argparse.ArgumentParser(description="BrightCart FAQ assistant")
    parser.add_argument("question")
    parser.add_argument("--offline", action="store_true",
                        help="show retrieval and the prompt, skip the LLM call")
    parser.add_argument("--faq", default=FAQ_PATH)
    args = parser.parse_args()

    records = load_faq(args.faq)
    vectors, encode_query = build_lexical_index(
        [tokenize(r["question"] + " " + r["answer"]) for r in records])
    hits = retrieve(args.question, records, vectors, encode_query)
    best_score = hits[0][1]

    print(f"Retrieval confidence: {best_score:.3f} "
          f"(threshold {CONFIDENCE_THRESHOLD})")
    print("Top matches:")
    for rec, score in hits:
        print(f"  [{score:.3f}] {rec['question']}")

    if best_score < CONFIDENCE_THRESHOLD:
        print("\nAssistant: I need to check that with a colleague - "
              "a human will follow up. (low retrieval confidence)")
        return

    prompt = build_prompt(args.question, hits)
    if args.offline:
        print("\n--offline mode: the prompt that would be sent is:\n")
        print(prompt)
        return

    answer = call_llm(prompt)
    print("\nAssistant:", answer)


if __name__ == "__main__":
    main()
