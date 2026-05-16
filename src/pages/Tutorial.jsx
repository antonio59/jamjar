import { motion } from "framer-motion";
import {
  BookOpen,
  Radio,
  Headphones,
  CheckCircle,
  Music,
  Link,
  Search,
  Upload,
  FolderOpen,
  Tag,
  Layers,
  ListMusic,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { Link as RouterLink } from "react-router-dom";

function Step({ number, color, children }) {
  return (
    <li className="flex gap-2 text-sm text-gray-700 dark:text-gray-300">
      <span
        className={`${color} text-white rounded-full w-5 h-5 flex items-center justify-center font-bold flex-shrink-0 text-xs mt-0.5`}
      >
        {number}
      </span>
      {children}
    </li>
  );
}

function Tip({ icon: Icon, color, children }) {
  return (
    <div className={`mt-4 rounded-lg p-3 flex items-start gap-2 ${color}`}>
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <p className="text-xs">{children}</p>
    </div>
  );
}

function SectionCard({ delay = 0, className = "", children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 transition-colors ${className}`}
    >
      {children}
    </motion.div>
  );
}

export default function Tutorial() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-4"
      >
        <BookOpen className="w-16 h-16 text-purple-600 mx-auto mb-4" />
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          How It Works 📚
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          How to request music and audiobooks for your device
        </p>
      </motion.div>

      {/* Requesting Music */}
      <SectionCard delay={0.05}>
        <div className="flex items-center gap-3 mb-5">
          <Music className="w-7 h-7 text-purple-500" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Requesting Music 🎵
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-700">
            <div className="flex items-center gap-2 mb-3">
              <Search className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-purple-800 dark:text-purple-300">
                Option 1 — Search
              </h3>
            </div>
            <ol className="space-y-2">
              {[
                "Go to the Home page and choose Music",
                'Make sure "Search" tab is selected',
                "Type the song name or artist",
                "Click the result you want",
                'Press "Send Request 🚀"',
              ].map((step, i) => (
                <Step key={i} number={i + 1} color="bg-purple-600">
                  {step}
                </Step>
              ))}
            </ol>
          </div>

          <div className="bg-pink-50 dark:bg-pink-900/20 rounded-xl p-4 border border-pink-200 dark:border-pink-700">
            <div className="flex items-center gap-2 mb-3">
              <Link className="w-5 h-5 text-pink-600" />
              <h3 className="font-bold text-pink-800 dark:text-pink-300">
                Option 2 — Paste YouTube Link
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Use this when search doesn't find the right version.
            </p>
            <ol className="space-y-2">
              {[
                "Find the video on YouTube",
                "Copy the link from the address bar",
                'On the Home page, choose "Paste YouTube Link" tab',
                "Paste the link",
                "Check or edit the song title",
                'Press "Send Request 🚀"',
              ].map((step, i) => (
                <Step key={i} number={i + 1} color="bg-pink-600">
                  {step}
                </Step>
              ))}
            </ol>
          </div>
        </div>
      </SectionCard>

      {/* Requesting Audiobooks */}
      <SectionCard delay={0.1}>
        <div className="flex items-center gap-3 mb-5">
          <BookOpen className="w-7 h-7 text-blue-500" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Requesting Audiobooks 📖
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm">
              For kids:
            </h3>
            {[
              { step: "Choose Audiobook on the Home page", desc: "Select Audiobook instead of Music" },
              { step: "Search for a book", desc: "Type the title or author name" },
              { step: "Pick the right book", desc: "Tap it to select it" },
              { step: "Press Request Audiobook", desc: "Your request goes to a parent" },
            ].map((item, i) => (
              <div key={i} className="flex gap-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold flex-shrink-0 text-xs">
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium text-sm text-gray-800 dark:text-gray-200">{item.step}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm">
              For parents:
            </h3>
            {[
              { step: "Review the request", desc: "Audiobook requests show a blue 📖 badge", icon: <BookOpen className="w-4 h-4 text-blue-500" /> },
              { step: "Approve to acknowledge", desc: "Marks as acknowledged — no auto-download", icon: <CheckCircle className="w-4 h-4 text-green-500" /> },
              { step: "Source the audiobook", desc: "Download from Librivox, Audible, etc.", icon: <Search className="w-4 h-4 text-purple-500" /> },
              { step: "Upload the file", desc: "Add it to the child's device manually", icon: <Upload className="w-4 h-4 text-orange-500" /> },
            ].map((item, i) => (
              <div key={i} className="flex gap-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
                <div className="flex-shrink-0 mt-0.5">{item.icon}</div>
                <div>
                  <p className="font-medium text-sm text-gray-800 dark:text-gray-200">{item.step}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* ── YOTO GUIDE ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl p-6 border-2 border-yellow-200 dark:border-yellow-700 space-y-6"
      >
        <div className="flex items-center gap-3">
          <Radio className="w-7 h-7 text-orange-500" />
          <h2 className="text-xl font-bold text-orange-700 dark:text-orange-400">
            Yoto Player Guide 📻
          </h2>
        </div>

        {/* Basic steps */}
        <div>
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm mb-3 uppercase tracking-wide">
            Getting a song onto your Yoto card
          </h3>
          <div className="space-y-3">
            {[
              { title: "Request approved", desc: "Wait for a parent to approve. The download starts automatically for music." },
              { title: "Preview the track", desc: "Use the play button in your request history to check it sounds right before downloading." },
              { title: "Download the file", desc: "Once completed, tap Download in your request history to save the MP3 to your computer." },
              { title: "Go to the Yoto website or app", desc: "You can load cards via the Yoto app on your phone/tablet, or via the Yoto website on a computer — both work!" },
              { title: "Upload the MP3", desc: "Select your blank card, tap Add Audio, choose the file you downloaded, wait for it to upload, then press Save." },
              { title: "Insert the card", desc: "Put the card in your Yoto Player and enjoy!" },
            ].map((step, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="bg-orange-600 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold flex-shrink-0 text-sm">
                    {i + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm mb-0.5">{step.title}</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{step.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Two upload methods */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-orange-300 dark:border-orange-600 shadow-sm">
              <p className="font-bold text-sm text-orange-700 dark:text-orange-400 mb-2">📱 Via the Yoto App</p>
              <ol className="space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
                <li className="flex gap-1.5"><span className="font-bold text-orange-500">1.</span> Open the Yoto app on your phone or tablet</li>
                <li className="flex gap-1.5"><span className="font-bold text-orange-500">2.</span> Go to <strong>Make Your Own</strong></li>
                <li className="flex gap-1.5"><span className="font-bold text-orange-500">3.</span> Select your blank card</li>
                <li className="flex gap-1.5"><span className="font-bold text-orange-500">4.</span> Tap <strong>Add Audio</strong> and choose your downloaded MP3</li>
                <li className="flex gap-1.5"><span className="font-bold text-orange-500">5.</span> Save and enjoy!</li>
              </ol>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-yellow-300 dark:border-yellow-600 shadow-sm">
              <p className="font-bold text-sm text-yellow-700 dark:text-yellow-400 mb-2">💻 Via the Yoto Website</p>
              <ol className="space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
                <li className="flex gap-1.5"><span className="font-bold text-yellow-600">1.</span> Connect your Yoto Player to your computer with a <strong>USB cable</strong></li>
                <li className="flex gap-1.5"><span className="font-bold text-yellow-600">2.</span> Go to{" "}
                  <a
                    href="https://uk.yotoplay.com/make-your-own"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-yellow-700 dark:text-yellow-400 font-semibold break-all"
                  >
                    uk.yotoplay.com/make-your-own
                  </a>
                </li>
                <li className="flex gap-1.5"><span className="font-bold text-yellow-600">3.</span> Log in to your Yoto account if asked</li>
                <li className="flex gap-1.5"><span className="font-bold text-yellow-600">4.</span> Select your blank card and tap <strong>Add Audio</strong></li>
                <li className="flex gap-1.5"><span className="font-bold text-yellow-600">5.</span> Upload your MP3 file and save</li>
              </ol>
            </div>
          </div>

          <Tip icon={AlertCircle} color="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
            <strong>Website method:</strong> Your Yoto Player must be plugged into your computer via USB cable before visiting the website. Make sure you're logged in to your Yoto account first.
          </Tip>
        </div>

        {/* Card naming */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">
              Naming your card so you can always find it
            </h3>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            A good card name tells you exactly what's on it the moment you pick it up.
            In the Yoto app, tap the card → <strong>Edit</strong> to set the name, description, and image.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-700">
              <p className="text-xs font-bold text-green-700 dark:text-green-400 mb-2">✅ Good card names</p>
              <ul className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
                <li>🎵 <strong>Pop Favourites</strong></li>
                <li>🌙 <strong>Bedtime Songs</strong></li>
                <li>🚗 <strong>Car Trip Mix</strong></li>
                <li>🎂 <strong>Party Playlist</strong></li>
                <li>📚 <strong>Harry Potter Stories</strong></li>
              </ul>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-700">
              <p className="text-xs font-bold text-red-700 dark:text-red-400 mb-2">❌ Confusing names to avoid</p>
              <ul className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
                <li>Card 1</li>
                <li>Music</li>
                <li>My songs</li>
                <li>New card</li>
                <li>asfdjk</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">
              Writing a great card description
            </h3>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            The description appears under the card name in the Yoto app. Use it to list what's on the card
            so you know exactly which one to grab.
          </p>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-orange-200 dark:border-orange-700 shadow-sm">
            <p className="text-xs font-bold text-orange-700 dark:text-orange-400 mb-1">Example description for a "Pop Favourites" card:</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 italic leading-relaxed">
              "Anti-Hero · Flowers · As It Was · Bad Guy · Watermelon Sugar · Levitating · drivers license · good 4 u — Added Jan 2025"
            </p>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            💡 Add the month and year so you remember when you made it, and know when it might need refreshing!
          </p>
        </div>

        {/* Organisation strategy */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">
              Keeping your card collection organised
            </h3>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            One theme per card makes it much easier to find what you're in the mood for.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { emoji: "🎭", title: "By mood", desc: "Happy songs, chill songs, dance songs, bedtime songs" },
              { emoji: "🎤", title: "By artist", desc: "One card per favourite artist or band" },
              { emoji: "📅", title: "By season", desc: "Christmas songs, summer playlist, birthday mix" },
            ].map((card) => (
              <div key={card.title} className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 text-center border border-orange-200 dark:border-orange-800">
                <div className="text-2xl mb-1">{card.emoji}</div>
                <p className="font-bold text-sm text-gray-800 dark:text-gray-200">{card.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{card.desc}</p>
              </div>
            ))}
          </div>
          <Tip icon={CheckCircle} color="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
            You can reuse the same blank Yoto card by overwriting it — but once you do, the old songs are gone.
            Give important cards a sticky label on the back so you don't accidentally overwrite them!
          </Tip>
        </div>
      </motion.div>

      {/* ── IPOD GUIDE ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-700 space-y-6"
      >
        <div className="flex items-center gap-3">
          <Headphones className="w-7 h-7 text-blue-500" />
          <h2 className="text-xl font-bold text-blue-700 dark:text-blue-400">
            iPod Guide 🎧
          </h2>
        </div>

        {/* Basic steps */}
        <div>
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm mb-3 uppercase tracking-wide">
            Getting a song onto your iPod
          </h3>
          <div className="space-y-3">
            {[
              { title: "Request approved", desc: "Wait for a parent to approve. The file downloads automatically for music." },
              { title: "Preview the track", desc: "Use the play button in your request history to check it sounds right before downloading." },
              { title: "Download the file", desc: "Tap Download in your request history to save the MP3 to your Downloads folder." },
              { title: "Open Finder (Mac) or iTunes (Windows)", desc: "Connect your iPod with the cable and wait for it to appear in the sidebar." },
              { title: "Drag the file in", desc: "On Mac: drag the MP3 to Music → your iPod's library. On Windows: drag into iTunes library." },
              { title: "Sync the iPod", desc: "Click the sync button, wait for it to finish, then safely eject." },
            ].map((step, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-500 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold flex-shrink-0 text-sm">
                    {i + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm mb-0.5">{step.title}</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{step.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Folder & file organisation */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FolderOpen className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">
              Keeping your music folder tidy
            </h3>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            Before you drag files into iTunes/Finder, organise them in a <strong>Music</strong> folder on your
            computer so you can always find the originals.
          </p>

          {/* Folder structure visual */}
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-blue-200 dark:border-blue-800 font-mono text-xs mb-3">
            <p className="text-gray-400 dark:text-gray-500 mb-2">📁 Recommended folder structure:</p>
            <div className="space-y-0.5 text-gray-700 dark:text-gray-300">
              <p>📁 <strong>Isabella's Music</strong></p>
              <p className="pl-4">📁 <strong>Pop Favourites</strong></p>
              <p className="pl-8 text-gray-500">🎵 Anti-Hero.mp3</p>
              <p className="pl-8 text-gray-500">🎵 Flowers.mp3</p>
              <p className="pl-8 text-gray-500">🎵 As It Was.mp3</p>
              <p className="pl-4">📁 <strong>Dance &amp; Party</strong></p>
              <p className="pl-8 text-gray-500">🎵 Levitating.mp3</p>
              <p className="pl-8 text-gray-500">🎵 Watermelon Sugar.mp3</p>
              <p className="pl-4">📁 <strong>Chill &amp; Bedtime</strong></p>
              <p className="pl-8 text-gray-500">🎵 drivers license.mp3</p>
              <p className="pl-4">📁 <strong>Audiobooks</strong></p>
              <p className="pl-8 text-gray-500">📖 Harry Potter Ch1-5.mp3</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-700">
              <p className="text-xs font-bold text-green-700 dark:text-green-400 mb-2">✅ Good file names</p>
              <ul className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
                <li>Anti-Hero.mp3</li>
                <li>Watermelon Sugar.mp3</li>
                <li>Harry Potter Ch1.mp3</li>
              </ul>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-700">
              <p className="text-xs font-bold text-red-700 dark:text-red-400 mb-2">❌ Confusing names to avoid</p>
              <ul className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
                <li>Anti_Hero_Official_Lyric_Video.mp3</li>
                <li>track001.mp3</li>
                <li>download (1).mp3</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Playlists */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ListMusic className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">
              Creating playlists in iTunes / Music app
            </h3>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            Playlists let you group songs without moving any files. A song can appear in multiple playlists at once.
          </p>
          <div className="space-y-3">
            {[
              {
                title: "Create a playlist",
                desc: 'iTunes/Music app: File → New Playlist (or Cmd+N on Mac). Give it a clear name like "Dance Songs" or "Bedtime".',
              },
              {
                title: "Add songs to it",
                desc: "Drag songs from your library into the playlist on the left sidebar, or right-click a song → Add to Playlist.",
              },
              {
                title: "Put playlists on the iPod",
                desc: "When you sync, make sure the playlist is ticked in the Music tab under your iPod settings.",
              },
              {
                title: "Use Smart Playlists (advanced)",
                desc: 'File → New Smart Playlist — e.g. "All songs added this year" or "Songs under 3 minutes". Updates automatically!',
              },
            ].map((item, i) => (
              <div key={i} className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-100 dark:border-blue-800">
                <p className="font-bold text-sm text-gray-800 dark:text-gray-200 mb-0.5">
                  {i + 1}. {item.title}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
          <Tip icon={CheckCircle} color="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
            On Mac use Finder to manage your iPod · On Windows use iTunes. Always eject the iPod safely
            (right-click → Eject) before unplugging to avoid losing music.
          </Tip>
          <Tip icon={AlertCircle} color="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
            Keep the original MP3 files in your "Isabella's Music" folder as a backup. If the iPod ever
            needs resetting, you can re-add everything from there without re-downloading.
          </Tip>
        </div>
      </motion.div>

      <div className="text-center mt-4">
        <RouterLink
          to="/"
          className="inline-block bg-purple-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-purple-700 transition-colors"
        >
          Start Requesting →
        </RouterLink>
      </div>
    </div>
  );
}
