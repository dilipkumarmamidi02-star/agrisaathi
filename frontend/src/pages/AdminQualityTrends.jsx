import { useEffect, useMemo, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { getAuth } from 'firebase/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function getData(path) {
  const user = getAuth().currentUser;

  if (!user) {
    throw new Error('You are not signed in.');
  }

  const token = await user.getIdToken();

  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return text ? JSON.parse(text) : [];
}

export default function AdminQualityTrends() {
  const [reports, setReports] = useState([]);
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [qualityResult, lotResult] = await Promise.all([
          getData('/api/quality-reports').catch(() => []),
          getData('/api/lots/').catch(() => []),
        ]);

        setReports(
          Array.isArray(qualityResult)
            ? qualityResult
            : qualityResult?.reports || qualityResult?.items || []
        );

        setLots(
          Array.isArray(lotResult)
            ? lotResult
            : lotResult?.lots || lotResult?.items || []
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const stats = useMemo(() => {
    const gradeA = reports.filter(
      (report) =>
        String(
          report.grade || report.quality_grade || ''
        ).toUpperCase() === 'A'
    ).length;

    const gradeB = reports.filter(
      (report) =>
        String(
          report.grade || report.quality_grade || ''
        ).toUpperCase() === 'B'
    ).length;

    const gradeC = reports.filter(
      (report) =>
        String(
          report.grade || report.quality_grade || ''
        ).toUpperCase() === 'C'
    ).length;

    return {
      reports: reports.length,
      gradeA,
      gradeB,
      gradeC,
      lots: lots.length,
    };
  }, [reports, lots]);

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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

          <Stat label="Total Quality Reports" value={loading ? '—' : stats.reports} />
          <Stat label="Grade A Reports" value={loading ? '—' : stats.gradeA} />
          <Stat label="Grade B Reports" value={loading ? '—' : stats.gradeB} />
          <Stat label="Grade C Reports" value={loading ? '—' : stats.gradeC} />
          <Stat label="Total Lots" value={loading ? '—' : stats.lots} />

        </div>

        <div className="mt-6 rounded-xl border border-lt-border bg-lt-card p-6">

          <h2 className="mb-5 font-semibold text-lt-text">
            Quality Grade Distribution
          </h2>

          <div className="space-y-5">

            <GradeBar
              label="Grade A"
              value={stats.gradeA}
              total={stats.reports}
            />

            <GradeBar
              label="Grade B"
              value={stats.gradeB}
              total={stats.reports}
            />

            <GradeBar
              label="Grade C"
              value={stats.gradeC}
              total={stats.reports}
            />

          </div>

        </div>

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
    total > 0 ? Math.round((value / total) * 100) : 0;

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
