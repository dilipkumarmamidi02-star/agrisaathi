import axios from 'axios';
import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { getAuth } from 'firebase/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function getQualityTrends() {
  const user = getAuth().currentUser;

  if (!user) {
    throw new Error('You are not signed in.');
  }

  const token = await user.getIdToken();

  const response = await axios.get(
    `${API_URL}/api/admin/quality/trends`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data || {};
}

export default function AdminQualityTrends() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const result = await getQualityTrends();

        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.data?.detail ||
            err?.message ||
            'Unable to load quality analytics.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const totalReports = Number(
    data?.total_quality_reports || 0
  );

  const gradeA = Number(
    data?.grade_a_reports || 0
  );

  const gradeB = Number(
    data?.grade_b_reports || 0
  );

  const gradeC = Number(
    data?.grade_c_reports || 0
  );

  const totalLots = Number(
    data?.total_lots || 0
  );

  return (
    <section className="min-h-screen bg-lt-bg p-6">
      <div className="mx-auto max-w-7xl">

        <div className="mb-6 flex items-center gap-3">
          <BarChart3 className="text-lt-primary" />

          <div>
            <h1 className="text-2xl font-bold text-lt-text">
              Quality Trends & Analytics
            </h1>

            <p className="text-sm text-lt-text-secondary">
              Distribution of lot quality reports and platform trends
            </p>
          </div>
        </div>

        {loading && (
          <div className="rounded-xl border border-lt-border bg-lt-card p-8 text-center">
            Loading quality analytics...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

              <Stat
                label="Total Quality Reports"
                value={totalReports}
              />

              <Stat
                label="Grade A Reports"
                value={gradeA}
              />

              <Stat
                label="Grade B Reports"
                value={gradeB}
              />

              <Stat
                label="Grade C Reports"
                value={gradeC}
              />

              <Stat
                label="Total Lots"
                value={totalLots}
              />

            </div>

            <div className="mt-6 rounded-xl border border-lt-border bg-lt-card p-6">

              <h2 className="mb-5 font-semibold text-lt-text">
                Quality Grade Distribution
              </h2>

              <div className="space-y-5">

                <GradeBar
                  label="Grade A"
                  value={gradeA}
                  total={totalReports}
                />

                <GradeBar
                  label="Grade B"
                  value={gradeB}
                  total={totalReports}
                />

                <GradeBar
                  label="Grade C"
                  value={gradeC}
                  total={totalReports}
                />

              </div>

            </div>

            <div className="mt-6 rounded-xl border border-lt-border bg-lt-card p-6">

              <h2 className="mb-4 font-semibold text-lt-text">
                Report Records
              </h2>

              <div className="space-y-3">

                {(data?.reports || []).map((report) => (
                  <div
                    key={report.id || report.report_id}
                    className="rounded-lg border border-lt-border p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-lt-text">
                          {report.report_id || report.id}
                        </p>

                        <p className="text-sm text-lt-text-secondary">
                          {report.commodity || '—'}
                          {' · '}
                          {report.variety || '—'}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-lt-text">
                          Grade {report.overall_grade || '—'}
                        </p>

                        <p className="text-xs text-lt-text-secondary">
                          Score {report.overall_score ?? '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

              </div>

            </div>
          </>
        )}

      </div>
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-lt-border bg-lt-card p-5">
      <p className="text-xs text-lt-text-muted">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold text-lt-text">
        {value}
      </p>
    </div>
  );
}

function GradeBar({ label, value, total }) {
  const percentage =
    total > 0
      ? Math.round((value / total) * 100)
      : 0;

  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span>{label}</span>
        <span>{value}</span>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-lt-bg">
        <div
          className="h-full rounded-full bg-lt-primary"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
