import { useState } from 'react';
import { motion } from 'framer-motion';
import useStore from './store/useStore';
import { Music, User, Lock } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'child',
    profile: 'yoto',
    displayName: '',
  });
  const [error, setError] = useState('');
  const { login, register } = useStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    let result;
    if (isLogin) {
      result = await login(formData.username, formData.password);
    } else {
      result = await register(
        formData.username,
        formData.password,
        formData.role,
        formData.profile,
        formData.displayName
      );
    }

    if (!result.success) {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎵</div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Music Request
          </h1>
          <p className="text-gray-600 mt-2">
            {isLogin ? 'Welcome back!' : 'Create your account'}
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                    placeholder="Your name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">I am a...</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'child' })}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                      formData.role === 'child'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Kid
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'parent' })}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                      formData.role === 'parent'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Parent
                  </button>
                </div>
              </div>

              {formData.role === 'child' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">My Device</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, profile: 'yoto' })}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                        formData.profile === 'yoto'
                          ? 'bg-yellow-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      📻 Yoto
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, profile: 'ipod' })}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                        formData.profile === 'ipod'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      🎧 iPod
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                placeholder="Username"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                placeholder="Password"
                required
              />
            </div>
          </div>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-bold text-lg hover:shadow-lg transition-shadow"
          >
            {isLogin ? 'Login' : 'Create Account'}
          </motion.button>
        </form>

        <p className="text-center mt-6 text-gray-600">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-purple-600 hover:text-purple-800 font-medium"
          >
            {isLogin ? 'Sign up' : 'Login'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
