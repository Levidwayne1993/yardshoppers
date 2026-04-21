'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase-browser';

const supabase = createClient();

interface SavedListing {
  id: string;
  listing_id: string;
  title: string;
  city: string;
  state: string;
  sale_date: string | null;
  photo_url: string | null;
  latitude: number | null;
  longitude: number | null;
  is_boosted: boolean;
  boost_tier: string | null;
}

interface SavedPanelProps {
  userId: string | null;
  totalListingsNearby?: number;
}

export default function SavedPanel({ userId, totalListingsNearby }: SavedPanelProps) {
  const [saved, setSaved] = useState<SavedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  async function fetchSaved() {
    if (!userId) {
      setSaved([]);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('saved_listings')
      .select('id, listing_id, listings(title, city, state, sale_date, latitude, longitude, is_boosted, boost_tier, listing_photos(photo_url))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      const mapped: SavedListing[] = data
        .filter((row: any) => row.listings)
        .map((row: any) => ({
          id: row.id,
          listing_id: row.listing_id,
          title: row.listings.title || 'Untitled',
          city: row.listings.city || '',
          state: row.listings.state || '',
          sale_date: row.listings.sale_date,
          photo_url: row.listings.listing_photos?.[0]?.photo_url || null,
          latitude: row.listings.latitude,
          longitude: row.listings.longitude,
          is_boosted: row.listings.is_boosted || false,
          boost_tier: row.listings.boost_tier,
        }));
      setSaved(mapped);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchSaved();
    // Listen for save/unsave events from ListingCard
    const handler = () => fetchSaved();
    window.addEventListener('ys-saved-change', handler);
    return () => window.removeEventListener('ys-saved-change', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function handleRemove(savedRowId: string) {
    setRemoving(savedRowId);
    await supabase.from('saved_listings').delete().eq('id', savedRowId);
    setSaved((prev) => prev.filter((s) => s.id !== savedRowId));
    window.dispatchEvent(new Event('ys-saved-change'));
    setRemoving(null);
  }

  // Build route planner URL with saved listing IDs
  const routePlannerUrl = saved.length > 0
    ? `/route-planner?ids=${saved.map((s) => s.listing_id).join(',')}`
    : '/route-planner';

  // Count sales happening today
  const today = new Date().toISOString().split('T')[0];
  const salesToday = saved.filter((s) => s.sale_date === today).length;

  // ── Logged-out state ──
  if (!userId) {
    return (
      <aside className="hidden xl:block w-[260px] flex-shrink-0">
        <div className="sticky top-[80px] bg-white rounded-2xl border border-gray-200/80 shadow-sm max-h-[calc(100vh-100px)] overflow-y-auto">
          <div className="px-4 pt-4 pb-5 text-center">
            <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <i className="fa-solid fa-heart text-2xl text-green-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1 text-sm">Save Your Favorites</h3>
            <p className="text-xs text-gray-500 mb-4">
              Log in to save yard sales, plan routes, and never miss a deal.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-2 bg-ys-700 hover:bg-ys-800 text-white rounded-full text-xs font-semibold transition-all"
            >
              <i className="fa-solid fa-right-to-bracket text-[10px]" />
              Log In
            </Link>
          </div>

          <hr className="border-gray-100 mx-4" />

          {/* Tips section for logged-out users */}
          <div className="px-4 py-4">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Yard Sale Tips
            </h3>
            <div className="space-y-2.5">
              {[
                { icon: 'fa-clock', tip: 'Arrive early for the best finds' },
                { icon: 'fa-money-bill-wave', tip: 'Bring small bills & change' },
                { icon: 'fa-car', tip: 'Plan your route in advance' },
                { icon: 'fa-hand-holding-dollar', tip: "Don't be afraid to negotiate" },
              ].map((t) => (
                <div key={t.tip} className="flex items-start gap-2">
                  <i className={`fa-solid ${t.icon} text-[10px] text-ys-600 mt-0.5 w-3.5 text-center`} />
                  <span className="text-xs text-gray-600 leading-snug">{t.tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // ── Logged-in state ──
  return (
    <aside className="hidden xl:block w-[260px] flex-shrink-0">
      <div className="sticky top-[80px] bg-white rounded-2xl border border-gray-200/80 shadow-sm max-h-[calc(100vh-100px)] overflow-y-auto">

        {/* ▸ Header */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              My Saved Sales
            </h3>
            {saved.length > 0 && (
              <span className="text-[10px] font-bold text-white bg-ys-600 rounded-full w-5 h-5 flex items-center justify-center">
                {saved.length}
              </span>
            )}
          </div>
        </div>

        {/* ▸ Saved listings */}
        <div className="px-3">
          {loading ? (
            <div className="space-y-2 py-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-2 animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-3 bg-gray-200 rounded w-3/4 mb-1.5" />
                    <div className="h-2.5 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : saved.length === 0 ? (
            <div className="text-center py-4">
              <i className="fa-regular fa-heart text-2xl text-gray-300 mb-2 block" />
              <p className="text-xs text-gray-500">
                Tap the <i className="fa-solid fa-heart text-[10px] text-red-400" /> on any listing to save it here
              </p>
            </div>
          ) : (
            <div className="space-y-1 max-h-[340px] overflow-y-auto pr-1">
              {saved.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 transition-all relative"
                >
                  {/* Thumbnail */}
                  <Link href={`/listing/${item.listing_id}`} className="flex-shrink-0">
                    {item.photo_url ? (
                      <div className="w-11 h-11 rounded-lg overflow-hidden relative">
                        <Image
                          src={item.photo_url}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="44px"
                        />
                      </div>
                    ) : (
                      <div className="w-11 h-11 rounded-lg bg-gray-100 flex items-center justify-center">
                        <i className="fa-solid fa-tag text-gray-300 text-xs" />
                      </div>
                    )}
                  </Link>

                  {/* Info */}
                  <Link href={`/listing/${item.listing_id}`} className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate leading-tight">
                      {item.title}
                    </p>
                    <p className="text-[10px] text-gray-500 truncate">
                      {[item.city, item.state].filter(Boolean).join(', ')}
                    </p>
                    {item.sale_date && (
                      <p className="text-[10px] text-ys-600 font-medium">
                        {item.sale_date === today ? '📍 Today' : item.sale_date}
                      </p>
                    )}
                  </Link>

                  {/* Remove */}
                  <button
                    onClick={() => handleRemove(item.id)}
                    disabled={removing === item.id}
                    className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center flex-shrink-0 transition-all"
                    title="Remove"
                  >
                    {removing === item.id ? (
                      <i className="fa-solid fa-spinner fa-spin text-[9px] text-red-400" />
                    ) : (
                      <i className="fa-solid fa-xmark text-[9px] text-red-400" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ▸ Route Planner Button */}
        {saved.length > 0 && (
          <div className="px-3 pt-2 pb-3">
            <Link
              href={routePlannerUrl}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-ys-700 to-ys-800 hover:from-ys-800 hover:to-ys-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-md"
            >
              <i className="fa-solid fa-route" />
              Plan Route ({saved.length} stop{saved.length !== 1 ? 's' : ''})
            </Link>
          </div>
        )}

        <hr className="border-gray-100 mx-4" />

        {/* ▸ Quick Stats */}
        <div className="px-4 py-3">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
            At a Glance
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center">
                <i className="fa-solid fa-heart text-[10px] text-green-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-900">{saved.length} Saved</p>
                <p className="text-[10px] text-gray-400">Yard sales</p>
              </div>
            </div>

            {salesToday > 0 && (
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center">
                  <i className="fa-solid fa-fire text-[10px] text-amber-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">{salesToday} Today</p>
                  <p className="text-[10px] text-gray-400">Happening now</p>
                </div>
              </div>
            )}

            {typeof totalListingsNearby === 'number' && (
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                  <i className="fa-solid fa-location-dot text-[10px] text-blue-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">{totalListingsNearby} Near You</p>
                  <p className="text-[10px] text-gray-400">Active listings</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <hr className="border-gray-100 mx-4" />

        {/* ▸ Quick Links */}
        <div className="px-4 py-3 pb-4">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
            Quick Links
          </h3>
          <div className="space-y-0.5">
            <Link
              href="/saved"
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs text-gray-700 hover:bg-gray-50 font-medium transition-all"
            >
              <i className="fa-solid fa-bookmark w-3.5 text-center text-xs text-gray-400" />
              View All Saved
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs text-gray-700 hover:bg-gray-50 font-medium transition-all"
            >
              <i className="fa-solid fa-gauge w-3.5 text-center text-xs text-gray-400" />
              My Dashboard
            </Link>
            <Link
              href="/post"
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs text-gray-700 hover:bg-gray-50 font-medium transition-all"
            >
              <i className="fa-solid fa-plus-circle w-3.5 text-center text-xs text-gray-400" />
              Post a Sale
            </Link>
            <Link
              href="/messages"
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs text-gray-700 hover:bg-gray-50 font-medium transition-all"
            >
              <i className="fa-solid fa-envelope w-3.5 text-center text-xs text-gray-400" />
              Messages
            </Link>
          </div>
        </div>

        <hr className="border-gray-100 mx-4" />

        {/* ▸ Yard Sale Tips */}
        <div className="px-4 py-3 pb-4">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
            Pro Tips
          </h3>
          <div className="space-y-2">
            {[
              { icon: 'fa-clock', tip: 'Arrive early for the best finds' },
              { icon: 'fa-money-bill-wave', tip: 'Bring small bills & change' },
              { icon: 'fa-route', tip: 'Use Route Planner to save gas' },
              { icon: 'fa-hand-holding-dollar', tip: "Don't be afraid to negotiate" },
            ].map((t) => (
              <div key={t.tip} className="flex items-start gap-2">
                <i className={`fa-solid ${t.icon} text-[10px] text-ys-600 mt-0.5 w-3.5 text-center`} />
                <span className="text-xs text-gray-600 leading-snug">{t.tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
