import { motion } from "framer-motion";
import { BookOpen, Radio, Headphones, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function Tutorial() {
  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <BookOpen className="w-16 h-16 text-purple-600 mx-auto mb-4" />
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          How It Works 📚
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Learn how to request music and add tracks to your device
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl p-6 border-2 border-yellow-200 dark:border-yellow-700"
        >
          <div className="flex items-center gap-3 mb-6">
            <Radio className="w-8 h-8 text-orange-500" />
            <h2 className="text-2xl font-bold text-orange-700 dark:text-orange-400">
              Yoto Player Guide 📻
            </h2>
          </div>
          <div className="space-y-4">
            {[
              {
                num: 1,
                title: "Request Your Music",
                desc: "Go to the home page and choose what song or audiobook you want.",
              },
              {
                num: 2,
                title: "Wait for Approval",
                desc: "A parent will check your request. You'll see a green checkmark when it's approved!",
              },
              {
                num: 3,
                title: "Download to Your Device",
                desc: "Once approved, the track will be available to download from the dashboard.",
              },
              {
                num: 4,
                title: "Add to Yoto Card",
                desc: "Use the Yoto app to add the music to a blank Yoto card. Insert the card and enjoy!",
              },
            ].map((step) => (
              <div
                key={step.num}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="bg-orange-700 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                    {step.num}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-1">
                      {step.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 bg-orange-100 dark:bg-orange-900/30 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-orange-800 dark:text-orange-300">
                  Pro Tip
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-400">
                  You can use the same blank Yoto card multiple times!
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-700"
        >
          <div className="flex items-center gap-3 mb-6">
            <Headphones className="w-8 h-8 text-blue-500" />
            <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              iPod Guide 🎧
            </h2>
          </div>
          <div className="space-y-4">
            {[
              {
                num: 1,
                title: "Request Your Music",
                desc: "Go to the home page and search for your favourite songs.",
              },
              {
                num: 2,
                title: "Wait for Approval",
                desc: "A parent will review your request. Green checkmark means you're good to go!",
              },
              {
                num: 3,
                title: "Download to Your Device",
                desc: "Once approved, download the track from the dashboard to your computer.",
              },
              {
                num: 4,
                title: "Add to Your iPod",
                desc: "Connect your iPod, open iTunes/Finder, drag the file into your library, then sync.",
              },
            ].map((step) => (
              <div
                key={step.num}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                    {step.num}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-1">
                      {step.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 bg-blue-100 dark:bg-blue-900/30 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-blue-800 dark:text-blue-300">
                  Pro Tip
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  On Mac, use Finder. On Windows, use iTunes to manage your
                  iPod!
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="text-center mt-8">
        <Link
          to="/"
          className="inline-block bg-purple-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-purple-700 transition-colors"
        >
          Start Requesting Music →
        </Link>
      </div>
    </div>
  );
}
