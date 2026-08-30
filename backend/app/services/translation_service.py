"""
Real translation layer for Agri Helper.
Every assistant-facing string (navigation replies, greetings, RAG answers)
is passed through here before being shown/spoken, so language switching
actually translates instead of just relabeling.

NOTE on the 3 remaining extra regional languages (raj, hne, tcy):
Bhojpuri and Magahi were tested and dropped — Groq's general LLM
consistently collapsed them into standard Hindi even with explicit
prompt hints, so they were removed rather than shipped broken.
Rajasthani and Tulu tested as genuinely distinct and were kept.
Chhattisgarhi showed only minor variation from Hindi — kept but worth
a native-speaker spot-check before demo day.
"""
from groq import Groq
from app.core.config import settings

client = Groq(api_key=settings.groq_api_key)

LANGUAGE_NAMES = {
    "en": "English", "hi": "Hindi", "te": "Telugu", "ta": "Tamil",
    "kn": "Kannada", "ml": "Malayalam", "mr": "Marathi", "gu": "Gujarati",
    "pa": "Punjabi", "bn": "Bengali", "or": "Odia", "as": "Assamese",
    "ur": "Urdu", "sa": "Sanskrit", "ks": "Kashmiri", "sd": "Sindhi",
    "ne": "Nepali", "kok": "Konkani", "mni": "Manipuri", "doi": "Dogri",
    "brx": "Bodo", "sat": "Santali", "mai": "Maithili",
    "raj": "Rajasthani", "hne": "Chhattisgarhi", "tcy": "Tulu",
}

# Extra per-language hints for codes the model tends to mishandle.
LANGUAGE_HINTS = {
    "raj": "Rajasthani, written in Devanagari script. This is a DISTINCT "
           "language from standard Hindi, spoken in Rajasthan — use "
           "Rajasthani vocabulary and grammar, not standard Hindi phrasing.",
    "hne": "Chhattisgarhi, written in Devanagari script. This is a DISTINCT "
           "language from standard Hindi, spoken in Chhattisgarh — use "
           "Chhattisgarhi vocabulary and grammar, not standard Hindi phrasing.",
    "tcy": "Tulu, conventionally written using the Kannada script (Tulu "
           "does not have its own widely-used digital script). This is a "
           "DISTINCT language from Kannada, spoken in coastal Karnataka — "
           "use Tulu vocabulary and grammar rendered in Kannada script, "
           "not standard Kannada phrasing. You MUST respond in Kannada "
           "script, never in English.",
}

SYSTEM_PROMPT = """You are a precise translator for a farming assistant app.
Translate the given English text into the requested Indian language.
Rules:
- Keep the meaning exact. Do not add, drop, or explain anything.
- Keep it natural and simple enough to read aloud to a farmer.
- Keep numbers, page/feature names in Latin script as-is if there is no
  natural local equivalent (e.g. keep "Soil Passport" recognizable).
- Respond with ONLY the translated text. No quotes, no notes, no preamble.
- You must always respond in the target language's native script.
  Never respond in English, and never substitute a different
  (even closely related) language than the one requested.
"""


def translate_text(text: str, target_language: str) -> str:
    text = (text or "").strip()
    if not text or target_language == "en":
        return text

    lang_name = LANGUAGE_NAMES.get(target_language)
    if not lang_name:
        # Unknown/unsupported code — return original rather than guessing.
        return text

    hint = LANGUAGE_HINTS.get(target_language)
    instruction = f"Translate to {lang_name}"
    if hint:
        instruction = f"Translate to {lang_name}.\n\nImportant: {hint}"

    completion = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"{instruction}\n\nText:\n{text}"},
        ],
        temperature=0.1,
        max_tokens=400,
    )
    translated = completion.choices[0].message.content.strip()
    return translated or text
