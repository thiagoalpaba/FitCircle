import { motion } from 'motion/react';

interface ProgressBarProps {
  val: number;
  max: number;
  color: string;
}

export function ProgressBar({ val, max, color }: ProgressBarProps) {
  const pct = Math.min((val / max) * 100, 100);

  return (
    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}