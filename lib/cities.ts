export interface City {
  slug: string;
  name: string;
  state: string;
  stateCode: string;
  lat: number;
  lng: number;
  population: string;
  description: string;
}

export const cities: City[] = [
  // Washington State
  {
    slug: "olympia-wa",
    name: "Olympia",
    state: "Washington",
    stateCode: "WA",
    lat: 47.0379,
    lng: -122.9007,
    population: "55,000+",
    description:
      "Olympia is a hub for yard sales and garage sales, especially in neighborhoods like Westside, Southeast Olympia, and near Evergreen State College. Spring and summer weekends are packed with sales.",
  },
  {
    slug: "tacoma-wa",
    name: "Tacoma",
    state: "Washington",
    stateCode: "WA",
    lat: 47.2529,
    lng: -122.4443,
    population: "220,000+",
    description:
      "Tacoma has one of the most active yard sale and garage sale scenes in the Pacific Northwest. Popular neighborhoods include Stadium District, North End, and South Tacoma.",
  },
  {
    slug: "seattle-wa",
    name: "Seattle",
    state: "Washington",
    stateCode: "WA",
    lat: 47.6062,
    lng: -122.3321,
    population: "740,000+",
    description:
      "Seattle's yard sale and garage sale culture is thriving, with sales popping up every weekend in Ballard, Capitol Hill, Fremont, West Seattle, and Beacon Hill.",
  },
  {
    slug: "spokane-wa",
    name: "Spokane",
    state: "Washington",
    stateCode: "WA",
    lat: 47.6588,
    lng: -117.426,
    population: "230,000+",
    description:
      "Spokane's affordable neighborhoods and spacious homes make it a garage sale hotspot. Check out South Hill, Shadle, and the Valley for the best finds.",
  },
  {
    slug: "vancouver-wa",
    name: "Vancouver",
    state: "Washington",
    stateCode: "WA",
    lat: 45.6387,
    lng: -122.6615,
    population: "195,000+",
    description:
      "Vancouver WA has a huge yard sale community, especially in neighborhoods like Felida, Salmon Creek, and Hazel Dell. No sales tax makes deals even sweeter.",
  },
  {
    slug: "bellevue-wa",
    name: "Bellevue",
    state: "Washington",
    stateCode: "WA",
    lat: 47.6101,
    lng: -122.2015,
    population: "150,000+",
    description:
      "Bellevue yard sales and garage sales often feature high-end items — designer furniture, electronics, and premium brands at a fraction of retail prices.",
  },
  {
    slug: "lakewood-wa",
    name: "Lakewood",
    state: "Washington",
    stateCode: "WA",
    lat: 47.1718,
    lng: -122.5185,
    population: "65,000+",
    description:
      "Lakewood's central location between Tacoma and Olympia makes it a convenient stop for yard sale shoppers hitting multiple sales on a Saturday morning.",
  },

  // Oregon
  {
    slug: "portland-or",
    name: "Portland",
    state: "Oregon",
    stateCode: "OR",
    lat: 45.5152,
    lng: -122.6784,
    population: "650,000+",
    description:
      "Portland is a treasure trove for yard sale and garage sale lovers. From vintage finds in Hawthorne to furniture deals in Northeast, every neighborhood has weekend sales.",
  },

  // California
  {
    slug: "los-angeles-ca",
    name: "Los Angeles",
    state: "California",
    stateCode: "CA",
    lat: 34.0522,
    lng: -118.2437,
    population: "3,900,000+",
    description:
      "LA's year-round warm weather means yard sales and garage sales happen every single weekend. From the Valley to the Westside, there are always deals to find.",
  },
  {
    slug: "san-diego-ca",
    name: "San Diego",
    state: "California",
    stateCode: "CA",
    lat: 32.7157,
    lng: -117.1611,
    population: "1,400,000+",
    description:
      "San Diego's laid-back vibe extends to its garage sale culture. Military families rotating through bases means frequent sales with great household items and furniture.",
  },
  {
    slug: "sacramento-ca",
    name: "Sacramento",
    state: "California",
    stateCode: "CA",
    lat: 38.5816,
    lng: -121.4944,
    population: "525,000+",
    description:
      "Sacramento neighborhoods like Land Park, East Sac, and Midtown host yard sales nearly every weekend from March through October.",
  },
  {
    slug: "san-francisco-ca",
    name: "San Francisco",
    state: "California",
    stateCode: "CA",
    lat: 37.7749,
    lng: -122.4194,
    population: "875,000+",
    description:
      "San Francisco's compact neighborhoods make for easy yard sale hopping. The Sunset, Richmond, and Noe Valley are popular spots for weekend garage sales.",
  },

  // Texas
  {
    slug: "houston-tx",
    name: "Houston",
    state: "Texas",
    stateCode: "TX",
    lat: 29.7604,
    lng: -95.3698,
    population: "2,300,000+",
    description:
      "Houston is one of the biggest yard sale and garage sale cities in the country. Suburban neighborhoods in Katy, Sugar Land, and The Woodlands have massive sales year-round.",
  },
  {
    slug: "dallas-tx",
    name: "Dallas",
    state: "Texas",
    stateCode: "TX",
    lat: 32.7767,
    lng: -96.797,
    population: "1,300,000+",
    description:
      "Dallas and the DFW metroplex are packed with yard sales and estate sales. From Plano to Arlington, there's always a sale within a short drive.",
  },
  {
    slug: "austin-tx",
    name: "Austin",
    state: "Texas",
    stateCode: "TX",
    lat: 30.2672,
    lng: -97.7431,
    population: "980,000+",
    description:
      "Austin's growth means lots of people moving in and out — perfect for yard sales. South Austin, East Austin, and Round Rock are top spots for garage sale finds.",
  },
  {
    slug: "san-antonio-tx",
    name: "San Antonio",
    state: "Texas",
    stateCode: "TX",
    lat: 29.4241,
    lng: -98.4936,
    population: "1,500,000+",
    description:
      "San Antonio has an active yard sale community with sales in neighborhoods across the city. Military base areas are especially good for household and furniture deals.",
  },

  // Florida
  {
    slug: "miami-fl",
    name: "Miami",
    state: "Florida",
    stateCode: "FL",
    lat: 25.7617,
    lng: -80.1918,
    population: "450,000+",
    description:
      "Miami's year-round sunshine means garage sales and yard sales happen every weekend. Check Coral Gables, Coconut Grove, and Kendall for the best finds.",
  },
  {
    slug: "orlando-fl",
    name: "Orlando",
    state: "Florida",
    stateCode: "FL",
    lat: 28.5383,
    lng: -81.3792,
    population: "310,000+",
    description:
      "Orlando's suburban neighborhoods host tons of yard sales every weekend. Winter Park, Lake Nona, and Dr. Phillips are top spots for deals.",
  },
  {
    slug: "tampa-fl",
    name: "Tampa",
    state: "Florida",
    stateCode: "FL",
    lat: 27.9506,
    lng: -82.4572,
    population: "400,000+",
    description:
      "Tampa Bay has one of the most active garage sale communities in Florida. Seminole Heights, South Tampa, and Brandon host sales nearly every weekend.",
  },
  {
    slug: "jacksonville-fl",
    name: "Jacksonville",
    state: "Florida",
    stateCode: "FL",
    lat: 30.3322,
    lng: -81.6557,
    population: "950,000+",
    description:
      "Jacksonville's sprawling neighborhoods mean yard sales are spread out but plentiful. Use YardShoppers to find the best sales and plan your route.",
  },

  // East Coast
  {
    slug: "new-york-ny",
    name: "New York",
    state: "New York",
    stateCode: "NY",
    lat: 40.7128,
    lng: -74.006,
    population: "8,300,000+",
    description:
      "Stoop sales, yard sales, and tag sales are a NYC tradition. Brooklyn, Queens, and Staten Island have the most active weekend sale scenes.",
  },
  {
    slug: "philadelphia-pa",
    name: "Philadelphia",
    state: "Pennsylvania",
    stateCode: "PA",
    lat: 39.9526,
    lng: -75.1652,
    population: "1,600,000+",
    description:
      "Philly's row house neighborhoods are perfect for yard sales and stoop sales. Check South Philly, Fishtown, and Manayunk for the best weekend finds.",
  },
  {
    slug: "atlanta-ga",
    name: "Atlanta",
    state: "Georgia",
    stateCode: "GA",
    lat: 33.749,
    lng: -84.388,
    population: "500,000+",
    description:
      "Atlanta's suburbs — Marietta, Alpharetta, Decatur, and Roswell — are packed with garage sales and estate sales every weekend, especially in spring and fall.",
  },
  {
    slug: "charlotte-nc",
    name: "Charlotte",
    state: "North Carolina",
    stateCode: "NC",
    lat: 35.2271,
    lng: -80.8431,
    population: "880,000+",
    description:
      "Charlotte's growing suburbs mean tons of yard sales and garage sales in neighborhoods like Ballantyne, Huntersville, and Matthews.",
  },

  // Midwest
  {
    slug: "chicago-il",
    name: "Chicago",
    state: "Illinois",
    stateCode: "IL",
    lat: 41.8781,
    lng: -87.6298,
    population: "2,700,000+",
    description:
      "Chicago's garage sale culture is legendary. From Logan Square to Beverly, every neighborhood has weekend sales from May through October.",
  },
  {
    slug: "detroit-mi",
    name: "Detroit",
    state: "Michigan",
    stateCode: "MI",
    lat: 42.3314,
    lng: -83.0458,
    population: "640,000+",
    description:
      "Detroit and its suburbs have some of the best garage sale deals in the Midwest. Royal Oak, Dearborn, and Grosse Pointe are top spots for yard sale shoppers.",
  },
  {
    slug: "minneapolis-mn",
    name: "Minneapolis",
    state: "Minnesota",
    stateCode: "MN",
    lat: 44.9778,
    lng: -93.265,
    population: "430,000+",
    description:
      "Minneapolis garage sales are a summer tradition. Short season means sales are packed into June through August with incredible deals.",
  },
  {
    slug: "columbus-oh",
    name: "Columbus",
    state: "Ohio",
    stateCode: "OH",
    lat: 39.9612,
    lng: -82.9988,
    population: "905,000+",
    description:
      "Columbus neighborhoods like Clintonville, German Village, and Westerville host yard sales and garage sales every weekend through the warmer months.",
  },

  // Southwest
  {
    slug: "phoenix-az",
    name: "Phoenix",
    state: "Arizona",
    stateCode: "AZ",
    lat: 33.4484,
    lng: -112.074,
    population: "1,600,000+",
    description:
      "Phoenix yard sales and garage sales peak in the cooler months — October through April. Scottsdale, Chandler, and Gilbert are top spots for deals.",
  },
  {
    slug: "denver-co",
    name: "Denver",
    state: "Colorado",
    stateCode: "CO",
    lat: 39.7392,
    lng: -104.9903,
    population: "715,000+",
    description:
      "Denver's active outdoor culture means lots of sports gear, bikes, and camping equipment at yard sales. Check Highlands, Park Hill, and Littleton for weekend sales.",
  },
  {
    slug: "las-vegas-nv",
    name: "Las Vegas",
    state: "Nevada",
    stateCode: "NV",
    lat: 36.1699,
    lng: -115.1398,
    population: "650,000+",
    description:
      "Las Vegas has a surprisingly active garage sale scene. Summerlin, Henderson, and North Las Vegas host sales year-round, with fall and spring being the busiest seasons.",
  },

  // Southeast
  {
    slug: "nashville-tn",
    name: "Nashville",
    state: "Tennessee",
    stateCode: "TN",
    lat: 36.1627,
    lng: -86.7816,
    population: "690,000+",
    description:
      "Nashville's growth has created a booming yard sale scene. East Nashville, Germantown, and Franklin are popular spots for weekend garage sales and estate sales.",
  },
  {
    slug: "charleston-sc",
    name: "Charleston",
    state: "South Carolina",
    stateCode: "SC",
    lat: 32.7765,
    lng: -79.9311,
    population: "150,000+",
    description:
      "Charleston's charming neighborhoods host yard sales with unique Southern finds — antique furniture, vintage decor, and handmade goods at great prices.",
  },
  {
    slug: "raleigh-nc",
    name: "Raleigh",
    state: "North Carolina",
    stateCode: "NC",
    lat: 35.7796,
    lng: -78.6382,
    population: "470,000+",
    description:
      "The Raleigh-Durham Triangle area is packed with yard sales and garage sales. Cary, Apex, and Wake Forest are especially active on spring and fall weekends.",
  },

  // Mountain West
  {
    slug: "salt-lake-city-ut",
    name: "Salt Lake City",
    state: "Utah",
    stateCode: "UT",
    lat: 40.7608,
    lng: -111.891,
    population: "200,000+",
    description:
      "Salt Lake City and its suburbs have a strong yard sale culture. Large families mean lots of kids' items, and the outdoor lifestyle brings great gear deals.",
  },
  {
    slug: "boise-id",
    name: "Boise",
    state: "Idaho",
    stateCode: "ID",
    lat: 43.615,
    lng: -116.2023,
    population: "235,000+",
    description:
      "Boise's friendly neighborhoods and growing population create a thriving garage sale scene. The North End, Eagle, and Meridian are top spots for weekend sales.",
  },
];

// Helper functions
export function getAllCities(): City[] {
  return cities.sort((a, b) => a.name.localeCompare(b.name));
}

export function getCityBySlug(slug: string): City | undefined {
  return cities.find((city) => city.slug === slug);
}

export function getCitiesByState(stateCode: string): City[] {
  return cities.filter((city) => city.stateCode === stateCode);
}

export function getNearestCities(
  lat: number,
  lng: number,
  limit = 5,
  excludeSlug?: string
): City[] {
  return cities
    .filter((city) => city.slug !== excludeSlug)
    .map((city) => ({
      ...city,
      distance: Math.sqrt(
        Math.pow(city.lat - lat, 2) + Math.pow(city.lng - lng, 2)
      ),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}

export function getStates(): { name: string; code: string }[] {
  const stateMap = new Map<string, string>();
  cities.forEach((city) => stateMap.set(city.stateCode, city.state));
  return Array.from(stateMap.entries())
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
