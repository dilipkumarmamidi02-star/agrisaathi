#!/usr/bin/env python3
"""
Run from ~/Downloads/agrisaathi:
    python3 patch_helper_service_i18n.py
"""
path = "backend/app/services/helper_service.py"
with open(path) as f:
    content = f.read()

# ---------------------------------------------------------------------
# 1. Insert language-keyed fallback dicts + helper, right after imports
# ---------------------------------------------------------------------
anchor = "client = Groq(api_key=settings.groq_api_key)"

lang_block = '''client = Groq(api_key=settings.groq_api_key)

# Static fallback replies that bypass the LLM entirely — these must be
# localized by hand since there's no model call to carry req.language
# through for them.
_FALLBACK_NOT_FOUND = {
    "en": "I don't have that exact detail on record.",
    "hi": "\\u092e\\u0947\\u0930\\u0947 \\u092a\\u093e\\u0938 \\u0935\\u0939 \\u0938\\u091f\\u0940\\u0915 \\u091c\\u093e\\u0928\\u0915\\u093e\\u0930\\u0940 \\u0930\\u093f\\u0915\\u0949\\u0930\\u094d\\u0921 \\u092e\\u0947\\u0902 \\u0928\\u0939\\u0940\\u0902 \\u0939\\u0948\\u0964",
    "te": "\\u0c28\\u0c3e\\u0c15\\u0c41 \\u0c06 \\u0c16\\u0c1a\\u0c4d\\u0c1a\\u0c3f\\u0c24\\u0c2e\\u0c48\\u0c28 \\u0c35\\u0c3f\\u0c35\\u0c30\\u0c3e\\u0c32\\u0c41 \\u0c30\\u0c3f\\u0c15\\u0c3e\\u0c30\\u0c4d\\u0c21\\u0c41\\u0c32\\u0c4b \\u0c32\\u0c47\\u0c35\\u0c41.",
}
_FALLBACK_TRY_REPHRASE = {
    "en": "Could you try rephrasing?",
    "hi": "\\u0915\\u094d\\u092f\\u093e \\u0906\\u092a \\u0926\\u094f\\u092c\\u093e\\u0930\\u093e \\u0915\\u094b\\u0936\\u093f\\u0936 \\u0915\\u0930 \\u0938\\u0915\\u0924\\u0947 \\u0939\\u0948\\u0902?",
    "te": "\\u0c2e\\u0c40\\u0c30\\u0c41 \\u0c2e\\u0c33\\u0c4d\\u0c33\\u0c40 \\u0c1a\\u0c46\\u0c2a\\u0c4d\\u0c2a\\u0c3f \\u0c1a\\u0c42\\u0c21\\u0c17\\u0c32\\u0c30\\u0c3e?",
}
_FALLBACK_TAKE_TO = {
    "en": "I can take you to {label} for more.",
    "hi": "\\u092e\\u0948\\u0902 \\u0906\\u092a\\u0915\\u094b \\u0905\\u0927\\u093f\\u0915 \\u091c\\u093e\\u0928\\u0915\\u093e\\u0930\\u0940 \\u0915\\u0947 \\u0932\\u093f\\u090f {label} \\u092a\\u0930 \\u0932\\u0947 \\u091c\\u093e \\u0938\\u0915\\u0924\\u093e \\u0939\\u0942\\u0902\\u0964",
    "te": "\\u0c2e\\u0c30\\u0c3f\\u0c28\\u0c4d\\u0c28\\u0c3f \\u0c35\\u0c3f\\u0c35\\u0c30\\u0c3e\\u0c32 \\u0c15\\u0c4b\\u0c38\\u0c02 \\u0c28\\u0c47\\u0c28\\u0c41 \\u0c2e\\u0c40\\u0c2e\\u0c41\\u0c32\\u0c4d\\u0c28\\u0c3f {label}\\u0c15\\u0c3f \\u0c24\\u0c40\\u0c38\\u0c41\\u0c15\\u0c46\\u0c33\\u0c4d\\u0c32\\u0c17\\u0c32\\u0c28\\u0c41.",
}
_FALLBACK_THANKS = {
    "en": "Thank you! If you need help, just ask me anytime.",
    "hi": "\\u0927\\u0928\\u094d\\u092f\\u0935\\u093e\\u0926! \\u0905\\u0917\\u0930 \\u0906\\u092a\\u0915\\u094b \\u092e\\u0926\\u0926 \\u091a\\u093e\\u0939\\u093f\\u090f, \\u0924\\u094b \\u0915\\u092d\\u0940 \\u092d\\u0940 \\u092a\\u0942\\u091b\\u0947\\u0902\\u0964",
    "te": "\\u0c27\\u0c28\\u0c4d\\u0c2f\\u0c35\\u0c3e\\u0c26\\u0c3e\\u0c32\\u0c41! \\u0c2e\\u0c40\\u0c15\\u0c41 \\u0c38\\u0c39\\u0c3e\\u0c2f\\u0c02 \\u0c15\\u0c3e\\u0c35\\u0c3e\\u0c32\\u0c02\\u0c1f\\u0c47 \\u0c0e\\u0c2a\\u0c4d\\u0c2a\\u0c41\\u0c21\\u0c48\\u0c28\\u0c3e \\u0c05\\u0c21\\u0c17\\u0c02\\u0c21\\u0c3f.",
}


def _fb(lang_dict, lang):
    """Pick a localized fallback string, defaulting to English."""
    return lang_dict.get(lang, lang_dict["en"])
'''

if anchor not in content:
    print("WARNING: anchor for step 1 not found — no changes made.")
else:
    content = content.replace(anchor, lang_block, 1)
    print("OK: inserted localized fallback dicts")

# ---------------------------------------------------------------------
# 2. Replace the hardcoded "not found" reply
# ---------------------------------------------------------------------
old_not_found = '''        reply = (
            f"I don't have that exact detail on record. "
            f"{'I can take you to ' + label + ' for more.' if label else 'Could you try rephrasing?'}"
        )'''

new_not_found = '''        lang = req.language or "en"
        reply = (
            f"{_fb(_FALLBACK_NOT_FOUND, lang)} "
            f"{_fb(_FALLBACK_TAKE_TO, lang).format(label=label) if label else _fb(_FALLBACK_TRY_REPHRASE, lang)}"
        )'''

if old_not_found not in content:
    print("WARNING: 'not found' reply block not matched — no changes made there.")
else:
    content = content.replace(old_not_found, new_not_found, 1)
    print("OK: localized 'not found' fallback reply")

# ---------------------------------------------------------------------
# 3. Replace the hardcoded "read declined" reply
# ---------------------------------------------------------------------
old_declined = '''        return HelperChatResponse(
            intent="read_declined",
            reply_text="Thank you! If you need help, just ask me anytime.",
            offer_read_aloud=False,
        )'''

new_declined = '''        return HelperChatResponse(
            intent="read_declined",
            reply_text=_fb(_FALLBACK_THANKS, req.language or "en"),
            offer_read_aloud=False,
        )'''

if old_declined not in content:
    print("WARNING: 'read declined' reply block not matched — no changes made there.")
else:
    content = content.replace(old_declined, new_declined, 1)
    print("OK: localized 'read declined' fallback reply")

with open(path, "w") as f:
    f.write(content)

print("\nDone. Restart the backend and test with the language set to Hindi/Telugu")
print("by asking something the RAG won't find (like 'hello').")
