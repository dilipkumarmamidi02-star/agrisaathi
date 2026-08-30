"""
Agri Helper backend brain — data_query (RAG-grounded) and open chat only.
Navigation is handled entirely client-side (useHelperRouter.js /
pageRouter.js) — this file does NOT guess routes anymore, it only answers
questions using retrieved passages, and suggests a route when nothing
relevant was found.
"""
import json
from groq import Groq
from app.core.config import settings
from app.schemas.helper import HelperChatRequest, HelperChatResponse
from app.services.rag_service import retrieve
from app.services.advisory_ledger import append_record
from app.data.feature_registry import ROUTE_TO_FEATURE

client = Groq(api_key=settings.groq_api_key)

# Static fallback replies that bypass the LLM entirely — these must be
# localized by hand since there's no model call to carry req.language
# through for them.
_FALLBACK_NOT_FOUND = {
    "en": "I don't have that exact detail on record.",
    "hi": "\u092e\u0947\u0930\u0947 \u092a\u093e\u0938 \u0935\u0939 \u0938\u091f\u0940\u0915 \u091c\u093e\u0928\u0915\u093e\u0930\u0940 \u0930\u093f\u0915\u0949\u0930\u094d\u0921 \u092e\u0947\u0902 \u0928\u0939\u0940\u0902 \u0939\u0948\u0964",
    "te": "\u0c28\u0c3e\u0c15\u0c41 \u0c06 \u0c16\u0c1a\u0c4d\u0c1a\u0c3f\u0c24\u0c2e\u0c48\u0c28 \u0c35\u0c3f\u0c35\u0c30\u0c3e\u0c32\u0c41 \u0c30\u0c3f\u0c15\u0c3e\u0c30\u0c4d\u0c21\u0c41\u0c32\u0c4b \u0c32\u0c47\u0c35\u0c41.",
}
_FALLBACK_TRY_REPHRASE = {
    "en": "Could you try rephrasing?",
    "hi": "\u0915\u094d\u092f\u093e \u0906\u092a \u0926\u094f\u092c\u093e\u0930\u093e \u0915\u094b\u0936\u093f\u0936 \u0915\u0930 \u0938\u0915\u0924\u0947 \u0939\u0948\u0902?",
    "te": "\u0c2e\u0c40\u0c30\u0c41 \u0c2e\u0c33\u0c4d\u0c33\u0c40 \u0c1a\u0c46\u0c2a\u0c4d\u0c2a\u0c3f \u0c1a\u0c42\u0c21\u0c17\u0c32\u0c30\u0c3e?",
}
_FALLBACK_TAKE_TO = {
    "en": "I can take you to {label} for more.",
    "hi": "\u092e\u0948\u0902 \u0906\u092a\u0915\u094b \u0905\u0927\u093f\u0915 \u091c\u093e\u0928\u0915\u093e\u0930\u0940 \u0915\u0947 \u0932\u093f\u090f {label} \u092a\u0930 \u0932\u0947 \u091c\u093e \u0938\u0915\u0924\u093e \u0939\u0942\u0902\u0964",
    "te": "\u0c2e\u0c30\u0c3f\u0c28\u0c4d\u0c28\u0c3f \u0c35\u0c3f\u0c35\u0c30\u0c3e\u0c32 \u0c15\u0c4b\u0c38\u0c02 \u0c28\u0c47\u0c28\u0c41 \u0c2e\u0c40\u0c2e\u0c41\u0c32\u0c4d\u0c28\u0c3f {label}\u0c15\u0c3f \u0c24\u0c40\u0c38\u0c41\u0c15\u0c46\u0c33\u0c4d\u0c32\u0c17\u0c32\u0c28\u0c41.",
}
_FALLBACK_THANKS = {
    "en": "Thank you! If you need help, just ask me anytime.",
    "hi": "\u0927\u0928\u094d\u092f\u0935\u093e\u0926! \u0905\u0917\u0930 \u0906\u092a\u0915\u094b \u092e\u0926\u0926 \u091a\u093e\u0939\u093f\u090f, \u0924\u094b \u0915\u092d\u0940 \u092d\u0940 \u092a\u0942\u091b\u0947\u0902\u0964",
    "te": "\u0c27\u0c28\u0c4d\u0c2f\u0c35\u0c3e\u0c26\u0c3e\u0c32\u0c41! \u0c2e\u0c40\u0c15\u0c41 \u0c38\u0c39\u0c3e\u0c2f\u0c02 \u0c15\u0c3e\u0c35\u0c3e\u0c32\u0c02\u0c1f\u0c47 \u0c0e\u0c2a\u0c4d\u0c2a\u0c41\u0c21\u0c48\u0c28\u0c3e \u0c05\u0c21\u0c17\u0c02\u0c21\u0c3f.",
}


