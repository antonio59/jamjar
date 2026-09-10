import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Music,
  BookOpen,
  Trash2,
  RotateCcw,
  Download,
  Play,
  Pause,
  UploadCloud,
  Check,
  X,
  AlertTriangle,
  HelpCircle,
  XCircle,
} from "lucide-react";
import useStore from "../../store/useStore";
import {
  Badge,
  StatusBadge,
  Button,
  ConfirmDialog,
  Input,
  cx,
} from "../ui";

const ACTIVE_STATUSES = new Set(["pending", "approved", "downloading"]);
const TERMINAL_STATUSES = new Set(["completed", "rejected", "failed"]);

function profileMeta(profile) {
  if (profile === "yoto") return { tone: "yoto", label: "Yoto", emoji: "📻" };
  if (profile === "ipod") return { tone: "ipod", label: "iPod", emoji: "🎧" };
  return { tone: "neutral", label: profile, emoji: "👤" };
}

function formatDate(d) {
  if (!d) return "";
  const date = new Date(d);
  const now = new Date();
  const diff = (now - date) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString();
}

function looksGeneric(title) {
  if (!title) return true;
  const lower = title.toLowerCase().trim();
  return (
    lower === "video from url" ||
    lower === "youtube video" ||
    lower === "song" ||
    lower.startsWith("untitled")
  );
}

