import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Music,
  BookOpen,
  Film,
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
import { thumbUrl } from "../../api/client";
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

const TYPE_META = {
  music: { label: "Music", tone: "neutral", icon: Music },
  video: { label: "Video", tone: "brand", icon: Film },
  audiobook: { label: "Audiobook", tone: "info", icon: BookOpen },
};

function typeMeta(type) {
  return TYPE_META[type] ?? TYPE_META.music;
}

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
  const typeInfo = typeMeta(request.type);
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
              src={thumbUrl(request.thumbnail)}
              alt=""
              className="w-12 h-12 rounded-[var(--r-md)] object-cover bg-[var(--surface-2)]"
            />
          ) : (
            <div className="w-12 h-12 rounded-[var(--r-md)] bg-[var(--surface-2)] flex items-center justify-center text-[var(--text-muted)]">
              <typeInfo.icon className="w-5 h-5" />
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
            <Badge tone={typeInfo.tone} size="xs">
              {typeInfo.label}
            </Badge>
            {Array.isArray(request.files) && request.files.length > 1 && (
              <Badge tone="neutral" size="xs">
                {request.files.length} parts
              </Badge>
            )}
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

  // Library — download is primary on ready music; re-download is recovery
  if (request.status === "completed" && request.file_path) {
    lanes.push(
      <div key="library" className="flex items-center gap-2">
        <DownloadAction request={request} />
        {isParent && request.type !== "audiobook" && (
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

  // Audiobook upload — approved audiobooks wait for a parent to attach the
  // actual audio files (or mark done without files if sideloaded by hand).
  // Completed uploads show the same lane so a wrong file can be swapped out.
  if (
    isParent &&
    request.type === "audiobook" &&
    ["approved", "completed"].includes(request.status)
  ) {
    lanes.push(
      <AudiobookUploadLane
        key="upload"
        request={request}
        onMarkUploaded={onMarkUploaded}
        onShowUploadGuide={onShowUploadGuide}
      />,
    );
  }

  // Recovery — retry failed downloads (music and video both come from yt-dlp)
  if (isParent && request.status === "failed" && request.type !== "audiobook") {
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

/* ─── Audiobook upload — parent attaches the ripped files; the request then
     completes with real paths so anyone on the profile can download them. ─── */
function AudiobookUploadLane({ request, onMarkUploaded, onShowUploadGuide }) {
  const uploadAudiobook = useStore((s) => s.uploadAudiobook);
  const fileInputRef = useRef(null);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ""; // allow picking the same files again after a failure
    if (files.length === 0) return;
    setError(null);
    setProgress(0);
    try {
      await uploadAudiobook(request.id, files, setProgress);
    } catch (err) {
      setError(err.response?.data?.error || "Upload failed — try again");
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="audio/*,.mp3,.m4a,.m4b,.aac,.ogg,.oga,.opus,.flac,.wav,.aax,.mp4"
        className="hidden"
        onChange={handleFiles}
      />
      <Button
        size="sm"
        variant="primary"
        loading={progress !== null}
        onClick={() => fileInputRef.current?.click()}
        iconLeft={<UploadCloud className="w-4 h-4" />}
      >
        {progress !== null
          ? `Uploading ${progress}%`
          : request.status === "completed"
            ? "Replace files"
            : "Upload files"}
      </Button>
      {request.status !== "completed" && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onMarkUploaded(request.id)}
          title="Mark done without attaching files (copied to the device by hand)"
        >
          Mark uploaded
        </Button>
      )}
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
      {error && <span className="text-xs text-[var(--danger)]">{error}</span>}
    </div>
  );
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

/* ─── Mini Player — signed-URL streaming with range support.
     Renders <video> for video requests so the dashboard previews the picture,
     not just the soundtrack. Both elements share the same play/pause API.  ─── */
function MiniPlayer({ request, className = "" }) {
  const getAccessToken = useStore((s) => s.getAccessToken);
  const [state, setState] = useState("idle"); // idle | loading | playing | paused | error
  const [error, setError] = useState(null);
  const mediaRef = useRef(null);
  const loadedRef = useRef(false);

  const isVideo = request.type === "video";
  const MediaTag = isVideo ? "video" : "audio";
  const streamUrl = request.file_path?.replace("/api/downloads/", "/api/stream/");

  const handleToggle = async () => {
    if (state === "loading") return;

    if (mediaRef.current && loadedRef.current) {
      if (mediaRef.current.paused) {
        await mediaRef.current.play().catch(() => {});
        setState("playing");
      } else {
        mediaRef.current.pause();
        setState("paused");
      }
      return;
    }

    setState("loading");
    setError(null);
    try {
      // Mints the jj_media cookie the media element authenticates with —
      // keeps the token out of URLs and proxy access logs.
      const token = await getAccessToken();
      if (!token) throw new Error("Session expired — log in again");
      if (mediaRef.current) {
        mediaRef.current.src = streamUrl;
        mediaRef.current.load();
        loadedRef.current = true;
        await mediaRef.current.play().catch(() => {});
      }
      setState("playing");
    } catch (e) {
      loadedRef.current = false;
      setError(e.message || "Preview unavailable");
      setState("error");
    }
  };

  return (
    <div className={cx("flex items-center gap-2", className, isVideo && "flex-col items-start")}>
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
      <MediaTag
        ref={mediaRef}
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
          "transition-all",
          isVideo ? "rounded-[var(--r-md)]" : "h-8",
          state === "idle" || state === "loading"
            ? "w-0 h-0 overflow-hidden opacity-0 pointer-events-none"
            : isVideo
              ? "w-full max-w-sm max-h-44 bg-black"
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

function formatBytes(n) {
  if (!n) return "";
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(0)} MB`;
  return `${Math.max(1, Math.round(n / 1024))} KB`;
}

function DownloadAction({ request }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(null);
  const defaultName = sanitizeFilename(request.title) || "song";
  const [filename, setFilename] = useState(defaultName);
  const [downloading, setDownloading] = useState(false);

  // Multi-part uploads (audiobooks) get a part list instead of the rename
  // field — each part is fetched straight from the downloads endpoint.
  const parts =
    Array.isArray(request.files) && request.files.length > 1
      ? request.files
      : null;

  // Extension follows the stored file — .mpg for videos, .mp3 for audio.
  const fileExt =
    request.file_path?.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase() || "mp3";

  const openDialog = () => {
    setFilename(defaultName);
    setOpen(true);
  };

  const handleDownload = async () => {
    const safeName = sanitizeFilename(filename);
    if (!safeName) {
      setError("Pick a filename");
      return;
    }
    setDownloading(true);
    setError(null);
    try {
      const res = await fetch(request.file_path, { credentials: "include" });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${safeName}.${fileExt}`;
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
        onClick={openDialog}
        iconLeft={<Download className="w-3.5 h-3.5" />}
      >
        Download
      </Button>

      <ConfirmDialog
        open={open}
        onClose={() => !downloading && setOpen(false)}
        onConfirm={parts ? () => setOpen(false) : handleDownload}
        loading={downloading}
        title={parts ? `Download ${parts.length} parts` : "Download as"}
        description={
          parts
            ? "Grab every part, then drop them into an Audiobooks folder on the device — numbered names keep them in order."
            : fileExt === "mpg"
              ? "Pick a filename for your saved copy. Video files come down as .mpg — drop them on the iPod and play via Rockbox's mpegplayer."
              : `Pick a filename for your saved copy. The file is downloaded as .${fileExt}.`
        }
        confirmLabel={parts ? "Done" : "Save file"}
        variant="primary"
      >
        {parts ? (
          <ul className="space-y-1.5 max-h-64 overflow-y-auto">
            {parts.map((f, i) => (
              <li key={f.name}>
                <a
                  href={`/api/downloads/${f.profile}/${encodeURIComponent(f.name)}`}
                  download={f.name}
                  className="flex items-center gap-2 px-3 py-2 rounded-[var(--r-md)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] hover:bg-[var(--surface-2)] text-sm text-[var(--text-primary)]"
                >
                  <Download className="w-3.5 h-3.5 text-[var(--brand)] flex-shrink-0" />
                  <span className="min-w-0 flex-1 truncate">
                    Part {i + 1} — {f.name}
                  </span>
                  <span className="text-xs text-[var(--text-muted)] tabular-nums flex-shrink-0">
                    {formatBytes(f.size)}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
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
              .{fileExt}
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
        )}
      </ConfirmDialog>
    </>
  );
}
