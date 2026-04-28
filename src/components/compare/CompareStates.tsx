export function EmptyState() {
    return (
      <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white/50 p-16 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
          <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-600">No teams selected</p>
        <p className="mt-1 text-xs text-gray-400">
          Pick 2 or 3 teams above to start comparing metrics
        </p>
      </div>
    );
  }
  
  export function SkeletonGrid() {
    return (
      <>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      </>
    );
  }