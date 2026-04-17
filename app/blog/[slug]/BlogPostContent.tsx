"use client";

import Link from "next/link";

interface Props {
  slug: string;
}

export default function BlogPostContent({ slug }: Props) {
  const content: Record<string, React.ReactNode> = {
    "how-to-have-a-successful-yard-sale": (
      <div className="prose prose-gray max-w-none">
        <p>
          Hosting a yard sale (or garage sale — same thing, different name) is
          one of the easiest ways to declutter your home and make hundreds of
          dollars in a single weekend. But the difference between a sale that
          makes $50 and one that makes $500 usually comes down to preparation.
        </p>
        <p>
          Whether you&apos;re a first-time seller or a seasoned pro, this
          complete guide covers everything you need to plan, price, promote, and
          profit from your next yard sale or garage sale.
        </p>

        <h2>1. Pick the Right Date and Time</h2>
        <p>
          Timing is everything. Saturday mornings are the gold standard for yard
          sales and garage sales — most buyers are free and actively looking.
          Here&apos;s what works best:
        </p>
        <ul>
          <li>
            <strong>Best days:</strong> Saturday, or Friday + Saturday for a
            two-day sale
          </li>
          <li>
            <strong>Best months:</strong> April through June, and September
            through October
          </li>
          <li>
            <strong>Best start time:</strong> 7:00 or 8:00 AM — early birds are
            your best customers
          </li>
          <li>
            <strong>Avoid:</strong> Holiday weekends (Memorial Day, Labor Day,
            4th of July) — people travel instead of shop
          </li>
        </ul>

        <h2>2. Sort and Prep Your Items</h2>
        <p>
          Go room by room and pull out everything you no longer need. Be
          ruthless. If you haven&apos;t used it in a year, it&apos;s a
          candidate. Group items into categories:
        </p>
        <ul>
          <li>Furniture</li>
          <li>Electronics</li>
          <li>Clothing and shoes</li>
          <li>Kitchen and home goods</li>
          <li>Toys and games</li>
          <li>Books and media</li>
          <li>Tools and outdoor gear</li>
        </ul>
        <p>
          Clean everything before the sale. Wipe down surfaces, test
          electronics, wash clothing. Clean items sell for significantly more
          than dusty ones.
        </p>

        <h2>3. Price Everything (Seriously, Everything)</h2>
        <p>
          The number one mistake at yard sales and garage sales is not pricing
          items. Shoppers will skip anything without a price tag — they don&apos;t
          want the awkwardness of asking. Use stickers, masking tape, or hang
          tags on every single item.
        </p>
        <p>General pricing guidelines:</p>
        <ul>
          <li>
            <strong>Clothing:</strong> $1–$5 per item ($0.50 for kids&apos;
            clothes)
          </li>
          <li>
            <strong>Books:</strong> $0.50–$2 each
          </li>
          <li>
            <strong>Electronics:</strong> 10–20% of retail price
          </li>
          <li>
            <strong>Furniture:</strong> 20–30% of retail price
          </li>
          <li>
            <strong>Kitchen items:</strong> $0.50–$3 each
          </li>
          <li>
            <strong>Toys:</strong> $0.50–$5 each
          </li>
        </ul>
        <p>
          When in doubt, price lower. Your goal is to sell it — not store it
          again. You can always negotiate up, but overpriced items just go back
          in the garage.
        </p>

        <h2>4. Set Up Like a Store</h2>
        <p>
          Presentation matters more than you think. Buyers are more likely to
          stop when your sale looks organized and inviting:
        </p>
        <ul>
          <li>
            Use tables — never put items on the ground (except large furniture)
          </li>
          <li>Hang clothing on a rack or clothesline</li>
          <li>Group similar items together (all kitchen stuff on one table)</li>
          <li>Put your best, most eye-catching items near the road</li>
          <li>
            Set up a &quot;Free&quot; box near the entrance to draw people in
          </li>
        </ul>

        <h2>5. Make Signs That Actually Work</h2>
        <p>
          Your signs are your advertising. Most buyers find garage sales and
          yard sales by driving around and spotting signs. Here&apos;s what
          works:
        </p>
        <ul>
          <li>
            <strong>Big, bold letters</strong> on bright poster board
            (fluorescent colors stand out)
          </li>
          <li>
            <strong>Include:</strong> &quot;YARD SALE&quot; or &quot;GARAGE
            SALE,&quot; your address, date, and an arrow
          </li>
          <li>
            <strong>Place at least 5 signs</strong> at major intersections
            within a mile of your home
          </li>
          <li>
            <strong>Don&apos;t:</strong> Use small handwriting, too many words,
            or plain white paper
          </li>
        </ul>

        <h2>6. Promote Online</h2>
        <p>
          Signs are great, but online promotion reaches 10x more people. Post
          your sale on:
        </p>
        <ul>
          <li>
            <strong>
              <Link
                href="/post"
                className="text-ys-800 hover:underline"
              >
                YardShoppers
              </Link>
            </strong>{" "}
            — upload photos, set your date, and reach local buyers
          </li>
          <li>Facebook Marketplace and local Facebook groups</li>
          <li>Craigslist (garage sales section)</li>
          <li>Nextdoor</li>
        </ul>
        <p>
          Include photos of your best items. Listings with photos get
          significantly more interest than text-only posts.
        </p>

        <h2>7. Be Ready for Early Birds</h2>
        <p>
          Experienced yard sale and garage sale shoppers show up early —
          sometimes 30 minutes before your posted start time. Decide in advance
          whether you&apos;ll allow early shopping or hold firm on your start
          time. Either way, have everything set up and priced the night before.
        </p>

        <h2>8. Have Change and Payment Options Ready</h2>
        <p>
          Start the day with at least $50 in small bills and coins. A good
          breakdown:
        </p>
        <ul>
          <li>20 × $1 bills</li>
          <li>2 × $5 bills</li>
          <li>1 × $10 bill</li>
          <li>$5 in quarters</li>
        </ul>
        <p>
          Consider accepting Venmo, Cash App, or Zelle for larger items.
          Mention it on a sign at your checkout table — it removes a barrier
          for buyers who don&apos;t carry cash.
        </p>

        <h2>9. Drop Prices as the Day Goes On</h2>
        <p>
          After lunch, cut prices by 50%. In the last hour, consider a &quot;fill
          a bag for $5&quot; deal. Your goal is to sell everything, not pack it
          back up.
        </p>

        <h2>10. Plan for Leftovers</h2>
        <p>
          Schedule a donation pickup for the same afternoon. Goodwill,
          Salvation Army, Habitat for Humanity ReStore, and local charities will
          often pick up for free. Whatever&apos;s left goes straight into the
          donation pile — not back into your house.
        </p>

        <div className="bg-ys-50 border border-ys-200 rounded-xl p-6 mt-8 not-prose">
          <h3 className="font-bold text-gray-900 mb-2">
            Quick Yard Sale Checklist
          </h3>
          <ul className="space-y-1.5 text-sm text-gray-700">
            {[
              "Pick a date (Saturday morning is best)",
              "Sort items room by room",
              "Clean and test everything",
              "Price every item with stickers or tags",
              "Get tables, racks, and display supplies",
              "Make 5+ large, bright signs",
              "Post on YardShoppers and social media",
              "Get $50 in small bills and coins",
              "Set up the night before",
              "Drop prices after noon",
              "Schedule donation pickup for leftover items",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <i
                  className="fa-regular fa-square text-ys-600 mt-0.5"
                  aria-hidden="true"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    ),

    "best-things-to-buy-at-yard-sales": (
      <div className="prose prose-gray max-w-none">
        <p>
          Yard sales and garage sales are treasure hunts in disguise. You can
          find incredible deals on things that cost a fortune at retail — if
          you know what to look for. Here are the 25 best things to buy at
          yard sales, plus a few items you should always skip.
        </p>

        <h2>The 25 Best Yard Sale &amp; Garage Sale Finds</h2>

        <h3>Furniture (Best Deals at Any Sale)</h3>
        <ol>
          <li>
            <strong>Solid wood furniture</strong> — Dressers, bookshelves, and
            tables made from real wood last decades. You&apos;ll pay $10–$50
            for pieces that cost $200+ new.
          </li>
          <li>
            <strong>Patio furniture</strong> — Outdoor chairs, tables, and
            umbrellas are heavily discounted at garage sales because they&apos;re
            bulky to store.
          </li>
          <li>
            <strong>Desks and office chairs</strong> — Remote work furniture is
            everywhere at yard sales now. Great quality at 80% off.
          </li>
        </ol>

        <h3>Kitchen &amp; Home</h3>
        <ol start={4}>
          <li>
            <strong>Cast iron cookware</strong> — A $3 cast iron skillet from a
            yard sale works just as well as a $40 new one. They last forever.
          </li>
          <li>
            <strong>Small appliances</strong> — KitchenAid mixers, Instant
            Pots, blenders, and coffee makers often show up barely used.
          </li>
          <li>
            <strong>Picture frames</strong> — Frames are wildly overpriced at
            retail. Buy them for $1–$2 at garage sales.
          </li>
          <li>
            <strong>Storage containers and baskets</strong> — Organizing
            supplies for pennies on the dollar.
          </li>
        </ol>

        <h3>Kids &amp; Baby</h3>
        <ol start={8}>
          <li>
            <strong>Kids&apos; clothing</strong> — Children outgrow clothes so
            fast. Find barely-worn outfits for $0.50–$2.
          </li>
          <li>
            <strong>Toys and games</strong> — Board games, LEGO sets, and
            outdoor toys at 90% off retail.
          </li>
          <li>
            <strong>Kids&apos; bikes</strong> — They outgrow bikes every couple
            of years. $10–$20 for a bike that works perfectly.
          </li>
        </ol>

        <h3>Books, Media &amp; Entertainment</h3>
        <ol start={11}>
          <li>
            <strong>Books</strong> — The ultimate yard sale deal. $0.25–$1 per
            book, often in great condition.
          </li>
          <li>
            <strong>Board games and puzzles</strong> — Check that all pieces
            are included, and you&apos;ve got family game nights for $1–$3 each.
          </li>
          <li>
            <strong>Musical instruments</strong> — Guitars, keyboards, and
            beginner instruments show up regularly at estate sales.
          </li>
        </ol>

        <h3>Tools &amp; Outdoor</h3>
        <ol start={14}>
          <li>
            <strong>Hand tools</strong> — Hammers, screwdrivers, wrenches, and
            pliers for $0.50–$2 each. Quality tools last forever.
          </li>
          <li>
            <strong>Garden tools</strong> — Shovels, rakes, hoses, and pots at
            a fraction of hardware store prices.
          </li>
          <li>
            <strong>Power tools</strong> — Test them first, but drills, sanders,
            and saws can be incredible deals.
          </li>
          <li>
            <strong>Ladders</strong> — Expensive new, cheap at yard sales.
            Check for stability before buying.
          </li>
        </ol>

        <h3>Sports &amp; Fitness</h3>
        <ol start={18}>
          <li>
            <strong>Exercise equipment</strong> — Dumbbells, yoga mats, and
            resistance bands are garage sale staples.
          </li>
          <li>
            <strong>Golf clubs</strong> — Full sets for $20–$50 that cost
            hundreds new.
          </li>
          <li>
            <strong>Bikes</strong> — Adult bikes in good condition for $20–$75.
          </li>
        </ol>

        <h3>Clothing &amp; Accessories</h3>
        <ol start={21}>
          <li>
            <strong>Brand-name clothing</strong> — Look for quality brands at
            $1–$5 per piece. Check for stains and wear.
          </li>
          <li>
            <strong>Jewelry</strong> — Costume jewelry is fun and cheap.
            Occasionally you&apos;ll find real pieces at estate sales.
          </li>
          <li>
            <strong>Handbags and purses</strong> — Designer bags show up more
            often than you&apos;d think.
          </li>
        </ol>

        <h3>Hidden Gems</h3>
        <ol start={24}>
          <li>
            <strong>Vintage and antiques</strong> — Old signs, vinyl records,
            vintage glassware, and retro decor can be worth far more than the
            asking price.
          </li>
          <li>
            <strong>Holiday decorations</strong> — Christmas, Halloween, and
            Easter decorations for 90% off. Stock up in the off-season.
          </li>
        </ol>

        <h2>What to Skip at Yard Sales</h2>
        <p>Not everything is a deal. Avoid these:</p>
        <ul>
          <li>
            <strong>Car seats and helmets</strong> — Safety equipment expires
            and you can&apos;t verify its history
          </li>
          <li>
            <strong>Mattresses</strong> — Hygiene concerns and no way to test
            for bed bugs
          </li>
          <li>
            <strong>Cribs</strong> — Safety standards change frequently; older
            cribs may not meet current requirements
          </li>
          <li>
            <strong>Underwear and swimwear</strong> — For obvious hygiene
            reasons
          </li>
          <li>
            <strong>Recalled items</strong> — No way to verify if an item has
            been recalled
          </li>
          <li>
            <strong>Old paint</strong> — May contain lead and is hard to
            dispose of
          </li>
        </ul>

        <h2>Pro Tips for Yard Sale &amp; Garage Sale Shoppers</h2>
        <ul>
          <li>Arrive early for the best selection</li>
          <li>Bring small bills — sellers may not have change</li>
          <li>
            Always negotiate — politely ask &quot;Would you take $___?&quot;
          </li>
          <li>
            Check items carefully — test electronics, open boxes, inspect for
            damage
          </li>
          <li>
            Use the{" "}
            <Link href="/route-planner" className="text-ys-800 hover:underline">
              YardShoppers Route Planner
            </Link>{" "}
            to hit multiple sales in one trip
          </li>
        </ul>
      </div>
    ),

    "how-to-price-items-for-yard-sale": (
      <div className="prose prose-gray max-w-none">
        <p>
          Pricing is the hardest part of hosting a yard sale or garage sale.
          Price too high and nothing sells. Price too low and you leave money on
          the table. This guide gives you real-world pricing examples for every
          category so you can price with confidence.
        </p>

        <h2>The Golden Rule of Yard Sale Pricing</h2>
        <p>
          Most items should be priced at <strong>10–30% of their original
          retail price</strong>, depending on condition. If it&apos;s brand new
          with tags, go up to 50%. If it&apos;s well-worn, go under 10%.
        </p>
        <p>
          Remember: your goal is to sell it today. An item priced at $3 that
          sells is better than an item priced at $10 that goes back in the
          garage.
        </p>

        <h2>Pricing Guide by Category</h2>

        <h3>Clothing</h3>
        <ul>
          <li>Adult clothing: $2–$5 per item</li>
          <li>Kids&apos; clothing: $0.50–$2 per item</li>
          <li>Baby clothing: $0.25–$1 per item</li>
          <li>Winter coats and jackets: $5–$15</li>
          <li>Shoes: $2–$10 depending on brand and condition</li>
          <li>Designer or name brand: $5–$20</li>
        </ul>

        <h3>Electronics</h3>
        <ul>
          <li>Smartphones (older models): $20–$50</li>
          <li>Tablets: $15–$75</li>
          <li>Laptops: $30–$150</li>
          <li>TVs (non-smart, older): $10–$30</li>
          <li>Smart TVs: $50–$150</li>
          <li>Bluetooth speakers: $5–$15</li>
          <li>Video game consoles: $25–$75</li>
          <li>Video games: $2–$10 each</li>
        </ul>

        <h3>Furniture</h3>
        <ul>
          <li>Bookshelves: $5–$25</li>
          <li>Dressers: $15–$50</li>
          <li>Dining tables: $20–$75</li>
          <li>Dining chairs: $5–$15 each</li>
          <li>Couches and sofas: $25–$100</li>
          <li>Desks: $10–$40</li>
          <li>Nightstands: $5–$15</li>
          <li>Patio furniture set: $20–$75</li>
        </ul>

        <h3>Kitchen &amp; Home</h3>
        <ul>
          <li>Pots and pans: $1–$5 each</li>
          <li>Cast iron cookware: $3–$10</li>
          <li>Small appliances (blender, toaster): $3–$10</li>
          <li>KitchenAid mixer: $30–$75</li>
          <li>Dishes and plates (set): $3–$10</li>
          <li>Glasses and mugs: $0.25–$1 each</li>
          <li>Lamps: $3–$10</li>
          <li>Picture frames: $1–$3</li>
          <li>Curtains and linens: $1–$5</li>
        </ul>

        <h3>Kids &amp; Toys</h3>
        <ul>
          <li>Board games: $1–$3</li>
          <li>LEGO sets: $3–$15</li>
          <li>Action figures and dolls: $0.50–$3</li>
          <li>Stuffed animals: $0.25–$1</li>
          <li>Kids&apos; bikes: $10–$25</li>
          <li>Strollers: $10–$30</li>
          <li>High chairs: $5–$15</li>
        </ul>

        <h3>Books &amp; Media</h3>
        <ul>
          <li>Paperback books: $0.25–$0.50</li>
          <li>Hardcover books: $0.50–$2</li>
          <li>Coffee table books: $2–$5</li>
          <li>DVDs and Blu-rays: $1–$3</li>
          <li>Vinyl records: $0.50–$5</li>
        </ul>

        <h3>Tools &amp; Outdoor</h3>
        <ul>
          <li>Hand tools: $0.50–$3 each</li>
          <li>Power tools: $10–$40</li>
          <li>Lawn mower: $25–$75</li>
          <li>Garden tools: $1–$5 each</li>
          <li>Hoses: $2–$5</li>
        </ul>

        <h3>Sports &amp; Fitness</h3>
        <ul>
          <li>Dumbbells: $0.25–$0.50 per pound</li>
          <li>Yoga mats: $2–$5</li>
          <li>Golf clubs (set): $15–$50</li>
          <li>Tennis rackets: $3–$10</li>
          <li>Adult bikes: $20–$75</li>
        </ul>

        <h2>Pricing Pro Tips</h2>
        <ul>
          <li>
            <strong>Use round numbers</strong> — $1, $2, $5, $10. Makes making
            change easy
          </li>
          <li>
            <strong>Bundle items</strong> — &quot;All books $1 each or 5 for
            $3&quot;
          </li>
          <li>
            <strong>Drop prices after noon</strong> — 50% off after lunch to
            move remaining inventory
          </li>
          <li>
            <strong>Last hour: &quot;Fill a bag for $5&quot;</strong> — clears
            out everything
          </li>
          <li>
            <strong>Be ready to negotiate</strong> — price 20% above your
            minimum so you have room to come down
          </li>
        </ul>

        <div className="bg-ys-50 border border-ys-200 rounded-xl p-6 mt-8 not-prose">
          <h3 className="font-bold text-gray-900 mb-2">
            Ready to list your sale?
          </h3>
          <p className="text-sm text-gray-600">
            Now that your items are priced,{" "}
            <Link
              href="/post"
              className="text-ys-800 font-semibold hover:underline"
            >
              post your yard sale on YardShoppers
            </Link>{" "}
            for free and reach thousands of local buyers.
          </p>
        </div>
      </div>
    ),

    "spring-yard-sale-season-guide": (
      <div className="prose prose-gray max-w-none">
        <p>
          Spring is officially yard sale and garage sale season. As the weather
          warms up, neighborhoods across the country come alive with sales
          every weekend. Whether you&apos;re buying or selling, here&apos;s
          everything you need to know about spring yard sale season 2026.
        </p>

        <h2>When Does Yard Sale Season Start?</h2>
        <p>
          It depends on your region, but generally yard sale and garage sale
          season kicks off:
        </p>
        <ul>
          <li>
            <strong>Southern states:</strong> Late February to early March
          </li>
          <li>
            <strong>Mid-Atlantic and Midwest:</strong> Late March to April
          </li>
          <li>
            <strong>Northeast and Pacific Northwest:</strong> April to May
          </li>
        </ul>
        <p>
          The sweet spot nationwide is <strong>April through June</strong> —
          warm enough to set up outside, before the summer heat drives people
          indoors.
        </p>

        <h2>Why Spring Is the Best Time to Sell</h2>
        <ul>
          <li>
            <strong>Spring cleaning energy:</strong> People are already
            decluttering. Channel that energy into a profitable sale.
          </li>
          <li>
            <strong>More foot traffic:</strong> Buyers are out and actively
            looking after being cooped up all winter.
          </li>
          <li>
            <strong>Perfect weather:</strong> Not too hot, not too cold — ideal
            for outdoor shopping.
          </li>
          <li>
            <strong>Community sales:</strong> Many neighborhoods organize
            multi-family or block-wide yard sales in spring, which brings
            massive traffic.
          </li>
        </ul>

        <h2>How to Find Yard Sales and Garage Sales Near You</h2>
        <p>Gone are the days of driving around looking for signs. Here&apos;s
          how to find sales in 2026:
        </p>
        <ol>
          <li>
            <strong>
              <Link href="/browse" className="text-ys-800 hover:underline">
                Browse YardShoppers
              </Link>
            </strong>{" "}
            — search by location, category, and date to find sales near you
          </li>
          <li>
            <strong>
              <Link
                href="/route-planner"
                className="text-ys-800 hover:underline"
              >
                Plan your route
              </Link>
            </strong>{" "}
            — use our route planner to hit multiple sales in one trip
          </li>
          <li>Check Facebook Marketplace and local community groups</li>
          <li>Look on Craigslist under &quot;garage sales&quot;</li>
          <li>Ask on Nextdoor — neighbors often post about upcoming sales</li>
        </ol>

        <h2>Spring Yard Sale Buyer Tips</h2>
        <ul>
          <li>
            <strong>Go early</strong> — the best stuff sells in the first hour
          </li>
          <li>
            <strong>Bring cash</strong> — small bills and coins, plus a
            phone payment app as backup
          </li>
          <li>
            <strong>Bring bags and boxes</strong> — sellers don&apos;t always
            have them
          </li>
          <li>
            <strong>Measure first</strong> — if you&apos;re looking for
            furniture, know your space dimensions before you go
          </li>
          <li>
            <strong>Hit multiple sales</strong> — use the{" "}
            <Link
              href="/route-planner"
              className="text-ys-800 hover:underline"
            >
              YardShoppers Route Planner
            </Link>{" "}
            to maximize your morning
          </li>
        </ul>

        <h2>Spring Yard Sale Seller Tips</h2>
        <ul>
          <li>
            <strong>Post early</strong> —{" "}
            <Link href="/post" className="text-ys-800 hover:underline">
              list your sale on YardShoppers
            </Link>{" "}
            at least 3–5 days before your sale date
          </li>
          <li>
            <strong>Take photos</strong> — listings with photos get far more
            views
          </li>
          <li>
            <strong>Join community sales</strong> — if your neighborhood is
            having a multi-family sale, join in for maximum traffic
          </li>
          <li>
            <strong>Watch the weather</strong> — have a rain date ready and
            update your listing if you need to reschedule
          </li>
        </ul>

        <h2>What Sells Best in Spring</h2>
        <p>Certain items are in high demand during spring yard sale season:</p>
        <ul>
          <li>Outdoor and patio furniture</li>
          <li>Garden tools and planters</li>
          <li>Bikes and outdoor sports gear</li>
          <li>Spring and summer clothing</li>
          <li>Grills and BBQ equipment</li>
          <li>Kids&apos; toys and outdoor play equipment</li>
        </ul>
      </div>
    ),

    "garage-sale-vs-yard-sale-vs-estate-sale": (
      <div className="prose prose-gray max-w-none">
        <p>
          Yard sale, garage sale, tag sale, rummage sale, estate sale — there
          are a lot of names for what seems like the same thing. But there are
          real differences, and knowing them helps whether you&apos;re buying or
          selling. Here&apos;s the breakdown.
        </p>

        <h2>Yard Sale</h2>
        <p>
          A <strong>yard sale</strong> is exactly what it sounds like — a sale
          held in someone&apos;s front yard or driveway. Items are typically
          displayed on tables, blankets, or the ground. It&apos;s the most
          common and casual type of sale.
        </p>
        <ul>
          <li>
            <strong>Location:</strong> Front yard, driveway, or sidewalk
          </li>
          <li>
            <strong>Who runs it:</strong> The homeowner
          </li>
          <li>
            <strong>What&apos;s sold:</strong> Household items, clothing, toys,
            furniture, electronics — whatever the homeowner wants to get rid of
          </li>
          <li>
            <strong>Price range:</strong> Very affordable — most items under $20
          </li>
        </ul>

        <h2>Garage Sale</h2>
        <p>
          A <strong>garage sale</strong> is functionally identical to a yard
          sale — the only difference is the items are displayed inside the
          garage instead of on the lawn. In many parts of the country,
          &quot;garage sale&quot; and &quot;yard sale&quot; are used
          interchangeably.
        </p>
        <ul>
          <li>
            <strong>Location:</strong> Inside the garage with the door open
          </li>
          <li>
            <strong>Advantage:</strong> Weather-proof — rain doesn&apos;t cancel
            a garage sale
          </li>
          <li>
            <strong>Common in:</strong> Midwest and suburbs where garages are
            standard
          </li>
        </ul>

        <h2>Tag Sale</h2>
        <p>
          A <strong>tag sale</strong> is common in the Northeast (especially
          Connecticut and New England). Every item has a price tag on it —
          hence the name. Tag sales can be run by the homeowner or by a
          professional tag sale company.
        </p>
        <ul>
          <li>
            <strong>Key difference:</strong> Every item is individually priced
            with a tag
          </li>
          <li>
            <strong>May be run by:</strong> Professional companies who take a
            percentage
          </li>
          <li>
            <strong>Often higher quality:</strong> Tag sales tend to have nicer
            items than casual yard sales
          </li>
        </ul>

        <h2>Estate Sale</h2>
        <p>
          An <strong>estate sale</strong> is a completely different animal.
          It&apos;s typically held when someone passes away, downsizes, or moves
          to a care facility. The entire contents of the home are sold — often
          including furniture, appliances, collectibles, artwork, and
          sometimes the house itself.
        </p>
        <ul>
          <li>
            <strong>Location:</strong> Inside the home — you walk through rooms
            and shop
          </li>
          <li>
            <strong>Who runs it:</strong> Usually a professional estate sale
            company hired by the family
          </li>
          <li>
            <strong>What&apos;s sold:</strong> Everything — from kitchen utensils
            to antique furniture
          </li>
          <li>
            <strong>Price range:</strong> Varies widely — from $1 items to
            $1,000+ antiques
          </li>
          <li>
            <strong>Best for:</strong> Furniture, vintage items, collectibles,
            and unique finds
          </li>
        </ul>

        <h2>Rummage Sale</h2>
        <p>
          A <strong>rummage sale</strong> is usually organized by a church,
          school, or community group as a fundraiser. Items are donated by
          members and sold at very low prices.
        </p>
        <ul>
          <li>
            <strong>Location:</strong> Church hall, school gym, community center
          </li>
          <li>
            <strong>Prices:</strong> Usually the cheapest — most items under $5
          </li>
          <li>
            <strong>Best for:</strong> Books, clothing, and household basics
          </li>
        </ul>

        <h2>Quick Comparison</h2>
        <div className="overflow-x-auto not-prose">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 font-semibold text-gray-700">Type</th>
                <th className="text-left p-3 font-semibold text-gray-700">Location</th>
                <th className="text-left p-3 font-semibold text-gray-700">Run By</th>
                <th className="text-left p-3 font-semibold text-gray-700">Price Range</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="p-3 font-medium">Yard Sale</td>
                <td className="p-3">Front yard</td>
                <td className="p-3">Homeowner</td>
                <td className="p-3">$0.25–$50</td>
              </tr>
              <tr>
                <td className="p-3 font-medium">Garage Sale</td>
                <td className="p-3">Garage</td>
                <td className="p-3">Homeowner</td>
                <td className="p-3">$0.25–$50</td>
              </tr>
              <tr>
                <td className="p-3 font-medium">Tag Sale</td>
                <td className="p-3">Home / yard</td>
                <td className="p-3">Owner or company</td>
                <td className="p-3">$1–$200</td>
              </tr>
              <tr>
                <td className="p-3 font-medium">Estate Sale</td>
                <td className="p-3">Inside home</td>
                <td className="p-3">Professional company</td>
                <td className="p-3">$1–$1,000+</td>
              </tr>
              <tr>
                <td className="p-3 font-medium">Rummage Sale</td>
                <td className="p-3">Church / school</td>
                <td className="p-3">Organization</td>
                <td className="p-3">$0.25–$10</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>Which Is Best for Buyers?</h2>
        <ul>
          <li>
            <strong>Best deals overall:</strong> Rummage sales and yard sales
          </li>
          <li>
            <strong>Best for furniture and antiques:</strong> Estate sales
          </li>
          <li>
            <strong>Best for unique finds:</strong> Tag sales and estate sales
          </li>
          <li>
            <strong>Most variety:</strong> Multi-family yard sales
          </li>
        </ul>

        <p>
          No matter which type of sale you&apos;re looking for, you can find
          them all on{" "}
          <Link href="/browse" className="text-ys-800 hover:underline">
            YardShoppers
          </Link>
          . Browse by date, location, and category to find yard sales, garage
          sales, and estate sales near you.
        </p>
      </div>
    ),
  };

  const articleContent = content[slug];

  if (!articleContent) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Article content coming soon.</p>
      </div>
    );
  }

  return <>{articleContent}</>;
}
