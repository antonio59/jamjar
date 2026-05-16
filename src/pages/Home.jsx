import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useStore from "../store/useStore";
import { Music, Book, CheckCircle, Search, Link, X, AlertTriangle } from "lucide-react";

function isYouTubeUrl(str) {
  return /youtube\.com|youtu\.be/.test(str);
}

export default function Home() {
  const { user, createRequest, search, searchBooks, getVideoInfo, checkDuplicate, showToast } =
    useStore();

  const isParent = user.role === "parent";
  // Parents pick a profile; children use their own
  const [selectedProfile, setSelectedProfile] = useState("yoto");
  const profile = isParent ? selectedProfile : user.profile;

  const [trackType, setTrackType] = useState("music");
  // music sub-mode: "search" | "url"
  const [musicMode, setMusicMode] = useState("search");

  // shared
  const [submitted, setSubmitted] = useState(false);

  // search mode state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [searching, setSearching] = useState(false);
  const [duplicateCount, setDuplicateCount] = useState(0);

  // URL mode state
  const [urlInput, setUrlInput] = useState("");
  const [urlTitle, setUrlTitle] = useState("");
  const [urlPreview, setUrlPreview] = useState(null);
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState(null);
  const urlDebounceRef = useRef(null);

  // Check for duplicates when a track is selected
  useEffect(() => {
    if (!selectedTrack) { setDuplicateCount(0); return; }
    checkDuplicate(selectedTrack.title).then(setDuplicateCount);
  }, [selectedTrack, checkDuplicate]);

  const resetAll = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedTrack(null);
    setUrlInput("");
    setUrlTitle("");
    setUrlPreview(null);
    setUrlError(null);
  };

  const handleTypeChange = (type) => {
    setTrackType(type);
    resetAll();
  };

  // --- Music search ---
  const handleSearch = async (query) => {
    setSearchQuery(query);
    setSelectedTrack(null);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const results = await search(query, "music");
    setSearchResults(results);
    setSearching(false);
  };

  // --- YouTube URL paste ---
  const handleUrlInput = (val) => {
    setUrlInput(val);
    setUrlPreview(null);
    setUrlTitle("");
    setUrlError(null);
    if (!isYouTubeUrl(val)) return;

    clearTimeout(urlDebounceRef.current);
    urlDebounceRef.current = setTimeout(async () => {
      setUrlLoading(true);
      try {
        const info = await getVideoInfo(val);
        if (info) {
          setUrlPreview(info);
          setUrlTitle(info.title || "");
        } else {
          setUrlError("Couldn't load video info — it may be private or unavailable.");
        }
      } catch {
        setUrlError("Couldn't load video info — it may be private or unavailable.");
      }
      setUrlLoading(false);
    }, 500);
  };

  // --- Audiobook search ---
  const handleBookSearch = async (query) => {
    setSearchQuery(query);
    setSelectedTrack(null);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const results = await searchBooks(query);
    setSearchResults(results);
    setSearching(false);
  };

  // --- Submit ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    let requestData;

    if (trackType === "music") {
      if (musicMode === "search") {
        if (!selectedTrack) return;
        requestData = {
          profile,
          title: selectedTrack.title,
          url: selectedTrack.url,
          type: "music",
          searchQuery,
          thumbnail: selectedTrack.thumbnail,
          duration: selectedTrack.duration,
          direct: isParent,
        };
      } else {
        // URL mode
        if (!urlPreview && !isYouTubeUrl(urlInput)) return;
        const title = urlTitle.trim() || urlPreview?.title || "YouTube Video";
        requestData = {
          profile,
          title,
          url: urlInput,
          type: "music",
          searchQuery: urlInput,
          thumbnail: urlPreview?.thumbnail || "",
          duration: urlPreview?.duration || "Unknown",
          direct: isParent,
        };
      }
    } else {
      // Audiobook
      if (!selectedTrack) return;
      requestData = {
        profile,
        title: `${selectedTrack.title} — ${selectedTrack.author}`,
        url: selectedTrack.url,
        type: "audiobook",
        searchQuery,
        thumbnail: selectedTrack.thumbnail || "",
        duration: "",
        direct: isParent,
      };
    }

    try {
      await createRequest(requestData);
      showToast(
        isParent
          ? trackType === "audiobook"
            ? "Audiobook request added! Remember to upload the file manually."
            : "Request added and downloading! Check the dashboard."
          : "Request sent! A parent will review it soon 🎉",
        "success"
      );
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        resetAll();
      }, 3000);
    } catch (err) {
      const status = err.response?.status;
      let msg = err.response?.data?.error || "Something went wrong. Please try again.";
      if (status === 401 || status === 403) msg = "Please ask a grown-up to log in again.";
      if (status === 429) msg = "You're going too fast! Please wait a moment and try again.";
      showToast(msg, "error");
    }
  };

  const canSubmit =
    trackType === "audiobook"
      ? !!selectedTrack
      : musicMode === "search"
        ? !!selectedTrack
        : isYouTubeUrl(urlInput);

  if (submitted) {
    const isAudiobook = trackType === "audiobook";
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-green-100 dark:bg-green-900/30 border-2 border-green-500 dark:border-green-700 rounded-2xl p-12 text-center max-w-md mx-auto mt-20"
      >
        <CheckCircle className="w-20 h-20 text-green-600 dark:text-green-400 mx-auto mb-6" />
        <h2 className="text-3xl font-bold text-green-800 dark:text-green-300 mb-3">
          {isParent ? "Added! 🎉" : "Request Sent! 🎉"}
        </h2>
        <p className="text-green-700 dark:text-green-400 text-lg mb-6">
          {isParent
            ? isAudiobook
              ? "Audiobook request logged — don't forget to upload the file."
              : "Downloading now. Check the dashboard for progress."
            : isAudiobook
              ? "A parent will find the audiobook for you soon!"
              : "A parent will review your request soon."}
        </p>
        {isAudiobook && (
          <button
            onClick={() => { setSubmitted(false); resetAll(); }}
            className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white font-medium px-5 py-2.5 rounded-xl transition-colors"
          >
            <Book className="w-4 h-4" />
            Request another book
          </button>
        )}
      </motion.div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-8 transition-colors"
      >
        <h1
          className={`text-4xl font-bold mb-2 text-center ${
            profile === "yoto"
              ? "bg-gradient-to-r from-yellow-500 to-orange-600 bg-clip-text text-transparent"
              : "bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent"
          }`}
        >
          {isParent ? "➕ Add a Request" : profile === "yoto" ? "📻 Request for Yoto" : "🎧 Request for iPod"}
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
          {isParent
            ? "Add music or an audiobook directly to the queue."
            : `Hi ${user.display_name || user.username}! What do you want to listen to?`}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile picker — parents only */}
          {isParent && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Request for
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedProfile("yoto")}
                  className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all ${
                    selectedProfile === "yoto"
                      ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  📻 Yoto
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedProfile("ipod")}
                  className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all ${
                    selectedProfile === "ipod"
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  🎧 iPod
                </button>
              </div>
            </div>
          )}

          {/* Type: Music / Audiobook */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleTypeChange("music")}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                trackType === "music"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              <Music className="w-5 h-5" />
              Music
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("audiobook")}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                trackType === "audiobook"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              <Book className="w-5 h-5" />
              Audiobook
            </button>
          </div>

          {/* Music sub-mode: Search / Paste URL */}
          {trackType === "music" && (
            <div className="flex gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                type="button"
                onClick={() => {
                  setMusicMode("search");
                  resetAll();
                }}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  musicMode === "search"
                    ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                }`}
              >
                <Search className="w-4 h-4" />
                Search
              </button>
              <button
                type="button"
                onClick={() => {
                  setMusicMode("url");
                  resetAll();
                }}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  musicMode === "url"
                    ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                }`}
              >
                <Link className="w-4 h-4" />
                Paste YouTube Link
              </button>
            </div>
          )}

          {/* Music: Search mode */}
          {trackType === "music" && musicMode === "search" && (
            <>
              <SearchInput
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Search for a song or artist..."
                loading={searching}
              />
              <SearchResultList
                results={searchResults}
                onSelect={(r) => {
                  setSelectedTrack(r);
                  setSearchQuery(r.title);
                  setSearchResults([]);
                }}
                renderItem={(r) => (
                  <MusicResultItem result={r} />
                )}
              />
              {selectedTrack && (
                <>
                  <SelectedMusicPreview track={selectedTrack} />
                  {duplicateCount > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg text-sm text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>This song has already been downloaded {duplicateCount} time{duplicateCount !== 1 ? "s" : ""}. You can still add it again if you'd like.</span>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* Music: URL paste mode */}
          {trackType === "music" && musicMode === "url" && (
            <UrlPasteMode
              urlInput={urlInput}
              urlTitle={urlTitle}
              urlPreview={urlPreview}
              urlLoading={urlLoading}
              urlError={urlError}
              onUrlChange={handleUrlInput}
              onTitleChange={setUrlTitle}
              onClear={() => {
                setUrlInput("");
                setUrlTitle("");
                setUrlPreview(null);
                setUrlError(null);
              }}
            />
          )}

          {/* Audiobook: Search Open Library */}
          {trackType === "audiobook" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Search for an audiobook by title or author
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  A parent will source and upload the audiobook for you.
                </p>
              </div>
              <SearchInput
                value={searchQuery}
                onChange={handleBookSearch}
                placeholder="e.g. Harry Potter, Roald Dahl..."
                loading={searching}
              />
              <SearchResultList
                results={searchResults}
                onSelect={(r) => {
                  setSelectedTrack(r);
                  setSearchQuery(r.title);
                  setSearchResults([]);
                }}
                renderItem={(r) => <BookResultItem result={r} />}
              />
              {selectedTrack && (
                <SelectedBookPreview book={selectedTrack} />
              )}
            </>
          )}

          <motion.button
            type="submit"
            disabled={!canSubmit}
            whileHover={canSubmit ? { scale: 1.02 } : {}}
            whileTap={canSubmit ? { scale: 0.98 } : {}}
            className={`w-full py-4 rounded-lg font-bold text-lg transition-colors ${
              canSubmit
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg"
                : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            }`}
          >
            {trackType === "audiobook" ? "Request Audiobook 📚" : "Send Request 🚀"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

// --- Sub-components ---

function SearchInput({ value, onChange, placeholder, loading }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none transition-colors text-gray-800 dark:bg-gray-700 dark:text-gray-200"
      />
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      )}
    </div>
  );
}

function SearchResultList({ results, onSelect, renderItem }) {
  if (results.length === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-2 border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-lg max-h-72 overflow-y-auto"
    >
      {results.map((result) => (
        <motion.button
          key={result.id}
          type="button"
          onClick={() => onSelect(result)}
          className="w-full px-4 py-3 flex items-center gap-3 text-left border-b last:border-b-0 border-gray-100 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-gray-700 transition-colors"
        >
          {renderItem(result)}
        </motion.button>
      ))}
    </motion.div>
  );
}

function MusicResultItem({ result }) {
  return (
    <>
      {result.thumbnail ? (
        <img
          src={result.thumbnail}
          alt=""
          className="w-12 h-12 rounded object-cover bg-gray-200 dark:bg-gray-600 flex-shrink-0"
        />
      ) : (
        <div className="w-12 h-12 rounded bg-gray-200 dark:bg-gray-600 flex-shrink-0 flex items-center justify-center">
          <Music className="w-5 h-5 text-gray-400" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 dark:text-gray-200 truncate">
          {result.title}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {result.duration}
        </p>
      </div>
    </>
  );
}

function BookResultItem({ result }) {
  return (
    <>
      {result.thumbnail ? (
        <img
          src={result.thumbnail}
          alt=""
          className="w-10 h-14 rounded object-cover bg-gray-200 dark:bg-gray-600 flex-shrink-0"
        />
      ) : (
        <div className="w-10 h-14 rounded bg-gray-200 dark:bg-gray-600 flex-shrink-0 flex items-center justify-center">
          <Book className="w-5 h-5 text-gray-400" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 dark:text-gray-200 truncate">
          {result.title}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {result.author}
          {result.year ? ` · ${result.year}` : ""}
        </p>
      </div>
    </>
  );
}

function SelectedMusicPreview({ track }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-700 rounded-lg p-4"
    >
      <div className="flex items-center gap-4">
        {track.thumbnail && (
          <img
            src={track.thumbnail}
            alt=""
            className="w-16 h-16 rounded-lg object-cover"
          />
        )}
        <div>
          <h3 className="font-bold text-gray-800 dark:text-gray-200">
            {track.title}
          </h3>
          {track.duration && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {track.duration}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function SelectedBookPreview({ book }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-lg p-4"
    >
      <div className="flex items-center gap-4">
        {book.thumbnail && (
          <img
            src={book.thumbnail}
            alt=""
            className="w-12 h-16 rounded object-cover"
          />
        )}
        <div>
          <h3 className="font-bold text-gray-800 dark:text-gray-200">
            {book.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            by {book.author}
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            📬 Parent will upload this for you
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function UrlPasteMode({
  urlInput,
  urlTitle,
  urlPreview,
  urlLoading,
  urlError,
  onUrlChange,
  onTitleChange,
  onClear,
}) {
  const isValid = isYouTubeUrl(urlInput);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          YouTube link
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          Paste a YouTube video or playlist URL — useful when search doesn't
          find the right version.
        </p>
        <div className="relative">
          <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="url"
            value={urlInput}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full pl-10 pr-10 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none transition-colors text-gray-800 dark:bg-gray-700 dark:text-gray-200"
          />
          {urlInput && (
            <button
              type="button"
              onClick={onClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {urlLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
        {urlError && (
          <p className="text-sm text-red-500 dark:text-red-400 mt-1.5">{urlError}</p>
        )}
      </div>

      <AnimatePresence>
        {isValid && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {urlPreview?.thumbnail && (
              <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <img
                  src={urlPreview.thumbnail}
                  alt=""
                  className="w-20 h-14 rounded object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Video found ✓
                  </p>
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Song title (edit if needed)
              </label>
              <input
                type="text"
                value={urlTitle}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="Enter the song name..."
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none transition-colors text-gray-800 dark:bg-gray-700 dark:text-gray-200"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
