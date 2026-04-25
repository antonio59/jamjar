import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useStore from "../store/useStore";
import {
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Trash2,
  Shield,
} from "lucide-react";
import SwipeApprove from "../components/SwipeApprove";

export default function Dashboard() {
  const {
    user,
    getPendingRequests,
    getRequests,
    approveRequest,
    rejectRequest,
    deleteRequest,
    showToast,
  } = useStore();
  const [pending, setPending] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (user.role === "parent") {
      const [pendingData, allData] = await Promise.all([
        getPendingRequests(),
        getRequests(),
      ]);
      setPending(pendingData);
      setAllRequests(allData);
    } else {
      const data = await getRequests();
      setAllRequests(data);
    }
    setLoading(false);
  };

  const handleApprove = async (id) => {
    await approveRequest(id);
    showToast("Request approved! Downloading...", "success");
    loadData();
  };

  const handleReject = async (id) => {
    await rejectRequest(id);
    showToast("Request rejected", "warning");
    loadData();
  };

  const handleRejectWithReason = async (id, reason) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`/api/requests/${id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });
      showToast(`Request rejected: ${reason}`, "warning");
      loadData();
    } catch (error) {
      showToast("Failed to reject request", "error");
    }
  };

  const handleDelete = async (id) => {
    await deleteRequest(id);
    showToast("Request deleted", "info");
    loadData();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700";
      case "approved":
        return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700";
      case "rejected":
        return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700";
      case "downloading":
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700";
      case "completed":
        return "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700";
      case "failed":
        return "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700";
      default:
        return "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-700" />;
      case "approved":
        return <CheckCircle className="w-5 h-5 text-green-700" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-700" />;
      case "downloading":
        return <Download className="w-5 h-5 text-blue-700 animate-pulse" />;
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-800" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-800" />;
      default:
        return null;
    }
  };

  if (loading)
    return (
      <div className="text-center py-12 dark:text-gray-300">Loading...</div>
    );

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
        {user.role === "parent" ? "Parent Dashboard" : "My Requests"}
      </h1>

      {user.role === "parent" && (
        <div className="mb-12">
          <h2 className="text-xl font-bold mb-6 text-center dark:text-gray-200">
            Quick Approve
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8 text-sm">
            Swipe right to approve · Swipe left to reject · Arrow keys work too!
          </p>
          <SwipeApprove
            requests={pending}
            onApprove={(id) => {
              handleApprove(id);
              setPending((prev) => prev.filter((r) => r.id !== id));
            }}
            onReject={(id, reason) => {
              handleRejectWithReason(id, reason);
              setPending((prev) => prev.filter((r) => r.id !== id));
            }}
          />
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold mb-4 dark:text-gray-200">
          Request History
        </h2>
        <div className="space-y-3">
          {allRequests.map((request) => (
            <motion.div
              key={request.id}
              layout
              className={`border-2 rounded-xl p-4 ${getStatusColor(request.status)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(request.status)}
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200">
                      {request.title}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(request.created_at).toLocaleDateString()} ·{" "}
                      {request.profile}
                    </p>
                  </div>
                </div>
                {user.role === "parent" &&
                  (request.status === "rejected" ||
                    request.status === "completed") && (
                    <button
                      onClick={() => handleDelete(request.id)}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
              </div>
              {request.internxt_url && (
                <a
                  href={request.internxt_url}
                  download
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-2 block"
                >
                  Download File →
                </a>
              )}
            </motion.div>
          ))}
          {allRequests.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No requests yet 🎵
            </p>
          )}
        </div>
      </div>

      {user.role === "parent" && <BlockedKeywordsManager />}
    </div>
  );
}

function BlockedKeywordsManager() {
  const { showToast } = useStore();
  const [keywords, setKeywords] = useState([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKeywords();
  }, []);

  const loadKeywords = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/blocked-keywords", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setKeywords(data);
    } catch (error) {
      console.error("Failed to load keywords:", error);
    }
    setLoading(false);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;

    try {
      const token = localStorage.getItem("token");
      await fetch("/api/blocked-keywords", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ keyword: newKeyword }),
      });
      setNewKeyword("");
      loadKeywords();
      showToast("Blocked keyword added", "success");
    } catch (error) {
      showToast("Failed to add keyword", "error");
    }
  };

  const handleRemove = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`/api/blocked-keywords/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      loadKeywords();
      showToast("Keyword removed", "info");
    } catch (error) {
      showToast("Failed to remove keyword", "error");
    }
  };

  if (loading) return null;

  return (
    <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md transition-colors">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-6 h-6 text-purple-600" />
        <h2 className="text-xl font-bold dark:text-gray-200">
          Blocked Keywords
        </h2>
      </div>
      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newKeyword}
          onChange={(e) => setNewKeyword(e.target.value)}
          placeholder="Add keyword to block..."
          className="flex-1 px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none text-gray-800 dark:bg-gray-700 dark:text-gray-200"
        />
        <button
          type="submit"
          className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
        >
          Add
        </button>
      </form>
      <div className="flex flex-wrap gap-2">
        {keywords.map((kw) => (
          <span
            key={kw.id}
            className="inline-flex items-center gap-2 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-3 py-1 rounded-full text-sm"
          >
            {kw.keyword}
            <button
              onClick={() => handleRemove(kw.id)}
              className="hover:text-red-600 dark:hover:text-red-400"
            >
              ×
            </button>
          </span>
        ))}
        {keywords.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            No blocked keywords configured
          </p>
        )}
      </div>
    </div>
  );
}
