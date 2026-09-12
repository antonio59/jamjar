import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Music,
  Book,
  Search,
  Link as LinkIcon,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import useStore from "../store/useStore";
import { thumbUrl } from "../api/client";
import ConfettiBurst from "../components/ConfettiBurst";
import {
  Card,
  Stepper,
  SegmentedControl,
  Button,
  Badge,
  SearchField,
  Label,
  Input,
  EmptyState,
  cx,
} from "../components/ui";

function isYouTubeUrl(s = "") {
  return /youtube\.com|youtu\.be/.test(s);
}

const PROFILE_OPTIONS = [
  { value: "yoto", label: "Yoto", icon: <span aria-hidden>📻</span> },
  { value: "ipod", label: "iPod", icon: <span aria-hidden>🎧</span> },
];

const TYPE_OPTIONS = [
  { value: "music", label: "Music", icon: <Music className="w-4 h-4" /> },
  { value: "audiobook", label: "Audiobook", icon: <Book className="w-4 h-4" /> },
];

const SOURCE_OPTIONS = [
  { value: "search", label: "Search", icon: <Search className="w-4 h-4" /> },
  { value: "url", label: "Paste YouTube link", icon: <LinkIcon className="w-4 h-4" /> },
];

export default function Home() {
  const {
    user,
    createRequest,
    search,
    searchBooks,
    getVideoInfo,
    checkDuplicate,
    showToast,
  } = useStore();

  const isParent = user.role === "parent";

  // ── State ─────────────────────────────────────────────────────────────────
  const [step, setStep] = useState(isParent ? 0 : 1);
  const [profile, setProfile] = useState(isParent ? "yoto" : user.profile);
  const [type, setType] = useState("music");
  const [source, setSource] = useState("search"); // music sub-mode

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchedOnce, setSearchedOnce] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [duplicateCount, setDuplicateCount] = useState(0);

  // URL paste
  const [urlInput, setUrlInput] = useState("");
  const [urlTitle, setUrlTitle] = useState("");
  const [urlPreview, setUrlPreview] = useState(null);
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState(null);
  const urlDebounce = useRef(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null); // null | { type, kind }

  // Reset downstream state when upstream choice changes
  const clearSelection = () => {
    setQuery("");
    setResults([]);
    setSelectedTrack(null);
    setUrlInput("");
    setUrlTitle("");
    setUrlPreview(null);
    setUrlError(null);
    setSearchedOnce(false);
    setDuplicateCount(0);
  };

  // Duplicate check
  useEffect(() => {
    if (!selectedTrack) {
      setDuplicateCount(0);
      return;
    }
    checkDuplicate(selectedTrack.title).then(setDuplicateCount);
  }, [selectedTrack, checkDuplicate]);

  // ── Step navigation ──────────────────────────────────────────────────────
  const steps = useMemo(() => {
    const base = [
      { id: "type", label: "Type", hint: "Music or audiobook" },
      { id: "source", label: "Find content", hint: type === "audiobook" ? "Search Open Library" : "Search or paste link" },
      { id: "confirm", label: "Confirm", hint: "Review and send" },
    ];
    if (isParent) {
      return [
        { id: "device", label: "Device", hint: "Yoto or iPod" },
        ...base,
      ];
    }
    return base;
  }, [isParent, type]);

  const stepIdx = step; // already 0-based
  const canAdvance = () => {
    const id = steps[stepIdx]?.id;
    if (id === "device") return !!profile;
    if (id === "type") return !!type;
    if (id === "source") {
      if (type === "audiobook") return !!selectedTrack;
      return source === "search" ? !!selectedTrack : isYouTubeUrl(urlInput);
    }
    return true;
  };

  const next = () => canAdvance() && setStep((s) => Math.min(s + 1, steps.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));
  const goTo = (idx) => idx <= step && setStep(idx);

  // ── Searches ──────────────────────────────────────────────────────────────
  const handleSearch = async (q) => {
    setQuery(q);
    setSelectedTrack(null);
    if (q.length < 2) {
      setResults([]);
      setSearchedOnce(false);
      return;
    }
    setSearching(true);
    const fn = type === "audiobook" ? searchBooks : (qq) => search(qq, "music");
    const r = await fn(q);
    setResults(r || []);
    setSearchedOnce(true);
    setSearching(false);
  };

  const handleUrlChange = (val) => {
    setUrlInput(val);
    setUrlPreview(null);
    setUrlTitle("");
    setUrlError(null);
    if (!val.trim()) return;
    if (!isYouTubeUrl(val)) {
      setUrlError(
        "Doesn't look like a YouTube link. Try a youtube.com or youtu.be URL.",
      );
      return;
    }

    clearTimeout(urlDebounce.current);
    urlDebounce.current = setTimeout(async () => {
      setUrlLoading(true);
      try {
        const info = await getVideoInfo(val);
        if (info?.title) {
          setUrlPreview(info);
          setUrlTitle(info.title);
        } else {
          setUrlError(
            "Couldn't read that video. It may be private, removed, or region-locked.",
          );
        }
      } catch {
        setUrlError(
          "Couldn't read that video. It may be private, removed, or region-locked.",
        );
      }
      setUrlLoading(false);
    }, 500);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const buildPayload = () => {
    if (type === "music") {
      if (source === "search" && selectedTrack) {
        return {
          profile,
          title: selectedTrack.title,
          url: selectedTrack.url,
          type: "music",
          searchQuery: query,
          thumbnail: selectedTrack.thumbnail,
          duration: selectedTrack.duration,
          direct: isParent,
        };
      }
      if (source === "url" && isYouTubeUrl(urlInput)) {
        return {
          profile,
          title: urlTitle.trim() || urlPreview?.title || "Untitled YouTube track",
          url: urlInput,
          type: "music",
          searchQuery: urlInput,
          thumbnail: urlPreview?.thumbnail || "",
          duration: urlPreview?.duration || "Unknown",
          direct: isParent,
        };
      }
    }
    if (type === "audiobook" && selectedTrack) {
      return {
        profile,
        title: `${selectedTrack.title} — ${selectedTrack.author}`,
        url: selectedTrack.url,
        type: "audiobook",
        searchQuery: query,
        thumbnail: selectedTrack.thumbnail || "",
        duration: "",
        direct: isParent,
      };
    }
    return null;
  };

  const handleSubmit = async () => {
    const payload = buildPayload();
    if (!payload) return;
    setSubmitting(true);
    try {
      await createRequest(payload);
      setSubmitted({ type, isParent, profile });
      showToast(
        isParent
          ? type === "audiobook"
            ? "Audiobook queued — upload the file when you're ready."
            : "Added — downloading now."
          : "Request sent — a grown-up will review it soon.",
        "success",
      );
    } catch (err) {
      const status = err.response?.status;
      let msg = err.response?.data?.error || "Couldn't send the request.";
      if (status === 401 || status === 403)
        msg = "Please ask a grown-up to log in again.";
      if (status === 429) msg = "Going too fast! Wait a moment and try again.";
      if (err.response?.data?.explicit)
        msg = "That's the explicit version — look for the clean one instead.";
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const resetAll = () => {
    setStep(isParent ? 0 : 1);
    clearSelection();
    setType("music");
    setSource("search");
    setSubmitted(null);
  };

  // ── Success view ──────────────────────────────────────────────────────────
  if (submitted) {
    return <SuccessCard submitted={submitted} onAddAnother={resetAll} />;
  }

  // ── Step content ──────────────────────────────────────────────────────────
  const currentStepId = steps[stepIdx]?.id;
  const showBack = stepIdx > 0 && stepIdx < steps.length;
  const isLast = stepIdx === steps.length - 1;

  return (
    <div className="max-w-2xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
          {isParent ? "New request" : "What do you want to hear?"}
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          {isParent
            ? "Add music or audiobooks to the library — direct, no approval needed."
            : `Hi ${user.display_name || user.username}! Pick a song or book and a grown-up will review it.`}
        </p>
      </header>

      <Card padding="lg" className="overflow-hidden">
        <Stepper steps={steps} current={stepIdx} onJump={goTo} />

        <div className="mt-6 min-h-[280px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStepId}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.18 }}
            >
              {currentStepId === "device" && (
                <DeviceStep value={profile} onChange={setProfile} />
              )}
              {currentStepId === "type" && (
                <TypeStep
                  value={type}
                  onChange={(t) => {
                    setType(t);
                    clearSelection();
                  }}
                />
              )}
              {currentStepId === "source" && (
                <SourceStep
                  type={type}
                  source={source}
                  onSourceChange={(s) => {
                    setSource(s);
                    clearSelection();
                  }}
                  query={query}
                  results={results}
                  searching={searching}
                  searchedOnce={searchedOnce}
                  selectedTrack={selectedTrack}
                  duplicateCount={duplicateCount}
                  onSearch={handleSearch}
                  onSelectTrack={(r) => {
                    setSelectedTrack(r);
                    setQuery(r.title);
                    setResults([]);
                  }}
                  urlInput={urlInput}
                  urlTitle={urlTitle}
                  urlPreview={urlPreview}
                  urlLoading={urlLoading}
                  urlError={urlError}
                  onUrlChange={handleUrlChange}
                  onUrlTitleChange={setUrlTitle}
                  onClearUrl={() => {
                    setUrlInput("");
                    setUrlTitle("");
                    setUrlPreview(null);
                    setUrlError(null);
                  }}
                />
              )}
              {currentStepId === "confirm" && (
                <ConfirmStep
                  profile={profile}
                  type={type}
                  source={source}
                  selectedTrack={selectedTrack}
                  urlInput={urlInput}
                  urlTitle={urlTitle}
                  urlPreview={urlPreview}
                  duplicateCount={duplicateCount}
                  isParent={isParent}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--border-subtle)]">
          {showBack ? (
            <Button
              variant="ghost"
              onClick={back}
              iconLeft={<ChevronLeft className="w-4 h-4" />}
            >
              Back
            </Button>
          ) : (
            <span />
          )}
          {isLast ? (
            <Button
              variant="primary"
              size="lg"
              loading={submitting}
              disabled={!buildPayload()}
              onClick={handleSubmit}
              iconLeft={<Sparkles className="w-4 h-4" />}
            >
              {isParent
                ? type === "audiobook"
                  ? "Add to queue"
                  : `Add to ${profile === "yoto" ? "Yoto" : "iPod"}`
                : "Send request"}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              disabled={!canAdvance()}
              onClick={next}
              iconRight={<ChevronRight className="w-4 h-4" />}
            >
              Continue
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

/* ─── Step: Device ──────────────────────────────────────────────────────── */
function DeviceStep({ value, onChange }) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Which device is this for?
        </h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          The track is delivered to that device's library.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PROFILE_OPTIONS.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cx(
                "flex items-center gap-3 p-4 rounded-[var(--r-lg)] border-2 text-left transition-all",
                active
                  ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                  : "border-[var(--border-subtle)] bg-[var(--surface)] hover:border-[var(--border-default)]",
              )}
            >
              <span className="text-3xl">{opt.icon}</span>
              <div className="min-w-0">
                <p className="font-semibold text-[var(--text-primary)]">{opt.label}</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {opt.value === "yoto"
                    ? "Auto-uploaded to your Yoto card library"
                    : "Downloaded as MP3 for iPod sync"}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Step: Type ─────────────────────────────────────────────────────────── */
function TypeStep({ value, onChange }) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          What kind of content?
        </h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Music downloads automatically. Audiobooks need a manual upload.
        </p>
      </div>
      <SegmentedControl
        size="lg"
        fullWidth
        value={value}
        onChange={onChange}
        options={TYPE_OPTIONS}
      />
      {value === "audiobook" && (
        <p className="text-xs text-[var(--text-muted)] flex items-start gap-1.5 mt-2">
          <Book className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          You'll source the audiobook file yourself, then upload it to the
          device. JamJar keeps it on the to-do list.
        </p>
      )}
    </div>
  );
}

/* ─── Step: Source ──────────────────────────────────────────────────────── */
function SourceStep(props) {
  const {
    type,
    source,
    onSourceChange,
    query,
    results,
    searching,
    searchedOnce,
    selectedTrack,
    duplicateCount,
    onSearch,
    onSelectTrack,
    urlInput,
    urlTitle,
    urlPreview,
    urlLoading,
    urlError,
    onUrlChange,
    onUrlTitleChange,
    onClearUrl,
  } = props;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          {type === "audiobook"
            ? "Search for an audiobook"
            : "Find a track"}
        </h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          {type === "audiobook"
            ? "Searches Open Library — used to identify the book a grown-up will source for you."
            : "Search YouTube or paste a link if you already have the exact video."}
        </p>
      </div>

      {/* Music sub-mode */}
      {type === "music" && (
        <SegmentedControl
          value={source}
          onChange={onSourceChange}
          options={SOURCE_OPTIONS}
          ariaLabel="Search method"
        />
      )}

      {type === "audiobook" || source === "search" ? (
        <div className="space-y-3">
          <SearchField
            value={query}
            onChange={onSearch}
            placeholder={
              type === "audiobook"
                ? "e.g. Charlotte's Web, Roald Dahl…"
                : "Try a song name, artist, or both"
            }
            loading={searching}
            size="lg"
          />

          {/* States */}
          {!searchedOnce && !selectedTrack && (
            <p className="text-xs text-[var(--text-muted)] px-1">
              {type === "audiobook"
                ? "Pulls from openlibrary.org · grown-ups upload the file later."
                : query.length === 0
                  ? "Tip: include artist + song for the best match."
                  : "Keep typing…"}
            </p>
          )}

          {searchedOnce && !searching && results.length === 0 && !selectedTrack && (
            <EmptyState
              icon={<Search className="w-5 h-5" />}
              title="Nothing matched"
              description={
                type === "audiobook"
                  ? "Try a different title or author."
                  : "Try a different spelling or include the artist."
              }
            />
          )}

          {results.length > 0 && (
            <div className="border border-[var(--border-subtle)] rounded-[var(--r-lg)] divide-y divide-[var(--border-subtle)] overflow-hidden max-h-80 overflow-y-auto bg-[var(--surface)]">
              {results.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => onSelectTrack(r)}
                  className="w-full flex items-start gap-3 p-3 text-left hover:bg-[var(--surface-2)] transition-colors"
                >
                  {r.thumbnail ? (
                    <img
                      src={thumbUrl(r.thumbnail)}
                      alt=""
                      className={cx(
                        "rounded object-cover bg-[var(--surface-2)] flex-shrink-0",
                        type === "audiobook" ? "w-10 h-14" : "w-12 h-12",
                      )}
                    />
                  ) : (
                    <div
                      className={cx(
                        "rounded bg-[var(--surface-2)] flex items-center justify-center text-[var(--text-muted)] flex-shrink-0",
                        type === "audiobook" ? "w-10 h-14" : "w-12 h-12",
                      )}
                    >
                      {type === "audiobook" ? (
                        <Book className="w-4 h-4" />
                      ) : (
                        <Music className="w-4 h-4" />
                      )}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {r.title}
                    </p>
                    {r.isCleanLabelled && (
                      <Badge tone="success" size="xs" className="mt-1">
                        Clean
                      </Badge>
                    )}
                    <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                      {type === "audiobook"
                        ? `${r.author}${r.year ? ` · ${r.year}` : ""}`
                        : r.duration || "—"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {selectedTrack && (
            <SelectedTrackCard
              track={selectedTrack}
              type={type}
              duplicateCount={duplicateCount}
            />
          )}
        </div>
      ) : (
        <UrlPasteSection
          urlInput={urlInput}
          urlTitle={urlTitle}
          urlPreview={urlPreview}
          urlLoading={urlLoading}
          urlError={urlError}
          onUrlChange={onUrlChange}
          onUrlTitleChange={onUrlTitleChange}
          onClearUrl={onClearUrl}
        />
      )}
    </div>
  );
}

function SelectedTrackCard({ track, type, duplicateCount }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 p-3 bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)] rounded-[var(--r-lg)]">
        {track.thumbnail ? (
          <img
            src={thumbUrl(track.thumbnail)}
            alt=""
            className={cx(
              "rounded object-cover bg-[var(--surface-2)] flex-shrink-0",
              type === "audiobook" ? "w-10 h-14" : "w-12 h-12",
            )}
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-[var(--brand)] uppercase tracking-wide mb-0.5">
            Selected
          </p>
          <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
            {track.title}
          </p>
          <p className="text-xs text-[var(--text-secondary)] truncate">
            {type === "audiobook" ? `by ${track.author}` : track.duration || "—"}
          </p>
        </div>
        <CheckCircle className="w-5 h-5 text-[var(--brand)] flex-shrink-0" />
      </div>
      {duplicateCount > 0 && (
        <div className="flex items-start gap-2 p-3 bg-[var(--warning-soft)] border border-[var(--warning-border)] rounded-[var(--r-md)]">
          <AlertTriangle className="w-4 h-4 text-[var(--warning)] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-[var(--text-secondary)]">
            <span className="font-medium text-[var(--text-primary)]">Already downloaded.</span>{" "}
            This title is in the library {duplicateCount}{" "}
            time{duplicateCount !== 1 ? "s" : ""}. You can add it again if you
            need another copy.
          </p>
        </div>
      )}
    </div>
  );
}

function UrlPasteSection({
  urlInput,
  urlTitle,
  urlPreview,
  urlLoading,
  urlError,
  onUrlChange,
  onUrlTitleChange,
  onClearUrl,
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="yt-url" hint="Works for any YouTube video. Playlists pull the first track only.">
          YouTube URL
        </Label>
        <div className="relative">
          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
          <Input
            id="yt-url"
            size="lg"
            value={urlInput}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder="https://youtube.com/watch?v=…"
            className="pl-10 pr-10"
          />
          {urlLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--brand)] animate-spin" />
          )}
          {urlInput && !urlLoading && (
            <button
              type="button"
              onClick={onClearUrl}
              aria-label="Clear"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1"
            >
              ×
            </button>
          )}
        </div>
        {urlError && (
          <p className="text-sm text-[var(--danger)] mt-2 flex items-start gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            {urlError}
          </p>
        )}
      </div>

      <AnimatePresence>
        {isYouTubeUrl(urlInput) && !urlError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {urlPreview?.thumbnail && (
              <div className="flex items-center gap-3 p-3 bg-[var(--surface-2)] rounded-[var(--r-lg)] border border-[var(--border-subtle)]">
                <img
                  src={thumbUrl(urlPreview.thumbnail)}
                  alt=""
                  className="w-20 h-14 rounded object-cover"
                />
                <div className="min-w-0">
                  <Badge tone="success" size="xs" icon={<CheckCircle className="w-3 h-3" />}>
                    Video found
                  </Badge>
                  {urlPreview.title && (
                    <p className="text-sm text-[var(--text-primary)] mt-1 line-clamp-2">
                      {urlPreview.title}
                    </p>
                  )}
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="yt-title" hint="Becomes the library title — keep it tidy.">
                Title
              </Label>
              <Input
                id="yt-title"
                size="lg"
                value={urlTitle}
                onChange={(e) => onUrlTitleChange(e.target.value)}
                placeholder="e.g. Artist — Song name"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Step: Confirm ──────────────────────────────────────────────────────── */
function ConfirmStep({
  profile,
  type,
  source,
  selectedTrack,
  urlInput,
  urlTitle,
  urlPreview,
  duplicateCount,
  isParent,
}) {
  const title =
    type === "audiobook" && selectedTrack
      ? `${selectedTrack.title} — ${selectedTrack.author}`
      : source === "search" && selectedTrack
        ? selectedTrack.title
        : urlTitle.trim() || urlPreview?.title || "Untitled YouTube track";

  const thumbnail =
    selectedTrack?.thumbnail || urlPreview?.thumbnail || null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Ready to send?
        </h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          {isParent
            ? "Parent submissions are auto-approved."
            : "A grown-up will review this and approve or reject it."}
        </p>
      </div>

      <div className="flex items-start gap-3 p-4 border border-[var(--border-subtle)] rounded-[var(--r-lg)] bg-[var(--surface-2)]">
        {thumbnail ? (
          <img
            src={thumbUrl(thumbnail)}
            alt=""
            className={cx(
              "rounded object-cover bg-[var(--surface-2)] flex-shrink-0",
              type === "audiobook" ? "w-12 h-16" : "w-16 h-16",
            )}
          />
        ) : (
          <div
            className={cx(
              "rounded bg-[var(--surface)] flex items-center justify-center text-[var(--text-muted)] flex-shrink-0",
              type === "audiobook" ? "w-12 h-16" : "w-16 h-16",
            )}
          >
            {type === "audiobook" ? (
              <Book className="w-5 h-5" />
            ) : (
              <Music className="w-5 h-5" />
            )}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--text-primary)] leading-snug">
            {title}
          </p>
          <div className="flex items-center flex-wrap gap-1.5 mt-2">
            <Badge tone={profile === "yoto" ? "yoto" : "ipod"} size="xs">
              {profile === "yoto" ? "📻 Yoto" : "🎧 iPod"}
            </Badge>
            <Badge tone={type === "audiobook" ? "info" : "neutral"} size="xs">
              {type === "audiobook" ? "Audiobook" : "Music"}
            </Badge>
            {selectedTrack?.duration && selectedTrack.duration !== "Unknown" && (
              <Badge tone="neutral" size="xs">
                {selectedTrack.duration}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* What happens next */}
      <div className="text-sm text-[var(--text-secondary)] space-y-2 p-3 bg-[var(--info-soft)] border border-[var(--info-border)] rounded-[var(--r-md)]">
        <p className="font-medium text-[var(--text-primary)]">What happens next:</p>
        <ul className="space-y-1 text-[var(--text-secondary)]">
          {!isParent && (
            <li>• A grown-up will review your request.</li>
          )}
          {type === "audiobook" ? (
            <>
              <li>• It joins the <strong>Needs upload</strong> list on the dashboard.</li>
              <li>• A grown-up sources the file and uploads it to the device.</li>
            </>
          ) : (
            <>
              <li>• {isParent ? "It starts downloading immediately." : "Once approved, it starts downloading."}</li>
              <li>• You'll see it under <strong>Library → Ready</strong> when it's done.</li>
            </>
          )}
        </ul>
      </div>

      {duplicateCount > 0 && (
        <div className="flex items-start gap-2 p-3 bg-[var(--warning-soft)] border border-[var(--warning-border)] rounded-[var(--r-md)]">
          <AlertTriangle className="w-4 h-4 text-[var(--warning)] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-[var(--text-secondary)]">
            <span className="font-medium text-[var(--text-primary)]">Heads up:</span>{" "}
            this title is already in the library {duplicateCount}× — adding it
            again will create a duplicate.
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── Success ────────────────────────────────────────────────────────────── */
function SuccessCard({ submitted, onAddAnother }) {
  const { type, isParent, profile } = submitted;
  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="max-w-md mx-auto mt-12"
    >
      <Card padding="lg" className="relative border-[var(--success-border)] bg-[var(--success-soft)] text-center overflow-visible">
        <ConfettiBurst />
        <div className="w-14 h-14 rounded-full bg-[var(--success-solid)] text-white flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-[var(--text-primary)]">
          {isParent
            ? type === "audiobook"
              ? "Added to the upload list"
              : `Sent to ${profile === "yoto" ? "Yoto" : "iPod"}`
            : "Request sent!"}
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mt-2 max-w-xs mx-auto">
          {isParent
            ? type === "audiobook"
              ? "Open Dashboard → Needs upload to finish the audiobook flow."
              : "Track the download in Dashboard → Library."
            : "A grown-up will review it soon. You'll see it on your requests page."}
        </p>
        <div className="flex items-center justify-center gap-2 mt-5">
          <Button variant="primary" onClick={onAddAnother}>
            Add another
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