def _fb(lang_dict, lang):
    """Pick a localized fallback string, defaulting to English."""
    return lang_dict.get(lang, lang_dict["en"])


SYSTEM_PROMPT = """You are Agri Helper, a voice-friendly assistant inside the AgriSaathi farming app.
The user may be an illiterate farmer speaking aloud — keep replies short (2-4 sentences), simple,
and natural to say out loud. Reply ONLY in the requested language (given as a language code).

You are given RETRIEVED PASSAGES from AgriSaathi's own crop encyclopedia, animal encyclopedia,
feature descriptions, and the user's own farm/soil/crop records. You may also receive LIVE GOVERNMENT
DATA from Data.gov.in through the frontend government_data handoff.

For current facts such as today's mandi prices, market rates, current government records, weather,
availability, or similar live-data questions, LIVE GOVERNMENT DATA has priority when relevant records
are present. Preserve the actual values and locations from those records.

Base other answers on the retrieved passages plus general, well-established agronomic/veterinary
knowledge for context. Do NOT invent specific numbers, prices, schedules, or eligibility figures.

If the passages don't actually answer the question, say plainly that you don't have that exact
detail on record, in ONE short sentence — do not pad or apologize repeatedly.

Respond ONLY with strict JSON, no markdown, no preamble:
{"reply_text": "..."}
"""


def _read_offer_needed(reply_text: str) -> bool:
    """Offer read-aloud for any substantive reply (not tiny acknowledgements)."""
    return len(reply_text.strip()) > 40


