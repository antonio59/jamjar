import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, KeyRound, Trash2, UserPlus } from "lucide-react";
import useStore from "../store/useStore";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Input,
  Label,
  SectionHeader,
  Select,
  SkeletonRow,
} from "../components/ui";

const AVATARS = ["🎵", "🐻", "🦖", "🚀", "🦄", "⚽", "🐙", "🌈"];

function errorMessage(error, fallback) {
  return error?.response?.data?.error || fallback;
}

function profileBadge(profile) {
  if (profile === "yoto") return { label: "📻 Yoto", tone: "yoto" };
  if (profile === "ipod") return { label: "🎧 iPod", tone: "ipod" };
  return { label: "Parent", tone: "brand" };
}

function AddChildForm({ onCreated }) {
  const createChild = useStore((s) => s.createChild);
  const showToast = useStore((s) => s.showToast);
  const [form, setForm] = useState({
    username: "",
    pin: "",
    profile: "yoto",
    displayName: "",
    avatarEmoji: AVATARS[0],
  });
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createChild(form);
      setForm({
        username: "",
        pin: "",
        profile: "yoto",
        displayName: "",
        avatarEmoji: AVATARS[0],
      });
      showToast("Child account created", "success");
      onCreated();
    } catch (error) {
      showToast(errorMessage(error, "Could not create the account"), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card as="form" onSubmit={submit}>
      <SectionHeader
        title="Add a child"
        description="They sign in with this username and a 4–8 digit PIN."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={form.username}
            onChange={set("username")}
            placeholder="rosie"
            autoComplete="off"
            required
          />
        </div>
        <div>
          <Label htmlFor="displayName">Display name</Label>
          <Input
            id="displayName"
            value={form.displayName}
            onChange={set("displayName")}
            placeholder="Rosie"
            autoComplete="off"
          />
        </div>
        <div>
          <Label htmlFor="pin">PIN</Label>
          <Input
            id="pin"
            value={form.pin}
            onChange={set("pin")}
            inputMode="numeric"
            pattern="\d{4,8}"
            maxLength={8}
            placeholder="4–8 digits"
            required
          />
        </div>
        <div>
          <Label htmlFor="profile">Device</Label>
          <div>
            <Select id="profile" value={form.profile} onChange={set("profile")}>
              <option value="yoto">📻 Yoto</option>
              <option value="ipod">🎧 iPod</option>
            </Select>
          </div>
        </div>
        <div className="sm:col-span-2">
          <Label>Avatar</Label>
          <div className="flex flex-wrap gap-2">
            {AVATARS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                aria-pressed={form.avatarEmoji === emoji}
                onClick={() => setForm((f) => ({ ...f, avatarEmoji: emoji }))}
                className={
                  form.avatarEmoji === emoji
                    ? "w-10 h-10 rounded-[var(--r-md)] text-lg bg-[var(--brand-soft)] border border-[var(--brand)]"
                    : "w-10 h-10 rounded-[var(--r-md)] text-lg border border-[var(--border-default)] hover:bg-[var(--surface-2)]"
                }
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4">
        <Button
          type="submit"
          variant="primary"
          loading={saving}
          iconLeft={<UserPlus className="w-4 h-4" />}
        >
          Create account
        </Button>
      </div>
    </Card>
  );
}

function PinField({ user, onDone }) {
  const setUserPin = useStore((s) => s.setUserPin);
  const showToast = useStore((s) => s.showToast);
  const logout = useStore((s) => s.logout);
  const isSelf = useStore((s) => s.user?.id === user.id);
  const [pin, setPin] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setUserPin(user.id, pin);
      setPin("");
      // Rotating your own PIN kills the session this page is using
      if (isSelf) {
        showToast("PIN changed — sign in again", "success");
        await logout();
        return;
      }
      showToast(`New PIN saved for ${user.display_name || user.username}`, "success");
      onDone();
    } catch (error) {
      showToast(errorMessage(error, "Could not change the PIN"), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <Input
        size="sm"
        className="w-24"
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        inputMode="numeric"
        pattern="\d{4,8}"
        maxLength={8}
        placeholder="New PIN"
        aria-label={`New PIN for ${user.username}`}
        required
      />
      <Button type="submit" size="sm" loading={saving}>
        Save
      </Button>
    </form>
  );
}

function UserRow({ user, onChanged }) {
  const deleteChild = useStore((s) => s.deleteChild);
  const showToast = useStore((s) => s.showToast);
  const [rotating, setRotating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const badge = profileBadge(user.role === "parent" ? null : user.profile);

  const remove = async () => {
    setDeleting(true);
    try {
      await deleteChild(user.id);
      showToast("Account removed", "success");
      setConfirming(false);
      onChanged();
    } catch (error) {
      showToast(errorMessage(error, "Could not remove the account"), "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 py-3 border-b border-[var(--border-subtle)] last:border-0">
      <span aria-hidden className="text-xl">
        {user.avatar_emoji || "👤"}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-[var(--text-primary)] truncate">
          {user.display_name || user.username}
        </div>
        <div className="text-xs text-[var(--text-muted)]">
          @{user.username} · {user.request_count} request
          {user.request_count === 1 ? "" : "s"}
        </div>
      </div>
      <Badge tone={badge.tone}>{badge.label}</Badge>
      {rotating ? (
        <PinField
          user={user}
          onDone={() => {
            setRotating(false);
            onChanged();
          }}
        />
      ) : (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setRotating(true)}
          iconLeft={<KeyRound className="w-4 h-4" />}
        >
          Change PIN
        </Button>
      )}
      {user.role !== "parent" && (
        <Button
          size="sm"
          variant="ghost"
          aria-label={`Remove ${user.username}`}
          onClick={() => setConfirming(true)}
        >
          <Trash2 className="w-4 h-4 text-[var(--danger)]" />
        </Button>
      )}
      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={remove}
        loading={deleting}
        title={`Remove ${user.display_name || user.username}?`}
        description="They won't be able to sign in again. Accounts with existing requests can't be removed."
        confirmLabel="Remove"
      />
    </div>
  );
}

export default function Settings() {
  const getUsers = useStore((s) => s.getUsers);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const load = useCallback(
    () =>
      getUsers()
      .then((list) => {
        setUsers(list);
        setLoadError(null);
      })
      .catch((error) => {
        setUsers([]);
        setLoadError(errorMessage(error, "Could not load accounts"));
      })
      .finally(() => setLoading(false)),
    [getUsers],
  );

  useEffect(load, [load]);

  return (
    <div className="space-y-6 max-w-3xl">
      <Card>
        <SectionHeader
          title="Accounts"
          description="Rotating a PIN signs that person out of every device."
        />
        {loading ? (
          <SkeletonRow />
        ) : loadError ? (
          <EmptyState
            icon={<AlertTriangle className="w-5 h-5" />}
            title="Accounts didn't load"
            description={loadError}
            action={
              <Button
                onClick={() => {
                  setLoading(true);
                  load();
                }}
              >
                Try again
              </Button>
            }
          />
        ) : (
          users.map((user) => (
            <UserRow key={user.id} user={user} onChanged={load} />
          ))
        )}
      </Card>
      <AddChildForm onCreated={load} />
    </div>
  );
}
