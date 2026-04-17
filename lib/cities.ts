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
  // ==============================
  // WASHINGTON STATE (7)
  // ==============================
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

  // ==============================
  // OREGON (1)
  // ==============================
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

  // ==============================
  // CALIFORNIA (8)
  // ==============================
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
  {
    slug: "san-jose-ca",
    name: "San Jose",
    state: "California",
    stateCode: "CA",
    lat: 37.3382,
    lng: -121.8863,
    population: "1,000,000+",
    description:
      "San Jose is the Bay Area's biggest city and a goldmine for yard sales and garage sales. Tech workers upgrading means barely-used electronics and furniture at deep discounts in Willow Glen, Almaden, and Evergreen.",
  },
  {
    slug: "santa-ana-ca",
    name: "Santa Ana",
    state: "California",
    stateCode: "CA",
    lat: 33.7455,
    lng: -117.8677,
    population: "310,000+",
    description:
      "Santa Ana ranks #1 per capita for yard sale treasure hunting in the US. Dense neighborhoods and a vibrant community mean garage sales on nearly every block during spring and summer weekends.",
  },
  {
    slug: "anaheim-ca",
    name: "Anaheim",
    state: "California",
    stateCode: "CA",
    lat: 33.8366,
    lng: -117.9143,
    population: "350,000+",
    description:
      "Anaheim is a top-ranked treasure hunting city for yard sales and garage sales. Families near the resort area and in neighborhoods like Anaheim Hills host weekend sales packed with great deals.",
  },
  {
    slug: "riverside-ca",
    name: "Riverside",
    state: "California",
    stateCode: "CA",
    lat: 33.9533,
    lng: -117.3962,
    population: "315,000+",
    description:
      "Riverside is a SoCal hotspot for yard sales and garage sales. Spacious lots in neighborhoods like Canyon Crest, Arlington, and La Sierra make for big, well-stocked sales year-round.",
  },
  {
    slug: "long-beach-ca",
    name: "Long Beach",
    state: "California",
    stateCode: "CA",
    lat: 33.7701,
    lng: -118.1937,
    population: "465,000+",
    description:
      "Long Beach is a top 5 treasure hunting city for garage sales and yard sales. Belmont Shore, Bixby Knolls, and Naples host frequent weekend sales with coastal finds and vintage goods.",
  },
  {
    slug: "fresno-ca",
    name: "Fresno",
    state: "California",
    stateCode: "CA",
    lat: 36.7378,
    lng: -119.7871,
    population: "540,000+",
    description:
      "Fresno's affordable neighborhoods and large yards make it a prime spot for garage sales and yard sales. Fig Garden, Tower District, and Clovis are popular areas for weekend sales.",
  },

  // ==============================
  // TEXAS (8)
  // ==============================
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
  {
    slug: "fort-worth-tx",
    name: "Fort Worth",
    state: "Texas",
    stateCode: "TX",
    lat: 32.7555,
    lng: -97.3308,
    population: "960,000+",
    description:
      "Fort Worth ranks #6 nationally for yard sale and garage sale activity. Neighborhoods like Arlington Heights, Southlake, and Keller host massive weekend sales with furniture, tools, and western goods.",
  },
  {
    slug: "arlington-tx",
    name: "Arlington",
    state: "Texas",
    stateCode: "TX",
    lat: 32.7357,
    lng: -97.1081,
    population: "395,000+",
    description:
      "Arlington sits right between Dallas and Fort Worth, making it a top yard sale and garage sale destination. Family-heavy neighborhoods mean tons of kids' items, furniture, and household goods every weekend.",
  },
  {
    slug: "plano-tx",
    name: "Plano",
    state: "Texas",
    stateCode: "TX",
    lat: 33.0198,
    lng: -96.6989,
    population: "290,000+",
    description:
      "Plano ranks in the top 15 nationally for garage sale activity. Upscale neighborhoods mean high-quality items at yard sale prices — designer clothing, electronics, and premium furniture are common finds.",
  },
  {
    slug: "el-paso-tx",
    name: "El Paso",
    state: "Texas",
    stateCode: "TX",
    lat: 31.7619,
    lng: -106.485,
    population: "680,000+",
    description:
      "El Paso's military community and warm climate make it a year-round garage sale destination. Fort Bliss families host frequent sales, and neighborhoods on the Westside and Eastside are packed with deals.",
  },

  // ==============================
  // FLORIDA (5)
  // ==============================
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
  {
    slug: "st-petersburg-fl",
    name: "St. Petersburg",
    state: "Florida",
    stateCode: "FL",
    lat: 27.7676,
    lng: -82.6403,
    population: "260,000+",
    description:
      "St. Petersburg is a top treasure hunting city for yard sales and garage sales. Historic neighborhoods like Old Northeast, Kenwood, and Shore Acres host vibrant weekend sales with vintage and antique finds.",
  },

  // ==============================
  // NEW YORK (1)
  // ==============================
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

  // ==============================
  // PENNSYLVANIA (1)
  // ==============================
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

  // ==============================
  // GEORGIA (1)
  // ==============================
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

  // ==============================
  // NORTH CAROLINA (2)
  // ==============================
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

  // ==============================
  // ILLINOIS (1)
  // ==============================
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

  // ==============================
  // MICHIGAN (1)
  // ==============================
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

  // ==============================
  // MINNESOTA (1)
  // ==============================
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

  // ==============================
  // OHIO (1)
  // ==============================
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

  // ==============================
  // ARIZONA (3)
  // ==============================
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
    slug: "scottsdale-az",
    name: "Scottsdale",
    state: "Arizona",
    stateCode: "AZ",
    lat: 33.4942,
    lng: -111.9261,
    population: "240,000+",
    description:
      "Scottsdale ranks #8 for treasure hunting at yard sales and garage sales. Upscale neighborhoods mean high-value finds — designer furniture, art, and luxury items at a fraction of retail prices.",
  },
  {
    slug: "tucson-az",
    name: "Tucson",
    state: "Arizona",
    stateCode: "AZ",
    lat: 32.2226,
    lng: -110.9747,
    population: "545,000+",
    description:
      "Tucson's cooler fall and winter months are prime time for garage sales and yard sales. Neighborhoods like Sam Hughes, Catalina Foothills, and midtown host sales packed with Southwestern finds.",
  },
  {
    slug: "mesa-az",
    name: "Mesa",
    state: "Arizona",
    stateCode: "AZ",
    lat: 33.4152,
    lng: -111.8315,
    population: "510,000+",
    description:
      "Mesa is one of Arizona's largest cities and a top spot for yard sales and garage sales. Retirement communities and family neighborhoods mean diverse finds from antiques to kids' gear.",
  },

  // ==============================
  // COLORADO (2)
  // ==============================
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
    slug: "colorado-springs-co",
    name: "Colorado Springs",
    state: "Colorado",
    stateCode: "CO",
    lat: 38.8339,
    lng: -104.8214,
    population: "480,000+",
    description:
      "Colorado Springs has a booming garage sale scene fueled by military families at Fort Carson and Peterson. Briargate, Old Colorado City, and Fountain are packed with sales every weekend.",
  },

  // ==============================
  // NEVADA (1)
  // ==============================
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

  // ==============================
  // TENNESSEE (2)
  // ==============================
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
    slug: "memphis-tn",
    name: "Memphis",
    state: "Tennessee",
    stateCode: "TN",
    lat: 35.1495,
    lng: -90.049,
    population: "630,000+",
    description:
      "Memphis is a major Southern market for yard sales and garage sales. Midtown, East Memphis, and Germantown host frequent sales with furniture, antiques, and Southern charm finds.",
  },

  // ==============================
  // SOUTH CAROLINA (1)
  // ==============================
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

  // ==============================
  // UTAH (1)
  // ==============================
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

  // ==============================
  // IDAHO (1)
  // ==============================
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

  // ==============================
  // INDIANA (1)
  // ==============================
  {
    slug: "indianapolis-in",
    name: "Indianapolis",
    state: "Indiana",
    stateCode: "IN",
    lat: 39.7684,
    lng: -86.1581,
    population: "880,000+",
    description:
      "Indianapolis ranks #8 nationally for yard sale and garage sale activity. Broad Ripple, Carmel, and Fishers have massive weekend sales, and the famous US 127 Corridor Sale passes right through Indiana.",
  },

  // ==============================
  // KANSAS (1)
  // ==============================
  {
    slug: "wichita-ks",
    name: "Wichita",
    state: "Kansas",
    stateCode: "KS",
    lat: 37.6872,
    lng: -97.3301,
    population: "400,000+",
    description:
      "Wichita ranks #9 nationally for garage sale activity. The city's affordable neighborhoods and Midwestern culture make weekend yard sales a way of life in College Hill, Riverside, and Eastborough.",
  },

  // ==============================
  // MISSOURI (1)
  // ==============================
  {
    slug: "kansas-city-mo",
    name: "Kansas City",
    state: "Missouri",
    stateCode: "MO",
    lat: 39.0997,
    lng: -94.5786,
    population: "510,000+",
    description:
      "Kansas City is a top market for antiques and vintage finds at yard sales, garage sales, and estate sales. Brookside, Waldo, and the Northland host packed weekend sales with unique Midwest treasures.",
  },

  // ==============================
  // WISCONSIN (1)
  // ==============================
  {
    slug: "milwaukee-wi",
    name: "Milwaukee",
    state: "Wisconsin",
    stateCode: "WI",
    lat: 43.0389,
    lng: -87.9065,
    population: "575,000+",
    description:
      "Milwaukee has a massive Midwest garage sale culture. Bay View, Wauwatosa, and the Third Ward host sales from May through September, with city-wide rummage sale events drawing thousands.",
  },

  // ==============================
  // OKLAHOMA (1)
  // ==============================
  {
    slug: "oklahoma-city-ok",
    name: "Oklahoma City",
    state: "Oklahoma",
    stateCode: "OK",
    lat: 35.4676,
    lng: -97.5164,
    population: "700,000+",
    description:
      "Oklahoma City has an active garage sale culture with affordable finds across the metro. Edmond, Norman, and Nichols Hills host frequent weekend sales, and the annual citywide events are legendary.",
  },

  // ==============================
  // WASHINGTON DC (1)
  // ==============================
  {
    slug: "washington-dc",
    name: "Washington",
    state: "District of Columbia",
    stateCode: "DC",
    lat: 38.9072,
    lng: -77.0369,
    population: "700,000+",
    description:
      "DC's yard sales and stoop sales are packed with unique finds from government workers, diplomats, and military families rotating in and out. Georgetown, Capitol Hill, and Petworth are top spots.",
  },

  // ==============================
  // MASSACHUSETTS (1)
  // ==============================
  {
    slug: "boston-ma",
    name: "Boston",
    state: "Massachusetts",
    stateCode: "MA",
    lat: 42.3601,
    lng: -71.0589,
    population: "675,000+",
    description:
      "Boston's tag sale and yard sale scene peaks during college move-out season in May and September. Allston, Jamaica Plain, Brookline, and Cambridge are goldmines for furniture, books, and electronics.",
  },

  // ==============================
  // KENTUCKY (1)
  // ==============================
  {
    slug: "louisville-ky",
    name: "Louisville",
    state: "Kentucky",
    stateCode: "KY",
    lat: 38.2527,
    lng: -85.7585,
    population: "630,000+",
    description:
      "Louisville's neighborhoods have a strong yard sale and garage sale tradition. The Highlands, St. Matthews, and Middletown host frequent weekend sales, and Kentucky's famous 400-Mile Yard Sale runs through the region.",
  },

  // ==============================
  // MARYLAND (1)
  // ==============================
  {
    slug: "baltimore-md",
    name: "Baltimore",
    state: "Maryland",
    stateCode: "MD",
    lat: 39.2904,
    lng: -76.6122,
    population: "575,000+",
    description:
      "Baltimore's row house neighborhoods make for walkable stoop sales and yard sales. Hampden, Canton, Federal Hill, and Towson host frequent weekend sales with vintage finds and household deals.",
  },

  // ==============================
  // NEW MEXICO (1)
  // ==============================
  {
    slug: "albuquerque-nm",
    name: "Albuquerque",
    state: "New Mexico",
    stateCode: "NM",
    lat: 35.0844,
    lng: -106.6504,
    population: "560,000+",
    description:
      "Albuquerque's affordable cost of living and spacious homes fuel a year-round garage sale scene. Nob Hill, the North Valley, and Rio Rancho host weekend sales with unique Southwestern art and decor.",
  },

  // ==============================
  // NEBRASKA (1)
  // ==============================
  {
    slug: "omaha-ne",
    name: "Omaha",
    state: "Nebraska",
    stateCode: "NE",
    lat: 41.2565,
    lng: -95.9345,
    population: "490,000+",
    description:
      "Omaha's family-friendly neighborhoods are packed with yard sales and garage sales from May through September. Dundee, Benson, and Elkhorn are top spots for weekend bargain hunting.",
  },

  // ==============================
  // VIRGINIA (1)
  // ==============================
  {
    slug: "virginia-beach-va",
    name: "Virginia Beach",
    state: "Virginia",
    stateCode: "VA",
    lat: 36.8529,
    lng: -75.978,
    population: "460,000+",
    description:
      "Virginia Beach's large military community means constant turnover and frequent yard sales and garage sales. Kempsville, Great Neck, and Red Mill are popular spots, with sales happening year-round.",
  },

  // ==============================
  // LOUISIANA (1)
  // ==============================
  {
    slug: "new-orleans-la",
    name: "New Orleans",
    state: "Louisiana",
    stateCode: "LA",
    lat: 29.9511,
    lng: -90.0715,
    population: "380,000+",
    description:
      "New Orleans yard sales are as unique as the city itself. Uptown, Mid-City, and the Garden District host sales filled with vintage treasures, antiques, and one-of-a-kind NOLA finds.",
  },

  // ==============================
  // HAWAII (1)
  // ==============================
  {
    slug: "honolulu-hi",
    name: "Honolulu",
    state: "Hawaii",
    stateCode: "HI",
    lat: 21.3069,
    lng: -157.8583,
    population: "350,000+",
    description:
      "Honolulu's military families and island lifestyle create a unique garage sale scene. Kailua, Hawaii Kai, and Mililani host frequent sales with everything from surfboards and outdoor gear to household essentials.",
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
