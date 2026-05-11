import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useStore from "../store/useStore";
import {
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Trash2,
  Shield,
  BookOpen,
  Music,
  UploadCloud,
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

const POLL_INTERVAL = 3000;

const STATUS_CONFIG = {
  pending:    { label: "Pending",     bg: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700",  dot: "bg-yellow-500"  },
  approved:   { label: "Approved",    bg: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700",      dot: "bg-green-500"   },
  rejected:   { label: "Rejected",    bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700",              dot: "bg-red-500"     },
  downloading:{ label: "Downloading", bg: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700",          dot: "bg-blue-500"    },
  completed:  { label: "Ready",       bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700", dot: "bg-emerald-500" },
  failed:     { label: "Failed",      bg: "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700",             dot: "bg-red-600"     },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const isDownloading = status === "downloading";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot} ${isDownloading ? "animate-pulse" : ""}`} />
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
    deleteRequest,
    markUploaded,
    showToast,
  } = useStore();
  const [pending, setPending] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef(null);

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
          (r) => r.status === "completed" &&
            allRequests.find((old) => old.id === r.id && old.status !== "completed"),
        );
        if (justCompleted) showToast(`✅ "${justCompleted.title}" is ready!`, "success");
      }
    }, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [allRequests, getRequestStatus, showToast]);

  const handleApprove = async (id) => {
    await approveRequest(id);
    const req = [...pending, ...allRequests].find((r) => r.id === id);
    showToast(
      req?.type === "audiobook" ? "Acknowledged — remember to upload manually!" : "Approved! Downloading…",
      "success",
    );
    loadData();
  };

  const handleRejectWithReason = async (id, reason) => {
    try {
      await fetch(`/api/requests/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Session-Id": sessionId },
        body: JSON.stringify({ reason }),
      });
      showToast(`Rejected: ${reason}`, "warning");
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
        {user.role === "parent" ? "Parent Dashboard" : "My Requests"}
      </h1>

      {user.role === "parent" ? (
        <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-8 lg:items-start">
          {/* ── LEFT: history + keywords ── */}
          <div className="space-y-8 min-w-0">
            <RequestHistory
              requests={allRequests}
              userRole={user.role}
              sessionId={sessionId}
              onDelete={handleDelete}
              onMarkUploaded={handleMarkUploaded}
            />
            <BlockedKeywordsManager />
          </div>

          {/* ── RIGHT: quick approve (on mobile renders first via order) ── */}
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
        <RequestHistory
          requests={allRequests}
          userRole={user.role}
          sessionId={sessionId}
          onDelete={handleDelete}
          onMarkUploaded={handleMarkUploaded}
        />
      )}
    </div>
  );
}

// ─── Request History ────────────────────────────────────────────────────────

function RequestHistory({ requests, userRole, sessionId, onDelete, onMarkUploaded }) {
  return (
    <div>
      <h2 className="text-base font-bold mb-3 text-gray-800 dark:text-gray-200">
        {userRole === "parent" ? "Request History" : "My Requests"}
      </h2>

      <AnimatePresence initial={false}>
        {requests.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-14 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-3">
              <Music className="w-8 h-8 text-purple-400" />
            </div>
            <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">No requests yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {userRole === "child"
                ? "Head to the home page to request your first song!"
                : "Requests from the kids will appear here."}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {requests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                userRole={userRole}
                sessionId={sessionId}
                onDelete={onDelete}
                onMarkUploaded={onMarkUploaded}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Request Card ────────────────────────────────────────────────────────────

function RequestCard({ request, userRole, sessionId, onDelete, onMarkUploaded }) {
  const cfg = STATUS_CONFIG[request.status] ?? STATUS_CONFIG.pending;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={`rounded-xl border-2 p-3 sm:p-4 transition-colors ${cfg.bg}`}
    >
      <div className="flex items-start gap-3">
        {/* Thumbnail */}
        {request.thumbnail ? (
          <img
            src={request.thumbnail}
            alt=""
            className="w-11 h-11 rounded-lg object-cover flex-shrink-0 mt-0.5"
          />
        ) : (
          <div className="w-11 h-11 rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center flex-shrink-0 mt-0.5">
            {request.type === "audiobook"
              ? <BookOpen className="w-5 h-5 text-gray-400" />
              : <Music className="w-5 h-5 text-gray-400" />}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate leading-snug">
              {request.title}
            </p>
            {/* Delete button */}
            {userRole === "parent" &&
              (request.status === "rejected" || request.status === "completed") && (
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
          </div>

          {/* Error */}
          {request.status === "failed" && request.error_message && (
            <p className="text-xs text-red-500 dark:text-red-400 mt-1">{request.error_message}</p>
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
              <MiniPlayer request={request} sessionId={sessionId} />
              <DownloadButton request={request} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Mini Player ─────────────────────────────────────────────────────────────

function MiniPlayer({ request, sessionId }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); };
  }, [blobUrl]);

  const handleLoad = async () => {
    if (blobUrl || loading) return;
    setLoading(true);
    try {
      const res = await fetch(request.internxt_url, {
        headers: { "X-Session-Id": sessionId },
      });
      if (!res.ok) throw new Error("fetch failed");
      const blob = await res.blob();
      setBlobUrl(URL.createObjectURL(blob));
    } catch {
      // silently fail — download button still works
    } finally {
      setLoading(false);
    }
  };

  if (blobUrl) {
    return (
      <audio
        controls
        autoPlay
        src={blobUrl}
        className="w-full max-w-xs h-8"
        style={{ colorScheme: "normal" }}
      />
    );
  }

  return (
    <button
      onClick={handleLoad}
      disabled={loading}
      className="text-xs text-purple-600 dark:text-purple-400 hover:underline disabled:opacity-50 flex items-center gap-1"
    >
      {loading ? "Loading…" : "▶ Preview"}
    </button>
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
        {downloading ? "Downloading…" : "Download"}
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
