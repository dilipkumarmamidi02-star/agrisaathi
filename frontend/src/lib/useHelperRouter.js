import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  resolvePageIntent,
  isYes,
  isNo,
  isDetailRequest,
  isExplainIntent,
  isReadPageRequest,
  detectLanguageSwitch,
  isSelfExplainRequest,
} from './pageRouter';

import { getReadableContent } from './pageReadable';

// ============================================================
// AgriSaathi Helper Router
// ============================================================
//
// Router responsibilities:
//   1. Language switching
//   2. Self explanation
//   3. Read-current-page
//   4. Navigation intent
//   5. Page explanation
//   6. Forward factual/data questions to backend
//
// Backend responsibilities:
//   - RAG
//   - government/live-data context
//   - factual agricultural questions
//   - market-price answers
//   - crop/animal information
//
// No new page is created here.
// ============================================================

export function useHelperRouter() {
  const navigate = useNavigate();

  const [pending, setPending] = useState(null);
  // pending = {
  //   route,
  //   originalQuery
  // }

  const handleRouterTurn = useCallback(
    (text) => {
      // --------------------------------------------------------
      // 0. Ignore empty input
      // --------------------------------------------------------

      if (!text || !text.trim()) {
        return { handled: false };
      }

      // --------------------------------------------------------
      // 1. Language switching
      // --------------------------------------------------------

      const newLangCode = detectLanguageSwitch(text);

      if (newLangCode) {
        setPending(null);

        return {
          handled: true,
          languageSwitch: newLangCode,
        };
      }

      // --------------------------------------------------------
      // 2. "What can you do?" / "Who are you?"
      // --------------------------------------------------------

      if (isSelfExplainRequest(text)) {
        setPending(null);

        return {
          handled: true,
          reply:
            "I'm Agri Helper. I can open AgriSaathi pages for you, explain what a feature does before opening it, read supported page content aloud, answer agricultural questions using the app's available records and government data context, help with market prices, weather, crops, animals, schemes and other farm tools, and change language whenever you ask.",
        };
      }

      // --------------------------------------------------------
      // 3. Direct "read this page"
      // --------------------------------------------------------

      if (isReadPageRequest(text)) {
        const content = getReadableContent();

        if (content) {
          return {
            handled: true,
            reply: `Here is the ${content.title}.`,
            readable: content,
          };
        }

        return {
          handled: true,
          reply:
            "I don't have readable page content available right now. Open a supported crop or animal page first, then ask me to read it.",
        };
      }

      // --------------------------------------------------------
      // 4. Resolve pending open/details question
      // --------------------------------------------------------

      if (pending) {
        // User said YES / OPEN
        if (isYes(text)) {
          const route = pending.route;

          setPending(null);

          navigate(route.path);

          return {
            handled: true,
            reply: `Opening ${route.label}.`,
          };
        }

        // User wants details instead
        if (isDetailRequest(text)) {
          const originalQuery = pending.originalQuery;

          setPending(null);

          return {
            handled: true,
            forwardToBackend: originalQuery,
          };
        }

        // User said NO
        if (isNo(text)) {
          setPending(null);

          return {
            handled: true,
            reply:
              "Okay, I won't open it. You can ask me for the details instead, or tell me what you want to do.",
          };
        }

        // New unrelated request:
        // discard old pending state and resolve the new request.
        setPending(null);
      }

      // --------------------------------------------------------
      // 5. Explanation request
      // --------------------------------------------------------

      if (isExplainIntent(text)) {
        const route = resolvePageIntent(text);

        if (route) {
          setPending({
            route,
            originalQuery: text,
          });

          return {
            handled: true,
            reply:
              `${route.description} Would you like me to open ${route.label}?`,
          };
        }
      }

      // --------------------------------------------------------
      // 6. Direct navigation request
      // --------------------------------------------------------

      const route = resolvePageIntent(text);

      if (route) {
        setPending({
          route,
          originalQuery: text,
        });

        return {
          handled: true,
          reply:
            `${route.label} is the AgriSaathi page for that. Should I open it, or do you want the details here?`,
        };
      }

      // --------------------------------------------------------
      // 7. No route match
      //
      // Let backend handle:
      //   - market questions
      //   - government data
      //   - crop facts
      //   - disease questions
      //   - animal questions
      //   - agricultural advice
      //   - RAG questions
      // --------------------------------------------------------

      return {
        handled: false,
      };
    },
    [pending, navigate]
  );

  return {
    pending,
    handleRouterTurn,
  };
}
