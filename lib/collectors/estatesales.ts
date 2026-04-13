import { RawExternalListing, CollectorResult } from "@/types/external";

const METRO_AREAS = [
  { slug: "seattle-wa", city: "Seattle", state: "WA" },
  { slug: "portland-or", city: "Portland", state: "OR" },
  { slug: "los-angeles-ca", city: "Los Angeles", state: "CA" },
  { slug: "san-francisco-ca", city: "San Francisco", state: "CA" },
  { slug: "chicago-il", city: "Chicago", state: "IL" },
  { slug: "new-york-ny", city: "New York", state: "NY" },
  { slug: "dallas-tx", city: "Dallas", state: "TX" },
  { slug: "houston-tx", city: "Houston", state: "TX" },
  { slug: "miami-fl", city: "Miami", state: "FL" },
  { slug: "atlanta-ga", city: "Atlanta", state: "GA" },
  { slug: "denver-co", city: "Denver", state: "CO" },
  { slug: "phoenix-az", city: "Phoenix", state: "AZ" },
  { slug: "tacoma-wa", city: "Tacoma", state: "WA" },
  { slug: "olympia-wa", city: "Olympia", state: "WA" },
];

function parseEstatesalesHtml(
  html: string,
  metro: (typeof METRO_AREAS)[number]
): RawExternalListing[] {
  const listings: RawExternalListing[] = [];

  const saleBlockRegex =
    /<div[^>]*class="[^"]*sale-item[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;
  const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  const imgRegex = /<img[^>]*src="([^"]*)"[^>]*/gi;
  const dateRegex =
    /(\w{3}\s+\d{1,2}(?:\s*[-–]\s*\w{3}\s+\d{1,2})?(?:,?\s+\d{4})?)/gi;

  let linkMatch;
  while ((linkMatch = linkRegex.exec(html)) !== null) {
    const href = linkMatch[1];
    const content = linkMatch[2].replace(/<[^>]+>/g, "").trim();

    if (!href.includes("/sale/") && !href.includes("estate")) continue;
    if (!content || content.length < 5) continue;

    const idMatch = href.match(/\/sale\/(\d+)/);
    const sourceId = idMatch
      ? `estatesales-${idMatch[1]}`
      : `estatesales-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    let saleDate: string | undefined;
    const dateMatch = dateRegex.exec(content);
    if (dateMatch) {
      try {
        const d = new Date(dateMatch[0]);
        if (!isNaN(d.getTime())) {
          saleDate = d.toISOString().split("T")[0];
        }
      } catch {
        // skip
      }
    }

    const photoUrls: string[] = [];
    let imgMatch;
    while ((imgMatch = imgRegex.exec(linkMatch[0])) !== null) {
      if (
        imgMatch[1] &&
        !imgMatch[1].includes("logo") &&
        !imgMatch[1].includes("icon")
      ) {
        photoUrls.push(
          imgMatch[1].startsWith("http")
            ? imgMatch[1]
            : `https://www.estatesales.net${imgMatch[1]}`
        );
      }
    }

    const fullUrl = href.startsWith("http")
      ? href
      : `https://www.estatesales.net${href.startsWith("/") ? "" : "/"}${href}`;

    listings.push({
      source_id: sourceId,
      source_url: fullUrl,
      title: content.slice(0, 200),
      description: content,
      city: metro.city,
      state: metro.state,
      sale_date: saleDate,
      photo_urls: photoUrls.length > 0 ? photoUrls : undefined,
      categories: ["Antiques"],
      raw_data: { metro: metro.slug },
    });
  }

  return listings;
}

export async function collectEstateSales(): Promise<CollectorResult> {
  const allListings: RawExternalListing[] = [];
  const errors: string[] = [];

  for (const metro of METRO_AREAS) {
    try {
      const url = `https://www.estatesales.net/${metro.slug}`;
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; YardShoppers/1.0; +https://www.yardshoppers.com)",
          Accept: "text/html",
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        errors.push(`EstateSales ${metro.slug}: HTTP ${res.status}`);
        continue;
      }

      const html = await res.text();
      const listings = parseEstatesalesHtml(html, metro);
      allListings.push(...listings);

      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (err) {
      errors.push(
        `EstateSales ${metro.slug}: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  }

  return {
    source: "estatesales",
    listings: allListings,
    errors,
    collected_at: new Date().toISOString(),
  };
}
