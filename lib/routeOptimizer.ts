// lib/routeOptimizer.ts

export interface RouteStop {
  id: string;
  title: string;
  address: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  sale_date: string;
  sale_time_start: string;
  sale_time_end: string;
  price: string;
  category: string;
  categories: string[];
  is_boosted: boolean;
  photo_url?: string | null;
}

export interface TimeWarning {
  stopId: string;
  type: 'starting-soon' | 'ending-soon' | 'not-started' | 'ended';
  message: string;
  minutesUntil: number;
}

/* ── Haversine distance (miles) ── */
function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ── Nearest-neighbor route optimization ── */
export function optimizeRoute(
  stops: RouteStop[],
  startLat: number,
  startLng: number
): RouteStop[] {
  if (stops.length <= 1) return [...stops];

  const remaining = [...stops];
  const ordered: RouteStop[] = [];
  let curLat = startLat;
  let curLng = startLng;

  while (remaining.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const d = haversineDistance(curLat, curLng, remaining[i].latitude, remaining[i].longitude);
      if (d < nearestDist) {
        nearestDist = d;
        nearestIdx = i;
      }
    }

    const nearest = remaining.splice(nearestIdx, 1)[0];
    ordered.push(nearest);
    curLat = nearest.latitude;
    curLng = nearest.longitude;
  }

  return ordered;
}

/* ── Total route distance ── */
export function totalRouteDistance(
  stops: RouteStop[],
  startLat: number,
  startLng: number
): number {
  if (stops.length === 0) return 0;
  let total = haversineDistance(startLat, startLng, stops[0].latitude, stops[0].longitude);
  for (let i = 1; i < stops.length; i++) {
    total += haversineDistance(
      stops[i - 1].latitude, stops[i - 1].longitude,
      stops[i].latitude, stops[i].longitude
    );
  }
  return total;
}

/* ── Google Maps multi-stop URL ── */
export function generateGoogleMapsUrl(
  stops: RouteStop[],
  startLat?: number,
  startLng?: number
): string {
  if (stops.length === 0) return '';
  let url = 'https://www.google.com/maps/dir/';
  if (startLat && startLng) url += `${startLat},${startLng}/`;
  for (const s of stops) url += `${s.latitude},${s.longitude}/`;
  return url;
}

/* ── Apple Maps multi-stop URL ── */
export function generateAppleMapsUrl(
  stops: RouteStop[],
  startLat?: number,
  startLng?: number
): string {
  if (stops.length === 0) return '';
  const coords = stops.map((s) => `${s.latitude},${s.longitude}`);
  return `https://maps.apple.com/?daddr=${coords.join('&daddr=')}&dirflg=d`;
}

/* ── Time-aware warnings ── */
export function getTimeWarnings(stops: RouteStop[]): TimeWarning[] {
  const warnings: TimeWarning[] = [];
  const now = new Date();

  for (const stop of stops) {
    if (!stop.sale_time_start || !stop.sale_time_end || !stop.sale_date) continue;

    const startTime = new Date(`${stop.sale_date}T${stop.sale_time_start}`);
    const endTime = new Date(`${stop.sale_date}T${stop.sale_time_end}`);
    const minsToStart = (startTime.getTime() - now.getTime()) / 60000;
    const minsToEnd = (endTime.getTime() - now.getTime()) / 60000;

    if (minsToEnd < 0) {
      warnings.push({
        stopId: stop.id,
        type: 'ended',
        message: `"${stop.title}" has already ended`,
        minutesUntil: minsToEnd,
      });
    } else if (minsToEnd <= 60) {
      warnings.push({
        stopId: stop.id,
        type: 'ending-soon',
        message: `"${stop.title}" ends in ${Math.round(minsToEnd)} min`,
        minutesUntil: minsToEnd,
      });
    } else if (minsToStart > 0 && minsToStart <= 60) {
      warnings.push({
        stopId: stop.id,
        type: 'starting-soon',
        message: `"${stop.title}" starts in ${Math.round(minsToStart)} min`,
        minutesUntil: minsToStart,
      });
    } else if (minsToStart > 60) {
      warnings.push({
        stopId: stop.id,
        type: 'not-started',
        message: `"${stop.title}" hasn't started yet (${startTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })})`,
        minutesUntil: minsToStart,
      });
    }
  }

  return warnings;
}