export default function RequestRow({
  request,
  downloadCount = 0,
  userRole,
  selectable = false,
  selected = false,
  onToggleSelect,
  onDelete,
  onApprove,
  onReject,
  onRetry,
  onMarkUploaded,
  onShowUploadGuide,
}) {
  const profile = profileMeta(request.profile);
  const isDuplicate = downloadCount > 1 && request.status === "completed";
  const isGenericTitle = looksGeneric(request.title);
  const [busy, setBusy] = useState(null);

  const run = (key, fn) => async (...args) => {
    setBusy(key);
    try {
      await fn(...args);
    } finally {
      setBusy(null);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className={cx(
        "group bg-[var(--surface)] border rounded-[var(--r-lg)] p-3 sm:p-4 transition-colors",
        selected
          ? "border-[var(--brand)] ring-1 ring-[var(--brand)]"
          : "border-[var(--border-subtle)] hover:border-[var(--border-default)]",
      )}
    >
      <div className="flex items-start gap-3">
        {/* Optional bulk-select checkbox */}
        {selectable && (
          <label className="flex items-center pt-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onToggleSelect?.(request.id)}
              className="w-4 h-4 rounded border-[var(--border-default)] text-[var(--brand)] focus:ring-[var(--brand)]"
            />
          </label>
        )}

        {/* Thumbnail */}
        <div className="flex-shrink-0">
          {request.thumbnail ? (
            <img
              src={request.thumbnail}
              alt=""
              className="w-12 h-12 rounded-[var(--r-md)] object-cover bg-[var(--surface-2)]"
            />
          ) : (
            <div className="w-12 h-12 rounded-[var(--r-md)] bg-[var(--surface-2)] flex items-center justify-center text-[var(--text-muted)]">
              {request.type === "audiobook" ? (
                <BookOpen className="w-5 h-5" />
              ) : (
                <Music className="w-5 h-5" />
              )}
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <h3 className="text-sm font-semibold text-[var(--text-primary)] leading-snug line-clamp-2 min-w-0">
            {request.title || "Untitled"}
            {isGenericTitle && userRole === "parent" && (
              <span
                className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] font-normal text-[var(--warning)] align-middle"
                title="Generic title — consider renaming for clearer library + analytics"
              >
                <AlertTriangle className="w-3 h-3" />
                generic
              </span>
            )}
          </h3>

          {/* Meta row — compact badges */}
          <div className="flex items-center flex-wrap gap-1.5 mt-1.5">
            <StatusBadge status={request.status} />
            <Badge tone={profile.tone} size="xs">
              <span aria-hidden>{profile.emoji}</span> {profile.label}
            </Badge>
            <Badge tone={request.type === "audiobook" ? "info" : "neutral"} size="xs">
              {request.type === "audiobook" ? "Audiobook" : "Music"}
            </Badge>
            <span className="text-[11px] text-[var(--text-muted)]">
              {formatDate(request.created_at)}
            </span>
            {isDuplicate && (
              <Badge tone="warning" size="xs" icon={<AlertTriangle className="w-3 h-3" />}>
                {downloadCount}× downloaded
              </Badge>
            )}
          </div>

          {/* Error message */}
          {request.status === "failed" && request.error_message && (
            <p className="text-xs text-[var(--danger)] mt-2 line-clamp-2">
              {request.error_message}
            </p>
          )}

          {/* Audio preview — only when ready and has playable URL */}
          {request.status === "completed" && request.file_path && (
            <MiniPlayer request={request} className="mt-3" />
          )}

          {/* Action groups — grouped by intent, never mixed */}
          <RowActions
            request={request}
            userRole={userRole}
            busy={busy}
            onApprove={run("approve", onApprove)}
            onReject={run("reject", onReject)}
            onRetry={run("retry", onRetry)}
            onMarkUploaded={run("uploaded", onMarkUploaded)}
            onDelete={onDelete}
            onShowUploadGuide={onShowUploadGuide}
          />
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Row Actions — strict grouping ──────────────────────────────────────────
   Four lanes, visually separated, never mixed:
   1. Decisions  (approve / reject)        — primary intent
   2. Library    (preview / download)      — non-destructive use
   3. Recovery   (retry / mark uploaded)   — fix-it actions
   4. Lifecycle  (cancel / delete)         — destructive, always rightmost
   The lifecycle lane is gated by ownership: parents can always act, children
   only on requests they originated.                                            */
function RowActions({
  request,
  userRole,
  busy,
  onApprove,
  onReject,
  onRetry,
  onMarkUploaded,
  onDelete,
  onShowUploadGuide,
}) {
  const currentUserId = useStore((s) => s.user?.id);
  const isParent = userRole === "parent";
  const ownsRequest = isParent || request.user_id === currentUserId;
  const lanes = [];

  // Decisions — pending only
  if (isParent && request.status === "pending") {
    lanes.push(
      <div key="decisions" className="flex items-center gap-2">
        <Button
          size="sm"
          variant="success"
          loading={busy === "approve"}
          onClick={() => onApprove(request.id)}
          iconLeft={<Check className="w-4 h-4" />}
        >
          Approve
        </Button>
        <Button
          size="sm"
          variant="secondary"
          loading={busy === "reject"}
          onClick={() => onReject(request.id, "Not appropriate")}
          iconLeft={<X className="w-4 h-4" />}
        >
          Reject
        </Button>
      </div>,
    );
  }

  // Audiobook upload — approved audiobooks waiting on manual upload
  if (isParent && request.type === "audiobook" && request.status === "approved") {
    lanes.push(
      <div key="upload" className="flex items-center gap-2">
        <Button
          size="sm"
          variant="primary"
          loading={busy === "uploaded"}
          onClick={() => onMarkUploaded(request.id)}
          iconLeft={<UploadCloud className="w-4 h-4" />}
        >
          Mark uploaded
        </Button>
        {onShowUploadGuide && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onShowUploadGuide(request)}
            iconLeft={<HelpCircle className="w-4 h-4" />}
          >
            How to upload
          </Button>
        )}
      </div>,
    );
  }

  // Library — download is primary on ready music; re-download is recovery
  if (request.status === "completed" && request.file_path) {
    lanes.push(
      <div key="library" className="flex items-center gap-2">
        <DownloadAction request={request} />
        {isParent && request.type === "music" && (
          <Button
            size="sm"
            variant="ghost"
            loading={busy === "retry"}
            onClick={() => onRetry(request.id, request.title)}
            iconLeft={<RotateCcw className="w-3.5 h-3.5" />}
            className="text-[var(--text-muted)]"
            title="Re-download (use if file is broken)"
          >
            Re-download
          </Button>
        )}
      </div>,
    );
  }

  // Recovery — retry failed music
  if (isParent && request.status === "failed" && request.type === "music") {
    lanes.push(
      <Button
        key="recovery"
        size="sm"
        variant="warning"
        loading={busy === "retry"}
        onClick={() => onRetry(request.id, request.title)}
        iconLeft={<RotateCcw className="w-4 h-4" />}
      >
        Retry download
      </Button>,
    );
  }

  // Lifecycle — cancel (active) or delete (terminal). Owner-gated.
  if (onDelete && ownsRequest) {
    lanes.push(
      <LifecycleAction
        key="lifecycle"
        request={request}
        onDelete={onDelete}
      />,
    );
  }

  if (lanes.length === 0) return null;
  return <div className="flex flex-wrap items-center gap-3 mt-3">{lanes}</div>;
}

/* ─── Lifecycle Action — cancel or delete depending on state ─────────────── */
function LifecycleAction({ request, onDelete }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const isActive = ACTIVE_STATUSES.has(request.status);
  const hasFile = request.status === "completed" && !!request.file_path;
  const needsConfirm = hasFile; // only confirm when we'd lose a real file

  const verb = isActive ? "Cancel" : hasFile ? "Delete" : "Remove";
  const variant = isActive ? "ghost" : "ghost";

  const handleClick = async () => {
    if (needsConfirm) {
      setConfirmOpen(true);
      return;
    }
    setBusy(true);
    try {
      await onDelete(request.id);
    } finally {
      setBusy(false);
    }
  };

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onDelete(request.id);
      setConfirmOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant={variant}
        loading={busy && !confirmOpen}
        onClick={handleClick}
        iconLeft={
          isActive ? (
            <XCircle className="w-3.5 h-3.5" />
          ) : (
            <Trash2 className="w-3.5 h-3.5" />
          )
        }
        className="text-[var(--text-muted)] hover:text-[var(--danger)] ml-auto"
      >
        {verb}
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => !busy && setConfirmOpen(false)}
        onConfirm={handleConfirm}
        loading={busy}
        title={`Delete "${request.title}"?`}
        description="This removes the request from the library and deletes the downloaded file from the server. You can request it again later if you change your mind."
        confirmLabel="Delete permanently"
        variant="danger"
      />
    </>
  );
}

