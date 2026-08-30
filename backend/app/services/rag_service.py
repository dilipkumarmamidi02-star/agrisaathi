"""
Lightweight RAG over AgriSaathi's own data — no vector DB needed at this
corpus size. Retrieval = TF-IDF cosine similarity over flattened JSON text
from: feature registry, crop encyclopedia, animal encyclopedia, and the
user's own localStorage snapshot (context_data) passed in per-request.

Design choice: if nothing scores above MIN_RELEVANCE, we do NOT let the LLM
free-associate an answer. We return found=False so helper_service can offer
to route the user to the closest matching page instead of hallucinating.
"""
import json
import os
from functools import lru_cache
from typing import Any

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.data.feature_registry import FEATURES
from app.core.datagov_registry import DATAGOV_REGISTRY

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
CROP_JSON = os.path.join(BASE_DIR, "frontend", "src", "data", "cropEncyclopedia.json")
ANIMAL_JSON = os.path.join(BASE_DIR, "frontend", "src", "data", "animalEncyclopedia.json")

MIN_RELEVANCE = 0.12  # cosine similarity floor — below this, treat as "not found"


def _flatten(obj: Any, prefix: str = "") -> str:
    """Turn any JSON shape into a flat searchable string, schema-agnostic."""
    parts = []
    if isinstance(obj, dict):
        for k, v in obj.items():
            parts.append(_flatten(v, f"{prefix}{k} "))
    elif isinstance(obj, list):
        for item in obj:
            parts.append(_flatten(item, prefix))
    else:
        if obj is not None and str(obj).strip():
            parts.append(f"{prefix}{obj}")
    return " ".join(p for p in parts if p)


def _load_json_safe(path: str):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


def _entries_from_json(path: str, source_label: str, route_hint: str):
    """Real shape: {"categories": [{"id","name","types": [{"id","name",...fields}]}]}.
    One retrievable document PER TYPE ENTRY (e.g. per crop, per animal breed-group),
    not one blob for the whole file — that was the bug."""
    data = _load_json_safe(path)
    if not data:
        return []

    docs = []
    categories = data.get("categories", []) if isinstance(data, dict) else []
    for cat in categories:
        if not isinstance(cat, dict):
            continue
        cat_name = cat.get("name", "")
        for entry in cat.get("types", []):
            if not isinstance(entry, dict):
                continue
            name = entry.get("name") or source_label
            # Prefix with name + category twice so short queries like "rice"
            # or "broiler" get strong TF-IDF weight on the entry that
            # actually IS that crop/animal, not a coincidental mention.
            text = f"{name} {name} {cat_name} " + _flatten(entry)
            docs.append({
                "source": source_label,
                "title": name,
                "text": text,
                "route": route_hint,
            })
    return docs


@lru_cache(maxsize=1)
def _static_corpus():
    """Cached corpus of everything that doesn't change per-request:
    feature registry + both encyclopedias. Clears on process restart —
    fine for dev; for prod, invalidate this cache when the JSON files change."""
    docs = []
    for f in FEATURES:
        docs.append({
            "source": "feature_registry",
            "title": f["name"],
            "text": f'{f["name"]} {f.get("description","")} {" ".join(f.get("keywords", []))}',
            "route": f["route"],
        })
    docs += _entries_from_json(CROP_JSON, "crop_encyclopedia", "/crop-planner")
    docs += _entries_from_json(ANIMAL_JSON, "animal_encyclopedia", "/animal-encyclopedia")

    # Data.gov.in resource registry — authoritative source is
    # app/core/datagov_registry.py (used by the real /api/data-gov routes).
    # This just makes those same 72 resources retrievable as RAG passages,
    # so a query can surface "what dataset covers X" with correct temporal
    # labeling, without maintaining a second copy of the registry.
    for r in DATAGOV_REGISTRY:
        temporal_status = (
            r["temporal_status"].value
            if hasattr(r["temporal_status"], "value")
            else r["temporal_status"]
        )
        temporal_note = (
            f"This is a {temporal_status.lower()} dataset — treat it as historical, not current."
            if temporal_status == "HISTORICAL"
            else ""
        )
        docs.append({
            "source": "datagov_resource",
            "title": r["resource_name"],
            "text": f"{r['resource_name']} {r['primary_feature']} Data.gov.in {temporal_note}",
            "route": None,  # route resolution stays with feature_registry.py; avoids a third route mapping
        })

    return docs


def retrieve(query: str, context_data: dict | None = None, top_k: int = 4):
    """Returns (found: bool, passages: list[dict], best_route_suggestion: dict|None)."""
    docs = list(_static_corpus())

    # Fold in the user's OWN data (their farm/soil/crop records) as extra
    # retrievable documents, scoped to this request only — not cached.
    if context_data:
        for key, value in context_data.items():
            text = _flatten(value, f"{key} ")
            if text:
                docs.append({"source": "user_data", "title": key, "text": text, "route": None})

    if not docs or not query.strip():
        return False, [], None

    corpus_texts = [d["text"] for d in docs]
    try:
        vectorizer = TfidfVectorizer(stop_words="english")
        matrix = vectorizer.fit_transform(corpus_texts + [query])
        sims = cosine_similarity(matrix[-1], matrix[:-1])[0]
    except ValueError:
        # e.g. query is only stopwords/punctuation
        return False, [], None

    ranked = sorted(zip(docs, sims), key=lambda x: x[1], reverse=True)
    top = [(d, s) for d, s in ranked[:top_k] if s >= MIN_RELEVANCE]

    if not top:
        # Nothing relevant enough for a real answer. Only suggest a route if
        # the closest FEATURE page itself clears a (lower) floor — otherwise
        # we'd be recommending a near-random page, which is worse than
        # saying nothing.
        SUGGEST_FLOOR = 0.06
        feature_ranked = [(d, s) for d, s in ranked if d["source"] == "feature_registry" and s >= SUGGEST_FLOOR]
        best_feature = feature_ranked[0][0] if feature_ranked else None
        return False, [], best_feature

    passages = [{"source": d["source"], "title": d["title"], "text": d["text"][:600], "route": d["route"]} for d, s in top]
    return True, passages, None
