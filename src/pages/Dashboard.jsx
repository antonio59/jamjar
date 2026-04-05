import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store/useStore';
import { CheckCircle, XCircle, Clock, Download, Trash2, Shield } from 'lucide-react';

export default function Dashboard() {
  const { user, getPendingRequests, getRequests, approveRequest, rejectRequest, deleteRequest, showToast } = useStore();
  const [pending, setPending] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (user.role === 'parent') {
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
    showToast('Request approved! Downloading...', 'success');
    loadData();
  };

  const handleReject = async (id) => {
    await rejectRequest(id);
    showToast('Request rejected', 'warning');
    loadData();
  };

  const handleDelete = async (id) => {
    await deleteRequest(id);
    showToast('Request deleted', 'info');
    loadData();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-50 border-yellow-200';
      case 'approved': return 'bg-green-50 border-green-200';
      case 'rejected': return 'bg-red-50 border-red-200';
      case 'downloading': return 'bg-blue-50 border-blue-200';
      case 'completed': return 'bg-green-100 border-green-300';
      case 'failed': return 'bg-red-100 border-red-300';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'approved': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'downloading': return <Download className="w-5 h-5 text-blue-500 animate-pulse" />;
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return null;
    }
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
        {user.role === 'parent' ? 'Parent Dashboard' : 'My Requests'}
      </h1>

      {user.role === 'parent' && pending.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Pending Approvals ({pending.length})</h2>
          <AnimatePresence>
            {pending.map((request) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-4 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {request.thumbnail && (
                      <img src={request.thumbnail} alt="" className="w-16 h-16 rounded-lg object-cover" />
                    )}
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">{request.title}</h3>
                      <p className="text-sm text-gray-600">
                        {request.profile === 'yoto' ? '📻 Yoto' : '🎧 iPod'} • {request.type === 'music' ? 'Music' : 'Audiobook'}
                      </p>
                      {request.duration && <p className="text-sm text-gray-500">{request.duration}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleApprove(request.id)}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" /> Approve
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleReject(request.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold mb-4">Request History</h2>
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
                    <p className="font-medium text-gray-800">{request.title}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(request.created_at).toLocaleDateString()} • {request.profile}
                    </p>
                  </div>
                </div>
                {user.role === 'parent' && (request.status === 'rejected' || request.status === 'completed') && (
                  <button onClick={() => handleDelete(request.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
              {request.internxt_url && (
                <a href={request.internxt_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-2 block">
                  Download from Internxt →
                </a>
              )}
            </motion.div>
          ))}
          {allRequests.length === 0 && (
            <p className="text-gray-500 text-center py-8">No requests yet 🎵</p>
          )}
        </div>
      </div>

      {/* Blocked Keywords Management (Parent Only) */}
      {user.role === 'parent' && <BlockedKeywordsManager />}
    </div>
  );
}

function BlockedKeywordsManager() {
  const { showToast } = useStore();
  const [keywords, setKeywords] = useState([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKeywords();
  }, []);

  const loadKeywords = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/blocked-keywords', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setKeywords(data);
    } catch (error) {
      console.error('Failed to load keywords:', error);
    }
    setLoading(false);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;

    try {
      const token = localStorage.getItem('token');
      await fetch('/api/blocked-keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ keyword: newKeyword }),
      });
      setNewKeyword('');
      loadKeywords();
      showToast('Blocked keyword added', 'success');
    } catch (error) {
      showToast('Failed to add keyword', 'error');
    }
  };

  const handleRemove = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/blocked-keywords/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      loadKeywords();
      showToast('Keyword removed', 'info');
    } catch (error) {
      showToast('Failed to remove keyword', 'error');
    }
  };

  if (loading) return null;

  return (
    <div className="mt-8 bg-white rounded-xl p-6 shadow-md">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-6 h-6 text-purple-600" />
        <h2 className="text-xl font-bold">Blocked Keywords</h2>
      </div>
      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newKeyword}
          onChange={(e) => setNewKeyword(e.target.value)}
          placeholder="Add keyword to block..."
          className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
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
            className="inline-flex items-center gap-2 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm"
          >
            {kw.keyword}
            <button onClick={() => handleRemove(kw.id)} className="hover:text-red-600">
              ×
            </button>
          </span>
        ))}
        {keywords.length === 0 && (
          <p className="text-gray-500 text-sm">No blocked keywords configured</p>
        )}
      </div>
    </div>
  );
}
