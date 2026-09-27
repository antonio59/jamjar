import { Drawer, Button, Badge } from "../ui";
import { ExternalLink, BookOpen, Upload, CheckCircle } from "lucide-react";

const STEPS = {
  yoto: [
    { title: "Find or rip the audiobook", body: "Use your preferred source — Audible, library, CD rip, etc. You'll need MP3 or M4B files." },
    { title: "Open Yoto Studio", body: "Sign in at my.yotoplay.com on a computer (uploading isn't available in the app)." },
    { title: "Create a new card", body: "Click + Create Playlist → upload the audio files one chapter at a time." },
    { title: "Add cover art and title", body: "Match the JamJar request so it stays linked. Use the original cover where possible." },
    { title: "Link to a physical card or QR", body: "Print or attach to a card so your child can find it." },
    { title: "Mark uploaded in JamJar", body: "Tap \"Mark uploaded\" on the request so it's removed from the Needs Upload list." },
  ],
  ipod: [
    { title: "Source the audiobook", body: "Buy from Audible / iTunes, rip a CD, or grab an MP3/M4A/M4B file." },
    { title: "Plug in the iPod", body: "It runs Rockbox now, so it shows up as a normal USB drive called IZZY (File Explorer on Windows, Finder sidebar on a Mac). Don't use iTunes, Finder sync or Apple Devices." },
    { title: "Make a book folder", body: "Inside Audiobooks, create a folder named \"Author - Title\" and drag the files in (numbered names keep chapters in order). Add the cover as cover.jpg." },
    { title: "Eject, then unplug", body: "Eject IZZY first. Rockbox remembers the listening position and updates its database on the next start-up." },
    { title: "Mark uploaded in JamJar", body: "Tap \"Mark uploaded\" so this request leaves the queue." },
  ],
};

export default function AudiobookUploadGuide({ open, onClose, request, onMarkUploaded }) {
  if (!request) {
    return (
      <Drawer open={open} onClose={onClose} title="Upload guide" width="md">
        <p className="text-sm text-[var(--text-muted)]">No request selected.</p>
      </Drawer>
    );
  }
  const steps = STEPS[request.profile] || STEPS.yoto;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="How to upload this audiobook"
      description={`${request.profile === "yoto" ? "📻 Yoto" : "🎧 iPod"} · ${request.title}`}
      width="md"
      footer={
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="success"
            iconLeft={<CheckCircle className="w-4 h-4" />}
            onClick={() => {
              onMarkUploaded(request.id);
              onClose();
            }}
          >
            Mark uploaded
          </Button>
        </div>
      }
    >
      <div className="flex items-start gap-3 p-3 mb-4 bg-[var(--info-soft)] border border-[var(--info-border)] rounded-[var(--r-md)]">
        <Upload className="w-4 h-4 text-[var(--info)] flex-shrink-0 mt-0.5" />
        <p className="text-sm text-[var(--text-secondary)]">
          Audiobooks can't be auto-downloaded — copyright and length make this a
          manual flow. Follow the steps below, then come back and mark it
          uploaded.
        </p>
      </div>

      <ol className="space-y-3">
        {steps.map((step, idx) => (
          <li key={idx} className="flex gap-3">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center text-xs font-semibold">
              {idx + 1}
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {step.title}
              </p>
              <p className="text-sm text-[var(--text-muted)] mt-0.5">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      {request.profile === "yoto" && (
        <a
          href="https://my.yotoplay.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 mt-4 text-sm text-[var(--brand)] hover:underline"
        >
          Open Yoto Studio <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}

      <div className="mt-5 pt-4 border-t border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-4 h-4 text-[var(--text-muted)]" />
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
            Request details
          </p>
        </div>
        <div className="flex items-center flex-wrap gap-2">
          <Badge tone={request.profile === "yoto" ? "yoto" : "ipod"} size="xs">
            {request.profile === "yoto" ? "📻 Yoto" : "🎧 iPod"}
          </Badge>
          <Badge tone="info" size="xs">
            Audiobook
          </Badge>
          {request.duration && (
            <Badge tone="neutral" size="xs">
              {request.duration}
            </Badge>
          )}
        </div>
      </div>
    </Drawer>
  );
}
