import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:8000'

function formatValue(value, fallback = 'Not available') {
  if (value === null || value === undefined || value === '') {
    return fallback
  }

  return String(value)
}

function scoreClass(score) {
  const value = Number(score)

  if (value >= 85) {
    return 'text-green-700'
  }

  if (value >= 70) {
    return 'text-amber-600'
  }

  return 'text-red-600'
}

function gradeClass(grade) {
  if (grade === 'A') return 'bg-green-100 text-green-800'
  if (grade === 'B') return 'bg-emerald-100 text-emerald-800'
  if (grade === 'C') return 'bg-amber-100 text-amber-800'
  if (grade === 'D') return 'bg-orange-100 text-orange-800'
  if (grade === 'F') return 'bg-red-100 text-red-800'

  return 'bg-gray-100 text-gray-700'
}

export default function LotVerification() {
  const location = useLocation()

  // This page is intentionally rendered as a standalone public page
  // from AppContent, so useParams() cannot be used here.
  // Extract the QR token directly from /lot-verification/<token>.
  const token = decodeURIComponent(
    location.pathname.replace(/^\/lot-verification\//, '').split('/')[0]
  )

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const controller = new AbortController()

    async function verify() {
      if (!token) {
        if (active) {
          setError('QR token is missing.')
          setLoading(false)
        }
        return
      }

      try {
        setLoading(true)
        setError('')
        setData(null)

        const url =
          `${API_BASE.replace(/\/$/, '')}` +
          `/api/lot-verification/${encodeURIComponent(token)}`

        console.log('[LotVerification] API:', url)

        const timeout = setTimeout(() => {
          controller.abort()
        }, 15000)

        let response

        try {
          response = await fetch(url, {
            method: 'GET',
            headers: {
              Accept: 'application/json',
            },
            signal: controller.signal,
            cache: 'no-store',
          })
        } finally {
          clearTimeout(timeout)
        }

        const rawText = await response.text()

        console.log(
          '[LotVerification] HTTP:',
          response.status
        )

        console.log(
          '[LotVerification] Response:',
          rawText
        )

        let body

        try {
          body = rawText ? JSON.parse(rawText) : null
        } catch {
          throw new Error(
            `Backend returned invalid JSON (${response.status}).`
          )
        }

        if (!response.ok) {
          throw new Error(
            body?.detail ||
            body?.message ||
            `Lot verification failed with HTTP ${response.status}.`
          )
        }

        if (!body?.verified) {
          throw new Error(
            body?.detail ||
            'This lot could not be verified.'
          )
        }

        if (!body?.lot) {
          throw new Error(
            'The verification service returned no lot details.'
          )
        }

        if (active) {
          setData(body)
        }
      } catch (err) {
        console.error(
          '[LotVerification] Verification failed:',
          err
        )

        if (!active) return

        if (err?.name === 'AbortError') {
          setError(
            'Lot verification timed out. Please try scanning the QR code again.'
          )
        } else {
          setError(
            err?.message ||
            'Unable to verify this lot.'
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    verify()

    return () => {
      active = false
      controller.abort()
    }
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-lg border border-slate-200 p-8 text-center">
          <div className="mx-auto mb-5 h-12 w-12 rounded-full border-4 border-slate-200 border-t-green-700 animate-spin" />

          <h1 className="text-xl font-semibold text-slate-900">
            Verifying AgriSaathi lot...
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Checking the QR token and retrieving the verified lot information.
          </p>

          <p className="mt-4 text-xs text-slate-400 break-all">
            Token: {token || 'missing'}
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="w-full max-w-lg rounded-2xl bg-white shadow-lg border border-red-200 p-8">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-2xl">
              !
            </div>

            <h1 className="text-xl font-semibold text-slate-900">
              Lot verification failed
            </h1>

            <p className="mt-3 text-sm text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white hover:bg-green-800"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  const lot = data?.lot || {}
  const report = data?.quality_report || {}
  const integrity = data?.integrity || {}
  const samples = Array.isArray(
    report?.quality_parameters?.samples
  )
    ? report.quality_parameters.samples
    : []

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">

        <div className="mb-6 rounded-2xl bg-green-800 px-6 py-5 text-white shadow-lg">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-green-100">
                AGRISAATHI
              </p>

              <h1 className="text-2xl font-bold">
                Lot Verification
              </h1>

              <p className="mt-1 text-sm text-green-100">
                QR-authenticated agricultural lot information
              </p>
            </div>

            <div className="rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold">
              {data?.verified ? '✓ Verified Lot' : 'Verification Pending'}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">

          <div className="lg:col-span-2 space-y-6">

            <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Lot ID
                  </p>

                  <h2 className="mt-1 text-xl font-bold break-all">
                    {formatValue(lot.lot_id)}
                  </h2>
                </div>

                <span
                  className={
                    `inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ` +
                    gradeClass(lot.quality_grade)
                  }
                >
                  Grade {formatValue(lot.quality_grade, 'N/A')}
                </span>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">

                <div>
                  <p className="text-xs text-slate-500">Commodity</p>
                  <p className="mt-1 font-semibold">
                    {formatValue(lot.crop)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Variety</p>
                  <p className="mt-1 font-semibold">
                    {formatValue(lot.variety)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Quantity</p>
                  <p className="mt-1 font-semibold">
                    {formatValue(lot.quantity_quintal)} quintal
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Status</p>
                  <p className="mt-1 font-semibold capitalize">
                    {formatValue(lot.status)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Price per quintal
                  </p>
                  <p className="mt-1 font-semibold">
                    ₹{formatValue(lot.price_per_quintal)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Minimum price
                  </p>
                  <p className="mt-1 font-semibold">
                    ₹{formatValue(lot.min_price_per_quintal)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Farmer
                  </p>
                  <p className="mt-1 font-semibold">
                    {formatValue(lot.farmer_name)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Quality report
                  </p>
                  <p className="mt-1 font-semibold break-all">
                    {formatValue(lot.quality_report_id)}
                  </p>
                </div>

              </div>
            </section>

            <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    AI Quality Assessment
                  </p>

                  <h2 className="mt-1 text-xl font-bold">
                    Produce Quality Report
                  </h2>
                </div>

                <div className="text-right">
                  <p
                    className={
                      `text-3xl font-bold ` +
                      scoreClass(report.overall_score)
                    }
                  >
                    {formatValue(report.overall_score, '—')}
                  </p>

                  <p className="text-xs text-slate-500">
                    Overall score
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">
                    Grade
                  </p>
                  <p className="mt-1 text-lg font-bold">
                    {formatValue(report.overall_grade, 'N/A')}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">
                    Samples
                  </p>
                  <p className="mt-1 text-lg font-bold">
                    {formatValue(report.sample_count, '0')}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">
                    Confidence
                  </p>
                  <p className="mt-1 text-lg font-bold">
                    {report.confidence != null
                      ? `${Math.round(Number(report.confidence) * 100)}%`
                      : 'N/A'}
                  </p>
                </div>

              </div>

              <div className="mt-5 rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap gap-3 text-sm">
                  <span>
                    AI model:
                    <strong className="ml-1">
                      {formatValue(report.ai_model)}
                    </strong>
                  </span>

                  <span>
                    Version:
                    <strong className="ml-1">
                      {formatValue(report.ai_model_version)}
                    </strong>
                  </span>
                </div>
              </div>
            </section>

            {samples.length > 0 && (
              <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
                <h2 className="text-xl font-bold">
                  Sample Analysis
                </h2>

                <div className="mt-5 space-y-4">
                  {samples.map((sample, index) => (
                    <div
                      key={sample.sample_number || index}
                      className="rounded-xl border border-slate-200 p-5"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold">
                            Sample {sample.sample_number || index + 1}
                          </p>

                          <p className="text-xs text-slate-500">
                            {formatValue(sample.model)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold">
                            {formatValue(sample.score, '—')}
                          </span>

                          <span
                            className={
                              `rounded-full px-3 py-1 text-xs font-semibold ` +
                              gradeClass(sample.grade)
                            }
                          >
                            Grade {formatValue(sample.grade, 'N/A')}
                          </span>
                        </div>
                      </div>

                      {Array.isArray(sample.observations) &&
                        sample.observations.length > 0 && (
                          <div className="mt-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Observations
                            </p>

                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                              {sample.observations.map((item, i) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                      {Array.isArray(sample.defects) &&
                        sample.defects.length > 0 && (
                          <div className="mt-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Defects / Issues
                            </p>

                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                              {sample.defects.map((item, i) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                      {sample.summary && (
                        <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                          {sample.summary}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>

          <div className="space-y-6">

            <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-bold">
                Verification
              </h2>

              <div className="mt-5 space-y-4 text-sm">

                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">
                    Verification type
                  </span>

                  <span className="text-right font-semibold">
                    {formatValue(data?.verification_type)}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">
                    Report found
                  </span>

                  <span className="font-semibold">
                    {integrity.report_found ? 'Yes' : 'No'}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">
                    Report hash
                  </span>

                  <span className="font-semibold">
                    {integrity.report_hash_present ? 'Present' : 'Missing'}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">
                    Blockchain
                  </span>

                  <span className="font-semibold capitalize">
                    {formatValue(
                      lot.blockchain_status,
                      'pending'
                    )}
                  </span>
                </div>

              </div>
            </section>

            <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-bold">
                Lot Identity
              </h2>

              <div className="mt-4 space-y-3 text-sm">

                <div>
                  <p className="text-xs text-slate-500">
                    QR token
                  </p>

                  <p className="mt-1 break-all font-mono text-xs">
                    {formatValue(lot.qr_token)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Quality report ID
                  </p>

                  <p className="mt-1 break-all font-mono text-xs">
                    {formatValue(lot.quality_report_id)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Report hash
                  </p>

                  <p className="mt-1 break-all font-mono text-xs">
                    {formatValue(report.report_hash)}
                  </p>
                </div>

              </div>
            </section>

            <section className="rounded-2xl bg-amber-50 border border-amber-200 p-5">
              <p className="text-sm font-semibold text-amber-900">
                Blockchain status
              </p>

              <p className="mt-2 text-sm text-amber-800">
                {formatValue(
                  report.blockchain_status ||
                  lot.blockchain_status,
                  'pending'
                )}
              </p>

              <p className="mt-2 text-xs text-amber-700">
                Blockchain anchoring is not claimed as completed unless
                the backend reports an anchored transaction.
              </p>
            </section>

          </div>
        </div>
      </div>
    </div>
  )
}
