import { CollectorResult } from "@/types/external";
import { collectCraigslist } from "./craigslist";
import { collectGsalr } from "./gsalr";
import { collectEstateSales } from "./estatesales";

export type CollectorName = "craigslist" | "gsalr" | "estatesales";

const collectors: Record<CollectorName, () => Promise<CollectorResult>> = {
  craigslist: collectCraigslist,
  gsalr: collectGsalr,
  estatesales: collectEstateSales,
};

export async function runCollector(name: CollectorName): Promise<CollectorResult> {
  const collector = collectors[name];
  if (!collector) {
    return {
      source: name,
      listings: [],
      errors: [`Unknown collector: ${name}`],
      collected_at: new Date().toISOString(),
    };
  }
  return collector();
}

export async function runAllCollectors(): Promise<CollectorResult[]> {
  const results: CollectorResult[] = [];

  for (const name of Object.keys(collectors) as CollectorName[]) {
    try {
      const result = await runCollector(name);
      results.push(result);
    } catch (err) {
      results.push({
        source: name,
        listings: [],
        errors: [err instanceof Error ? err.message : "Unknown error"],
        collected_at: new Date().toISOString(),
      });
    }
  }

  return results;
}

export { collectCraigslist } from "./craigslist";
export { collectGsalr } from "./gsalr";
export { collectEstateSales } from "./estatesales";
