export default function DraftsLoading() {
  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="w-48 h-8 bg-gray-200 rounded-lg mb-2" />
            <div className="w-24 h-5 bg-gray-200 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-28 h-10 bg-gray-200 rounded-xl" />
            <div className="w-32 h-10 bg-gray-200 rounded-xl" />
          </div>
        </div>

        {/* Filters */}
        <div className="crystal-card p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 h-12 bg-gray-200 rounded-xl" />
            <div className="w-40 h-12 bg-gray-200 rounded-xl" />
          </div>
        </div>

        {/* Draft items */}
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="crystal-card p-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-lg" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-48 h-5 bg-gray-200 rounded" />
                    <div className="w-20 h-5 bg-gray-200 rounded-full" />
                  </div>
                  <div className="flex gap-4">
                    <div className="w-24 h-4 bg-gray-200 rounded" />
                    <div className="w-20 h-4 bg-gray-200 rounded" />
                  </div>
                </div>
                <div className="w-8 h-8 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
