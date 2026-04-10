"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";

interface Rating {
  id: string;
  rating: number;
  review: string | null;
  created_at: string;
  rater_id: string;
  profiles: {
    full_name: string | null;
  } | null;
}

interface RatingSectionProps {
  listingId: string;
  hostId: string;
}

export default function RatingSection({ listingId, hostId }: RatingSectionProps) {
  const supabase = createClient();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [myRating, setMyRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [review, setReview] = useState("");
  const [hasRated, setHasRated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [avgRating, setAvgRating] = useState<number>(0);
  const [totalRatings, setTotalRatings] = useState<number>(0);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
      await fetchRatings(user?.id || null);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRatings = async (currentUserId: string | null) => {
    setFetching(true);
    const { data } = await supabase
      .from("ratings")
      .select("id, rating, review, created_at, rater_id, profiles:rater_id(full_name)")
      .eq("listing_id", listingId)
      .order("created_at", { ascending: false });

    if (data) {
      const typed = data as unknown as Rating[];
      setRatings(typed);
      if (typed.length > 0) {
        const avg = typed.reduce((sum, r) => sum + r.rating, 0) / typed.length;
        setAvgRating(Math.round(avg * 10) / 10);
        setTotalRatings(typed.length);
      }
      if (currentUserId) {
        const mine = typed.find((r) => r.rater_id === currentUserId);
        if (mine) {
          setMyRating(mine.rating);
          setReview(mine.review || "");
          setHasRated(true);
        }
      }
    }
    setFetching(false);
  };

  const handleSubmit = async () => {
    if (!userId || myRating === 0) return;
    setLoading(true);

    if (hasRated) {
      await supabase
        .from("ratings")
        .update({ rating: myRating, review: review.trim() || null })
        .eq("listing_id", listingId)
        .eq("rater_id", userId);
    } else {
      await supabase.from("ratings").insert({
        listing_id: listingId,
        rater_id: userId,
        host_id: hostId,
        rating: myRating,
        review: review.trim() || null,
      });
    }

    setHasRated(true);
    await fetchRatings(userId);
    setLoading(false);
  };

  const renderStars = (count: number, size: string = "text-lg") => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <i
            key={star}
            className={`fa-solid fa-star ${size} ${
              star <= count ? "text-yellow-400" : "text-gray-200"
            }`}
          />
        ))}
      </div>
    );
  };

  const starBreakdown = [5, 4, 3, 2, 1].map((star) => {
    const count = ratings.filter((r) => r.rating === star).length;
    const pct = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
    return { star, count, pct };
  });

  const displayedRatings = showAll ? ratings : ratings.slice(0, 3);
  const isOwnListing = userId === hostId;

  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold text-gray-900 mb-4">
        <i className="fa-solid fa-star text-yellow-400 mr-2"></i>
        Host Ratings
      </h3>

      {fetching ? (
        <div className="text-center py-6 text-gray-400">
          <i className="fa-solid fa-spinner fa-spin text-xl"></i>
        </div>
      ) : (
        <>
          {/* Summary Bar */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm mb-6">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Big Average */}
              <div className="flex flex-col items-center justify-center min-w-[120px]">
                <span className="text-4xl font-bold text-gray-900">
                  {totalRatings > 0 ? avgRating : "—"}
                </span>
                {totalRatings > 0 && renderStars(Math.round(avgRating))}
                <span className="text-xs text-gray-400 mt-1">
                  {totalRatings} {totalRatings === 1 ? "rating" : "ratings"}
                </span>
              </div>

              {/* Breakdown Bars */}
              <div className="flex-1 space-y-1.5">
                {starBreakdown.map(({ star, count, pct }) => (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-4 text-right">{star}</span>
                    <i className="fa-solid fa-star text-yellow-400 text-xs"></i>
                    <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-yellow-400 h-full rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-6">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Rate This Host */}
          {userId && !isOwnListing ? (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6">
              <p className="text-sm font-semibold text-gray-700 mb-3">
                {hasRated ? "Update your rating" : "Rate this host"}
              </p>
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setMyRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <i
                      className={`fa-solid fa-star text-2xl ${
                        star <= (hoverRating || myRating)
                          ? "text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
                {myRating > 0 && (
                  <span className="ml-2 text-sm text-gray-500 self-center">
                    {["", "Poor", "Fair", "Good", "Great", "Excellent"][myRating]}
                  </span>
                )}
              </div>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Leave a review (optional)..."
                maxLength={500}
                rows={2}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent resize-none"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">{review.length}/500</span>
                <button
                  onClick={handleSubmit}
                  disabled={loading || myRating === 0}
                  className="bg-[#2E7D32] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <i className="fa-solid fa-spinner fa-spin mr-1"></i>
                  ) : (
                    <i className="fa-solid fa-check mr-1"></i>
                  )}
                  {hasRated ? "Update" : "Submit"}
                </button>
              </div>
            </div>
          ) : userId && isOwnListing ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center mb-6">
              <p className="text-sm text-gray-500">You can&apos;t rate your own listing</p>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center mb-6">
              <p className="text-sm text-gray-600">
                <a href="/login" className="text-[#2E7D32] font-semibold hover:underline">
                  Sign in
                </a>{" "}
                to rate this host
              </p>
            </div>
          )}

          {/* Reviews List */}
          {ratings.filter((r) => r.review).length > 0 && (
            <div className="space-y-3">
              {displayedRatings
                .filter((r) => r.review)
                .map((r) => (
                  <div
                    key={r.id}
                    className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-[#2E7D32] flex items-center justify-center text-white font-bold text-xs">
                        {r.profiles?.full_name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {r.profiles?.full_name || "Anonymous"}
                        </p>
                        <div className="flex items-center gap-2">
                          {renderStars(r.rating, "text-xs")}
                          <span className="text-xs text-gray-400">
                            {new Date(r.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{r.review}</p>
                  </div>
                ))}

              {ratings.filter((r) => r.review).length > 3 && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="text-[#2E7D32] text-sm font-semibold hover:underline"
                >
                  {showAll ? "Show less" : `View all ${ratings.filter((r) => r.review).length} reviews`}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
