import React from 'react'
import { useState, useMemo, useRef } from 'react'
import {
  ArrowLeft, Camera, X, Sprout, PawPrint, Mic, AlertTriangle,
  Leaf, FlaskConical, ShieldAlert, ChevronRight,
} from 'lucide-react';
import api from '../api/apiClient';
import appClient from '@/api/appClient';
import cropData from '@/data/cropEncyclopedia.json';
import animalData from '@/data/animalEncyclopedia.json';


const STEPS = [
  { id: 1, label: 'Take a photo' },
  { id: 2, label: 'Confirm crop' },
  { id: 3, label: 'Treatment advice' },
];

// Flatten the encyclopedia data into { id, name, category } option lists
const cropOptions = cropData.categories.flatMap((c) =>
  c.types.map((t) => ({ id: t.id, name: t.name, category: c.name }))
);
const animalOptions = animalData.categories.flatMap((c) =>
  c.types.map((t) => ({ id: t.id, name: t.name, category: c.name }))
);

export default function Diagnose() {
  const [step, setStep] = useState(1);

  // Step 1 state
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  // Step 2 state
  const [domain, setDomain] = useState('crop'); // 'crop' | 'livestock'
  const [subject, setSubject] = useState('');
  const [plots, setPlots] = useState([]);
  const [plotId, setPlotId] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [listening, setListening] = useState(false);

  // Step 3 state
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);

  const subjectOptions = domain === 'crop' ? cropOptions : animalOptions;

  const groupedSubjectOptions = useMemo(() => {
    const groups = {};
    subjectOptions.forEach((o) => {
      if (!groups[o.category]) groups[o.category] = [];
      groups[o.category].push(o);
    });
    return groups;
  }, [subjectOptions]);

  // Load plots (farms) once, best-effort — works with the localStorage-backed
  // appClient entity shim even if none exist yet.
  React.useEffect(() => {
    appClient.entities.Farm.list('plot_name', 50)
      .then((rows) => setPlots(Array.isArray(rows) ? rows : []))
      .catch(() => setPlots([]));
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResult(null);
      setError(null);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
  };

  const goNextFromStep1 = () => {
    if (!file) {
      setError('Please take or upload a photo first');
      return;
    }
    setError(null);
    setStep(2);
  };

  const toggleMic = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setSymptoms((prev) => (prev ? `${prev} ${text}` : text));
    };
    recognition.onend = () => setListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
  };

  const analyze = async () => {
    if (!subject) {
      setError(domain === 'crop' ? 'Please select a crop' : 'Please select an animal type');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('crop_hint', subject);
    formData.append('domain', domain);
    formData.append('subject', subject);
    if (plotId) formData.append('plot_id', plotId);
    if (symptoms) formData.append('symptoms_text', symptoms);

    try {
      const response = await api.post('/api/diagnosis/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });

      setResult(response.data);
      setStep(3);
      // Don't also setError here — the "source === 'unavailable'" block
      // in step 3 already renders response.data.description, so setting
      // error too would show the same message twice.
    } catch (err) {
      console.error('Diagnosis error:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to analyze image. Please try again.');
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  const startOver = () => {
    setStep(1);
    setFile(null);
    setPreview(null);
    setSubject('');
    setPlotId('');
    setSymptoms('');
    setResult(null);
    setError(null);
  };

  const confidencePct =
    result?.confidence !== undefined && result?.confidence !== null
      ? Math.round(result.confidence * 100)
      : null;

  // Flexible field mapping so this keeps working whether the backend returns
  // the legacy shape (disease_name/treatment_advice/prevention) or the newer
  // Diagnosis-entity shape (likely_issue/organic_treatment/chemical_treatment/precautions)
  const likelyIssue = result?.likely_issue || result?.disease_name || 'Unable to determine';
  const alternatives = result?.alternatives || [];
  const evidence = result?.evidence || result?.detailed_analysis || result?.description || '';
  const organicTreatment =
    result?.organic_treatment ||
    (result?.treatment_advice && result.treatment_advice.length
      ? result.treatment_advice.join(' ')
      : '');
  const chemicalTreatment = result?.chemical_treatment || result?.recommended_action || '';
  const precautions =
    result?.precautions ||
    (result?.prevention && result.prevention.length ? result.prevention.join(' ') : '');

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-3">
        {step > 1 && (
          <button
            onClick={() => setStep(step - 1)}
            className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <Camera className="h-5 w-5 text-green-600" />
        <h1 className="text-xl font-bold text-gray-800">Diagnose</h1>
      </div>

      {step === 1 && (
        <p className="text-gray-500 text-sm mb-3">AI-powered crop &amp; livestock diagnosis</p>
      )}

      <div className="flex items-center gap-1 mb-1">
        {STEPS.map((s, i) => (
          <div
            key={s.id}
            className={`h-1.5 flex-1 rounded-full ${step >= s.id ? 'bg-green-500' : 'bg-gray-200'}`}
          />
        ))}
      </div>
      <div className="flex justify-between mb-4">
        {STEPS.map((s) => (
          <span
            key={s.id}
            className={`text-[11px] ${step >= s.id ? 'text-green-700 font-medium' : 'text-gray-400'}`}
          >
            {s.id}. {s.label}
          </span>
        ))}
      </div>

      <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700">AI-assisted — not a guaranteed diagnosis</p>
      </div>

      {/* STEP 1 — Take a photo */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-green-300 bg-green-50/40 rounded-xl p-6 text-center hover:border-green-400 transition-colors">
            {preview ? (
              <div className="relative">
                <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-lg object-contain" />
                <button
                  onClick={removeFile}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                >
                  <X size={20} />
                </button>
                <p className="text-sm text-gray-500 mt-2">{file.name}</p>
              </div>
            ) : (
              <label className="cursor-pointer block">
                <Camera className="h-10 w-10 mx-auto text-green-500" />
                <p className="text-green-700 font-medium mt-2">Take / upload photo</p>
                <p className="text-xs text-gray-400 mt-1">Supports JPG, PNG, WEBP</p>
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={goNextFromStep1}
            disabled={!file}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* STEP 2 — Confirm crop / animal */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => { setDomain('crop'); setSubject(''); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition ${
                domain === 'crop' ? 'bg-green-600 text-white' : 'bg-white text-gray-600'
              }`}
            >
              <Sprout className="h-4 w-4" /> Crop
            </button>
            <button
              onClick={() => { setDomain('livestock'); setSubject(''); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition ${
                domain === 'livestock' ? 'bg-green-600 text-white' : 'bg-white text-gray-600'
              }`}
            >
              <PawPrint className="h-4 w-4" /> Animal / Livestock
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Select {domain === 'crop' ? 'crop' : 'animal'} <span className="text-red-500">*</span>
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
            >
              <option value="">Select {domain === 'crop' ? 'crop' : 'animal'}</option>
              {Object.entries(groupedSubjectOptions).map(([category, opts]) => (
                <optgroup key={category} label={category}>
                  {opts.map((o) => (
                    <option key={o.id} value={o.name}>{o.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Select plot (optional)</label>
            <select
              value={plotId}
              onChange={(e) => setPlotId(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
            >
              <option value="">Select plot (optional)</option>
              {plots.map((p) => (
                <option key={p.id} value={p.id}>{p.plot_name || p.id}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Describe symptoms (optional)</label>
            <div className="relative">
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="e.g. leaves turning yellow with brown spots"
                rows={3}
                className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              />
              <button
                type="button"
                onClick={toggleMic}
                className={`absolute bottom-2.5 right-2.5 h-8 w-8 rounded-full flex items-center justify-center transition ${
                  listening ? 'bg-red-500 text-white animate-pulse' : 'bg-green-600 text-white'
                }`}
              >
                <Mic className="h-4 w-4" />
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setStep(1)}
              className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={analyze}
              disabled={!subject || loading}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
            >
              {loading ? 'Analyzing...' : <>Analyze <ChevronRight className="h-4 w-4" /></>}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 — Treatment advice */}
      {step === 3 && (
        <div className="space-y-3">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {result && result.source !== 'unavailable' && (
            <>
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                    <Leaf className="h-4 w-4 text-green-600" /> Likely issue
                  </h3>
                  {confidencePct !== null && (
                    <span className="text-xs font-medium bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full">
                      Confidence: {confidencePct}%
                    </span>
                  )}
                </div>
                <p className="text-lg font-semibold text-gray-800">{likelyIssue}</p>

                {alternatives.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-500 mb-1">Other possibilities</p>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-0.5">
                      {alternatives.map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                  </div>
                )}

                {evidence && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-500 mb-1">Evidence</p>
                    <p className="text-sm text-gray-700">{evidence}</p>
                  </div>
                )}
              </div>

              {organicTreatment && (
                <div className="p-3 bg-green-50 border border-green-100 rounded-xl">
                  <p className="text-xs font-semibold text-green-700 flex items-center gap-1.5 mb-1">
                    <Leaf className="h-4 w-4" /> Organic (try first)
                  </p>
                  <p className="text-sm text-green-800">{organicTreatment}</p>
                </div>
              )}

              {chemicalTreatment && (
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                  <p className="text-xs font-semibold text-blue-700 flex items-center gap-1.5 mb-1">
                    <FlaskConical className="h-4 w-4" /> Chemical
                  </p>
                  <p className="text-sm text-blue-800">{chemicalTreatment}</p>
                </div>
              )}

              {precautions && (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                  <p className="text-xs font-semibold text-amber-700 flex items-center gap-1.5 mb-1">
                    <ShieldAlert className="h-4 w-4" /> Precautions
                  </p>
                  <p className="text-sm text-amber-800">{precautions}</p>
                </div>
              )}

              <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  {result.disclaimer || 'AI-assisted estimate only. Confirm with a KVK expert before applying treatment.'}
                </p>
              </div>

              {(result.source || result.model_name) && (
                <p className="text-xs text-gray-400">
                  Source: {result.source} {result.model_name ? `| Model: ${result.model_name}` : ''}
                </p>
              )}
            </>
          )}

          {result && result.source === 'unavailable' && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-700 text-sm">
                {result.description || 'Diagnosis service temporarily unavailable'}
              </p>
            </div>
          )}

          <button
            onClick={startOver}
            className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors mt-2"
          >
            Diagnose another
          </button>
        </div>
      )}
    </div>
  );
}
