"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import BoostModal from "@/components/BoostModal";

const ADMIN_EMAIL = "erwin-levi@outlook.com";

interface Listing {
  id: string;
  title: string;
  city: string;
  state: string;
  is_boosted: boolean;
  created_at: string;
  user_id: string;
  listing_photos?: { id: string; photo_url: string }[];
}

interface Report {
  id: string;
  reason: string;
  details: string | null;
  created_at: string;
  listing_id: string;
  reporter_id: string;
  listings?: {
    id: string;
    title: string;
    city: string;
    state: string;
    user_id: string;
    listing_photos?: { id: string; photo_url: string }[];
  };
}

export default function DashboardPage() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [boostTarget, setBoostTarget] = useState<Listing | null>(null);
  const [activeTab, setActiveTab] = useState<"listings" | "reports">(
    "listings"
  );

  useEffect(() => {
    async function load() {
      const {
        data: { user: u },
      } = await supabase.auth.getUser();

      if (!u) {
        router.push("/login");
        return;
      }

      setUser(u);
      const admin = u.email?.toLowerCase() === ADMIN_EMAIL;
      setIsAdmin(admin);

      let query = supabase
        .from("listings")
        .select("*, listing_photos(*)")
        .order("created_at", { ascending: false });

      if (!admin) {
        query = query.eq("user_id", u.id);
      }

      const { data: listingsData } = await query;
      setListings(listingsData || []);

      if (admin) {
        const { data: reportsData } = await supabase
          .from("reported_listings")
          .select(
            "*, listings(id, title, city, state, user_id, listing_photos(*))"
          )
          .eq("resolved", false)
          .order("created_at", { ascending: false });

        setReports(reportsData || []);
      }

      setLoading(false);
    }
    load();
  }, []);

  async function handleDelete(listingId: string) {
    const confirmed = confirm(
      "Are you sure you want to delete this listing? This cannot be undone."
    );
    if (!confirmed) return;

    try {
      if (isAdmin) {
        const res = await fetch("/api/admin/delete-listing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listing_id: listingId }),
        });
        if (!res.ok) throw new Error("Delete failed");
      } else {
        await supabase
          .from("listing_photos")
          .delete()
          .eq("listing_id", listingId);
        await supabase.from("listings").delete().eq("id", listingId);
      }

      setListings((prev) => prev.filter((l) => l.id !== listingId));
      setReports((prev) => prev.filter((r) => r.listing_id !== listingId));
    } catch (err) {
      alert("Failed to delete listing.");
    }
  }

  async function handleDismissReport(reportId: string) {
    await supabase
      .from("reported_listings")
      .update({ resolved: true })
      .eq("id", reportId);
    setReports((prev) => prev.filter((r) => r.id !== reportId));
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <i className="fa-solid fa-spinner fa-spin" />
          Loading your dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">My Account</h1>
            {isAdmin && (
              <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full">
                Admin
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <Link
          href="/saved"
          className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-2xl hover:border-ys-300 hover:shadow-sm transition group"
        >
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
            <i className="fa-solid fa-heart text-red-400 text-sm" />
          </div>
          <span className="text-sm font-semibold text-gray-700 group-hover:text-ys-800">
            Saved
          </span>
        </Link>
        <Link
          href="/browse"
          className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-2xl hover:border-ys-300 hover:shadow-sm transition group"
        >
          <div className="w-10 h-10 bg-ys-50 rounded-xl flex items-center justify-center">
            <i className="fa-solid fa-magnifying-glass text-ys-600 text-sm" />
          </div>
          <span className="text-sm font-semibold text-gray-700 group-hover:text-ys-800">
            Browse
          </span>
        </Link>
        <Link
          href="/post"
          className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-2xl hover:border-ys-300 hover:shadow-sm transition group"
        >
          <div className="w-10 h-10 bg-ys-50 rounded-xl flex items-center justify-center">
            <i className="fa-solid fa-plus text-ys-600 text-sm" />
          </div>
          <span className="text-sm font-semibold text-gray-700 group-hover:text-ys-800">
            Post a Sale
          </span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-2xl hover:border-red-200 hover:shadow-sm transition group"
        >
          <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
            <i className="fa-solid fa-right-from-bracket text-gray-400 text-sm" />
          </div>
          <span className="text-sm font-semibold text-gray-700 group-hover:text-red-500">
            Log out
          </span>
        </button>
      </div>

      {isAdmin && (
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
          <button
            onClick={() => setActiveTab("listings")}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === "listings"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <i className="fa-solid fa-grid-2 mr-2 text-xs" />
            All Listings ({listings.length})
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === "reports"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <i className="fa-solid fa-flag mr-2 text-xs" />
            Reports
            {reports.length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {reports.length}
              </span>
            )}
          </button>
        </div>
      )}

      {activeTab === "listings" && (
        <>
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            {isAdmin ? "All Listings" : "My Listings"}{" "}
            <span className="text-gray-400 font-normal">
              ({listings.length})
            </span>
          </h2>

          {listings.length === 0 ? (
            <div className="text-center py-16 bg-white border border-gray-100 rounded-2xl">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-tag text-2xl text-gray-300" />
              </div>
              <p className="text-gray-500 mb-4">
                {isAdmin
                  ? "No listings yet."
                  : "You haven't posted any sales yet."}
              </p>
              <Link
                href="/post"
                className="inline-flex items-center gap-2 bg-ys-800 hover:bg-ys-900 text-white px-6 py-2.5 rounded-full font-semibold transition"
              >
                <i className="fa-solid fa-plus text-xs" />
                Post Your First Sale
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((listing) => {
                const photo = listing.listing_photos?.[0]?.photo_url;
                return (
                  <div
                    key={listing.id}
                    className={`bg-white rounded-2xl overflow-hidden border transition-all hover:shadow-md ${
                      listing.is_boosted
                        ? "border-amber-200 shadow-sm"
                        : "border-gray-100"
                    }`}
                  >
                    <Link
                      href={`/listing/${listing.id}`}
                      className="block relative aspect-[4/3] bg-gray-100"
                    >
                      {photo ? (
                        <Image
                          src={photo}
                          alt={listing.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-ys-50">
                          <i className="fa-solid fa-tag text-3xl text-ys-300" />
                        </div>
                      )}
                      {listing.is_boosted && (
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-amber-400 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full">
                          <i className="fa-solid fa-rocket text-[10px]" />
                          Boosted
                        </div>
                      )}
                    </Link>

                    <div className="p-4">
                      <Link href={`/listing/${listing.id}`}>
                        <h3 className="font-bold text-gray-900 hover:text-ys-800 transition truncate">
                          {listing.title}
                        </h3>
                      </Link>
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                        <i className="fa-solid fa-location-dot text-[10px] text-ys-500" />
                        {listing.city}, {listing.state}
                      </p>

                      <div className="mt-3 flex gap-2">
                        {!listing.is_boosted ? (
                          <button
                            onClick={() => setBoostTarget(listing)}
                            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-amber-900 py-2 rounded-xl text-sm font-bold transition-all"
                          >
                            <i className="fa-solid fa-rocket text-xs" />
                            Boost — $2.99
                          </button>
                        ) : (
                          <div className="flex-1 flex items-center justify-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 py-2 rounded-xl text-sm font-semibold">
                            <i className="fa-solid fa-check-circle text-xs" />
                            Boosted
                          </div>
                        )}

                        <button
                          onClick={() => handleDelete(listing.id)}
                          className="flex items-center justify-center gap-1.5 px-4 py-2 border border-red-200 text-red-500 hover:bg-red-50 rounded-xl text-sm font-semibold transition"
                        >
                          <i className="fa-solid fa-trash text-xs" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === "reports" && isAdmin && (
        <>
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Reported Listings{" "}
            <span className="text-gray-400 font-normal">
              ({reports.length})
            </span>
          </h2>

          {reports.length === 0 ? (
            <div className="text-center py-16 bg-white border border-gray-100 rounded-2xl">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-check text-2xl text-green-500" />
              </div>
              <p className="text-gray-500">
                No reported listings to review. All clear!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => {
                const reportedListing = report.listings;
                const reportPhoto =
                  reportedListing?.listing_photos?.[0]?.photo_url;

                return (
                  <div
                    key={report.id}
                    className="bg-white border border-red-100 rounded-2xl p-5 hover:shadow-md transition"
                  >
                    <div className="flex flex-col sm:flex-row gap-4">
                      {reportedListing && (
                        <Link
                          href={`/listing/${reportedListing.id}`}
                          className="shrink-0 w-full sm:w-32 h-24 relative rounded-xl overflow-hidden bg-gray-100"
                        >
                          {reportPhoto ? (
                            <Image
                              src={reportPhoto}
                              alt={reportedListing.title}
                              fill
                              className="object-cover"
                              sizes="128px"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full bg-ys-50">
                              <i className="fa-solid fa-tag text-xl text-ys-300" />
                            </div>
                          )}
                        </Link>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-bold text-gray-900">
                              {reportedListing?.title || "Deleted Listing"}
                            </h3>
                            {reportedListing && (
                              <p className="text-sm text-gray-500 mt-0.5">
                                <i className="fa-solid fa-location-dot text-[10px] mr-1" />
                                {reportedListing.city}, {reportedListing.state}
                              </p>
                            )}
                          </div>
                          <span className="shrink-0 bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full">
                            <i className="fa-solid fa-flag text-[10px] mr-1" />
                            Reported
                          </span>
                        </div>

                        <div className="mt-3 p-3 bg-red-50 rounded-xl">
                          <p className="text-sm font-semibold text-red-800">
                            {report.reason}
                          </p>
                          {report.details && (
                            <p className="text-sm text-red-600 mt-1">
                              {report.details}
                            </p>
                          )}
                        </div>

                        <p className="text-xs text-gray-400 mt-2">
                          Reported{" "}
                          {new Date(report.created_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            }
                          )}
                        </p>

                        <div className="mt-3 flex gap-2">
                          {reportedListing && (
                            <button
                              onClick={() =>
                                handleDelete(reportedListing.id)
                              }
                              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition"
                            >
                              <i className="fa-solid fa-trash text-xs" />
                              Delete Listing
                            </button>
                          )}
                          <button
                            onClick={() => handleDismissReport(report.id)}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-semibold transition"
                          >
                            <i className="fa-solid fa-xmark text-xs" />
                            Dismiss
                          </button>
                          {reportedListing && (
                            <Link
                              href={`/listing/${reportedListing.id}`}
                              className="flex items-center gap-2 px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-semibold transition"
                            >
                              <i className="fa-solid fa-eye text-xs" />
                              View
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {boostTarget && (
        <BoostModal
          listingId={boostTarget.id}
          listingTitle={boostTarget.title}
          onClose={() => setBoostTarget(null)}
        />
      )}
    </div>
  );
}
