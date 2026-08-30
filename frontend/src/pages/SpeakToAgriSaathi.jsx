import { useState, useRef, useCallback } from 'react';
import { getDataGovResource } from '../lib/dataGov';

/*
 * SPEAK TO AGRISAATHI
 * -----------------------------------------------------------------
 * This is a SEPARATE experience from AgriHelperWidget.
 * Do not merge, do not reuse the Agri Helper greeting here.
 *
 * State machine: idle -> listening -> transcribing -> understanding
 *   -> retrieving -> generating -> responding -> speaking -> idle
 *   (error at any stage)
 *
 * Resource #26 (Kisan Call Centre transcripts, resource_key
 * "kcc_farmer_queries") is the primary knowledge source for this
 * page. It is intentionally NOT wired into AgriHelperWidget.
 *
 * HONEST SCOPE NOTE:
 * Retrieval here is real (live call to /api/data-gov/resources/data
 * for kcc_farmer_queries) but ranking is keyword-overlap, not vector
 * embeddings. There is no vector DB / embeddings service in the repo
 * yet. Do not present this as "RAG" in user-facing copy until a real
 * embedding + vector store is added on the backend. This is Phase 1:
 * grounded-in-real-data, not fabricated.
 */

const STATES = {
  IDLE: 'idle',
  LISTENING: 'listening',
  TRANSCRIBING: 'transcribing',
  UNDERSTANDING: 'understanding',
  RETRIEVING: 'retrieving',
  GENERATING: 'generating',
  RESPONDING: 'responding',
  SPEAKING: 'speaking',
  ERROR: 'error',
};

// Minimal language list for STT/TTS BCP-47 codes.
// Swap this for your real src/lib/indianLanguages.js export once
// I can see its actual shape — I didn't have that file's contents
// in this session, so I'm not guessing at its export name.
const VOICE_LANGUAGES = [
  { code: 'en-IN', label: 'English' },
  { code: 'hi-IN', label: 'हिंदी' },
  { code: 'te-IN', label: 'తెలుగు' },
  { code: 'ta-IN', label: 'தமிழ்' },
  { code: 'kn-IN', label: 'ಕನ್ನಡ' },
  { code: 'mr-IN', label: 'मराठी' },
  { code: 'bn-IN', label: 'বাংলা' },
];

// Lightweight crop keyword extraction — same spirit as
// detectVoiceFeature() in voiceDataGov.js, but crop-focused.
const CROP_KEYWORDS = [
  'paddy', 'rice', 'wheat', 'cotton', 'sugarcane', 'maize', 'corn',
  'groundnut', 'soybean', 'chilli', 'chili', 'tomato', 'onion',
  'banana', 'mango', 'turmeric', 'jowar', 'bajra', 'ragi', 'gram',
  'ధాన్యం', 'వరి', 'పత్తి', 'వేరుశనగ', 'मक्का', 'चावल', 'गेहूं',
];

const CHEMICAL_KEYWORDS = [
  'pesticide', 'insecticide', 'fungicide', 'herbicide', 'dosage',
  'spray', 'chemical', 'urea', 'dap', 'npk',
];

function extractCropKeyword(text) {
  const lower = text.toLowerCase();
  return CROP_KEYWORDS.find((kw) => lower.includes(kw.toLowerCase())) || null;
}

function scoreRecordAgainstQuery(record, queryText) {
  const q = queryText.toLowerCase();
  const hay = `${record.query || ''} ${record.answer || ''} ${record.crop || ''} ${record.category || ''}`.toLowerCase();
  const queryWords = q.split(/\s+/).filter((w) => w.length > 2);
  let score = 0;
  queryWords.forEach((w) => {
    if (hay.includes(w)) score += 1;
  });
  return score;
}

