import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Package,
  AlertTriangle,
  ShoppingCart,
  CheckCircle,
  Clock,
  FileCheck,
  TrendingUp,
  ShieldCheck,
  Database,
  UserCog,
} from 'lucide-react';
import { api } from '../api/appClient';
import { useUserRole } from '../hooks/useUserRole';

export default function AdminHome() {
  const { displayName, email } = useUserRole();

  const [data, setData] = useState({
    users: [],
    lots: [],
    offers: [],
    orders: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        const [usersResult, lotsResult] = await Promise.all([
          api.get('/api/users/admin/users'),
          api.get('/api/lots/'),
        ]);

        const users = Array.isArray(usersResult)
          ? usersResult
          : usersResult?.users || usersResult?.items || [];

        const lots = Array.isArray(lotsResult)
          ? lotsResult
          : lotsResult?.lots || lotsResult?.items || [];

        const results = [
          users,
          lots,
          [],
          [],
        ];

        if (!mounted) return;

        setData({
          users: Array.isArray(results[0]) ? results[0] : [],
          lots: Array.isArray(results[1]) ? results[1] : [],
          offers: Array.isArray(results[2]) ? results[2] : [],
          orders: Array.isArray(results[3]) ? results[3] : [],
        });
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const farmers = data.users.filter(
      (u) => String(u.role || '').toLowerCase() === 'farmer'
    ).length;

    const supporters = data.users.filter(
      (u) => String(u.role || '').toLowerCase() === 'supporter'
    ).length;

    const verifiedLots = data.lots.filter((lot) => {
      const status = String(
        lot.status || lot.blockchain_status || ''
      ).toLowerCase();

      return (
        status === 'verified' ||
        status === 'active' ||
        status === 'anchored'
      );
    }).length;

    const pendingLots = Math.max(
      data.lots.length - verifiedLots,
      0
    );

    const qualityReports = data.lots.filter(
      (lot) =>
        lot.quality_report_id ||
        lot.quality_grade ||
        lot.quality_score != null
    ).length;

    return {
      totalUsers: data.users.length,
      farmers,
      supporters,
      totalLots: data.lots.length,
      verifiedLots,
      pendingLots,
      qualityReports,
      orders: data.orders.length,
      offers: data.offers.length,
    };
  }, [data]);

  return (
    <div className="min-h-screen bg-lt-bg px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-lt-primary">
              AgriSaathi · Governance
            </p>

            <h1 className="mt-1 text-3xl font-bold text-lt-text">
              Admin Dashboard
            </h1>

            <p className="mt-1 text-sm text-lt-text-secondary">
              Platform governance and oversight
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-lt-border bg-lt-card px-4 py-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lt-primary/10">
              <UserCog size={19} className="text-lt-primary" />
            </div>

            <div>
              <p className="text-sm font-semibold text-lt-text">
                {displayName || 'Admin'}
              </p>

              <p className="text-xs text-lt-text-secondary">
                {email || 'Administrator account'}
              </p>
            </div>

          </div>
        </div>


        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <Metric
            icon={Users}
            value={loading ? '—' : stats.totalUsers}
            label="Total Users"
            detail={`${stats.farmers} farmers · ${stats.supporters} supporters`}
          />

          <Metric
            icon={Package}
            value={loading ? '—' : stats.totalLots}
            label="Active Lots"
            detail={`${stats.verifiedLots} verified · ${stats.pendingLots} pending`}
          />

          <Metric
            icon={AlertTriangle}
            value="0"
            label="Open Grievances"
            detail="Needs attention"
          />

          <Metric
            icon={ShoppingCart}
            value={loading ? '—' : stats.orders}
            label="Total Orders"
            detail={`${stats.offers} offers`}
          />

        </div>


        <div className="grid gap-5 lg:grid-cols-2">

          <Panel title="Lot Verification Status" icon={ShieldCheck}>

            <div className="grid grid-cols-2 gap-4">

              <StatusCard
                icon={CheckCircle}
                value={loading ? '—' : stats.verifiedLots}
                label="Verified Lots"
              />

              <StatusCard
                icon={Clock}
                value={loading ? '—' : stats.pendingLots}
                label="Pending Lots"
              />

            </div>

          </Panel>


          <Panel title="Quality Reports" icon={FileCheck}>

            <div className="flex items-center justify-between">

              <div>
                <p className="text-4xl font-bold text-lt-primary">
                  {loading ? '—' : stats.qualityReports}
                </p>

                <p className="mt-1 text-sm text-lt-text-secondary">
                  Quality reports linked to platform lots
                </p>
              </div>

              <Link
                to="/admin/quality-trends"
                className="rounded-lg border border-lt-border px-4 py-2 text-sm font-medium text-lt-text hover:bg-lt-bg"
              >
                View analytics
              </Link>

            </div>

          </Panel>

        </div>


        <Panel title="Reports & Platform Activity" icon={TrendingUp}>

          <div className="grid gap-4 sm:grid-cols-3">

            <ActivityCard
              label="Users"
              value={loading ? '—' : stats.totalUsers}
              href="/admin/users"
            />

            <ActivityCard
              label="Lots"
              value={loading ? '—' : stats.totalLots}
              href="/admin/lots"
            />

            <ActivityCard
              label="Quality Reports"
              value={loading ? '—' : stats.qualityReports}
              href="/admin/quality-trends"
            />

          </div>

        </Panel>


        <Panel title="Logistics Demand Overview" icon={Package}>

          <div className="flex min-h-[130px] items-center justify-center rounded-xl bg-lt-bg">

            <div className="text-center">

              <p className="font-medium text-lt-text">
                No active storage demand or harvest forecasts yet.
              </p>

              <p className="mt-1 text-xs text-lt-text-secondary">
                Live logistics information will appear here when available.
              </p>

            </div>

          </div>

        </Panel>


        <Panel title="Admin Actions" icon={Database}>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">

            <Action
              href="/admin/users"
              title="Manage Users"
              description="Verify farmers & supporters"
            />

            <Action
              href="/admin/grievances"
              title="Handle Grievances"
              description="Review complaints & take action"
            />

            <Action
              href="/market-prices"
              title="Monitor Market Data"
              description="Data.gov.in integration"
            />

            <Action
              href="/admin/quality-trends"
              title="Quality Trends Analytics"
              description="Charts & platform trends"
            />

          </div>

        </Panel>

      </div>
    </div>
  );
}

