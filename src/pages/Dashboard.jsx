import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useStore from "../store/useStore";
import {
  Download,
  Trash2,
  Shield,
  BookOpen,
  Music,
  UploadCloud,
  Search,
  Users,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import SwipeApprove from "../components/SwipeApprove";

async function downloadFile(url, filename) {
  const { sessionId } = useStore.getState();
  const response = await fetch(url, { headers: { "X-Session-Id": sessionId } });
  if (!response.ok) throw new Error("Download failed");
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
}

function parseArtist(title) {
  const idx = title.indexOf(" - ");
  return idx > 0 ? title.substring(0, idx).trim() : null;
}

// Returns true if the file is almost certainly a dummy (< 1KB on server)
function isDummyDownload(request) {
  return request.status === "completed" && request.internxt_url && !request.is_real_file;
}

const POLL_INTERVAL = 3000;

const STATUS_CONFIG = {
  pending:     { label: "Pending",     bg: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700",    dot: "bg-yellow-500"  },
  approved:    { label: "Approved",    bg: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700",         dot: "bg-green-500"   },
  rejected:    { label: "Rejected",    bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700",                 dot: "bg-red-500"     },
  downloading: { label: "Downloading", bg: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700",            dot: "bg-blue-500"    },
  completed:   { label: "Ready",       bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700", dot: "bg-emerald-500" },
  failed:      { label: "Failed",      bg: "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700",               dot: "bg-red-600"     },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot} ${status === "downloading" ? "animate-pulse" : ""}`} />
      {cfg.label}
    </span>
  );
}

export default function Dashboard() {
  const {
    user,
    sessionId,
    getPendingRequests,
    getRequests,
    getRequestStatus,
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
  const [retryingAll, setRetryingAll] = useState(false);
  const pollRef = useRef(null);

  // Filter state
  const [searchQ, setSearchQ] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterProfile, setFilterProfile] = useState("all");
  const [filterArtist, setFilterArtist] = useState("all");
  const [groupByArtist, setGroupByArtist] = useState(false);

  const loadData = useCallback(async () => {
    if (user.role === "parent") {
      const [pendingData, allData] = await Promise.all([
        getPendingRequests(),
        getRequests(),
      ]);
      setPending(pendingData);
      setAllRequests(allData);
    } else {
      const data = await getRequests();
      setAllRequests(data);
    }
    setLoading(false);
  }, [user.role, getPendingRequests, getRequests]);

  useEffect(() => { loadData(); }, [loadData]);

  // Poll in-flight downloads
  useEffect(() => {
    const inFlight = allRequests.filter(
      (r) => r.status === "downloading" || (r.status === "approved" && r.type === "music"),
    );
    if (inFlight.length === 0) {
      clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(async () => {
      let anyChanged = false;
      const updated = await Promise.all(
        allRequests.map(async (r) => {
          if (r.status !== "downloading" && !(r.status === "approved" && r.type === "music")) return r;
          const fresh = await getRequestStatus(r.id);
          if (fresh && fresh.status !== r.status) {
            anyChanged = true;
            return { ...r, status: fresh.status, internxt_url: fresh.download_url };
          }
          return r;
        }),
      );
      if (anyChanged) {
        setAllRequests(updated);
        const justCompleted = updated.find(
          (r) =>
            r.status === "completed" &&
            allRequests.find((old) => old.id === r.id && old.status !== "completed"),
        );
        if (justCompleted) showToast(`"${justCompleted.title}" is ready!`, "success");
      }
    }, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [allRequests, getRequestStatus, showToast]);

  // Duplicate count map — how many times each title has been completed
  const downloadCounts = useMemo(() => {
    const counts = {};
    allRequests.forEach((r) => {
      if (r.status === "completed") {
        const key = r.title.toLowerCase();
        counts[key] = (counts[key] || 0) + 1;
      }
    });
    return counts;
  }, [allRequests]);

  // Detect dummy files — any completed track < 1KB (size stored in download_count field from API,
  // but we can heuristically detect by checking if it was downloaded before the fix)
  const dummyCount = useMemo(
    () => allRequests.filter((r) => r.status === "completed" && r.file_size_bytes !== undefined && r.file_size_bytes < 1024).length,
    [allRequests]
  );

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return allRequests.filter((r) => {
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (filterType !== "all" && r.type !== filterType) return false;
      if (filterProfile !== "all" && r.profile !== filterProfile) return false;
      if (filterArtist !== "all") {
        const artist = parseArtist(r.title);
        if (artist !== filterArtist) return false;
      }
      if (searchQ) {
        const q = searchQ.toLowerCase();
        if (!r.title.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [allRequests, filterStatus, filterType, filterProfile, filterArtist, searchQ]);

  // All unique artists for filter dropdown
  const artists = useMemo(() => {
    const set = new Set();
    allRequests.forEach((r) => {
      const a = parseArtist(r.title);
      if (a) set.add(a);
    });
    return Array.from(set).sort();
  }, [allRequests]);

  const handleApprove = async (id) => {
    await approveRequest(id);
    const req = [...pending, ...allRequests].find((r) => r.id === id);
    showToast(
      req?.type === "audiobook"
        ? "Acknowledged — remember to upload manually!"
        : "Approved! Downloading…",
      "success",
    );
    loadData();
  };

  const handleRejectWithReason = async (id, reason = "Not appropriate") => {
    try {
      await rejectRequest(id, reason);
      showToast(`Rejected`, "warning");
      loadData();
    } catch {
      showToast("Failed to reject request", "error");
    }
  };

  const handleMarkUploaded = async (id) => {
    try {
      await markUploaded(id);
      showToast("Marked as uploaded!", "success");
      loadData();
    } catch {
      showToast("Failed to mark as uploaded", "error");
    }
  };

  const handleDelete = async (id) => {
    await deleteRequest(id);
    showToast("Request deleted", "info");
    loadData();
  };

  const handleRetry = async (id, title) => {
    try {
      await retryDownload(id);
      showToast(`Re-downloading "${title}"…`, "success");
      loadData();
    } catch {
      showToast("Failed to retry — try again", "error");
    }
  };

  const handleRetryAll = async () => {
    setRetryingAll(true);
    try {
      const result = await retryAllDummy();
      showToast(`Re-downloading ${result.queued} track${result.queued !== 1 ? "s" : ""}…`, "success");
      loadData();
    } catch {
      showToast("Failed to start re-downloads", "error");
    } finally {
      setRetryingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filterProps = {
    searchQ, setSearchQ,
    filterStatus, setFilterStatus,
    filterType, setFilterType,
    filterProfile, setFilterProfile,
    filterArtist, setFilterArtist,
    artists,
    groupByArtist, setGroupByArtist,
    userRole: user.role,
    totalCount: allRequests.length,
    filteredCount: filteredRequests.length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          {user.role === "parent" ? "Parent Dashboard" : "My Requests"}
        </h1>
        {user.role === "parent" && (
          <button
            onClick={handleRetryAll}
            disabled={retryingAll}
            title="Re-download all tracks that failed or have broken files"
            className="inline-flex items-center gap-1.5 text-xs bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${retryingAll ? "animate-spin" : ""}`} />
            {retryingAll ? "Queuing…" : "Fix broken downloads"}
          </button>
        )}
      </div>

      {user.role === "parent" ? (
        <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-8 lg:items-start">
          {/* ── LEFT: history + keywords ── */}
          <div className="space-y-6 min-w-0">
            <FilterBar {...filterProps} />
            <RequestHistory
              requests={filteredRequests}
              allRequests={allRequests}
              downloadCounts={downloadCounts}
              userRole={user.role}
              sessionId={sessionId}
              groupByArtist={groupByArtist}
              onDelete={handleDelete}
              onMarkUploaded={handleMarkUploaded}
              onRetry={handleRetry}
              onApprove={handleApprove}
              onReject={handleRejectWithReason}
            />
            <BlockedKeywordsManager />
          </div>

          {/* ── RIGHT: quick approve ── */}
          <div className="order-first lg:order-last mb-8 lg:mb-0">
            <div className="lg:sticky lg:top-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-gray-800 dark:text-gray-200">Quick Approve</h2>
                {pending.length > 0 && (
                  <span className="bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {pending.length}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Swipe or tap ← → · Arrow keys also work
              </p>
              <SwipeApprove
                requests={pending}
                onApprove={(id) => {
                  handleApprove(id);
                  setPending((prev) => prev.filter((r) => r.id !== id));
                }}
                onReject={(id, reason) => {
                  handleRejectWithReason(id, reason);
                  setPending((prev) => prev.filter((r) => r.id !== id));
                }}
              />
            </div>
          </div>
        </div>
      ) : (
        <>
          <FilterBar {...filterProps} />
          <div className="mt-4">
            <RequestHistory
              requests={filteredRequests}
              allRequests={allRequests}
              downloadCounts={downloadCounts}
              userRole={user.role}
              sessionId={sessionId}
              groupByArtist={groupByArtist}
              onDelete={handleDelete}
              onMarkUploaded={handleMarkUploaded}
              onRetry={handleRetry}
              onApprove={handleApprove}
              onReject={handleRejectWithReason}
            />
          </div>
        </>
      )}
    </div>
  );
}

// ─── Filter Bar ──────────────────────────────────────────────────────────────

function FilterBar({
  searchQ, setSearchQ,
  filterStatus, setFilterStatus,
  filterType, setFilterType,
  filterProfile, setFilterProfile,
  filterArtist, setFilterArtist,
  artists,
  groupByArtist, setGroupByArtist,
  userRole,
  totalCount, filteredCount,
}) {
  const hasFilter = searchQ || filterStatus !== "all" || filterType !== "all" ||
    filterProfile !== "all" || filterArtist !== "all";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          placeholder="Search songs…"
          className="w-full pl-9 pr-4 py-2 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
        />
        {searchQ && (
          <button
            onClick={() => setSearchQ("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ×
          </button>
        )}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-2">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-purple-400"
        >
          <option value="all">All statuses</option>
          <option value="completed">Ready</option>
          <option value="downloading">Downloading</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="failed">Failed</option>
          <option value="rejected">Rejected</option>
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-purple-400"
        >
          <option value="all">All types</option>
          <option value="music">Music</option>
          <option value="audiobook">Audiobook</option>
        </select>

        {userRole === "parent" && (
          <select
            value={filterProfile}
            onChange={(e) => setFilterProfile(e.target.value)}
            className="text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-purple-400"
          >
            <option value="all">All profiles</option>
            <option value="yoto">Yoto</option>
            <option value="ipod">iPod</option>
          </select>
        )}

        {artists.length > 0 && (
          <select
            value={filterArtist}
            onChange={(e) => setFilterArtist(e.target.value)}
            className="text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-purple-400"
          >
            <option value="all">All artists</option>
            {artists.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        )}

        <button
          onClick={() => setGroupByArtist((v) => !v)}
          className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
            groupByArtist
              ? "bg-purple-600 border-purple-600 text-white"
              : "border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:border-purple-400"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Group by artist
        </button>

        {hasFilter && (
          <button
            onClick={() => {
              setSearchQ(""); setFilterStatus("all"); setFilterType("all");
              setFilterProfile("all"); setFilterArtist("all");
            }}
            className="text-xs text-red-500 dark:text-red-400 hover:underline px-1"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Count indicator */}
      {hasFilter && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Showing {filteredCount} of {totalCount} requests
        </p>
      )}
    </div>
  );
}

// ─── Request History ──────────────────────────────────────────────────────────

function RequestHistory({ requests, allRequests, downloadCounts, userRole, sessionId, groupByArtist, onDelete, onMarkUploaded, onRetry, onApprove, onReject }) {
  // Group by artist if toggled
  const grouped = useMemo(() => {
    if (!groupByArtist) return null;
    const groups = {};
    requests.forEach((r) => {
      const artist = parseArtist(r.title) || "Unknown Artist";
      if (!groups[artist]) groups[artist] = [];
      groups[artist].push(r);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [requests, groupByArtist]);

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center">
        <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-3">
          <Music className="w-8 h-8 text-purple-400" />
        </div>
        <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">No requests found</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {userRole === "child"
            ? "Head to the home page to request your first song!"
            : "Try adjusting your filters, or requests will appear here."}
        </p>
      </div>
    );
  }

  if (grouped) {
    return (
      <div className="space-y-6">
        {grouped.map(([artist, artistRequests]) => (
          <ArtistGroup
            key={artist}
            artist={artist}
            requests={artistRequests}
            downloadCounts={downloadCounts}
            userRole={userRole}
            sessionId={sessionId}
            onDelete={onDelete}
            onMarkUploaded={onMarkUploaded}
            onRetry={onRetry}
            onApprove={onApprove}
            onReject={onReject}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {requests.map((request) => (
          <RequestCard
            key={request.id}
            request={request}
            downloadCount={downloadCounts[request.title.toLowerCase()] || 0}
            userRole={userRole}
            sessionId={sessionId}
            onDelete={onDelete}
            onMarkUploaded={onMarkUploaded}
            onRetry={onRetry}
            onApprove={onApprove}
            onReject={onReject}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Artist Group ─────────────────────────────────────────────────────────────

function ArtistGroup({ artist, requests, downloadCounts, userRole, sessionId, onDelete, onMarkUploaded, onRetry, onApprove, onReject }) {
  const [expanded, setExpanded] = useState(true);
  const completedCount = requests.filter((r) => r.status === "completed").length;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
          <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">{artist}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {requests.length} track{requests.length !== 1 ? "s" : ""}
            {completedCount > 0 && ` · ${completedCount} ready`}
          </span>
        </div>
      </button>
      {expanded && (
        <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
          {requests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              downloadCount={downloadCounts[request.title.toLowerCase()] || 0}
              userRole={userRole}
              sessionId={sessionId}
              onDelete={onDelete}
              onMarkUploaded={onMarkUploaded}
              onRetry={onRetry}
              onApprove={onApprove}
              onReject={onReject}
              compact
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Request Card ─────────────────────────────────────────────────────────────

function RequestCard({ request, downloadCount, userRole, sessionId, onDelete, onMarkUploaded, onRetry, onApprove, onReject, compact }) {
  const cfg = STATUS_CONFIG[request.status] ?? STATUS_CONFIG.pending;
  const [retrying, setRetrying] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const isDuplicate = downloadCount > 1 && request.status === "completed";

  const handleRetryClick = async () => {
    setRetrying(true);
    await onRetry(request.id, request.title);
    setRetrying(false);
  };

  const handleApproveClick = async () => {
    setApproving(true);
    await onApprove(request.id);
    setApproving(false);
  };

  const handleRejectClick = async () => {
    setRejecting(true);
    await onReject(request.id, "Not appropriate");
    setRejecting(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={`${compact ? "px-4 py-3" : `rounded-xl border-2 p-3 sm:p-4`} transition-colors ${compact ? "" : cfg.bg}`}
    >
      <div className="flex items-start gap-3">
        {/* Thumbnail */}
        {request.thumbnail ? (
          <img
            src={request.thumbnail}
            alt=""
            className="w-10 h-10 rounded-lg object-cover flex-shrink-0 mt-0.5"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center flex-shrink-0 mt-0.5">
            {request.type === "audiobook"
              ? <BookOpen className="w-5 h-5 text-gray-400" />
              : <Music className="w-5 h-5 text-gray-400" />}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-sm text-gray-800 dark:text-gray-200 leading-snug line-clamp-2">
              {request.title}
            </p>
            {userRole === "parent" &&
              (request.status === "rejected" || request.status === "completed" || request.status === "failed") && (
                <button
                  onClick={() => onDelete(request.id)}
                  className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 flex-shrink-0 transition-colors ml-1"
                  aria-label="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
          </div>

          {/* Meta row */}
          <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1">
            <StatusBadge status={request.status} />
            <span className="text-xs text-gray-400 dark:text-gray-500">·</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{request.profile}</span>
            {request.type === "audiobook" && (
              <>
                <span className="text-xs text-gray-400 dark:text-gray-500">·</span>
                <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                  <BookOpen className="w-3 h-3" /> Audiobook
                </span>
              </>
            )}
            <span className="text-xs text-gray-400 dark:text-gray-500">·</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {new Date(request.created_at).toLocaleDateString()}
            </span>
            {/* Duplicate badge */}
            {isDuplicate && (
              <>
                <span className="text-xs text-gray-400 dark:text-gray-500">·</span>
                <span className="inline-flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 font-medium">
                  <AlertTriangle className="w-3 h-3" />
                  Downloaded {downloadCount}×
                </span>
              </>
            )}
          </div>

          {/* Error */}
          {request.status === "failed" && request.error_message && (
            <p className="text-xs text-red-500 dark:text-red-400 mt-1 line-clamp-2">{request.error_message}</p>
          )}

          {/* Inline approve / reject for pending requests (parent only) */}
          {userRole === "parent" && request.status === "pending" && (
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={handleApproveClick}
                disabled={approving || rejecting}
                className="inline-flex items-center gap-1 text-xs bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-1 rounded-lg transition-colors font-medium"
              >
                {approving ? "Approving…" : "✓ Approve"}
              </button>
              <button
                onClick={handleRejectClick}
                disabled={approving || rejecting}
                className="inline-flex items-center gap-1 text-xs bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-3 py-1 rounded-lg transition-colors font-medium"
              >
                {rejecting ? "Rejecting…" : "✗ Reject"}
              </button>
            </div>
          )}

          {/* Retry button for failed tracks */}
          {userRole === "parent" && request.status === "failed" && request.type !== "audiobook" && (
            <button
              onClick={handleRetryClick}
              disabled={retrying}
              className="inline-flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-2.5 py-1 rounded-lg mt-2 transition-colors"
            >
              <RotateCcw className={`w-3 h-3 ${retrying ? "animate-spin" : ""}`} />
              {retrying ? "Retrying…" : "Retry download"}
            </button>
          )}

          {/* Audiobook upload controls */}
          {request.type === "audiobook" && request.status === "approved" && (
            <div className="flex items-center gap-3 mt-2">
              <p className="text-xs text-amber-600 dark:text-amber-400">⚠ Manual upload needed</p>
              {userRole === "parent" && (
                <button
                  onClick={() => onMarkUploaded(request.id)}
                  className="inline-flex items-center gap-1 text-xs bg-green-600 hover:bg-green-700 text-white px-2.5 py-1 rounded-lg transition-colors"
                >
                  <UploadCloud className="w-3 h-3" /> Mark uploaded
                </button>
              )}
            </div>
          )}

          {/* Mini player + download */}
          {request.internxt_url && request.status === "completed" && (
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-3">
                <MiniPlayer request={request} sessionId={sessionId} />
                {userRole === "parent" && (
                  <button
                    onClick={handleRetryClick}
                    disabled={retrying}
                    title="Re-download this track (use if the file sounds wrong or won't upload to Yoto)"
                    className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 disabled:opacity-50 transition-colors"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${retrying ? "animate-spin" : ""}`} />
                    <span>{retrying ? "Queued" : "Re-download"}</span>
                  </button>
                )}
              </div>
              <DownloadButton request={request} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Mini Player ─────────────────────────────────────────────────────────────
// Fixed: always render <audio> element in DOM, set src directly on ref after
// authenticated fetch, call play() on ref — avoids React re-render timing issues
// that cause the browser's autoplay policy to block playback.

function MiniPlayer({ request, sessionId }) {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const audioRef = useRef(null);
  const blobUrlRef = useRef(null);

  const streamUrl = request.internxt_url?.replace("/api/downloads/", "/api/stream/");

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  const handleLoad = async () => {
    if (loading) return;

    // If already loaded, toggle play/pause
    if (blobUrlRef.current && audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(streamUrl, { headers: { "X-Session-Id": sessionId } });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error("Please log in again to preview this track");
        }
        throw new Error(`Could not load track (${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;

      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.load();
        audioRef.current.play().catch(() => {
          // Autoplay blocked — audio controls are shown and user can click ▶
        });
      }
      setVisible(true);
    } catch (err) {
      setError(err.message || "Preview unavailable");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {!visible && (
        <button
          onClick={handleLoad}
          disabled={loading}
          className="text-xs text-purple-600 dark:text-purple-400 hover:underline disabled:opacity-50 flex items-center gap-1"
        >
          {loading ? (
            <>
              <span className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin inline-block" />
              Loading…
            </>
          ) : (
            "▶ Preview"
          )}
        </button>
      )}
      {error && (
        <span className="text-xs text-red-500 dark:text-red-400">{error}</span>
      )}
      {/* Always in DOM — set src directly after fetch to avoid autoplay timing issues */}
      <audio
        ref={audioRef}
        controls
        className={`h-8 transition-all ${visible ? "w-full max-w-xs" : "w-0 overflow-hidden opacity-0 pointer-events-none"}`}
        style={{ colorScheme: "normal" }}
      />
    </div>
  );
}

// ─── Download Button ──────────────────────────────────────────────────────────

function DownloadButton({ request }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  const cleanTitle = request.title.replace(/[<>:"/\\|?*]/g, "").trim().substring(0, 80);
  const filename = cleanTitle ? `${cleanTitle}.mp3` : "song.mp3";

  const handleClick = async () => {
    setDownloading(true);
    setError(null);
    try {
      await downloadFile(request.internxt_url, filename);
    } catch {
      setError("Download failed — try again");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={downloading}
        className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
      >
        <Download className="w-3.5 h-3.5" />
        {downloading ? "Downloading…" : "Download MP3"}
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// ─── Blocked Keywords ─────────────────────────────────────────────────────────

function BlockedKeywordsManager() {
  const { getBlockedKeywords, addBlockedKeyword, removeBlockedKeyword, showToast } = useStore();
  const [keywords, setKeywords] = useState([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadKeywords(); }, []);

  const loadKeywords = async () => {
    try {
      const data = await getBlockedKeywords();
      setKeywords(data);
    } catch {
      // silently skip
    }
    setLoading(false);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    try {
      await addBlockedKeyword(newKeyword.trim());
      setNewKeyword("");
      await loadKeywords();
      showToast("Blocked keyword added", "success");
    } catch {
      showToast("Failed to add keyword", "error");
    }
  };

  const handleRemove = async (id) => {
    try {
      await removeBlockedKeyword(id);
      await loadKeywords();
      showToast("Keyword removed", "info");
    } catch {
      showToast("Failed to remove keyword", "error");
    }
  };

  if (loading) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-purple-600" />
        <h2 className="font-bold text-gray-800 dark:text-gray-200">Blocked Keywords</h2>
      </div>
      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newKeyword}
          onChange={(e) => setNewKeyword(e.target.value)}
          placeholder="Add keyword to block…"
          className="flex-1 min-w-0 px-3 py-2 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none text-gray-800 dark:bg-gray-700 dark:text-gray-200"
        />
        <button
          type="submit"
          className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex-shrink-0"
        >
          Add
        </button>
      </form>

      {keywords.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No blocked keywords configured</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {keywords.map((kw) => (
            <span
              key={kw.id}
              title={`Added ${new Date(kw.created_at).toLocaleDateString()}`}
              className="inline-flex items-center gap-1.5 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-3 py-1 rounded-full text-sm"
            >
              {kw.keyword}
              <button
                onClick={() => handleRemove(kw.id)}
                className="hover:text-red-600 dark:hover:text-red-400 leading-none font-bold"
                aria-label={`Remove ${kw.keyword}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
