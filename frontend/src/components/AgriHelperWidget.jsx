import { useState, useRef, useEffect } from 'react';
import { useLang } from '../lib/i18n';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageCircle, X, Mic, Volume2, Send, ShieldCheck, Languages, Square } from 'lucide-react';
import axios from 'axios';
import { API_ENDPOINTS } from '../api/endpoints';
import { INDIAN_LANGUAGES } from '../lib/indianLanguages';
import { useHelperRouter } from '../lib/useHelperRouter';
import { getVoiceGovernmentContext } from '../lib/voiceDataGov';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

async function translateText(text, targetLang) {
  if (!text || targetLang === 'en') return text;
  try {
    const res = await axios.post(`${API_URL}${API_ENDPOINTS.translate}`, {
      text,
      target_language: targetLang,
    });
    return res.data.translated_text || text;
  } catch {
    // Translation service unavailable — fall back to original text
    // rather than blocking the reply.
    return text;
  }
}

function collectContextData() {
  const snapshot = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('agrisaathi_entity_')) {
      try {
        snapshot[key.replace('agrisaathi_entity_', '')] = JSON.parse(localStorage.getItem(key));
      } catch {
        // skip malformed entries
      }
    }
  }
  return snapshot;
}

function timeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

export default function AgriHelperWidget() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  // lang now comes from shared i18n context so Profile <-> Helper stay in sync
  const { lang, setLang } = useLang();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [greetingBanner, setGreetingBanner] = useState(null); // { text }
  const [greetingSpoken, setGreetingSpoken] = useState(false);

  const recognitionRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const scrollRef = useRef(null);
  const greetedRef = useRef(false);
  const greetingTextRef = useRef('');

  const { handleRouterTurn } = useHelperRouter();

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const currentLocale = INDIAN_LANGUAGES.find((l) => l.code === lang)?.locale || 'en-IN';

  // Chrome loads TTS voices asynchronously — getVoices() can return an
  // empty array on the very first call. This waits for voices to actually
  // be populated (or a short timeout) before the first real speak() call.
  const voicesReadyRef = useRef(false);
  const ensureVoicesReady = () =>
    new Promise((resolve) => {
      if (voicesReadyRef.current || window.speechSynthesis.getVoices().length > 0) {
        voicesReadyRef.current = true;
        resolve();
        return;
      }
      const handler = () => {
        voicesReadyRef.current = true;
        window.speechSynthesis.removeEventListener('voiceschanged', handler);
        resolve();
      };
      window.speechSynthesis.addEventListener('voiceschanged', handler);
      // Fallback in case voiceschanged never fires on this browser
      setTimeout(() => {
        window.speechSynthesis.removeEventListener('voiceschanged', handler);
        resolve();
      }, 1000);
    });

  // Tracks the current utterance so a rapid second call (e.g. React
  // StrictMode double-invoking an effect in dev) doesn't cancel a speech
  // request that hasn't actually started yet, which throws a confusing
  // "interrupted" error rather than a real failure.
  const speakingRef = useRef(false);

  const speak = async (text, onDone) => {
    if (!('speechSynthesis' in window) || !text) {
      console.warn('[AgriHelper speak] speechSynthesis unavailable or empty text');
      onDone?.(false);
      return;
    }

    await ensureVoicesReady();

    if (speakingRef.current) {
      window.speechSynthesis.cancel();
    }
    speakingRef.current = true;

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = currentLocale;
    const voices = window.speechSynthesis.getVoices();
    const match = voices.find((v) => v.lang === currentLocale || v.lang.toLowerCase().startsWith(lang.toLowerCase()));
    if (match) {
      utter.voice = match;
      console.log('[AgriHelper speak] matched voice:', match.name, match.lang);
    } else {
      console.warn('[AgriHelper speak] no matching voice found for', currentLocale, '- using browser default voice');
    }

    // Chrome has a long-standing bug (still present in recent Chrome/Chromium
    // builds) where speechSynthesis silently stops producing audio after
    // roughly 15 seconds, or when the tab loses focus, even though the
    // browser still reports `speaking: true` and never fires onend/onerror.
    // A periodic pause()/resume() nudge keeps the underlying audio thread
    // alive. This interval is cleared as soon as the utterance genuinely
    // finishes or errors.
    let cutoffWatchdog = null;

    setIsSpeaking(true);
    utter.onstart = () => {
      console.log('[AgriHelper speak] STARTED speaking:', text.slice(0, 40));
      cutoffWatchdog = setInterval(() => {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }, 5000);
    };
    utter.onend = () => {
      if (cutoffWatchdog) clearInterval(cutoffWatchdog);
      speakingRef.current = false;
      setIsSpeaking(false);
      onDone?.(true);
    };
    utter.onerror = (e) => {
      if (cutoffWatchdog) clearInterval(cutoffWatchdog);
      speakingRef.current = false;
      setIsSpeaking(false);
      if (e.error === 'interrupted' || e.error === 'canceled') {
        // Expected when a newer speak() call supersedes this one
        // (e.g. dev-mode StrictMode double effects) — not a real failure.
        console.log('[AgriHelper speak] superseded by a newer speak call, not an error');
      } else {
        console.error('[AgriHelper speak] BLOCKED or failed:', e.error, '- likely Chrome autoplay policy if this is the first speak() call on page load');
      }
      onDone?.(false);
    };
    window.speechSynthesis.speak(utter);
  };

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  };

  // Adds an assistant message AND speaks it immediately — this is the only
  // way assistant text gets shown, so every reply auto-reads by default.
  // Stop button (global, in the input bar) is the only way to interrupt.
  const sayAssistant = async (text, extra = {}) => {
    const translated = await translateText(text, lang);
    setMessages((m) => [...m, { role: 'assistant', text: translated, ...extra }]);
    speak(translated);
  };

  useEffect(() => {
    if (greetedRef.current) return;
    greetedRef.current = true;
    const greeting = `${timeGreeting()}! I am Agri Helper. How can I assist you today?`;
    translateText(greeting, lang).then((translated) => {
      greetingTextRef.current = translated;
      setGreetingBanner({ text: translated });
      setMessages([{ role: 'assistant', text: translated }]);
      speak(translated, (played) => setGreetingSpoken(played));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      sayAssistant('Voice input is not supported on this browser.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = currentLocale;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      sendMessage(transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const callBackendChat = async (text) => {
    setLoading(true);

    try {
      /*
       * Load live Data.gov.in context only when the voice/helper
       * request matches a supported government-data feature.
       *
       * This does not replace the existing backend RAG/helper.
       * It enriches the existing request with live government data.
       */
      let governmentData = null;

      try {
        governmentData = await getVoiceGovernmentContext(
          text,
          {
            language: lang,
          },
        );
      } catch {
        governmentData = {
          feature: null,
          resources: [],
          context: [],
          live: false,
          error: 'Government data unavailable',
        };
      }

      const response = await axios.post(
        `${API_URL}${API_ENDPOINTS.helperChat}`,
        {
          message: text,
          language: lang,

          /*
           * Current route, so the backend knows what page the user
           * is on (e.g. /crops, /fertilizer) even before per-page
           * entity context (selected crop, commodity, etc.) exists.
           */
          route: location.pathname,

          /*
           * Existing AgriSaathi local/entity context.
           */
          context_data: collectContextData(),

          /*
           * New live Data.gov context.
           *
           * The backend can use `context` directly for RAG/context
           * generation while `feature` and `resources` remain
           * available for traceability/debugging.
           */
          government_data: governmentData,
        },
      );

      return response.data;
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageSwitch = async (code) => {
    setLang(code);
    const label = INDIAN_LANGUAGES.find((l) => l.code === code)?.label || code;
    const confirmMsg = `Language changed to ${label}.`;
    const translated = await translateText(confirmMsg, code);
    setMessages((m) => [...m, { role: 'assistant', text: translated }]);
    speak(translated);
  };

  const sendMessage = async (textOverride) => {
    const text = (textOverride ?? input).trim();
    if (!text) return;

    setMessages((m) => [...m, { role: 'user', text }]);
    setInput('');

    const routed = handleRouterTurn(text);
    if (routed.handled) {
      if (routed.languageSwitch) {
        handleLanguageSwitch(routed.languageSwitch);
        return;
      }
      if (routed.forwardToBackend) {
        const data = await callBackendChat(routed.forwardToBackend);
        sayAssistant(data.reply_text, {
          sources: data.sources,
          proofHash: data.proof_hash,
          routeSuggested: data.route_suggested,
          routeSuggestedLabel: data.route_suggested_label,
        });
        return;
      }
      sayAssistant(routed.reply);
      if (routed.readable) {
        // "read this page" — speak the full page content right away, no yes/no.
        sayAssistant(routed.readable.text);
      }
      return;
    }

    try {
      const data = await callBackendChat(text);
      sayAssistant(data.reply_text, {
        sources: data.sources,
        proofHash: data.proof_hash,
        routeSuggested: data.route_suggested,
        routeSuggestedLabel: data.route_suggested_label,
      });
    } catch {
      sayAssistant('Sorry, I had trouble understanding that. Please try again.');
    }
  };

  const goToSuggestedRoute = (route) => {
    if (route) navigate(route);
  };

  const dismissGreetingBanner = (speakItNow) => {
    if (speakItNow) speak(greetingTextRef.current, () => setGreetingSpoken(true));
    setGreetingBanner(null);
  };

  return (
    <>
      {greetingBanner && !open && (
        <div className="fixed bottom-36 right-4 z-50 max-w-xs bg-white border border-gray-200 shadow-lg rounded-xl p-3 text-sm text-gray-800 flex items-start gap-2">
          <span className="flex-1">{greetingBanner.text}</span>
          <div className="flex flex-col gap-1 items-end">
            {!greetingSpoken && (
              <button onClick={() => dismissGreetingBanner(true)} className="text-green-700 text-xs flex items-center gap-1" aria-label="Tap to hear greeting">
                <Volume2 className="h-3.5 w-3.5" /> Tap to hear
              </button>
            )}
            <button onClick={() => dismissGreetingBanner(false)} className="text-gray-400 text-xs">{t('dismiss')}</button>
          </div>
        </div>
      )}

      {!open && (
        <button
          onClick={() => { setOpen(true); if (!greetingSpoken) dismissGreetingBanner(true); }}
          className="fixed bottom-20 right-4 z-50 bg-green-600 text-white rounded-full p-4 shadow-lg hover:bg-green-700"
          aria-label="Open Agri Helper"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-0 right-0 z-50 w-full sm:w-96 h-[70vh] sm:h-[32rem] sm:bottom-20 sm:right-4 bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-gray-200 flex flex-col">
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800">{t('agriHelper')}</span>
              <div className="flex items-center gap-1">
                <Languages className="h-3.5 w-3.5 text-gray-400" />
                <select
                  value={lang}
                  onChange={(e) => handleLanguageSwitch(e.target.value)}
                  className="text-xs border border-gray-200 rounded px-1 py-0.5"
                >
                  {INDIAN_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${m.role === 'user' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                  <p>{m.text}</p>
                  {m.role === 'assistant' && m.sources?.length > 0 && (
                    <p className="mt-1 text-[10px] text-gray-500">Source: {m.sources.join(', ')}</p>
                  )}
                  {m.role === 'assistant' && m.proofHash && (
                    <p className="mt-1 flex items-center gap-1 text-[10px] text-gray-400" title={m.proofHash}>
                      <ShieldCheck className="h-3 w-3" /> Tamper-evident record
                    </p>
                  )}
                  {m.role === 'assistant' && m.routeSuggested && (
                    <button onClick={() => goToSuggestedRoute(m.routeSuggested)} className="mt-1 block text-xs font-medium text-green-700 underline">
                      Open {m.routeSuggestedLabel}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {loading && <p className="text-xs text-gray-400">Thinking...</p>}
            <div ref={scrollRef} />
          </div>

          <div className="p-3 border-t border-gray-100 flex items-center gap-2">
            {isSpeaking ? (
              <button onClick={stopSpeaking} className="p-2 rounded-full bg-red-500 text-white" aria-label="Stop reading">
                <Square className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={startListening}
                className={`p-2 rounded-full ${listening ? 'bg-red-500' : 'bg-green-600'} text-white`}
                aria-label="Speak"
              >
                <Mic className="h-4 w-4" />
              </button>
            )}
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder={t('typeOrTapMic')}
              className="flex-1 border border-gray-200 rounded-full px-3 py-2 text-sm"
            />
            <button onClick={() => sendMessage()} className="p-2 rounded-full bg-green-600 text-white" aria-label="Send">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
