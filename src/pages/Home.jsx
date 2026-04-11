import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useStore from "../store/useStore";
import { Music, Book, CheckCircle, Search } from "lucide-react";

export default function Home() {
  const { user, createRequest, search, showToast } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [trackType, setTrackType] = useState("music");
  const [submitted, setSubmitted] = useState(false);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const results = await search(query, trackType);
    setSearchResults(results);
    setSearching(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTrack) return;

    await createRequest({
      profile: user.profile,
      title: selectedTrack.title,
      url: selectedTrack.url,
      type: trackType,
      searchQuery,
      thumbnail: selectedTrack.thumbnail,
      duration: selectedTrack.duration,
    });

    showToast("Request sent! A parent will review it soon 🎉", "success");
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setSelectedTrack(null);
      setSearchQuery("");
      setSearchResults([]);
    }, 3000);
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-green-100 dark:bg-green-900/30 border-2 border-green-500 dark:border-green-700 rounded-2xl p-12 text-center max-w-md mx-auto mt-20"
      >
        <CheckCircle className="w-20 h-20 text-green-600 dark:text-green-400 mx-auto mb-6" />
        <h2 className="text-3xl font-bold text-green-800 dark:text-green-300 mb-3">
          Request Sent! 🎉
        </h2>
        <p className="text-green-700 dark:text-green-400 text-lg">
          A parent will review your request soon.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 transition-colors"
      >
        <h1
          className={`text-4xl font-bold mb-2 text-center ${
            user.profile === "yoto"
              ? "bg-gradient-to-r from-yellow-500 to-orange-600 bg-clip-text text-transparent"
              : "bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent"
          }`}
        >
          {user.profile === "yoto"
            ? "📻 Request Music for Yoto"
            : "🎧 Request Music for iPod"}
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
          Hi {user.display_name || user.username}! What do you want to listen
          to?
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setTrackType("music")}
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
              onClick={() => setTrackType("audiobook")}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search for{" "}
              {trackType === "music" ? "a song or artist" : "an audiobook"}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Type to search..."
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none transition-colors text-gray-800 dark:bg-gray-700 dark:text-gray-200"
              />
            </div>
          </div>

          {searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-2 border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-lg max-h-64 overflow-y-auto"
            >
              {searchResults.map((result) => (
                <motion.button
                  key={result.id}
                  type="button"
                  whileHover={{ backgroundColor: "#f3e8ff" }}
                  onClick={() => {
                    setSelectedTrack(result);
                    setSearchQuery(result.title);
                    setSearchResults([]);
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 text-left border-b last:border-b-0 border-gray-100 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <img
                    src={result.thumbnail}
                    alt=""
                    className="w-12 h-12 rounded object-cover bg-gray-200 dark:bg-gray-600"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 dark:text-gray-200">
                      {result.title}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {result.duration}
                    </p>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}

          {selectedTrack && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-700 rounded-lg p-4"
            >
              <div className="flex items-center gap-4">
                <img
                  src={selectedTrack.thumbnail}
                  alt=""
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-gray-200">
                    {selectedTrack.title}
                  </h3>
                  {selectedTrack.duration && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedTrack.duration}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          <motion.button
            type="submit"
            disabled={!selectedTrack}
            whileHover={selectedTrack ? { scale: 1.02 } : {}}
            whileTap={selectedTrack ? { scale: 0.98 } : {}}
            className={`w-full py-4 rounded-lg font-bold text-lg transition-colors ${
              selectedTrack
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg"
                : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            }`}
          >
            Send Request 🚀
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
