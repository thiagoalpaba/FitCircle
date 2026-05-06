export function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex -space-x-4 relative">
        <div
          className={`w-16 h-16 rounded-full ${
            light ? 'bg-white' : 'bg-green-500'
          } shadow-lg`}
        />
        <div
          className={`w-16 h-16 rounded-full ${
            light ? 'bg-white/70' : 'bg-green-600'
          } shadow-lg`}
        />
      </div>

      <h2
        className={`text-2xl font-black mt-4 tracking-tighter ${
          light ? 'text-white' : 'text-gray-900'
        }`}
      >
        FitCircle
      </h2>
    </div>
  );
}