async def handle_chat(req: HelperChatRequest) -> HelperChatResponse:
    # --- Turn 2 of the read-aloud flow: user is answering yes/no to
    # "do you want me to read this aloud?" ---
    if req.awaiting_read_confirmation:
        text = req.message.strip().lower()
        yes_words = ["yes", "yeah", "yep", "ok", "okay", "avunu", "\u0905\u0935\u0941\u0928\u0941", "haan", "\u0939\u093e\u0902"]
        if any(text == w or text.startswith(w + " ") for w in yes_words):
            return HelperChatResponse(
                intent="read_confirmed",
                reply_text=req.pending_read_text or "",
                offer_read_aloud=False,
            )
        return HelperChatResponse(
            intent="read_declined",
            reply_text=_fb(_FALLBACK_THANKS, req.language or "en"),
            offer_read_aloud=False,
        )

    # --- Normal turn: RAG retrieval + live Data.gov context ---
    #
    # Data.gov.in context comes from the existing frontend bridge.
    # It must remain separate from the local RAG context because
    # current market/weather/etc. data can be more recent than
    # historical knowledge stored in RAG.

    government_data = req.government_data or {}
    government_context = government_data.get("context") or []
    government_feature = government_data.get("feature")
    government_live = bool(government_data.get("live"))
    government_error = government_data.get("error")

    current_feature = ROUTE_TO_FEATURE.get(req.route) if req.route else None

    found, passages, suggested_feature = retrieve(
        req.message,
        req.context_data
    )

    # If the frontend supplied live government records, treat them
    # as additional evidence even when local RAG has no matching
    # passage.
    has_government_records = any(
        isinstance(item, dict)
        and isinstance(item.get("records"), list)
        and len(item.get("records", [])) > 0
        for item in government_context
    )

    if not found and not has_government_records:
        route = suggested_feature["route"] if suggested_feature else None
        label = suggested_feature["title"] if suggested_feature else None

        # Don't suggest navigating to the page the farmer is already on.
        if route and req.route and route == req.route:
            route = None
            label = None

        lang = req.language or "en"
        reply = (
            f"{_fb(_FALLBACK_NOT_FOUND, lang)} "
            f"{_fb(_FALLBACK_TAKE_TO, lang).format(label=label) if label else _fb(_FALLBACK_TRY_REPHRASE, lang)}"
        )
        proof = append_record(
            request_type="data_query",
            user_input_text=req.message,
            advice_output=reply,
            sources=[],
        )
        return HelperChatResponse(
            intent="chat",
            reply_text=reply,
            found_in_rag=False,
            sources=[],
            route_suggested=route,
            route_suggested_label=label,
            offer_read_aloud=False,
            proof_hash=proof,
        )

    passages_text = "\n\n".join(
        f"[{p['source']}: {p['title']}] {p['text']}"
        for p in passages
    )

    # Compact live Data.gov evidence for the LLM.
    # Keep only the first 20 records per resource because the frontend
    # already limits the context size.
    government_sections = []

    for resource in government_context:
        if not isinstance(resource, dict):
            continue

        resource_key = resource.get("resource_key", "unknown")
        records = resource.get("records") or []

        if not isinstance(records, list) or not records:
            continue

        government_sections.append(
            f"[Data.gov.in resource: {resource_key}] "
            + json.dumps(records[:20], ensure_ascii=False)
        )

    government_text = "\n\n".join(government_sections)

    if not government_text:
        government_text = "No live government records supplied."

    user_prompt = f"""Language code for reply: {req.language}
Current app page: {current_feature['name'] if current_feature else 'unknown'}

LIVE GOVERNMENT DATA:
Feature: {government_feature or "none"}
Live: {government_live}
Error: {government_error or "none"}

{government_text}

LOCAL AGRISAATHI RAG PASSAGES:
{passages_text or "No matching local RAG passages."}

IMPORTANT DATA RULES:
- If the user's question asks for current/today's market price,
  mandi price, market rate, weather, rainfall, availability,
  or another current government-data fact, use LIVE GOVERNMENT DATA
  when matching records are present.
- Do not invent a current price or replace a live government record
  with an unrelated historical RAG value.
- Preserve the state, district, market, commodity, variety, grade,
  arrival date and price values from the government records.
- If a requested commodity is not present in the supplied live
  records, clearly say that the requested current record was not
  found. Do not manufacture one.
- If live government data is unavailable, use the existing RAG
  evidence only when it actually answers the question.
- If the question is short or ambiguous (e.g. "what should I do",
  "what is this", "how do I use this"), answer it in the context of
  Current app page above rather than asking the farmer to clarify.
- Keep the answer short and farmer-friendly.

User message: "{req.message}"
"""

    completion = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.2,
        max_tokens=350,
        response_format={"type": "json_object"},
    )

    raw = completion.choices[0].message.content
    try:
        parsed = json.loads(raw)
        reply_text = parsed.get("reply_text", "").strip()
    except json.JSONDecodeError:
        reply_text = raw.strip()

    sources = sorted({p["title"] for p in passages})

    government_sources = sorted({
        str(resource.get("resource_key"))
        for resource in government_context
        if isinstance(resource, dict)
        and resource.get("resource_key")
        and isinstance(resource.get("records"), list)
        and resource.get("records")
    })

    for source in government_sources:
        if source not in sources:
            sources.append(source)
    proof = append_record(
        request_type="data_query",
        user_input_text=req.message,
        advice_output=reply_text,
        sources=sources,
    )

    return HelperChatResponse(
        intent="data_query",
        reply_text=reply_text,
        found_in_rag=True,
        sources=sources,
        offer_read_aloud=_read_offer_needed(reply_text),
        proof_hash=proof,
    )
