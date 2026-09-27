import { motion } from "framer-motion";
import {
  BookOpen,
  Radio,
  Headphones,
  Music,
  Link as LinkIcon,
  Search,
  Upload,
  Tag,
  Layers,
  ListMusic,
  Sparkles,
  AlertCircle,
  ExternalLink,
  Power,
  Bookmark,
  BatteryCharging,
  Laptop,
  Film,
  Download,
} from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import { Card, SectionHeader, Button, Badge, cx } from "../components/ui";

function StepList({ items, accent = "var(--brand)" }) {
  return (
    <ol className="space-y-2">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3">
          <span
            aria-hidden
            className="flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-semibold mt-0.5"
            style={{
              background: `color-mix(in srgb, ${accent} 14%, transparent)`,
              color: accent,
            }}
          >
            {i + 1}
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            {typeof it === "string" ? (
              <p className="text-sm text-[var(--text-secondary)] leading-snug">{it}</p>
            ) : (
              <>
                <p className="text-sm font-medium text-[var(--text-primary)] leading-snug">
                  {it.title}
                </p>
                {it.desc && (
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {it.desc}
                  </p>
                )}
              </>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

function Callout({ icon: Icon = AlertCircle, tone = "info", children }) {
  const toneCls = {
    info: "bg-[var(--info-soft)] border-[var(--info-border)] text-[var(--text-secondary)]",
    warning: "bg-[var(--warning-soft)] border-[var(--warning-border)] text-[var(--text-secondary)]",
    brand: "bg-[var(--brand-soft)] border-[var(--brand-soft-strong)] text-[var(--text-secondary)]",
  }[tone];
  const iconColor = {
    info: "var(--info)",
    warning: "var(--warning)",
    brand: "var(--brand)",
  }[tone];

  return (
    <div className={cx("flex items-start gap-2.5 p-3 mt-4 border rounded-[var(--r-md)]", toneCls)}>
      <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: iconColor }} />
      <p className="text-sm leading-snug">{children}</p>
    </div>
  );
}

export default function Tutorial() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <header>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
            How JamJar works
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1 max-w-xl">
            Request songs, videos and audiobooks for your Yoto card or iPod. Here's the
            end-to-end flow plus device-specific guides.
          </p>
        </motion.div>
      </header>

      {/* Quick start */}
      <Card padding="md">
        <SectionHeader
          title="Quick start"
          description="Three steps that work for every request type."
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Sparkles, title: "1. Request", body: "Pick a device (parents), choose music, video or audiobook, find your content." },
            { icon: ListMusic, title: "2. Review", body: "Parents approve or reject from the Triage tab on the dashboard." },
            { icon: Upload, title: "3. Enjoy", body: "Music and videos auto-download; audiobooks need a manual upload to the device." },
          ].map((s) => (
            <div key={s.title} className="flex flex-col items-start gap-2 p-3 bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-[var(--r-lg)]">
              <s.icon className="w-5 h-5 text-[var(--brand)]" />
              <p className="font-semibold text-[var(--text-primary)] text-sm">{s.title}</p>
              <p className="text-xs text-[var(--text-muted)] leading-snug">{s.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Button as={RouterLink} to="/" variant="primary" iconLeft={<Sparkles className="w-4 h-4" />}>
            Start a new request
          </Button>
        </div>
      </Card>

      {/* Music */}
      <Card padding="md">
        <SectionHeader
          title="Requesting music"
          description="Two ways to find a track — search or paste."
          action={<Badge tone="brand" size="sm"><Music className="w-3 h-3" /> Auto-downloads</Badge>}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-[var(--border-subtle)] rounded-[var(--r-lg)]">
            <div className="flex items-center gap-2 mb-3 text-[var(--brand)]">
              <Search className="w-4 h-4" />
              <h3 className="font-semibold text-sm">Option 1 — Search</h3>
            </div>
            <StepList
              items={[
                "Open Request and choose Music",
                'Keep the "Search" mode selected',
                "Type artist + song for the best match",
                "Tap the result you want",
                "Continue, review, send",
              ]}
            />
          </div>
          <div className="p-4 border border-[var(--border-subtle)] rounded-[var(--r-lg)]">
            <div className="flex items-center gap-2 mb-3 text-[var(--brand)]">
              <LinkIcon className="w-4 h-4" />
              <h3 className="font-semibold text-sm">Option 2 — Paste YouTube link</h3>
            </div>
            <p className="text-xs text-[var(--text-muted)] mb-2">
              Use when search misses the exact version you want.
            </p>
            <StepList
              items={[
                "Find the video on YouTube and copy the URL",
                'In Request, switch to "Paste YouTube link"',
                "Paste — JamJar will preview the video",
                "Edit the title so the library entry is clean",
                "Continue, review, send",
              ]}
            />
          </div>
        </div>

        <Callout tone="info" icon={Film}>
          <strong>Videos work the same way.</strong> Pick the iPod on step 1 and a Video
          option appears next to Music — same search-or-paste flow. JamJar downloads
          it and converts it for the iPod, so it takes a little longer than a song.
        </Callout>
      </Card>

      {/* Audiobooks */}
      <Card padding="md">
        <SectionHeader
          title="Requesting audiobooks"
          description="Audiobooks are sourced and uploaded by a parent — JamJar tracks them so nothing slips through."
          action={<Badge tone="info" size="sm"><BookOpen className="w-3 h-3" /> Manual upload</Badge>}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-[var(--border-subtle)] rounded-[var(--r-lg)]">
            <h3 className="font-semibold text-sm text-[var(--text-primary)] mb-3">For kids</h3>
            <StepList
              items={[
                { title: "Choose Audiobook", desc: "On the Request page, second step." },
                { title: "Search a title or author", desc: "Powered by Open Library — pick the closest match." },
                { title: "Send the request", desc: "It lands in a grown-up's queue." },
              ]}
              accent="var(--info)"
            />
          </div>
          <div className="p-4 border border-[var(--border-subtle)] rounded-[var(--r-lg)]">
            <h3 className="font-semibold text-sm text-[var(--text-primary)] mb-3">For parents</h3>
            <StepList
              items={[
                { title: "Approve in Triage", desc: "Acknowledges the request — no auto-download." },
                { title: "Open Needs Upload tab", desc: "Use the “How to upload” drawer for step-by-step." },
                { title: "Source the audiobook", desc: "Audible, Librivox, library rip — your choice." },
                { title: "Mark uploaded", desc: "Removes it from the upload list once done." },
              ]}
              accent="var(--info)"
            />
          </div>
        </div>
      </Card>

      {/* Yoto */}
      <Card padding="md" className="border-[var(--warning-border)]">
        <SectionHeader
          title="Yoto Player upload guide"
          description="How to get a finished MP3 onto your Yoto card."
          action={<Badge tone="warning" size="sm"><Radio className="w-3 h-3" /> Yoto</Badge>}
        />
        <StepList
          items={[
            { title: "Wait for the download", desc: "Music downloads automatically once a parent approves." },
            { title: "Preview the file", desc: "Use the Preview button in the dashboard to make sure the track is right." },
            { title: "Download the MP3", desc: "Tap Download in the row — saves to your computer." },
            { title: "Open Yoto Studio or the app", desc: "my.yotoplay.com (computer) or the Yoto app (phone/tablet)." },
            { title: "Add audio to a blank card", desc: "Make Your Own → Add Audio → upload the MP3 → Save." },
            { title: "Insert the card", desc: "Put it in the player and it plays straight away." },
          ]}
          accent="var(--warning)"
        />

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 border border-[var(--border-subtle)] rounded-[var(--r-lg)] bg-[var(--surface-2)]">
            <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">📱 Yoto app</p>
            <p className="text-xs text-[var(--text-muted)] leading-snug">
              Open the app → Make Your Own → choose your blank card → Add Audio → pick the MP3 → Save.
            </p>
          </div>
          <div className="p-4 border border-[var(--border-subtle)] rounded-[var(--r-lg)] bg-[var(--surface-2)]">
            <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">💻 Yoto website</p>
            <p className="text-xs text-[var(--text-muted)] leading-snug">
              Plug the player into your computer via USB, then visit{" "}
              <a
                href="https://uk.yotoplay.com/make-your-own"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--brand)] hover:underline inline-flex items-center gap-0.5"
              >
                yotoplay.com/make-your-own <ExternalLink className="w-3 h-3" />
              </a>
              {" "}and follow the same flow.
            </p>
          </div>
        </div>

        <Callout tone="warning">
          <strong>Plug in first.</strong> The website method needs the Yoto Player connected via USB before you visit the site.
        </Callout>

        <div className="mt-5">
          <div className="flex items-center gap-2 mb-2 text-[var(--text-muted)]">
            <Tag className="w-3.5 h-3.5" />
            <p className="text-xs font-semibold uppercase tracking-wide">Naming tips</p>
          </div>
          <p className="text-sm text-[var(--text-secondary)] leading-snug">
            In the Yoto app, tap any card → <strong>Edit</strong> to change its name, description, and image. A name like{" "}
            <em>"Bedtime — 5 Songs"</em> tells you exactly what's on the card without playing it.
          </p>
        </div>
      </Card>

      {/* iPod — Izzy's iPod runs Rockbox (updated 26 Sep 2026) */}
      <Card padding="md" className="border-[var(--info-border)]">
        <SectionHeader
          title="iPod guide (Rockbox)"
          description="Izzy's iPod now runs Rockbox instead of the old Apple software. Here's how to use it and add your own songs, videos and audiobooks."
          action={<Badge tone="info" size="sm"><Headphones className="w-3 h-3" /> iPod</Badge>}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-[var(--border-subtle)] rounded-[var(--r-lg)]">
            <div className="flex items-center gap-2 mb-3 text-[var(--info)]">
              <Power className="w-4 h-4" />
              <h3 className="font-semibold text-sm">On, off and the Hold switch</h3>
            </div>
            <StepList
              items={[
                { title: "Turn on", desc: "Press any button (Select, the middle one, is easiest). It goes straight back to whatever you were listening to." },
                { title: "Turn off", desc: "Hold Play/Pause for a few seconds. First the music stops. Keep holding and the screen turns off." },
                { title: "Auto-off", desc: "If it's paused or stopped for 10 minutes, it turns itself off to save battery." },
                { title: "Hold switch", desc: "Slide Hold on (you'll see orange) to lock the buttons in your pocket. If nothing happens when you press things, check Hold first!" },
              ]}
              accent="var(--info)"
            />
          </div>
          <div className="p-4 border border-[var(--border-subtle)] rounded-[var(--r-lg)]">
            <div className="flex items-center gap-2 mb-3 text-[var(--info)]">
              <Headphones className="w-4 h-4" />
              <h3 className="font-semibold text-sm">The click wheel</h3>
            </div>
            <StepList
              items={[
                { title: "Wheel = move", desc: "Slide your finger round to move up and down lists. On the Now Playing screen, the wheel changes the volume." },
                { title: "Select (middle) = choose", desc: "Opens a folder or plays a song. Hold Select for an extra options menu." },
                { title: "Menu = back", desc: "Takes you back to the main menu. ◀◀ goes back just one step." },
                { title: "Play/Pause", desc: "Pauses and plays. In a list, a quick press jumps back to Now Playing." },
                { title: "▶▶ and ◀◀", desc: "On Now Playing: next / previous track. Hold them to fast-forward or rewind." },
              ]}
              accent="var(--info)"
            />
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center gap-2 mb-2 text-[var(--text-muted)]">
            <ListMusic className="w-3.5 h-3.5" />
            <p className="text-xs font-semibold uppercase tracking-wide">Finding things (main menu)</p>
          </div>
          <p className="text-xs text-[var(--text-muted)] mb-3">
            Main menu, top to bottom: Now Playing (Resume Playback), Shortcuts, Playlists, Database, Files, Recent Bookmarks, Plugins, Settings.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 border border-[var(--border-subtle)] rounded-[var(--r-lg)] bg-[var(--surface-2)]">
              <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">▶️ Now Playing / Resume Playback</p>
              <p className="text-xs text-[var(--text-muted)] leading-snug">
                Top of the main menu. Takes you back to the song or book that's on. After turning the iPod on it carries on from where you stopped
                (the very first time it may say "Nothing to resume" — that's fine).
              </p>
            </div>
            <div className="p-4 border border-[var(--border-subtle)] rounded-[var(--r-lg)] bg-[var(--surface-2)]">
              <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">⭐ Shortcuts</p>
              <p className="text-xs text-[var(--text-muted)] leading-snug">
                Your quick list: <strong>Audiobooks</strong>, <strong>Music</strong>, <strong>PictureFlow</strong>, all your playlists (Pop for Kids, Hits,
                Country &amp; Folk, Hip-Hop, R&amp;B, Gospel &amp; Christian, Jazz, Rock, Reggae, Classical, Soca, Latin, K-Pop) and the sleep timer —{" "}
                <strong>Sleep in 30 minutes</strong>, <strong>Sleep in 60 minutes</strong> or <strong>Sleep timer off</strong>. Pick a playlist and it starts straight away.
              </p>
            </div>
            <div className="p-4 border border-[var(--border-subtle)] rounded-[var(--r-lg)] bg-[var(--surface-2)]">
              <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">🎶 Playlists</p>
              <p className="text-xs text-[var(--text-muted)] leading-snug">
                <strong>Playlists</strong> → pick one (Pop for Kids, Hits For Kids of All Ages, Classical for Kids, Soca for Kids, Latin for Kids, K-Pop for Kids and more) → Select, and it plays the
                whole playlist in order. Want to mix it up? Hold Menu on Now Playing for the Quick Screen: ◀◀ side = Shuffle, ▶▶ side = Repeat.
              </p>
            </div>
            <div className="p-4 border border-[var(--border-subtle)] rounded-[var(--r-lg)] bg-[var(--surface-2)]">
              <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">🎤 Database</p>
              <p className="text-xs text-[var(--text-muted)] leading-snug">
                The easiest way to find things. <strong>Songs</strong> = every song A to Z (no audiobooks) — pick one and it carries on down the list.{" "}
                <strong>Artists</strong> → pick an artist → <strong>[All tracks]</strong> at the top plays all their songs, or pick one album.{" "}
                <strong>Audiobooks</strong> = just the books → pick a book → pick Part 1. There's also Albums, Genres, Recently Added,
                Search (spell a name with the wheel) and More... for the rest. If it ever says "Database is not ready", choose <strong>Initialize Now</strong> and wait a few minutes.
              </p>
            </div>
            <div className="p-4 border border-[var(--border-subtle)] rounded-[var(--r-lg)] bg-[var(--surface-2)]">
              <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">📁 Files</p>
              <p className="text-xs text-[var(--text-muted)] leading-snug">
                The folders on the iPod — music, audiobooks, videos and playlists (no pictures or documents).{" "}
                <strong>Files → Audiobooks</strong> → pick a book → select the first part. <strong>Files → Music</strong> → Artist → Album → pick a song.{" "}
                <strong>Files → Videos</strong> → pick a film to watch it. Songs play the rest of the folder after them.
                (Database → Songs or Artists is usually quicker for music.)
              </p>
            </div>
            <div className="p-4 border border-[var(--border-subtle)] rounded-[var(--r-lg)] bg-[var(--surface-2)]">
              <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">🖼️ PictureFlow (album covers)</p>
              <p className="text-xs text-[var(--text-muted)] leading-snug">
                <strong>Shortcuts → PictureFlow</strong> (or Plugins → Demos → PictureFlow). <strong>Turn the wheel</strong> to flip through the covers,{" "}
                <strong>Select</strong> opens the album's songs, <strong>Select</strong> again plays. Menu leaves. Set up the Database first; the very first
                time it takes a minute or two to collect the covers.
              </p>
            </div>
            <div className="p-4 border border-[var(--border-subtle)] rounded-[var(--r-lg)] bg-[var(--surface-2)]">
              <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">🎮 Games</p>
              <p className="text-xs text-[var(--text-muted)] leading-snug">
                <strong>Plugins → Games</strong>: Brickmania, Jewels, Rockblox (like Tetris) and Sudoku. Press Menu to pause or get out.
                Your music keeps playing while you play.
              </p>
            </div>
            <div className="p-4 border border-[var(--border-subtle)] rounded-[var(--r-lg)] bg-[var(--surface-2)]">
              <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">🔋 Battery and the new look</p>
              <p className="text-xs text-[var(--text-muted)] leading-snug">
                The iPod has a clean white look with big letters and the album cover on Now Playing. The number in the{" "}
                <strong>top right corner</strong> is the battery (%) — charge it when it gets below about 20%.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 p-4 border border-[var(--border-subtle)] rounded-[var(--r-lg)]">
          <div className="flex items-center gap-2 mb-3 text-[var(--info)]">
            <Film className="w-4 h-4" />
            <h3 className="font-semibold text-sm">Watching films & videos</h3>
          </div>
          <StepList
            items={[
              { title: "Find a film", desc: "Files → Videos → pick one → Select. Videos don't appear in Database — Files is the place." },
              { title: "Start menu", desc: "It asks where to begin: Play from beginning, or Resume at where you stopped. Pick one and it plays." },
              { title: "While watching", desc: "Wheel = volume. Play/Pause = pause. Menu opens the film menu — Resume playback carries on, Quit mpegplayer stops." },
              { title: "It remembers your place", desc: "Stop a film halfway and next time it offers to carry on from the same spot — just like audiobooks." },
            ]}
            accent="var(--info)"
          />
          <Callout tone="info">
            Only <strong>.mpg</strong> videos work — the iPod can't play .mp4 or plain YouTube files. Anything
            downloaded through JamJar is already converted, so it's ready to copy over.
          </Callout>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-[var(--border-subtle)] rounded-[var(--r-lg)]">
            <div className="flex items-center gap-2 mb-3 text-[var(--info)]">
              <Bookmark className="w-4 h-4" />
              <h3 className="font-semibold text-sm">Audiobooks & bookmarks</h3>
            </div>
            <StepList
              items={[
                { title: "Find a book", desc: "Database → Audiobooks → pick the book → select the first part (or Shortcuts → Audiobooks)." },
                { title: "It remembers your place", desc: "When you stop a book, the iPod saves a bookmark by itself. Open the same book again and it jumps back to your spot." },
                { title: "Recent Bookmarks", desc: "Recent Bookmarks in the main menu (just under Files) lists the books you've been listening to — pick one to carry on." },
                { title: "Save one yourself", desc: "On Now Playing, hold Select → Bookmarks → Create Bookmark." },
              ]}
              accent="var(--info)"
            />
          </div>
          <div className="p-4 border border-[var(--border-subtle)] rounded-[var(--r-lg)]">
            <div className="flex items-center gap-2 mb-3 text-[var(--info)]">
              <BatteryCharging className="w-4 h-4" />
              <h3 className="font-semibold text-sm">Volume & charging</h3>
            </div>
            <StepList
              items={[
                { title: "Volume", desc: "Turn the wheel on the Now Playing screen. It has a safe maximum, so it can't go ear-splittingly loud." },
                { title: "Charging", desc: "Plug the iPod cable into a USB wall plug or your laptop. A full charge takes a few hours." },
                { title: "Laptop = USB screen", desc: "Plugged into a computer, the iPod shows a USB picture and becomes a drive, so it can't play. To charge and keep listening, hold Menu while you plug it in." },
                { title: "Headphones out = pause", desc: "Pull the headphones out and it pauses by itself." },
              ]}
              accent="var(--info)"
            />
          </div>
        </div>

        <div className="mt-5 p-4 border border-[var(--border-subtle)] rounded-[var(--r-lg)]">
          <div className="flex items-center gap-2 mb-3 text-[var(--info)]">
            <Laptop className="w-4 h-4" />
            <h3 className="font-semibold text-sm">Adding songs, videos & audiobooks (Windows laptop)</h3>
          </div>
          <StepList
            items={[
              { title: "Download from JamJar first", desc: "On the dashboard, find the finished item and tap Download. It lands in your Downloads folder — .mp3 for songs, .mpg for videos." },
              { title: "Plug it in", desc: "The iPod shows a USB picture. Open File Explorer (the yellow folder on the taskbar) → This PC, and you'll see a drive called IZZY. It's just like a USB stick — no iTunes needed." },
              { title: "Songs → Music\\Artist\\Album", desc: "Open Music, then the artist's folder (make a new folder if it's not there), then the album folder. Drag the .mp3 or .m4a files in." },
              { title: "Books → Audiobooks\\Author - Title", desc: "Make a new folder in Audiobooks named like \"R. J. Palacio - Wonder\" and drag all the parts in. Numbered file names keep them in order." },
              { title: "Films → Videos\\", desc: "Make a Videos folder next to Music and Audiobooks if there isn't one, and drag the .mpg files in. To watch: Files → Videos → pick it." },
              { title: "Add the cover", desc: "Save the cover picture into the same folder as a song or book and call it cover.jpg — it shows up on Now Playing and in PictureFlow." },
              { title: "Eject before unplugging", desc: "In File Explorer, right-click IZZY → Eject (or use the Safely Remove Hardware icon by the clock) and wait for the \"safe to remove\" message. Then unplug." },
              { title: "Database updates itself", desc: "New stuff is in Files straight away — including videos. Songs, Artists and Audiobooks in Database catch up by themselves the next time the iPod starts. In a hurry? Settings → General Settings → Database → Update Now." },
            ]}
            accent="var(--info)"
          />
          <Callout tone="info" icon={Download}>
            If Windows pops up <strong>"Do you want to scan and fix IZZY?"</strong>, choose{" "}
            <strong>Continue without scanning</strong> — nothing is broken, Windows is just fussy about the iPod's disk format.
          </Callout>
          <Callout tone="warning">
            <strong>Leave these alone:</strong> don't delete, rename or move the <strong>.rockbox</strong> folder or the hidden{" "}
            <strong>iPod_Control</strong> folder. They're what make the iPod work. And <strong>don't install or use iTunes</strong>{" "}
            (or the Apple Devices app) for this iPod — it would try to "restore" or sync it and wipe your music.
          </Callout>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 border border-[var(--border-subtle)] rounded-[var(--r-lg)] bg-[var(--surface-2)]">
            <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">🧊 If it freezes</p>
            <p className="text-xs text-[var(--text-muted)] leading-snug">
              Slide Hold on and off again. Then press and hold <strong>Menu + Select</strong> together until the screen goes blank
              and it restarts (about 6–10 seconds). It comes back into Rockbox — your music and bookmarks are safe.
            </p>
          </div>
          <div className="p-4 border border-[var(--border-subtle)] rounded-[var(--r-lg)] bg-[var(--surface-2)]">
            <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">🍎 Apple mode (you shouldn't need it)</p>
            <p className="text-xs text-[var(--text-muted)] leading-snug">
              The old Apple software is still there as a backup. Turn the iPod off, turn it on, then straight away slide{" "}
              <strong>Hold on</strong> — the Apple logo stays and the old menus appear. It only has the songs Uncle Antonio loaded,
              not the ones you add yourself, and the old software is what made songs skip. To get back to Rockbox, slide Hold off and hold
              Menu + Select until it restarts.
            </p>
          </div>
        </div>

        <Callout tone="warning">
          <strong>Never click "Restore"</strong> (or "Update") in iTunes, Finder or the Apple Devices app. It wipes everything —
          Rockbox, songs, audiobooks, the lot. If something's not right, ask Uncle Antonio first.
        </Callout>
        <Callout tone="info">
          Got a song or video from JamJar? Tap <strong>Download</strong> in the dashboard, then follow the Windows laptop steps above.
        </Callout>
      </Card>

      {/* Library tips */}
      <Card padding="md">
        <SectionHeader
          title="Library tips"
          description="Keep your dashboard tidy as it grows."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 border border-[var(--border-subtle)] rounded-[var(--r-lg)]">
            <Layers className="w-4 h-4 text-[var(--brand)] mb-2" />
            <p className="text-sm font-semibold text-[var(--text-primary)]">Group by artist</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              The Library tab has a "Group by artist" toggle — handy when a single artist dominates.
            </p>
          </div>
          <div className="p-3 border border-[var(--border-subtle)] rounded-[var(--r-lg)]">
            <Search className="w-4 h-4 text-[var(--brand)] mb-2" />
            <p className="text-sm font-semibold text-[var(--text-primary)]">Use filters</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Filter by status, type, profile, or artist. Multiple filters stack.
            </p>
          </div>
          <div className="p-3 border border-[var(--border-subtle)] rounded-[var(--r-lg)]">
            <AlertCircle className="w-4 h-4 text-[var(--brand)] mb-2" />
            <p className="text-sm font-semibold text-[var(--text-primary)]">Fix broken downloads</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              The Maintenance tab lists failed downloads and offers a one-tap retry.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
