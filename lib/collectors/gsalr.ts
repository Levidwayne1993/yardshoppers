import { RawExternalListing, CollectorResult } from "@/types/external";

const STATE_CODES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

function parseGsalrHtml(html: string, stateCode: string): RawExternalListing[] {
  const listings: RawExternalListing[] = [];
  const listingRegex =
    /<div[^>]*class="[^"]*sale[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;

  const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  const dateRegex =
    /(\w+day,?\s+\w+\s+\d{1,2},?\s+\d{4})|(\d{1,2}\/\d{1,2}\/\d{2,4})/gi;
  const addressRegex =
    /(\d+\s+[\w\s]+(?:St|Ave|Blvd|Dr|Ln|Rd|Ct|Way|Pl|Cir)[.,]?\s*[\w\s]*,?\s*[A-Z]{2}\s*\d{5})/gi;
  const cityStateRegex = /([A-Z][a-z]+(?:\s[A-Z][a-z]+)*),\s*([A-Z]{2})/g;

  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const url = match[1];
    const text = match[2].replace(/<[^>]+>/g, "").trim();

    if (!text || text.length < 5) continue;
    if (!url.includes("sale") && !url.includes("garage") && !url.includes("yard"))
      continue;

    const idMatch = url.match(/\/(\d+)/);
    const sourceId = idMatch
      ? `gsalr-${stateCode}-${idMatch[1]}`
      : `gsalr-${stateCode}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    let saleDate: string | undefined;
    const dateMatch = dateRegex.exec(text);
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

    let city: string | undefined;
    let state: string | undefined;
    const csMatch = cityStateRegex.exec(text);
    if (csMatch) {
      city = csMatch[1];
      state = csMatch[2];
    } else {
      state = stateCode;
    }

    let address: string | undefined;
    const addrMatch = addressRegex.exec(text);
    if (addrMatch) {
      address = addrMatch[0];
    }

    const fullUrl = url.startsWith("http")
      ? url
      : `https://www.gsalr.com${url.startsWith("/") ? "" : "/"}${url}`;

    listings.push({
      source_id: sourceId,
      source_url: fullUrl,
      title: text.slice(0, 200),
      description: text,
      city,
      state,
      sale_date: saleDate,
      address,
      categories: [],
      raw_data: { stateCode },
    });
  }

  return listings;
}

export async function collectGsalr(): Promise<CollectorResult> {
  const allListings: RawExternalListing[] = [];
  const errors: string[] = [];

  const targetStates = ["WA", "OR", "CA", "TX", "FL", "NY", "IL", "GA", "CO", "AZ"];

  for (const stateCode of targetStates) {
    try {
      const url = `https://www.gsalr.com/${stateCode.toLowerCase()}/`;
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; YardShoppers/1.0; +https://www.yardshoppers.com)",
          Accept: "text/html",
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        errors.push(`GSALR ${stateCode}: HTTP ${res.status}`);
        continue;
      }

      const html = await res.text();
      const listings = parseGsalrHtml(html, stateCode);
      allListings.push(...listings);

      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (err) {
      errors.push(
        `GSALR ${stateCode}: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  }

  return {
    source: "gsalr",
    listings: allListings,
    errors,
    collected_at: new Date().toISOString(),
  };
}
