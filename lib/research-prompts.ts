// ============================================================
// FILE: research-prompts.ts
// WHERE TO PUT THIS:
//   C:\Users\citys\Documents\yardshoppers\lib\research-prompts.ts
// ============================================================

export function getResearchPrompt(category: string): string {
  switch (category) {
    // ---- ORIGINAL 13 ----
    case 'hoa':
      return `Search for Homeowner Associations (HOAs), Condominium Associations (COAs), and HOA Management Companies in [TYPE YOUR CITY HERE], [STATE].

Use Google Maps, Yelp, HOA directory sites, and community association listings to gather results quickly. For each one, collect: Organization Name, Email, City, Region, Type, Phone. Include any contact email you find — leasing office, info@, contact@, or management company emails all count.

Find as many as possible. If this city has fewer than 50, expand to surrounding cities and the rest of the county. Don't spend more than a few minutes verifying — speed matters more than perfection. It's okay if some rows are missing a phone number or region.

Export the results as an Excel (.xlsx) file I can download.`;

    case 'property-management':
      return `Search for Property Management Companies that manage residential communities, apartments, HOAs, or condominiums in [TYPE YOUR CITY HERE], [STATE].

Use Google Maps, Yelp, and property management directories to gather results quickly. For each one, collect: Organization Name, Email, City, Region, Type, Phone. Any contact email counts — info@, office@, leasing@, etc.

Find as many as possible. If this city has fewer than 50, expand to surrounding cities and the rest of the county. Speed matters more than perfection — it's okay if some rows are missing a phone number.

Export the results as an Excel (.xlsx) file I can download.`;

    case 'neighborhood':
      return `Search for Neighborhood Associations, Community Associations, Civic Associations, and Resident Associations (NOT HOAs) in [TYPE YOUR CITY HERE], [STATE].

Use Google search, city government websites, community directories, and Nextdoor-style listings to find them. For each one, collect: Organization Name, Email, City, Region, Type, Phone. Any contact email counts.

Find as many as possible. If this city has fewer than 50, expand to surrounding cities and the county. Speed matters — don't spend time verifying each email individually.

Export the results as an Excel (.xlsx) file I can download.`;

    case 'church':
      return `Search for Churches, Mosques, Synagogues, Temples, and Religious Organizations in [TYPE YOUR CITY HERE], [STATE].

Use Google Maps, church directory sites (like ChurchFinder.com, find-a-church.org), and denomination directories to gather results in bulk. For each one, collect: Organization Name, Email, City, Region, Type, Phone. Any email listed on their website or directory listing counts.

Find as many as possible. If this city has fewer than 50, expand to surrounding cities and the county. Prioritize speed — grab emails from directory listings rather than visiting each individual website.

Export the results as an Excel (.xlsx) file I can download.`;

    case 'estate-sale':
      return `Search for Estate Sale Companies, Estate Liquidators, and Estate Auction Companies in [TYPE YOUR CITY HERE], [STATE].

Use Google Maps, EstateSales.net, EstateSales.org, and Yelp to gather results quickly. For each one, collect: Organization Name, Email, City, Region, Type, Phone. Any contact email counts.

Find as many as possible. If this city has fewer than 50, expand to surrounding cities, the county, then the state. Speed matters — grab emails from directory listings.

Export the results as an Excel (.xlsx) file I can download.`;

    case 'real-estate':
      return `Search for Real Estate Agencies, Brokerages, and Real Estate Offices in [TYPE YOUR CITY HERE], [STATE]. Focus on office/brokerage emails, not individual agent emails.

Use Google Maps, Realtor.com office listings, Zillow agent finder, and Yelp to gather results quickly. For each one, collect: Organization Name, Email, City, Region, Type, Phone. Office emails like info@, contact@, or office@ all count.

Find as many as possible. If this city has fewer than 50, expand to surrounding cities and the county. Prioritize speed over perfection.

Export the results as an Excel (.xlsx) file I can download.`;

    case 'military':
      return `Search for Military Bases, Military Installations, MWR (Morale, Welfare & Recreation) Centers, Family Support Centers, and Military Community Service offices in [TYPE YOUR CITY HERE], [STATE].

Use military installation directories, MilitaryINSTALLATIONS.dod.mil, and Google to find them. For each one, collect: Organization Name, Email, City, Region, Type, Phone. Any official contact email counts.

Find as many as possible. If this city has fewer results, expand statewide. Military bases are limited in number — just find all that exist in the state.

Export the results as an Excel (.xlsx) file I can download.`;

    case 'senior-living':
      return `Search for Senior Living Communities, Retirement Communities, Assisted Living Facilities, Independent Living Communities, and 55+ Communities in [TYPE YOUR CITY HERE], [STATE].

Use Google Maps, SeniorLiving.org, A Place for Mom, Caring.com, and Yelp to gather results in bulk. For each one, collect: Organization Name, Email, City, Region, Type, Phone. Any contact email counts — community@, info@, admissions@, etc.

Find as many as possible. If this city has fewer than 50, expand to surrounding cities and the county. Prioritize speed — pull emails from directory listings rather than visiting each website.

Export the results as an Excel (.xlsx) file I can download.`;

    case 'moving':
      return `Search for Moving Companies, Relocation Services, and Local Movers in [TYPE YOUR CITY HERE], [STATE].

Use Google Maps, Yelp, MovingCompanyReviews.com, and the Better Business Bureau to gather results quickly. For each one, collect: Organization Name, Email, City, Region, Type, Phone. Any contact email counts.

Find as many as possible. If this city has fewer than 50, expand to surrounding cities and the county. Speed matters — grab contact info from directory listings.

Export the results as an Excel (.xlsx) file I can download.`;

    case 'storage':
      return `Search for Self Storage Facilities, Storage Unit Companies, and Mini Storage locations in [TYPE YOUR CITY HERE], [STATE].

Use Google Maps, SpareFoot.com, SelfStorage.com, StorageCafe.com, and Yelp to gather results in bulk. For each one, collect: Organization Name, Email, City, Region, Type, Phone. Any contact email counts.

Find as many as possible. If this city has fewer than 50, expand to surrounding cities and the county. Prioritize speed — pull from directory listings.

Export the results as an Excel (.xlsx) file I can download.`;

    case 'school':
      return `Search for PTA (Parent Teacher Association) and PTO (Parent Teacher Organization) groups at elementary, middle, and high schools in [TYPE YOUR CITY HERE], [STATE].

Use school district websites, PTA.org chapter finder, Google search, and GreatSchools.org to find them. For each one, collect: Organization Name (School + PTA/PTO), Email, City, Region, Type, Phone. Any PTA/PTO or school office contact email counts.

Find as many as possible. If this city has fewer than 50, expand to the school district, then the county. Prioritize speed — use school district directories that list multiple schools at once.

Export the results as an Excel (.xlsx) file I can download.`;

    case 'parks-rec':
      return `Search for City Parks and Recreation Departments, County Recreation Departments, and Community Recreation Centers in [TYPE YOUR CITY HERE], [STATE].

Use city/county government websites and Google to find them. For each one, collect: Organization Name, Email, City, Region, Type, Phone. Any department contact email counts.

Find as many as possible. If this city has fewer results, expand to surrounding cities and the county. These are government departments so there are limited numbers — just find all that exist in the area.

Export the results as an Excel (.xlsx) file I can download.`;

    case 'chamber':
      return `Search for Chamber of Commerce offices, Business Associations, and Local Business Groups in [TYPE YOUR CITY HERE], [STATE].

Use Google, the U.S. Chamber of Commerce directory, and ACCE (Association of Chamber of Commerce Executives) to find them. For each one, collect: Organization Name, Email, City, Region, Type, Phone. Any contact email counts.

Find as many as possible. If this city has fewer results, expand to surrounding cities and the county. Chambers are limited in number — just find all that exist in the area.

Export the results as an Excel (.xlsx) file I can download.`;

    // ============================================================
    // NEW 16 CATEGORIES
    // ============================================================

    case 'thrift':
      return `Search for Thrift Stores, Consignment Shops, Resale Stores, and Secondhand Stores in [TYPE YOUR CITY HERE], [STATE].

Use Google Maps, Yelp, and thrift store directories to gather results quickly. For each one, collect: Organization Name, Email, City, Region, Type, Phone. Any contact email counts — store@, info@, shop@, etc.

Find as many as possible. If this city has fewer than 50, expand to surrounding cities and the county. Prioritize speed — pull from directory listings rather than visiting each store's website.

Export the results as an Excel (.xlsx) file I can download.`;

    case 'organizer':
      return `Search for Professional Organizers, Home Organizers, Decluttering Services, and Downsizing Specialists in [TYPE YOUR CITY HERE], [STATE].

Use Google Maps, Yelp, NAPO.net (National Association of Productivity and Organizing Professionals), and Thumbtack to find them. For each one, collect: Organization Name, Email, City, Region, Type, Phone. Any contact email counts.

Find as many as possible. If this city has fewer than 50, expand to surrounding cities, the county, then the state. Prioritize speed.

Export the results as an Excel (.xlsx) file I can download.`;

    case 'junk-removal':
      return `Search for Junk Removal Companies, Hauling Services, and Trash Removal Companies in [TYPE YOUR CITY HERE], [STATE].

Use Google Maps, Yelp, and Thumbtack to gather results quickly. For each one, collect: Organization Name, Email, City, Region, Type, Phone. Any contact email counts.

Find as many as possible. If this city has fewer than 50, expand to surrounding cities and the county. Prioritize speed — pull from directory listings.

Export the results as an Excel (.xlsx) file I can download.`;

    case 'antique':
      return `Search for Antique Shops, Antique Dealers, Vintage Stores, and Antique Malls in [TYPE YOUR CITY HERE], [STATE].

Use Google Maps, Yelp, Antiquers.com, and Ruby Lane dealer directories to gather results quickly. For each one, collect: Organization Name, Email, City, Region, Type, Phone. Any contact email counts.

Find as many as possible. If this city has fewer than 50, expand to surrounding cities and the county. Prioritize speed.

Export the results as an Excel (.xlsx) file I can download.`;

    case 'probate':
      return `Search for Probate Attorneys, Estate Planning Attorneys, Estate Settlement Lawyers, and Trust & Estate Law Firms in [TYPE YOUR CITY HERE], [STATE].

Use Google Maps, Avvo.com, FindLaw.com, Justia.com, and your state bar association directory to gather results quickly. For each one, collect: Organization Name, Email, City, Region, Type, Phone. Any firm contact email counts.

Find as many as possible. If this city has fewer than 50, expand to surrounding cities and the county. Prioritize speed — pull from lawyer directories that list emails.

Export the results as an Excel (.xlsx) file I can download.`;

    case 'library':
      return `Search for Public Libraries and Library Branches in [TYPE YOUR CITY HERE], [STATE].

Use the city/county library system website and Google to find all branches. For each one, collect: Organization Name, Email, City, Region, Type, Phone. Any branch or system contact email counts.

Find all library branches in the area. If this city has fewer results, expand to the county library system. Libraries are limited in number — just find all that exist.

Export the results as an Excel (.xlsx) file I can download.`;

    case 'community-center':
      return `Search for Community Centers, Recreation Centers, Civic Centers, and Neighborhood Centers in [TYPE YOUR CITY HERE], [STATE].

Use Google Maps, city government websites, and Yelp to find them. For each one, collect: Organization Name, Email, City, Region, Type, Phone. Any contact email counts.

Find as many as possible. If this city has fewer results, expand to surrounding cities and the county. Prioritize speed.

Export the results as an Excel (.xlsx) file I can download.`;

    case 'veterans':
      return `Search for VFW (Veterans of Foreign Wars) Posts, American Legion Posts, DAV (Disabled American Veterans) Chapters, and Veterans Service Organizations in [TYPE YOUR CITY HERE], [STATE].

Use the VFW Post Locator (vfw.org), American Legion Post Finder (legion.org), and Google to find them. For each one, collect: Organization Name, Email, City, Region, Type, Phone. Any post contact email counts.

Find as many as possible. If this city has fewer results, expand to the county, then the state. Prioritize speed — use the national organization directories that list posts in bulk.

Export the results as an Excel (.xlsx) file I can download.`;

    case 'civic-clubs':
      return `Search for Rotary Clubs, Lions Clubs, Kiwanis Clubs, Optimist Clubs, Elks Lodges, and similar civic/service clubs in [TYPE YOUR CITY HERE], [STATE].

Use Rotary.org club finder, LionsClubs.org, Kiwanis.org, and Google to find them. For each one, collect: Organization Name, Email, City, Region, Type, Phone. Any club contact email counts.

Find as many as possible. If this city has fewer results, expand to the county, then the state. Prioritize speed — use the national organization directories.

Export the results as an Excel (.xlsx) file I can download.`;

    case 'local-media':
      return `Search for Local Newspapers, Community Newspapers, Neighborhood Blogs, and Local Online News Publications in [TYPE YOUR CITY HERE], [STATE].

Use Google, USNPL.com (US Newspaper Listing), and local media directories to find them. For each one, collect: Organization Name, Email (editor, newsroom, or general contact), City, Region, Type, Phone. Any editorial or contact email counts.

Find as many as possible. If this city has fewer results, expand to the county, then the state. Prioritize speed.

Export the results as an Excel (.xlsx) file I can download.`;

    case 'college':
      return `Search for Colleges, Universities, Community Colleges, and Trade Schools with student housing in [TYPE YOUR CITY HERE], [STATE].

Use Google, the NCES College Navigator (nces.ed.gov), and school websites to find them. For each one, collect: Organization Name (School + Housing Office), Email (housing office, student affairs, or residence life), City, Region, Type, Phone. Any campus office email counts.

Find all schools with housing in the area. If this city has fewer results, expand statewide. Schools are limited in number — just find all that exist.

Export the results as an Excel (.xlsx) file I can download.`;

    case 'apartment':
      return `Search for Apartment Complexes and Apartment Communities in [TYPE YOUR CITY HERE], [STATE].

Use Apartments.com, ApartmentFinder.com, Zillow rentals, and Google Maps to pull listings in bulk. For each one, collect: Organization Name, Email, City, Region, Type, Phone. Any leasing email counts — leasing@, info@, office@, or property management company emails.

Find as many as possible. If this city has fewer than 50, expand to surrounding cities and the county. Prioritize speed — pull contact info from apartment listing sites rather than visiting each complex's individual website.

Export the results as an Excel (.xlsx) file I can download.`;

    case 'relocation':
      return `Search for Corporate Relocation Companies, Employee Relocation Services, and Relocation Management Companies in [TYPE YOUR CITY HERE], [STATE].

Use Google, Worldwide ERC member directory, and Yelp to find them. For each one, collect: Organization Name, Email, City, Region, Type, Phone. Any contact email counts.

Find as many as possible. If this city has fewer results, expand to the county, then the state. Relocation companies are limited in number — just find all that exist in the area.

Export the results as an Excel (.xlsx) file I can download.`;

    case 'flea-market':
      return `Search for Flea Markets, Swap Meets, Open-Air Markets, and Community Markets in [TYPE YOUR CITY HERE], [STATE].

Use Google Maps, FleaMarketZone.com, Yelp, and Facebook to find them. For each one, collect: Organization Name, Email (organizer or management), City, Region, Type, Phone. Any contact email counts.

Find as many as possible. If this city has fewer results, expand to the county, then the state. Flea markets are limited in number — just find all that exist.

Export the results as an Excel (.xlsx) file I can download.`;

    case 'auction':
      return `Search for Auction Houses, Auctioneers, and Estate Auctioneers in [TYPE YOUR CITY HERE], [STATE].

Use Google Maps, AuctionZip.com, the National Auctioneers Association directory, and Yelp to find them. For each one, collect: Organization Name, Email, City, Region, Type, Phone. Any contact email counts.

Find as many as possible. If this city has fewer than 50, expand to surrounding cities, the county, then the state. Prioritize speed — pull from auction directories.

Export the results as an Excel (.xlsx) file I can download.`;

    case 'habitat':
      return `Search for Habitat for Humanity ReStores and Habitat for Humanity chapters in [TYPE YOUR CITY HERE], [STATE].

Use the Habitat.org ReStore locator and Google to find them. For each one, collect: Organization Name, Email, City, Region, Type, Phone. Any store or chapter contact email counts.

Find all ReStores and chapters in the area. If this city has fewer results, expand statewide. ReStores are limited in number — just find all that exist.

Export the results as an Excel (.xlsx) file I can download.`;

    default:
      return `Search for organizations in [TYPE YOUR CITY HERE], [STATE]. Collect: Organization Name, Email, City, Region, Type, Phone. Use Google Maps and directory sites to gather results quickly. Find as many as possible. Export as an Excel (.xlsx) file.`;
  }
}
