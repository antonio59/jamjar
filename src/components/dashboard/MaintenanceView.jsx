import { useState, useEffect } from "react";
import { Wrench, Shield, RefreshCw, ShieldAlert } from "lucide-react";
import useStore from "../../store/useStore";
import { Card, SectionHeader, Button, EmptyState, Input, Badge, cx } from "../ui";
import RequestRow from "./RequestRow";

export default function MaintenanceView({
  brokenRequests,
  userRole,
  onRetry,
  onDelete,
  onRetryAll,
}) {
  const [retrying, setRetrying] = useState(false);

  const handleRetryAll = async () => {
    setRetrying(true);
    try {
      await onRetryAll();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Broken downloads */}
      <section>
        <SectionHeader
          title="Broken or failed downloads"
          description="Tracks that failed mid-download or produced files too small to play. Use Retry to fetch them again."
          action={
            brokenRequests.length > 0 ? (
              <Button
                variant="warning"
                size="sm"
                loading={retrying}
                onClick={handleRetryAll}
                iconLeft={<RefreshCw className={cx("w-3.5 h-3.5", retrying && "animate-spin")} />}
              >
                {retrying ? "Queuing…" : `Retry all (${brokenRequests.length})`}
              </Button>
            ) : null
          }
        />
        {brokenRequests.length === 0 ? (
          <EmptyState
            icon={<Wrench className="w-5 h-5" />}
            title="Nothing broken right now"
            description="All completed tracks have valid audio files."
          />
        ) : (
          <div className="space-y-2">
            {brokenRequests.map((r) => (
              <RequestRow
                key={r.id}
                request={r}
                userRole={userRole}
                onRetry={onRetry}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </section>

      {/* Blocked keywords */}
      <section>
        <BlockedKeywords />
      </section>
    </div>
  );
}

function BlockedKeywords() {
  const { getBlockedKeywords, addBlockedKeyword, removeBlockedKeyword, showToast } = useStore();
  const [keywords, setKeywords] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const data = await getBlockedKeywords();
      setKeywords(data);
    } catch {
      // ignore
    }
    setLoading(false);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    try {
      await addBlockedKeyword(input.trim());
      setInput("");
      await load();
      showToast("Keyword blocked", "success");
    } catch {
      showToast("Couldn't add keyword", "error");
    }
  };

  const handleRemove = async (id) => {
    try {
      await removeBlockedKeyword(id);
      await load();
      showToast("Keyword removed", "info");
    } catch {
      showToast("Couldn't remove keyword", "error");
    }
  };

  return (
    <Card>
      <SectionHeader
        title="Blocked keywords"
        description="Requests with these words are rejected automatically before reaching the queue."
      />
      <form onSubmit={handleAdd} className="flex gap-2 mb-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. explicit, parody, scary"
          className="flex-1"
        />
        <Button type="submit" variant="primary" disabled={!input.trim()}>
          Block
        </Button>
      </form>
      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">Loading…</p>
      ) : keywords.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)] inline-flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" />
          No keywords blocked. Requests are filtered by safe-search only.
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {keywords.map((kw) => (
            <span
              key={kw.id}
              title={`Added ${new Date(kw.created_at).toLocaleDateString()}`}
              className="inline-flex items-center gap-1.5 bg-[var(--danger-soft)] text-[var(--danger)] px-2.5 py-1 rounded-[var(--r-pill)] text-xs font-medium border border-[var(--danger-border)]"
            >
              <ShieldAlert className="w-3 h-3" />
              {kw.keyword}
              <button
                onClick={() => handleRemove(kw.id)}
                aria-label={`Remove ${kw.keyword}`}
                className="hover:text-[var(--danger-solid-hover)] -mr-0.5 leading-none font-bold"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}
