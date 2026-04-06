export default function Hero() {
  return (
    <section className="w-full bg-red-600 py-20 text-white">
      <div className="mx-auto max-w-5xl px-4 text-center">
        
        {/* Badge */}
        <div className="mx-auto mb-4 inline-block rounded-full bg-white/10 px-4 py-1 text-sm font-semibold backdrop-blur">
          <i className="fa-solid fa-location-dot mr-2 text-emerald-300" />
          Local Yard Sales Near You
        </div>

        {/* Headline */}
        <h1 className="mx-auto mb-4 max-w-3xl text-4xl font-extrabold leading-tight md:text-5xl">
          Find Yard Sales, Estate Sales & Local Deals Instantly
        </h1>

        {/* Subtext */}
        <p className="mx-auto mb-8 max-w-xl text-lg text-white/80">
          Search your neighborhood for the best local sales happening today.
        </p>

        {/* Search Bar */}
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 rounded-xl bg-white p-3 shadow-lg md:flex-row">
          <div className="relative w-full">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search items, neighborhoods, or keywords..."
              className="w-full rounded-lg border border-gray-200 py-3 pl-10 pr-4 text-gray-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          <button className="w-full rounded-lg bg-emerald-700 px-6 py-3 font-semibold text-white transition hover:bg-emerald-600 md:w-auto">
            Search
          </button>
        </div>

        {/* Stats */}
        <div className="mt-10 flex flex-wrap justify-center gap-10 text-center">
          <div>
            <div className="text-3xl font-bold">12,400+</div>
            <div className="text-white/80">Active Listings</div>
          </div>
          <div>
            <div className="text-3xl font-bold">3,200+</div>
            <div className="text-white/80">Weekly Visitors</div>
          </div>
          <div>
            <div className="text-3xl font-bold">850+</div>
            <div className="text-white/80">Neighborhoods</div>
          </div>
        </div>
      </div>
    </section>
  );
}
