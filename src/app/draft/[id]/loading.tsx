export default function DraftLoading() {
  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
        {/* Header skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-24 h-10 bg-gray-200 rounded-xl" />
            <div>
              <div className="w-48 h-8 bg-gray-200 rounded-lg mb-2" />
              <div className="flex items-center gap-2">
                <div className="w-20 h-5 bg-gray-200 rounded-full" />
                <div className="w-32 h-4 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-20 h-10 bg-gray-200 rounded-xl" />
            <div className="w-24 h-10 bg-gray-200 rounded-xl" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column skeleton */}
          <div className="lg:col-span-1 space-y-6">
            {/* Images card */}
            <div className="crystal-card p-5">
              <div className="w-32 h-6 bg-gray-200 rounded mb-4" />
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="aspect-square bg-gray-200 rounded-lg"
                  />
                ))}
              </div>
            </div>

            {/* Pipeline card */}
            <div className="crystal-card p-5">
              <div className="w-28 h-6 bg-gray-200 rounded mb-2" />
              <div className="w-48 h-4 bg-gray-200 rounded mb-4" />
              <div className="w-full h-10 bg-gray-200 rounded-xl" />
            </div>
          </div>

          {/* Right column skeleton */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product card */}
            <div className="crystal-card p-5">
              <div className="flex items-center justify-between mb-6">
                <div className="w-36 h-6 bg-gray-200 rounded" />
                <div className="w-20 h-8 bg-gray-200 rounded-xl" />
              </div>

              {/* Name */}
              <div className="mb-6">
                <div className="w-28 h-4 bg-gray-200 rounded mb-2" />
                <div className="w-full h-8 bg-gray-200 rounded" />
              </div>

              {/* Short description */}
              <div className="mb-6">
                <div className="w-24 h-4 bg-gray-200 rounded mb-2" />
                <div className="w-full h-16 bg-gray-200 rounded" />
              </div>

              {/* Long description */}
              <div className="mb-6">
                <div className="w-24 h-4 bg-gray-200 rounded mb-2" />
                <div className="w-full h-32 bg-gray-200 rounded" />
              </div>

              {/* SEO section */}
              <div className="border-t pt-4">
                <div className="w-12 h-5 bg-gray-200 rounded mb-4" />
                <div className="space-y-3">
                  <div className="w-full h-10 bg-gray-200 rounded" />
                  <div className="w-full h-16 bg-gray-200 rounded" />
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="w-16 h-6 bg-gray-200 rounded"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Publish card */}
            <div className="crystal-card p-5">
              <div className="w-28 h-6 bg-gray-200 rounded mb-2" />
              <div className="w-56 h-4 bg-gray-200 rounded mb-4" />
              <div className="w-full h-10 bg-gray-200 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
