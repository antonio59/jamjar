import { motion } from "framer-motion";

// Deterministic particle layout — positions/rotations fixed so re-renders
// never reshuffle the burst.
const PARTICLES = [
  { e: "🎵", x: -90, y: -110, r: -30, s: 1.4, d: 0 },
  { e: "⭐", x: -40, y: -140, r: 20, s: 1.0, d: 0.03 },
  { e: "🎶", x: 30, y: -130, r: 40, s: 1.2, d: 0.06 },
  { e: "🫙", x: 90, y: -100, r: -45, s: 1.1, d: 0.02 },
  { e: "🎵", x: -110, y: -50, r: 60, s: 0.9, d: 0.08 },
  { e: "✨", x: 110, y: -60, r: -60, s: 1.3, d: 0.05 },
  { e: "🎶", x: -60, y: -170, r: 30, s: 0.8, d: 0.1 },
  { e: "⭐", x: 60, y: -160, r: -20, s: 1.0, d: 0.09 },
  { e: "🎵", x: 0, y: -180, r: 50, s: 1.1, d: 0.12 },
  { e: "✨", x: -130, y: -90, r: -50, s: 0.9, d: 0.11 },
  { e: "🎶", x: 130, y: -90, r: 70, s: 1.0, d: 0.07 },
  { e: "⭐", x: 10, y: -100, r: -70, s: 0.7, d: 0.04 },
];

export default function ConfettiBurst() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-visible"
      aria-hidden="true"
    >
      {PARTICLES.map((p, i) => (
        <motion.span
          key={i}
          className="absolute left-1/2 top-1/2 select-none"
          style={{ fontSize: `${p.s}rem` }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
          animate={{
            x: p.x,
            y: p.y,
            opacity: [1, 1, 0],
            scale: [0, 1, 0.9],
            rotate: p.r,
          }}
          transition={{
            duration: 1.1,
            delay: p.d,
            ease: "easeOut",
            times: [0, 0.6, 1],
          }}
        >
          {p.e}
        </motion.span>
      ))}
    </div>
  );
}
