import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  AlertTriangle,
  CheckCircle2,
  Hash,
  Loader2,
  Package,
  ShieldCheck,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

const API_BASE =
  import.meta.env.VITE_API_URL || 'http://localhost:8000'

function Score({ label, value }) {
  if (value === null || value === undefined) return null

  const score = Math.max(
    0,
    Math.min(100, Number(value))
  )

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-500">
          {label}
        </span>

        <span className="font-semibold">
          {score.toFixed(0)}/100
        </span>
      </div>

      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-emerald-600"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

export default function LotVerification() {
  const { qrToken } = useParams()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const verificationUrl =
    `${window.location.origin}/lot-verification/${encodeURIComponent(qrToken)}`

  useEffect(() => {
    let active = true

    async function verify() {
      try {
        setLoading(true)

        const response = await fetch(
          `${API_BASE}/api/lot-verification/${encodeURIComponent(qrToken)}`
        )

        const body = await response.json()

        if (!response.ok) {
          throw new Error(
            body?.detail || 'Lot verification failed.'
          )
        }

        if (active) {
          setData(body)
        }
      } catch (err) {
        if (active) {
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

    if (qrToken) {
      verify()
    }

    return () => {
      active = false
    }
  }, [qrToken])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-emerald-700">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Verifying AgriSaathi lot...</span>
        </div>
      </div>
    )
  }

  if (error || !data?.verified) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-red-100 shadow-lg p-7 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />

          <h1 className="text-xl font-bold text-gray-900">
            Lot Verification Failed
          </h1>

          <p className="text-sm text-gray-500 mt-2">
            {error || 'This QR code is not valid.'}
          </p>
        </div>
      </div>
    )
  }

  const lot = data.lot
  const report = data.quality_report
  const parameters =
    report?.quality_parameters || {}

  return (
    <div className="min-h-screen bg-slate-50">

      <header className="bg-[#1b4332] text-white">
        <div className="max-w-5xl mx-auto px-5 py-5 flex justify-between items-center">

          <div>
            <div className="text-xl font-bold">
              AgriSaathi
            </div>

            <div className="text-xs text-emerald-200">
              Verified Produce Lot
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-5 w-5 text-emerald-300" />
            Verified
          </div>

        </div>
      </header>

      <main className="max-w-5xl mx-auto p-5 space-y-5">

        <section className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-5">

          <div className="flex flex-col md:flex-row gap-6">

            <div className="flex-1">

              <div className="flex items-center gap-2 text-emerald-700 text-sm font-semibold">
                <Package className="h-4 w-4" />
                LOT VERIFICATION
              </div>

              <h1 className="text-3xl font-bold text-[#1b4332] mt-2">
                {lot.crop}
                {lot.variety
                  ? ` · ${lot.variety}`
                  : ''}
              </h1>

              <div className="font-mono text-sm text-gray-500 mt-2">
                {lot.lot_id}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">

                <div>
                  <div className="text-xs text-gray-400">
                    Quantity
                  </div>
                  <div className="font-semibold">
                    {lot.quantity_quintal} quintal
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-400">
                    Asking Price
                  </div>
                  <div className="font-semibold">
                    ₹{Number(
                      lot.price_per_quintal
                    ).toLocaleString('en-IN')}
                    /quintal
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-400">
                    Farmer
                  </div>
                  <div className="font-semibold">
                    {lot.farmer_name ||
                      'Verified farmer'}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-400">
                    Status
                  </div>
                  <div className="font-semibold text-emerald-700">
                    {lot.status}
                  </div>
                </div>

              </div>
            </div>

            <div className="flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-gray-100 pt-5 md:pt-0 md:pl-6">

              <QRCodeSVG
                value={verificationUrl}
                size={180}
                level="H"
                includeMargin
              />

              <div className="text-xs text-gray-400 mt-2">
                Scan to verify
              </div>

            </div>

          </div>

        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-5">

          <div className="flex items-center gap-2 mb-5">
            <ShieldCheck className="h-5 w-5 text-emerald-700" />

            <h2 className="text-xl font-bold text-[#1b4332]">
              Quality Analysis
            </h2>
          </div>

          {!report ? (

            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
              No linked AI quality report is currently available for this lot.
            </div>

          ) : (

            <>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                <div className="rounded-xl bg-emerald-50 p-4">
                  <div className="text-xs text-gray-500">
                    Grade
                  </div>

                  <div className="text-3xl font-bold text-emerald-700">
                    {report.overall_grade || '—'}
                  </div>
                </div>

                <div className="rounded-xl bg-emerald-50 p-4">
                  <div className="text-xs text-gray-500">
                    Quality Score
                  </div>

                  <div className="text-3xl font-bold text-emerald-700">
                    {report.overall_score ?? '—'}
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="text-xs text-gray-500">
                    Confidence
                  </div>

                  <div className="text-2xl font-bold">
                    {report.confidence != null
                      ? `${Math.round(
                          Number(report.confidence) * 100
                        )}%`
                      : '—'}
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="text-xs text-gray-500">
                    Samples
                  </div>

                  <div className="text-2xl font-bold">
                    {report.sample_count ?? '—'}
                  </div>
                </div>

              </div>

              <div className="grid md:grid-cols-2 gap-5 mt-6">

                <Score
                  label="Appearance"
                  value={parameters.appearance}
                />

                <Score
                  label="Damage"
                  value={parameters.damage}
                />

                <Score
                  label="Cleanliness"
                  value={parameters.cleanliness}
                />

                <Score
                  label="Uniformity"
                  value={parameters.uniformity}
                />

              </div>

              {report.consistency_note && (
                <div className="mt-5 rounded-xl bg-amber-50 border border-amber-100 p-4 text-sm text-amber-800">
                  <strong>Analysis note:</strong>{' '}
                  {report.consistency_note}
                </div>
              )}

            </>
          )}

        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-5">

          <div className="flex items-center gap-2 mb-5">

            <Hash className="h-5 w-5 text-emerald-700" />

            <h2 className="text-xl font-bold text-[#1b4332]">
              Authenticity & Provenance
            </h2>

          </div>

          <div className="space-y-4 text-sm">

            <div className="flex justify-between gap-4">
              <span className="text-gray-500">
                Verification status
              </span>

              <span className="font-semibold text-emerald-700">
                {data.integrity?.verification_status ||
                  'Recorded'}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-gray-500">
                Blockchain status
              </span>

              <span className="font-semibold">
                {lot.blockchain_status ||
                  'Pending'}
              </span>
            </div>

            {lot.blockchain_hash && (
              <div>

                <div className="text-gray-500 mb-1">
                  Lot provenance hash
                </div>

                <div className="font-mono text-xs break-all bg-slate-50 rounded-lg p-3">
                  {lot.blockchain_hash}
                </div>

              </div>
            )}

            {report?.report_hash && (
              <div>

                <div className="text-gray-500 mb-1">
                  Quality report hash
                </div>

                <div className="font-mono text-xs break-all bg-slate-50 rounded-lg p-3">
                  {report.report_hash}
                </div>

              </div>
            )}

          </div>

        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-5">

          <h2 className="text-xl font-bold text-[#1b4332] mb-4">
            Lot Details
          </h2>

          <div className="space-y-2 text-sm text-gray-700">

            {lot.harvest_date && (
              <div>
                <strong>Harvest date:</strong>{' '}
                {lot.harvest_date}
              </div>
            )}

            {lot.min_price_per_quintal != null && (
              <div>
                <strong>Minimum price:</strong>{' '}
                ₹{Number(
                  lot.min_price_per_quintal
                ).toLocaleString('en-IN')}
                /quintal
              </div>
            )}

            {lot.notes && (
              <div>
                <strong>Farmer notes:</strong>{' '}
                {lot.notes}
              </div>
            )}

          </div>

        </section>

        <div className="text-center text-xs text-gray-400 pb-8">
          AgriSaathi QR verification
        </div>

      </main>

    </div>
  )
}
