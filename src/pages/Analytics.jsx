import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import useStore from '../store/useStore';
import { BarChart, PieChart, TrendingUp, Users, Music, Book } from 'lucide-react';

export default function Analytics() {
  const { getAnalytics } = useStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    const analytics = await getAnalytics();
    setData(analytics);
    setLoading(false);
  };

  if (loading) return <div className="text-center py-12">Loading analytics...</div>;
  if (!data) return <div className="text-center py-12">No data available</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
        Analytics Dashboard 📊
      </h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-md"
        >
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <span className="text-3xl font-bold">{data.total}</span>
          </div>
          <p className="text-gray-600">Total Requests</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-md"
        >
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-8 h-8 text-yellow-600" />
            <span className="text-3xl font-bold">{data.pending}</span>
          </div>
          <p className="text-gray-600">Pending</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-md"
        >
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <span className="text-3xl font-bold">{data.completed}</span>
          </div>
          <p className="text-gray-600">Completed</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-md"
        >
          <div className="flex items-center gap-3 mb-2">
            <XCircle className="w-8 h-8 text-red-600" />
            <span className="text-3xl font-bold">{data.rejected + data.failed}</span>
          </div>
          <p className="text-gray-600">Rejected/Failed</p>
        </motion.div>
      </div>

      {/* By Profile & Type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl p-6 shadow-md"
        >
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-bold">By Profile</h2>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-700">📻 Yoto</span>
                <span className="font-bold">{data.byProfile.yoto}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full transition-all"
                  style={{ width: `${(data.byProfile.yoto / data.total) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-700">🎧 iPod</span>
                <span className="font-bold">{data.byProfile.ipod}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-400 to-purple-500 h-3 rounded-full transition-all"
                  style={{ width: `${(data.byProfile.ipod / data.total) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl p-6 shadow-md"
        >
          <div className="flex items-center gap-2 mb-4">
            <Music className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-bold">By Type</h2>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-700 flex items-center gap-2"><Music className="w-4 h-4" /> Music</span>
                <span className="font-bold">{data.byType.music}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-purple-600 h-3 rounded-full transition-all"
                  style={{ width: `${(data.byType.music / data.total) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-700 flex items-center gap-2"><Book className="w-4 h-4" /> Audiobook</span>
                <span className="font-bold">{data.byType.audiobook}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all"
                  style={{ width: `${(data.byType.audiobook / data.total) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Top Requested */}
      {data.topRequested.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-md mb-8"
        >
          <h2 className="text-xl font-bold mb-4">Most Requested</h2>
          <div className="space-y-2">
            {data.topRequested.map((item, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-gray-800">{item.title}</span>
                <span className="font-bold text-purple-600">{item.times_requested}x</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent Requests */}
      {data.recent.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-md"
        >
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <div className="space-y-2">
            {data.recent.slice(0, 10).map((request) => (
              <div key={request.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium text-gray-800">{request.title}</p>
                  <p className="text-xs text-gray-500">{request.profile} • {request.type}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                  request.status === 'completed' ? 'bg-green-100 text-green-800' :
                  request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {request.status}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