export default function SpeakToAgriSaathi() {
  const [state, setState] = useState(STATES.IDLE);
  const [language, setLanguage] = useState('en-IN');
  const [transcript, setTranscript] = useState('');
  const [responseText, setResponseText] = useState('');
  const [matchedRecords, setMatchedRecords] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  const recognitionRef = useRef(null);

  const speak = useCallback((text) => {
    if (!('speechSynthesis' in window)) {
      setState(STATES.IDLE);
      return;
    }
    setState(STATES.SPEAKING);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.onend = () => setState(STATES.IDLE);
    utterance.onerror = () => setState(STATES.IDLE);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [language]);

  const runRetrievalAndRespond = useCallback(async (queryText) => {
    setState(STATES.UNDERSTANDING);
    const crop = extractCropKeyword(queryText);

    setState(STATES.RETRIEVING);
    let records = [];
    let retrievalError = null;
    try {
      const params = crop ? { crop, limit: 20 } : { limit: 20 };
      const data = await getDataGovResource('kcc_farmer_queries', params);
      records = Array.isArray(data?.records) ? data.records : [];
    } catch (err) {
      retrievalError = err?.response?.data?.detail || err?.message || 'KCC resource unavailable';
    }

    setState(STATES.GENERATING);

    if (retrievalError) {
      setMatchedRecords([]);
      setResponseText(
        'Verified information is not available in the current AgriSaathi knowledge base right now (KCC source unreachable). Please try again shortly.'
      );
      setState(STATES.RESPONDING);
      return;
    }

    const ranked = records
      .map((r) => ({ record: r, score: scoreRecordAgainstQuery(r, queryText) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    setMatchedRecords(ranked.map((r) => r.record));

    if (ranked.length === 0) {
      setResponseText(
        'Verified information is not available in the current AgriSaathi knowledge base for this question.'
      );
      setState(STATES.RESPONDING);
      return;
    }

    const top = ranked[0].record;
    const containsChemical = CHEMICAL_KEYWORDS.some((kw) =>
      `${top.query || ''} ${top.answer || ''}`.toLowerCase().includes(kw)
    );

    let text = `Based on a past Kisan Call Centre record${top.crop ? ` about ${top.crop}` : ''}: ${top.answer || 'No answer text available.'}`;

    text += ' This is historical Kisan Call Centre information, not a current official recommendation.';

    if (containsChemical) {
      text += ' This response references a chemical or dosage topic — verify current registration, dosage, and safety instructions with a current authoritative source before use; this historical record should not be treated as a current recommendation.';
    }

    setResponseText(text);
    setState(STATES.RESPONDING);
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMessage('Speech recognition is not supported in this browser. You can type your question instead.');
      setState(STATES.ERROR);
      return;
    }

    setErrorMessage('');
    setTranscript('');
    setResponseText('');
    setMatchedRecords([]);

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => setState(STATES.LISTENING);

    recognition.onresult = (event) => {
      setState(STATES.TRANSCRIBING);
      const text = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join('');
      setTranscript(text);
    };

    recognition.onerror = (event) => {
      setErrorMessage(event.error === 'not-allowed'
        ? 'Microphone permission was denied.'
        : `Speech recognition error: ${event.error}`);
      setState(STATES.ERROR);
    };

    recognition.onend = () => {
      setTranscript((current) => {
        if (current.trim()) {
          runRetrievalAndRespond(current.trim());
        } else {
          setState(STATES.IDLE);
        }
        return current;
      });
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [language, runRetrievalAndRespond]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const retry = useCallback(() => {
    setErrorMessage('');
    setResponseText('');
    setMatchedRecords([]);
    setTranscript('');
    setState(STATES.IDLE);
  }, []);

  const isBusy = ![STATES.IDLE, STATES.ERROR, STATES.RESPONDING].includes(state);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-10 text-center">
      <h1 className="text-2xl font-bold text-text-primary mb-1">Speak to AgriSaathi</h1>
      <p className="text-text-secondary mb-6">Tap and speak your problem</p>

      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        disabled={isBusy}
        className="mb-8 border border-border-strong rounded-lg px-3 py-2 text-sm"
      >
        {VOICE_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>{lang.label}</option>
        ))}
      </select>

      <button
        onClick={state === STATES.LISTENING ? stopListening : startListening}
        disabled={isBusy && state !== STATES.LISTENING}
        className={`w-28 h-28 rounded-full flex items-center justify-center text-white text-lg font-semibold shadow-lg transition-colors
          ${state === STATES.LISTENING ? 'bg-red-500/100 animate-pulse' : 'bg-green-600 hover:bg-green-700'}
          ${isBusy && state !== STATES.LISTENING ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        {state === STATES.LISTENING ? 'Stop' : '🎤'}
      </button>

      <p className="mt-4 text-sm text-text-secondary">
        {state === STATES.IDLE && 'Tap to speak'}
        {state === STATES.LISTENING && 'Listening…'}
        {state === STATES.TRANSCRIBING && 'Transcribing…'}
        {state === STATES.UNDERSTANDING && 'Understanding your question…'}
        {state === STATES.RETRIEVING && 'Checking Kisan Call Centre records…'}
        {state === STATES.GENERATING && 'Preparing an answer…'}
        {state === STATES.SPEAKING && 'Speaking…'}
      </p>

      {transcript && (
        <div className="mt-8 w-full max-w-lg bg-surface-hover border border-border rounded-lg p-4 text-left">
          <p className="text-xs uppercase tracking-wide text-text-muted mb-1">You said</p>
          <p className="text-text-primary">{transcript}</p>
        </div>
      )}

      {state === STATES.ERROR && (
        <div className="mt-6 w-full max-w-lg bg-red-500/10 border border-red-200 rounded-lg p-4 text-left">
          <p className="text-red-400 text-sm">{errorMessage}</p>
          <button onClick={retry} className="mt-3 text-sm font-medium text-red-400 underline">
            Retry
          </button>
        </div>
      )}

      {responseText && state === STATES.RESPONDING && (
        <div className="mt-6 w-full max-w-lg bg-surface border border-border rounded-lg p-4 text-left shadow-sm">
          <p className="text-xs uppercase tracking-wide text-amber-600 mb-1">
            {matchedRecords.length > 0 ? 'Historical KCC Reference' : 'No Verified Match'}
          </p>
          <p className="text-text-primary mb-3">{responseText}</p>

          {matchedRecords.length > 0 && (
            <div className="text-xs text-text-muted border-t border-border pt-2 space-y-1">
              <p>Source: Data.gov.in — Kisan Call Centre (KCC) transcripts</p>
              <p>resource_id: cef25fe2-9231-4128-8aec-2c948fedd43f</p>
              <p>Status: Historical — not a current recommendation</p>
            </div>
          )}

          <div className="mt-3 flex gap-3">
            <button
              onClick={() => speak(responseText)}
              className="text-sm font-medium text-mint underline"
            >
              🔊 Speak answer
            </button>
            <button onClick={retry} className="text-sm font-medium text-text-secondary underline">
              Ask another question
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
