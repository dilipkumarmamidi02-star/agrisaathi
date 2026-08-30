import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { resolvePageIntent, isYes, isNo, isDetailRequest, isExplainIntent, isReadPageRequest, detectLanguageSwitch, isSelfExplainRequest } from './pageRouter';
import { getReadableContent } from './pageReadable';

// handleRouterTurn(text) returns one of:
//   { handled: true, reply }                           -> shown as-is, nothing else to do
//   { handled: true, reply, readable: {title,text} }    -> shown, then widget offers to read `readable` aloud
//   { handled: true, forwardToBackend: text }           -> widget should call the backend RAG chat with this text
//   { handled: false }                                  -> not a routing turn, pass to backend chat normally
export function useHelperRouter() {
  const navigate = useNavigate();
  const [pending, setPending] = useState(null); // { route, originalQuery }

  const handleRouterTurn = useCallback((text) => {
    // -1. Language switch — handled instantly, no backend round-trip.
    const newLangCode = detectLanguageSwitch(text);
    if (newLangCode) {
      return { handled: true, languageSwitch: newLangCode };
    }

    // -0.5. "What can you do / who are you" — self-description.
    if (isSelfExplainRequest(text)) {
      return {
        handled: true,
        reply: "I'm Agri Helper. I can open any page in AgriSaathi for you, answer questions about your crops and animals using the app's own records, explain what a feature does before you open it, read page content aloud, and change language any time — just say 'change language to Telugu' or similar. Ask me anything in your own words.",
      };
    }

    // 0. Direct "read this page" request — independent of navigation state.
    if (isReadPageRequest(text)) {
      const content = getReadableContent();
      if (content) {
        return { handled: true, reply: `Here it is: ${content.title}.`, readable: content };
      }
      return { handled: true, reply: "I don't have a readable page open right now. Open a crop or animal page first, then ask me to read it." };
    }

    // 1. Waiting on a response to a previous "open it, or details?" offer.
    if (pending) {
      if (isYes(text)) {
        const route = pending.route;
        setPending(null);
        navigate(route.path);
        return { handled: true, reply: `Opening ${route.label}.` };
      }
      if (isDetailRequest(text)) {
        const originalQuery = pending.originalQuery;
        setPending(null);
        return { handled: true, forwardToBackend: originalQuery };
      }
      if (isNo(text)) {
        setPending(null);
        return { handled: true, reply: 'Okay, not opening that. What are you looking for?' };
      }
      // Ambiguous reply — drop pending and re-resolve against the new text.
      setPending(null);
    }

    // 2. "What is X / how do I use X" — explain, then offer to open it.
    if (isExplainIntent(text)) {
      const route = resolvePageIntent(text);
      if (route) {
        setPending({ route, originalQuery: text });
        return { handled: true, reply: `${route.description} Would you like me to open it?` };
      }
    }

    // 3. Plain page match — ask whether they want it opened or just the details here.
    const route = resolvePageIntent(text);
    if (route) {
      setPending({ route, originalQuery: text });
      return { handled: true, reply: `${route.label} is where you'd do that. Should I open it, or do you want the details here?` };
    }

    // 4. No page match — let the backend RAG/chat handle it.
    return { handled: false };
  }, [pending, navigate]);

  return { pending, handleRouterTurn };
}
