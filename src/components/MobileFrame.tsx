import React from 'react';

export function MobileFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full min-h-[100dvh] bg-[#E5E7EB] flex justify-center">
      <div className="relative w-full max-w-[430px] h-[100dvh] bg-[#F9FAFB] overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.12)]">
        {children}
      </div>
    </div>
  );
}