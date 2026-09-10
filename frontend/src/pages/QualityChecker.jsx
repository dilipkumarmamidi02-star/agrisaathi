import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  FileCheck2,
  ImagePlus,
  Loader2,
  ShieldCheck,
  Trash2,
  Upload,
  XCircle,
} from 'lucide-react';

import { api } from '../api/appClient';


const MIN_SAMPLES = 5;
const MAX_SAMPLES = 10;


export default function QualityChecker() {
  const navigate = useNavigate();
  const location = useLocation();

  const [commodity, setCommodity] = useState(
    location.state?.commodity || ''
  );

  const [variety, setVariety] = useState(
    location.state?.variety || ''
  );

  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);


  const canAnalyze = useMemo(
    () =>
      !analyzing &&
      commodity.trim().length > 0 &&
      files.length >= MIN_SAMPLES &&
      files.length <= MAX_SAMPLES,
    [analyzing, commodity, files]
  );


  const handleFiles = (event) => {
    const selected = Array.from(
      event.target.files || []
    );

    if (!selected.length) return;

    setError('');

    const combined = [
      ...files,
      ...selected,
    ].slice(0, MAX_SAMPLES);

    const unique = combined.filter(
      (file, index, array) =>
        array.findIndex(
          (item) =>
            item.name === file.name &&
            item.size === file.size &&
            item.lastModified === file.lastModified
        ) === index
    );

    setFiles(unique);

    previews.forEach((url) => {
      URL.revokeObjectURL(url);
    });

    setPreviews(
      unique.map((file) =>
        URL.createObjectURL(file)
      )
    );

    event.target.value = '';

    if (files.length + selected.length > MAX_SAMPLES) {
      setError(
        `Maximum ${MAX_SAMPLES} samples are allowed.`
      );
    }
  };


  const removeSample = (index) => {
    const nextFiles = files.filter(
      (_, fileIndex) => fileIndex !== index
    );

    const nextPreviews = previews.filter(
      (_, previewIndex) => previewIndex !== index
    );

    if (previews[index]) {
      URL.revokeObjectURL(previews[index]);
    }

    setFiles(nextFiles);
    setPreviews(nextPreviews);
    setError('');
  };


  const clearSamples = () => {
    previews.forEach((url) => {
      URL.revokeObjectURL(url);
    });

    setFiles([]);
    setPreviews([]);
    setReport(null);
    setError('');
  };



  const compressQualityImage = (file) =>
    new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith('image/')) {
        reject(new Error('Only image files are supported.'));
        return;
      }

      const MAX_BYTES = 2.5 * 1024 * 1024;
      const MAX_DIMENSION = 1600;

      if (file.size <= MAX_BYTES) {
        resolve(file);
        return;
      }

      const reader = new FileReader();

      reader.onerror = () => {
        reject(new Error(`Unable to read ${file.name}.`));
      };

      reader.onload = () => {
        const image = new Image();

        image.onerror = () => {
          reject(new Error(`Unable to decode ${file.name}.`));
        };

        image.onload = () => {
          let width = image.naturalWidth;
          let height = image.naturalHeight;

          const scale = Math.min(
            1,
            MAX_DIMENSION / Math.max(width, height)
          );

          width = Math.max(1, Math.round(width * scale));
          height = Math.max(1, Math.round(height * scale));

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const context = canvas.getContext('2d');

          if (!context) {
            reject(new Error(`Unable to process ${file.name}.`));
            return;
          }

          context.drawImage(image, 0, 0, width, height);

          const convert = (quality) => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error(`Unable to compress ${file.name}.`));
                  return;
                }

                if (blob.size <= MAX_BYTES || quality <= 0.55) {
                  const outputName = file.name.replace(
                    /\.(png|jpe?g|webp|heic|heif)$/i,
                    ''
                  ) + '.jpg';

                  resolve(
                    new File(
                      [blob],
                      outputName,
                      {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                      }
                    )
                  );
                  return;
                }

                convert(Math.max(0.55, quality - 0.08));
              },
              'image/jpeg',
              quality
            );
          };

          convert(0.82);
        };

        image.src = reader.result;
      };

      reader.readAsDataURL(file);
    });

  const analyze = async () => {
    setError('');

    if (!commodity.trim()) {
      setError('Please enter the commodity.');
      return;
    }

    if (files.length < MIN_SAMPLES) {
      setError(
        `Please upload at least ${MIN_SAMPLES} samples.`
      );
      return;
    }

    if (files.length > MAX_SAMPLES) {
      setError(
        `Maximum ${MAX_SAMPLES} samples are allowed.`
      );
      return;
    }

    setAnalyzing(true);
    setReport(null);

    try {
      const formData = new FormData();

      formData.append(
        'commodity',
        commodity.trim()
      );

      formData.append(
        'variety',
        variety.trim()
      );

      const compressedFiles = await Promise.all(
        files.map((file) => compressQualityImage(file))
      );

      compressedFiles.forEach((file) => {
        formData.append('files', file, file.name);
      });

      const result = await api.post(
        '/api/quality-reports/analyze',
        formData,
        {
          headers: {
            'Content-Type':
              'multipart/form-data',
          },
          timeout: 600000,
        }
      );

      if (!result?.report_id) {
        throw new Error(
          'Quality analysis completed but no report ID was returned.'
        );
      }

      setReport(result);

    } catch (err) {
      console.error(
        'Quality analysis failed:',
        err
      );

      const status = err?.response?.status;

      const detail =
        err?.response?.data?.detail ||
        err?.message ||
        'Quality analysis failed.';

      if (status === 413) {
        setError(
          'The selected images are too large. They will be compressed automatically before upload. Please try again.'
        );
        return;
      }

      if (status === 502) {
        const providerDetail =
          typeof detail === 'object'
            ? detail.message || JSON.stringify(detail)
            : String(detail);

        setError(
          `AI quality analysis is temporarily unavailable. ${providerDetail}`
        );
        return;
      }

      if (
        typeof detail === 'object'
      ) {
        setError(
          detail.message ||
          JSON.stringify(detail)
        );
      } else {
        setError(String(detail));
      }
    } finally {
      setAnalyzing(false);
    }
  };


  const createLotFromReport = () => {
    if (!report?.report_id) {
      setError(
        'A valid quality report is required before creating a lot.'
      );
      return;
    }

    navigate('/my-lots', {
      state: {
        qualityReportId: report.report_id,
        qualityGrade: report.overall_grade,
        qualityScore: report.overall_score,
        commodity: report.commodity,
        variety: report.variety,
      },
    });
  };


  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={18} />
          Back
        </button>


        <div className="mb-8">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-green-700">
            <ShieldCheck size={18} />
            AGRISAATHI QUALITY
          </div>

          <h1 className="text-3xl font-bold text-slate-900">
            Produce Quality Checker
          </h1>

          <p className="mt-2 max-w-3xl text-slate-600">
            Upload multiple real produce samples for
            AI-assisted visual quality assessment.
          </p>
        </div>


        <div className="grid gap-6 lg:grid-cols-3">

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">

            <div className="grid gap-5 sm:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Commodity
                </label>

                <input
                  value={commodity}
                  onChange={(event) =>
                    setCommodity(event.target.value)
                  }
                  placeholder="e.g. Paddy, Maize, Tomato"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </div>


              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Variety
                </label>

                <input
                  value={variety}
                  onChange={(event) =>
                    setVariety(event.target.value)
                  }
                  placeholder="Optional"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </div>

            </div>


            <div className="mt-6 rounded-2xl border-2 border-dashed border-slate-300 p-6 text-center">

              <ImagePlus
                className="mx-auto mb-3 text-slate-500"
                size={34}
              />

              <h2 className="font-semibold text-slate-900">
                Upload produce samples
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Minimum {MIN_SAMPLES}, maximum {MAX_SAMPLES} images
              </p>

              <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800">
                <Upload size={18} />
                Choose Images

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFiles}
                  className="hidden"
                />
              </label>

            </div>


            {files.length > 0 && (
              <div className="mt-6">

                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-slate-900">
                      Selected Samples
                    </h2>

                    <p className="text-sm text-slate-500">
                      {files.length} of {MAX_SAMPLES} samples
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={clearSamples}
                    className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                    Clear
                  </button>
                </div>


                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">

                  {previews.map((preview, index) => (
                    <div
                      key={`${preview}-${index}`}
                      className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                    >
                      <img
                        src={preview}
                        alt={`Sample ${index + 1}`}
                        className="aspect-square w-full object-cover"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          removeSample(index)
                        }
                        className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-red-600 shadow"
                        aria-label={`Remove sample ${index + 1}`}
                      >
                        <XCircle size={18} />
                      </button>

                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 text-center text-xs font-medium text-white">
                        Sample {index + 1}
                      </div>
                    </div>
                  ))}

                </div>

              </div>
            )}


            {error && (
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <XCircle
                  size={20}
                  className="mt-0.5 shrink-0"
                />
                <span>{error}</span>
              </div>
            )}


            <button
              type="button"
              disabled={!canAnalyze}
              onClick={analyze}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3.5 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <Loader2
                    size={19}
                    className="animate-spin"
                  />
                  Analyzing Samples…
                </>
              ) : (
                <>
                  <FileCheck2 size={19} />
                  Analyze Quality
                </>
              )}
            </button>

          </section>


          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="font-semibold text-slate-900">
              Assessment Process
            </h2>

            <div className="mt-5 space-y-4">

              <div className="flex gap-3">
                <div className="mt-1">
                  <CheckCircle2
                    size={18}
                    className="text-green-600"
                  />
                </div>

                <div>
                  <p className="font-medium text-slate-800">
                    Multiple samples
                  </p>

                  <p className="text-sm text-slate-500">
                    Uses several images instead of one
                    visual sample.
                  </p>
                </div>
              </div>


              <div className="flex gap-3">
                <div className="mt-1">
                  <CheckCircle2
                    size={18}
                    className="text-green-600"
                  />
                </div>

                <div>
                  <p className="font-medium text-slate-800">
                    Groq Vision
                  </p>

                  <p className="text-sm text-slate-500">
                    Images are assessed by the configured
                    AI vision service.
                  </p>
                </div>
              </div>


              <div className="flex gap-3">
                <div className="mt-1">
                  <CheckCircle2
                    size={18}
                    className="text-green-600"
                  />
                </div>

                <div>
                  <p className="font-medium text-slate-800">
                    Persistent report
                  </p>

                  <p className="text-sm text-slate-500">
                    The backend stores the quality report
                    and sample analysis.
                  </p>
                </div>
              </div>

            </div>

          </aside>

        </div>


        {report && (
          <section className="mt-6 rounded-2xl border border-green-200 bg-white p-6 shadow-sm">

            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">

              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-green-700">
                  <CheckCircle2 size={18} />
                  QUALITY REPORT CREATED
                </div>

                <h2 className="text-2xl font-bold text-slate-900">
                  AI-Assisted Quality Assessment
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Report ID: {report.report_id}
                </p>
              </div>


              <div className="rounded-2xl bg-green-50 px-6 py-4 text-center">
                <div className="text-4xl font-bold text-green-700">
                  {report.overall_grade || '—'}
                </div>

                <div className="text-sm font-medium text-green-800">
                  Overall Grade
                </div>
              </div>

            </div>


            <div className="mt-6 grid gap-4 sm:grid-cols-3">

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">
                  Overall Score
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {report.overall_score ?? '—'}
                  <span className="text-sm font-medium text-slate-500">
                    /100
                  </span>
                </p>
              </div>


              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">
                  Confidence
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {report.confidence != null
                    ? `${Math.round(
                        Number(report.confidence) * 100
                      )}%`
                    : '—'}
                </p>
              </div>


              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">
                  Samples
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {report.sample_count ?? files.length}
                </p>
              </div>

            </div>


            {report.consistency_note && (
              <div className="mt-5 rounded-xl border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-700">
                  Assessment Note
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  {report.consistency_note}
                </p>
              </div>
            )}


            {Array.isArray(
              report.quality_parameters?.samples
            ) && (
              <div className="mt-5">
                <h3 className="font-semibold text-slate-900">
                  Sample Assessments
                </h3>

                <div className="mt-3 space-y-3">

                  {report.quality_parameters.samples.map(
                    (sample, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-slate-200 p-4"
                      >

                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium text-slate-800">
                            Sample {index + 1}
                          </span>

                          <span className="font-semibold text-slate-900">
                            {sample.score ?? '—'}/100
                          </span>
                        </div>


                        {sample.summary && (
                          <p className="mt-2 text-sm text-slate-600">
                            {sample.summary}
                          </p>
                        )}


                        {Array.isArray(
                          sample.observations
                        ) &&
                          sample.observations.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Observations
                              </p>

                              <ul className="mt-1 list-disc pl-5 text-sm text-slate-600">
                                {sample.observations.map(
                                  (item, itemIndex) => (
                                    <li key={itemIndex}>
                                      {item}
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}


                        {Array.isArray(
                          sample.defects
                        ) &&
                          sample.defects.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Defects
                              </p>

                              <ul className="mt-1 list-disc pl-5 text-sm text-red-600">
                                {sample.defects.map(
                                  (item, itemIndex) => (
                                    <li key={itemIndex}>
                                      {item}
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}

                      </div>
                    )
                  )}

                </div>
              </div>
            )}


            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <strong>AI-assisted estimate:</strong>{' '}
              This visual assessment should be confirmed
              with an agricultural/KVK expert before making
              treatment or commercial decisions.
            </div>


            <button
              type="button"
              onClick={createLotFromReport}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-700 px-5 py-3.5 font-semibold text-white hover:bg-green-800"
            >
              Create Lot From This Report
            </button>

          </section>
        )}

      </div>
    </div>
  );
}