/* ─── Mini Player — signed-URL streaming with range support ──────────────── */
function MiniPlayer({ request, className = "" }) {
  const getAccessToken = useStore((s) => s.getAccessToken);
  const [state, setState] = useState("idle"); // idle | loading | playing | paused | error
  const [error, setError] = useState(null);
  const audioRef = useRef(null);
  const loadedRef = useRef(false);

  const streamUrl = request.file_path?.replace("/api/downloads/", "/api/stream/");

  const handleToggle = async () => {
    if (state === "loading") return;

    if (audioRef.current && loadedRef.current) {
      if (audioRef.current.paused) {
        await audioRef.current.play().catch(() => {});
        setState("playing");
      } else {
        audioRef.current.pause();
        setState("paused");
      }
      return;
    }

    setState("loading");
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Session expired — log in again");
      if (audioRef.current) {
        audioRef.current.src = `${streamUrl}?token=${encodeURIComponent(token)}`;
        audioRef.current.load();
        loadedRef.current = true;
        await audioRef.current.play().catch(() => {});
      }
      setState("playing");
    } catch (e) {
      loadedRef.current = false;
      setError(e.message || "Preview unavailable");
      setState("error");
    }
  };

  return (
    <div className={cx("flex items-center gap-2", className)}>
      <Button
        size="xs"
        variant="secondary"
        onClick={handleToggle}
        loading={state === "loading"}
        iconLeft={
          state === "playing" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />
        }
      >
        {state === "playing" ? "Pause" : state === "paused" ? "Resume" : "Preview"}
      </Button>
      <audio
        ref={audioRef}
        controls
        preload="none"
        onError={() => {
          if (!loadedRef.current) return;
          loadedRef.current = false;
          setError("Preview unavailable");
          setState("error");
        }}
        onEnded={() => setState("paused")}
        onPause={() => state === "playing" && setState("paused")}
        onPlay={() => setState("playing")}
        className={cx(
          "h-8 transition-all",
          state === "idle" || state === "loading"
            ? "w-0 overflow-hidden opacity-0 pointer-events-none"
            : "w-full max-w-xs",
        )}
      />
      {error && <span className="text-xs text-[var(--danger)]">{error}</span>}
    </div>
  );
}

/* ─── Download Action — open rename dialog, then fetch + save with chosen name ─── */
function sanitizeFilename(name) {
  // eslint-disable-next-line no-control-regex -- control chars are illegal in filenames
  return name.replace(/[<>:"/\\|?*\x00-\x1f]/g, "").trim().slice(0, 100);
}

function DownloadAction({ request }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(null);
  const defaultName = sanitizeFilename(request.title) || "song";
  const [filename, setFilename] = useState(defaultName);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (open) setFilename(defaultName);
  }, [open, defaultName]);

  const handleDownload = async () => {
    const safeName = sanitizeFilename(filename);
    if (!safeName) {
      setError("Pick a filename");
      return;
    }
    setDownloading(true);
    setError(null);
    try {
      const { sessionId } = useStore.getState();
      const res = await fetch(request.file_path, {
        headers: { "X-Session-Id": sessionId },
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${safeName}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setOpen(false);
    } catch {
      setError("Download failed — try again");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant="primary"
        onClick={() => setOpen(true)}
        iconLeft={<Download className="w-3.5 h-3.5" />}
      >
        Download
      </Button>

      <ConfirmDialog
        open={open}
        onClose={() => !downloading && setOpen(false)}
        onConfirm={handleDownload}
        loading={downloading}
        title="Download as"
        description="Pick a filename for your saved copy. The file is downloaded as MP3."
        confirmLabel="Save file"
        variant="primary"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleDownload();
                }
              }}
              className="flex-1"
              aria-label="Filename"
            />
            <span className="text-sm text-[var(--text-muted)] tabular-nums select-none">
              .mp3
            </span>
          </div>
          {error && (
            <p className="text-xs text-[var(--danger)]">{error}</p>
          )}
          {filename !== defaultName && (
            <button
              type="button"
              onClick={() => setFilename(defaultName)}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              Reset to “{defaultName}”
            </button>
          )}
        </div>
      </ConfirmDialog>
    </>
  );
}
