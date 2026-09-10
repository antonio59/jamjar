import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Sparkles, Check, X, ListChecks } from "lucide-react";
import { Button, EmptyState, Badge } from "../ui";
import RequestRow from "./RequestRow";
import QuickApproveDrawer from "./QuickApproveDrawer";

export default function TriageView({
  pending,
  userRole,
  sessionId,
  onApprove,
  onReject,
  onDelete,
  onShowUploadGuide,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState(new Set());

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(pending.map((r) => r.id)));
  const clearSelection = () => setSelected(new Set());

  const handleBulkApprove = async () => {
    const ids = [...selected];
    clearSelection();
    for (const id of ids) await onApprove(id);
  };

  const handleBulkReject = async () => {
    const ids = [...selected];
    clearSelection();
    for (const id of ids) await onReject(id, "Not appropriate");
  };

  if (pending.length === 0) {
    return (
      <EmptyState
        icon={<Sparkles className="w-5 h-5" />}
        title="No pending requests"
        description="Nothing in the queue. New requests from your kids will appear here."
      />
    );
  }

  const allSelected = selected.size === pending.length;
  const someSelected = selected.size > 0;

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={allSelected ? clearSelection : selectAll}
            className="inline-flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <input
              type="checkbox"
              checked={allSelected}
              readOnly
              className="w-3.5 h-3.5 rounded border-[var(--border-default)] text-[var(--brand)] focus:ring-[var(--brand)]"
            />
            {allSelected ? "Clear" : "Select all"}
          </button>
          {someSelected && (
            <Badge tone="brand" size="xs">
              {selected.size} selected
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {someSelected ? (
            <>
              <Button
                size="sm"
                variant="success"
                onClick={handleBulkApprove}
                iconLeft={<Check className="w-3.5 h-3.5" />}
              >
                Approve {selected.size}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleBulkReject}
                iconLeft={<X className="w-3.5 h-3.5" />}
              >
                Reject {selected.size}
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="subtle"
              onClick={() => setDrawerOpen(true)}
              iconLeft={<ListChecks className="w-3.5 h-3.5" />}
            >
              Review mode
            </Button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {pending.map((req) => (
            <RequestRow
              key={req.id}
              request={req}
              userRole={userRole}
              sessionId={sessionId}
              selectable
              selected={selected.has(req.id)}
              onToggleSelect={toggleSelect}
              onApprove={onApprove}
              onReject={onReject}
              onDelete={onDelete}
              onShowUploadGuide={onShowUploadGuide}
            />
          ))}
        </AnimatePresence>
      </div>

      <QuickApproveDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        requests={pending}
        onApprove={onApprove}
        onReject={onReject}
      />
    </div>
  );
}
