import { UploadCloud } from "lucide-react";
import { Card, EmptyState } from "../ui";
import RequestRow from "./RequestRow";

export default function NeedsUploadView({
  audiobooks,
  userRole,
  onMarkUploaded,
  onDelete,
  onShowUploadGuide,
}) {
  if (audiobooks.length === 0) {
    return (
      <EmptyState
        icon={<UploadCloud className="w-5 h-5" />}
        title="No audiobooks waiting on upload"
        description="When you approve an audiobook request it lands here until you upload the file manually."
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-[var(--info-border)] bg-[var(--info-soft)]">
        <div className="flex items-start gap-3">
          <UploadCloud className="w-4 h-4 text-[var(--info)] flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {audiobooks.length} audiobook{audiobooks.length !== 1 ? "s" : ""} waiting on upload
            </p>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              Audiobooks aren't auto-downloaded. Open the upload guide on any
              row for step-by-step instructions, then mark it uploaded when done.
            </p>
          </div>
        </div>
      </Card>

      <div className="space-y-2">
        {audiobooks.map((r) => (
          <RequestRow
            key={r.id}
            request={r}
            userRole={userRole}
            onMarkUploaded={onMarkUploaded}
            onDelete={onDelete}
            onShowUploadGuide={onShowUploadGuide}
          />
        ))}
      </div>
    </div>
  );
}