function Metric({ icon: Icon, value, label, detail }) {
  return (
    <div className="rounded-xl border border-lt-border bg-lt-card p-5">

      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lt-primary/10">
        <Icon size={19} className="text-lt-primary" />
      </div>

      <p className="mt-5 text-3xl font-bold text-lt-text">
        {value}
      </p>

      <p className="mt-1 text-sm font-medium text-lt-text">
        {label}
      </p>

      <p className="mt-1 text-xs text-lt-text-secondary">
        {detail}
      </p>

    </div>
  );
}

function Panel({ title, icon: Icon, children }) {
  return (
    <section className="rounded-xl border border-lt-border bg-lt-card p-5">

      <div className="mb-5 flex items-center gap-2">

        {Icon && (
          <Icon size={18} className="text-lt-primary" />
        )}

        <h2 className="font-semibold text-lt-text">
          {title}
        </h2>

      </div>

      {children}

    </section>
  );
}

function StatusCard({ icon: Icon, value, label }) {
  return (
    <div className="rounded-xl bg-lt-bg p-5">

      <Icon size={19} className="text-lt-primary" />

      <p className="mt-3 text-3xl font-bold text-lt-text">
        {value}
      </p>

      <p className="text-sm text-lt-text-secondary">
        {label}
      </p>

    </div>
  );
}

function ActivityCard({ label, value, href }) {
  return (
    <Link
      to={href}
      className="rounded-xl border border-lt-border p-5 transition hover:bg-lt-bg"
    >
      <p className="text-xs text-lt-text-muted">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold text-lt-primary">
        {value}
      </p>

      <p className="mt-2 text-xs font-medium text-lt-text-secondary">
        View details →
      </p>
    </Link>
  );
}

function Action({ href, title, description }) {
  return (
    <Link
      to={href}
      className="rounded-xl border border-lt-border p-4 transition hover:bg-lt-bg"
    >
      <p className="font-medium text-lt-text">
        {title}
      </p>

      <p className="mt-1 text-xs text-lt-text-secondary">
        {description}
      </p>
    </Link>
  );
}
