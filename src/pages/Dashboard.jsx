import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Clock,
  CheckCircle,
  UploadCloud,
  AlertTriangle,
  Inbox,
  Library,
  Wrench,
} from "lucide-react";
import useStore from "../store/useStore";
import { Tabs, Skeleton } from "../components/ui";
import SummaryCounters from "../components/dashboard/SummaryCounters";
import TriageView from "../components/dashboard/TriageView";
import LibraryView from "../components/dashboard/LibraryView";
import NeedsUploadView from "../components/dashboard/NeedsUploadView";
import MaintenanceView from "../components/dashboard/MaintenanceView";
import AudiobookUploadGuide from "../components/dashboard/AudiobookUploadGuide";

const API_URL = import.meta.env.VITE_API_URL || "/api";
// Only used when the event stream can't be opened (proxy strips SSE, etc.)
const POLL_INTERVAL = 12000;
const MAX_SSE_ATTEMPTS = 3;

export default function Dashboard() {
  const {
    user,
    getPendingRequests,
    getRequests,
    getAccessToken,
    approveRequest,
    rejectRequest,
    deleteRequest,
    markUploaded,
    retryDownload,
    retryAllDummy,
    showToast,
  } = useStore();

  const [pending, setPending] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(
    user.role === "parent" ? "triage" : "library",
  );
  const [uploadGuideRequest, setUploadGuideRequest] = useState(null);

  const loadData = useCallback(async () => {
    if (user.role === "parent") {
      const [pendingData, allData] = await Promise.all([
        getPendingRequests(),
        getRequests(),
      ]);
      setPending(pendingData);
      setAllRequests(allData);
    } else {
      setAllRequests(await getRequests());
    }
    setLoading(false);
  }, [user.role, getPendingRequests, getRequests]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Live updates over SSE; fall back to polling if the stream won't stay up
  useEffect(() => {
    let source = null;
    let pollId = null;
    let retryId = null;
    let cancelled = false;
    let attempts = 0;

    const startPolling = () => {
      if (pollId || cancelled) return;
      pollId = setInterval(loadData, POLL_INTERVAL);
    };

    const connect = async () => {
      if (cancelled) return;
      let token;
      try {
        token = await getAccessToken();
      } catch {
        token = null;
      }
      if (cancelled) return;
      if (!token) return startPolling();

      source = new EventSource(
        `${API_URL}/events?token=${encodeURIComponent(token)}`,
      );

      source.addEventListener("request", (event) => {
        attempts = 0;
        const { type, request } = JSON.parse(event.data);
        if (type === "updated" && request?.status === "completed") {
          showToast(`"${request.title}" is ready!`, "success");
        }
        loadData();
      });

      // The browser retries by itself, but with the now-expired token in the
      // URL — reconnect with a fresh one instead.
      source.onerror = () => {
        source.close();
        source = null;
        if (cancelled) return;
        if (++attempts >= MAX_SSE_ATTEMPTS) return startPolling();
        retryId = setTimeout(connect, 2000 * attempts);
      };
    };

    connect();

    return () => {
      cancelled = true;
      source?.close();
      clearInterval(pollId);
      clearTimeout(retryId);
    };
  }, [loadData, getAccessToken, showToast]);

  // ── Derived state ─────────────────────────────────────────────────────────
  const needsUpload = useMemo(
    () =>
      allRequests.filter(
        (r) => r.type === "audiobook" && r.status === "approved",
      ),
    [allRequests],
  );

  const broken = useMemo(
    () =>
      allRequests.filter(
        (r) =>
          r.status === "failed" ||
          (r.status === "completed" &&
            r.file_size_bytes != null &&
            r.file_size_bytes < 1024),
      ),
    [allRequests],
  );

  const completedThisWeek = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return allRequests.filter(
      (r) =>
        r.status === "completed" &&
        r.downloaded_at &&
        new Date(r.downloaded_at).getTime() >= cutoff,
    ).length;
  }, [allRequests]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleApprove = async (id) => {
    try {
      await approveRequest(id);
      const req = [...pending, ...allRequests].find((r) => r.id === id);
      showToast(
        req?.type === "audiobook"
          ? "Approved — upload the file manually to finish."
          : "Approved — downloading now.",
        "success",
      );
      loadData();
    } catch {
      showToast("Couldn't approve — try again.", "error");
    }
  };

  const handleReject = async (id, reason = "Not appropriate") => {
    try {
      await rejectRequest(id, reason);
      showToast("Rejected", "warning");
      loadData();
    } catch {
      showToast("Couldn't reject — try again.", "error");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteRequest(id);
      showToast("Request deleted", "info");
      loadData();
    } catch {
      showToast("Couldn't delete — try again.", "error");
    }
  };

  const handleMarkUploaded = async (id) => {
    try {
      await markUploaded(id);
      showToast("Marked as uploaded — your child can use it now.", "success");
      loadData();
    } catch {
      showToast("Couldn't mark uploaded — try again.", "error");
    }
  };

  const handleRetry = async (id, title) => {
    try {
      await retryDownload(id);
      showToast(`Re-downloading "${title}"…`, "info");
      loadData();
    } catch {
      showToast("Couldn't retry — try again.", "error");
    }
  };

  const handleRetryAll = async () => {
    try {
      const r = await retryAllDummy();
      showToast(
        `Re-downloading ${r.queued} track${r.queued !== 1 ? "s" : ""}…`,
        "info",
      );
      loadData();
    } catch {
      showToast("Couldn't queue retries — try again.", "error");
    }
  };

  if (loading) return <DashboardSkeleton />;

  // ── Counters definition ───────────────────────────────────────────────────
  const counters =
    user.role === "parent"
      ? [
          {
            key: "triage",
            label: "Awaiting approval",
            value: pending.length,
            tone: pending.length > 0 ? "warning" : "neutral",
            icon: <Clock className="w-3.5 h-3.5" />,
            hint: pending.length > 0 ? "Action needed" : "All caught up",
          },
          {
            key: "library",
            label: "Completed this week",
            value: completedThisWeek,
            tone: "success",
            icon: <CheckCircle className="w-3.5 h-3.5" />,
            hint: `${allRequests.length} in library`,
          },
          {
            key: "needs-upload",
            label: "Needs upload",
            value: needsUpload.length,
            tone: needsUpload.length > 0 ? "info" : "neutral",
            icon: <UploadCloud className="w-3.5 h-3.5" />,
            hint: needsUpload.length > 0 ? "Audiobooks waiting" : "None",
          },
          {
            key: "maintenance",
            label: "Needs attention",
            value: broken.length,
            tone: broken.length > 0 ? "danger" : "neutral",
            icon: <AlertTriangle className="w-3.5 h-3.5" />,
            hint: broken.length > 0 ? "Failed or broken" : "Healthy",
          },
        ]
      : null;

  // ── Tabs definition ───────────────────────────────────────────────────────
  const parentTabs = [
    {
      value: "triage",
      label: "Triage",
      icon: <Inbox className="w-4 h-4" />,
      count: pending.length,
      urgent: pending.length > 0,
    },
    {
      value: "library",
      label: "Library",
      icon: <Library className="w-4 h-4" />,
      count: allRequests.length,
    },
    {
      value: "needs-upload",
      label: "Needs upload",
      icon: <UploadCloud className="w-4 h-4" />,
      count: needsUpload.length,
      urgent: needsUpload.length > 0,
    },
    {
      value: "maintenance",
      label: "Maintenance",
      icon: <Wrench className="w-4 h-4" />,
      count: broken.length,
      urgent: broken.length > 0,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <header>
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
              {user.role === "parent" ? "Dashboard" : "My requests"}
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {user.role === "parent"
                ? "Review requests, manage the library, and keep downloads healthy."
                : "Track what you've requested and grab finished tracks."}
            </p>
          </div>
        </div>
      </header>

      {/* Counters — parent only, also act as quick tab jumpers */}
      {counters && (
        <SummaryCounters
          items={counters}
          activeKey={activeTab}
          onSelect={setActiveTab}
        />
      )}

      {/* Tabs + content */}
      {user.role === "parent" ? (
        <>
          <Tabs value={activeTab} onChange={setActiveTab} tabs={parentTabs} />
          <div className="pt-2">
            {activeTab === "triage" && (
              <TriageView
                pending={pending}
                userRole={user.role}
                onApprove={handleApprove}
                onReject={handleReject}
                onDelete={handleDelete}
                onShowUploadGuide={(req) => setUploadGuideRequest(req)}
              />
            )}
            {activeTab === "library" && (
              <LibraryView
                requests={allRequests}
                userRole={user.role}
                onDelete={handleDelete}
                onRetry={handleRetry}
                onShowUploadGuide={(req) => setUploadGuideRequest(req)}
              />
            )}
            {activeTab === "needs-upload" && (
              <NeedsUploadView
                audiobooks={needsUpload}
                userRole={user.role}
                onMarkUploaded={handleMarkUploaded}
                onDelete={handleDelete}
                onShowUploadGuide={(req) => setUploadGuideRequest(req)}
              />
            )}
            {activeTab === "maintenance" && (
              <MaintenanceView
                brokenRequests={broken}
                userRole={user.role}
                onRetry={handleRetry}
                onDelete={handleDelete}
                onRetryAll={handleRetryAll}
              />
            )}
          </div>
        </>
      ) : (
        <LibraryView
          requests={allRequests}
          userRole={user.role}
          onDelete={handleDelete}
          onRetry={handleRetry}
        />
      )}

      <AudiobookUploadGuide
        open={!!uploadGuideRequest}
        request={uploadGuideRequest}
        onClose={() => setUploadGuideRequest(null)}
        onMarkUploaded={handleMarkUploaded}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-48" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    </div>
  );
}
