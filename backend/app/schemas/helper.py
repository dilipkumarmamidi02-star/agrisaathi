from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class HelperChatRequest(BaseModel):
    message: str
    language: str = "en"
    context_data: Optional[Dict[str, Any]] = None

    # Current frontend route (e.g. "/crops", "/fertilizer") — lets the
    # backend resolve ambiguous questions like "what should I do here?"
    # against the page the farmer is actually looking at.
    route: Optional[str] = None

    # Live Data.gov.in context supplied by Speak to AgriSaathi /
    # Agri Helper frontend. Contains feature, resources, context,
    # live status and optional error information.
    government_data: Optional[Dict[str, Any]] = None

    # True when the user was just asked "read this aloud?" and this message
    # is their yes/no answer to THAT question (not a new query).
    awaiting_read_confirmation: bool = False
    # The reply text that is pending a read-aloud decision (echoed back so
    # the backend doesn't need server-side session state).
    pending_read_text: Optional[str] = None


class HelperChatResponse(BaseModel):
    intent: str  # "data_query" | "chat" | "read_confirmed" | "read_declined"
    reply_text: str
    found_in_rag: bool = False
    sources: List[str] = []                 # human-readable source titles used
    route_suggested: Optional[str] = None    # e.g. "/loan-eligibility"
    route_suggested_label: Optional[str] = None
    offer_read_aloud: bool = False           # true => frontend should ask "read this aloud?"
    proof_hash: Optional[str] = None         # tamper-evident record hash for this exchange
