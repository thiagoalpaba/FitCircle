import React from 'react';

type ProgressBarProps = {
  val: number;
  max: number;
  color: string;
};

export function ProgressBar({ val, max, color }: ProgressBarProps) {
  const safeVal = Number.isFinite(val) ? val : 0;
  const safeMax = Number.isFinite(max) && max > 0 ? max : 1;
  const pct = Math.max(0, Math.min(100, (safeVal / safeMax) * 100));

  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200 shadow-inner">
      <div
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{
          width: `${pct}%`,
          backgroundColor: color,
        }}
      />
    </div>
  );
}