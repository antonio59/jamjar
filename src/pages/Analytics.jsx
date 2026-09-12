import { useEffect, useState, useMemo } from "react";
import {
  Clock,
  CheckCircle,
  UploadCloud,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Music,
  Book,
  Users,
} from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import useStore from "../store/useStore";
import {
  Card,
  SectionHeader,
  KpiCard,
  EmptyState,
  Badge,
  StatusBadge,
  Skeleton,
} from "../components/ui";

function formatDuration(seconds) {
  if (!seconds || seconds < 1) return "—";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function pctChange(current, previous) {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) return { direction: "up", label: "new this week" };
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return { direction: "flat", label: "no change" };
  return {
    direction: pct > 0 ? "up" : "down",
    label: `${Math.abs(pct)}% vs last week`,
  };
}

export default function Analytics() {
  const { getAnalytics } = useStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalytics().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [getAnalytics]);

  const weekTrend = useMemo(
    () =>
      data ? pctChange(data.completedThisWeek, data.completedLastWeek) : null,
    [data],
  );

  if (loading) return <AnalyticsSkeleton />;
  if (!data) return <EmptyState title="No analytics yet" />;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
          Analytics
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Library growth, queue health, and what's getting played most.
        </p>
      </header>

      {/* Outcome KPIs — what to do, not just totals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Awaiting approval"
          value={data.pending}
          tone={data.pending > 0 ? "warning" : "neutral"}
          icon={<Clock className="w-4 h-4" />}
          hint={data.pending > 0 ? "Open Triage to review" : "Queue is empty"}
        />
        <KpiCard
          label="Completed this week"
          value={data.completedThisWeek}
          tone="success"
          icon={<CheckCircle className="w-4 h-4" />}
          trend={weekTrend}
          hint={`${data.completed} total in library`}
        />
        <KpiCard
          label="Needs upload"
          value={data.needsUpload}
          tone={data.needsUpload > 0 ? "info" : "neutral"}
          icon={<UploadCloud className="w-4 h-4" />}
          hint={
            data.needsUpload > 0
              ? "Audiobooks waiting on you"
              : "Nothing waiting"
          }
        />
        <KpiCard
          label="Needs attention"
          value={data.failed}
          tone={data.failed > 0 ? "danger" : "neutral"}
          icon={<AlertTriangle className="w-4 h-4" />}
          hint={
            data.failed > 0
              ? "Failed downloads to retry"
              : data.rejected > 0
                ? `${data.rejected} rejected (declined intentionally)`
                : "All healthy"
          }
        />
      </div>

      {/* Trend chart */}
      <Card padding="md">
        <SectionHeader
          title="Requests over the last 14 days"
          description="Daily request volume — spikes mean new content drives, dips mean a quieter week."
          action={
            data.avgCompletionSeconds && (
              <Badge tone="brand" size="sm">
                Avg download: {formatDuration(data.avgCompletionSeconds)}
              </Badge>
            )
          }
        />
        <RequestsByDayChart data={data.requestsByDay} />
      </Card>

      {/* Profile + type breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card padding="md">
          <SectionHeader title="By device" />
          <Breakdown
            total={data.total}
            items={[
              { label: "📻 Yoto", value: data.byProfile.yoto, color: "var(--yoto)" },
              { label: "🎧 iPod", value: data.byProfile.ipod, color: "var(--ipod)" },
            ]}
          />
        </Card>
        <Card padding="md">
          <SectionHeader title="By type" />
          <Breakdown
            total={data.total}
            items={[
              {
                label: <span className="inline-flex items-center gap-1.5"><Music className="w-3.5 h-3.5" />Music</span>,
                value: data.byType.music,
                color: "var(--brand)",
              },
              {
                label: <span className="inline-flex items-center gap-1.5"><Book className="w-3.5 h-3.5" />Audiobook</span>,
                value: data.byType.audiobook,
                color: "var(--info)",
              },
            ]}
          />
        </Card>
      </div>

      {/* Top artists + Most requested */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card padding="md">
          <SectionHeader
            title="Top artists"
            description="By completed downloads"
          />
          {data.topArtists.length === 0 ? (
            <EmptyState
              icon={<Users className="w-5 h-5" />}
              title="No artist data yet"
              description="Artist appears when titles are formatted as “Artist – Track”."
            />
          ) : (
            <ol className="space-y-2">
              {data.topArtists.map((a, i) => (
                <li key={a.artist} className="flex items-center justify-between gap-3 py-1.5 border-b border-[var(--border-subtle)] last:border-0">
                  <span className="text-sm text-[var(--text-secondary)] tabular-nums flex-shrink-0 w-5 text-right">
                    {i + 1}.
                  </span>
                  <span className="text-sm font-medium text-[var(--text-primary)] min-w-0 truncate flex-1">
                    {a.artist}
                  </span>
                  <Badge tone="brand" size="xs">{a.count} tracks</Badge>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card padding="md">
          <SectionHeader
            title="Most requested"
            description="Across all statuses"
          />
          {data.topRequested.length === 0 ? (
            <EmptyState
              icon={<TrendingUp className="w-5 h-5" />}
              title="Not enough data yet"
            />
          ) : (
            <ol className="space-y-2">
              {data.topRequested.slice(0, 6).map((item, i) => (
                <li key={`${item.title}-${i}`} className="flex items-center justify-between gap-3 py-1.5 border-b border-[var(--border-subtle)] last:border-0">
                  <span className="text-sm text-[var(--text-secondary)] tabular-nums flex-shrink-0 w-5 text-right">
                    {i + 1}.
                  </span>
                  <span className="text-sm text-[var(--text-primary)] truncate min-w-0 flex-1">
                    {item.title}
                  </span>
                  <Badge tone="neutral" size="xs">{item.times_requested}×</Badge>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      {/* Recent timeline */}
      <Card padding="md">
        <SectionHeader
          title="Recent activity"
          description="Last 10 status changes"
        />
        {data.recent.length === 0 ? (
          <EmptyState title="No activity yet" />
        ) : (
          <ul className="space-y-2.5">
            {data.recent.slice(0, 10).map((r) => (
              <li
                key={r.id}
                className="flex items-start gap-3 py-2 border-b border-[var(--border-subtle)] last:border-0"
              >
                <span className="text-xs text-[var(--text-muted)] tabular-nums w-16 flex-shrink-0 mt-0.5">
                  {new Date(r.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[var(--text-primary)] truncate">
                    {r.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <StatusBadge status={r.status} />
                    <span className="text-[11px] text-[var(--text-muted)]">
                      {r.profile === "yoto" ? "📻 Yoto" : "🎧 iPod"} ·{" "}
                      {r.type === "audiobook" ? "Audiobook" : "Music"}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Breakdown({ items, total }) {
  return (
    <div className="space-y-3">
      {items.map((it, i) => {
        const pct = total > 0 ? Math.round((it.value / total) * 100) : 0;
        return (
          <div key={i}>
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-[var(--text-primary)] font-medium">
                {it.label}
              </span>
              <span className="text-[var(--text-secondary)] tabular-nums">
                {it.value} <span className="text-[var(--text-muted)]">· {pct}%</span>
              </span>
            </div>
            <div
              className="h-2 rounded-full bg-[var(--surface-2)] overflow-hidden"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: it.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RequestsByDayChart({ data }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.count));
  const isFlat = max === 0;

  if (isFlat) {
    return (
      <EmptyState
        icon={<TrendingDown className="w-5 h-5" />}
        title="No requests in the last 14 days"
        description="The chart will fill in as new requests come in."
      />
    );
  }

  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <div className="h-48 -mx-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formatted} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="reqFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.32} />
              <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--text-muted)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--border-subtle)" }}
            interval="preserveStartEnd"
            minTickGap={20}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--text-muted)" }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={28}
          />
          <Tooltip
            cursor={{ stroke: "var(--border-default)", strokeWidth: 1 }}
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--r-md)",
              fontSize: 12,
              color: "var(--text-primary)",
              padding: "6px 10px",
            }}
            labelStyle={{ color: "var(--text-muted)", fontWeight: 500 }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="var(--brand)"
            strokeWidth={2}
            fill="url(#reqFill)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-60" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </div>
  );
}
