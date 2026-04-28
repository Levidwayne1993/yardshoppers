// ============================================================
// FILE: research-prompts.ts
// WHERE TO PUT THIS:
//   C:\Users\citys\Documents\yardshoppers\lib\research-prompts.ts
// ============================================================

export function getResearchPrompt(category: string): string {
  switch (category) {
    // ---- ORIGINAL 13 ----
    case 'hoa':
      return `Find all Homeowner Associations (HOAs), Condominium Associations (COAs), and HOA Management Companies in [TYPE YOUR CITY HERE], [STATE]. For each one, provide: Organization Name, Email Address, City, Region (county or area), Type (HOA, COA, or Management Company), and Phone Number.

Format the results as a table with these exact columns: Organization Name, Email, City, Region, Type, Phone.

Only include organizations where you can find a real, verified email address — no generic or made-up emails. If you cannot find at least 100 results in this city, expand your search to surrounding cities, then the entire county, then the full state. Keep going until you reach at least 100 contacts with verified emails. Skip any organization that does not have a publicly listed email address.

When you're done, export the table as an Excel (.xlsx) file I can download.`;

    case 'property-management':
      return `Find all Property Management Companies that manage residential communities, apartments, HOAs, or condominiums in [TYPE YOUR CITY HERE], [STATE]. For each one, provide: Company Name, Email Address, City, Region (county or area), Type (Property Management), and Phone Number.

Format the results as a table with these exact columns: Organization Name, Email, City, Region, Type, Phone.

Only include companies where you can find a real, verified email address. If you cannot find at least 100 results in this city, expand your search to surrounding cities, then the entire county, then the full state. Keep going until you reach at least 100 contacts with verified emails. Skip any company that does not have a publicly listed email address.

When you're done, export the table as an Excel (.xlsx) file I can download.`;

    case 'neighborhood':
      return `Find all Neighborhood Associations, Community Associations, Civic Associations, and Resident Associations (that are NOT HOAs) in [TYPE YOUR CITY HERE], [STATE]. For each one, provide: Association Name, Email Address, City, Region (county or area), Type (Neighborhood Association), and Phone Number.

Format the results as a table with these exact columns: Organization Name, Email, City, Region, Type, Phone.

Only include associations where you can find a real, verified email address. If you cannot find at least 100 results in this city, expand your search to surrounding cities, then the entire county, then the full state. Keep going until you reach at least 100 contacts with verified emails. Skip any association that does not have a publicly listed email address.

When you're done, export the table as an Excel (.xlsx) file I can download.`;

    case 'church':
      return `Find all Churches, Mosques, Synagogues, Temples, and Religious Organizations in [TYPE YOUR CITY HERE], [STATE]. For each one, provide: Organization Name, Email Address, City, Region (county or area), Type (Church, Mosque, Synagogue, Temple, or Religious Org), and Phone Number.

Format the results as a table with these exact columns: Organization Name, Email, City, Region, Type, Phone.

Only include organizations where you can find a real, verified email address. If you cannot find at least 100 results in this city, expand your search to surrounding cities, then the entire county, then the full state. Keep going until you reach at least 100 contacts with verified emails. Skip any organization that does not have a publicly listed email address.

When you're done, export the table as an Excel (.xlsx) file I can download.`;

    case 'estate-sale':
      return `Find all Estate Sale Companies, Estate Liquidators, and Estate Auction Companies in [TYPE YOUR CITY HERE], [STATE]. For each one, provide: Company Name, Email Address, City, Region (county or area), Type (Estate Sale Company), and Phone Number.

Format the results as a table with these exact columns: Organization Name, Email, City, Region, Type, Phone.

Only include companies where you can find a real, verified email address. If you cannot find at least 100 results in this city, expand your search to surrounding cities, then the entire county, then the full state. Keep going until you reach at least 100 contacts with verified emails. Skip any company that does not have a publicly listed email address.

When you're done, export the table as an Excel (.xlsx) file I can download.`;

    case 'real-estate':
      return `Find all Real Estate Agencies, Brokerages, and Real Estate Offices in [TYPE YOUR CITY HERE], [STATE]. For each one, provide: Agency/Brokerage Name, Email Address, City, Region (county or area), Type (Real Estate Brokerage), and Phone Number. Focus on the office or brokerage email, not individual agent emails.

Format the results as a table with these exact columns: Organization Name, Email, City, Region, Type, Phone.

Only include agencies where you can find a real, verified email address. If you cannot find at least 100 results in this city, expand your search to surrounding cities, then the entire county, then the full state. Keep going until you reach at least 100 contacts with verified emails. Skip any agency that does not have a publicly listed email address.

When you're done, export the table as an Excel (.xlsx) file I can download.`;

    case 'military':
      return `Find all Military Bases, Military Installations, MWR (Morale, Welfare & Recreation) Centers, Family Support Centers, and Military Community Service offices in [TYPE YOUR CITY HERE], [STATE]. For each one, provide: Installation/Center Name, Email Address, City, Region (county or area), Type (Military Base, MWR, or Family Support), and Phone Number.

Format the results as a table with these exact columns: Organization Name, Email, City, Region, Type, Phone.

Only include installations where you can find a real, verified email address. If you cannot find at least 100 results in this city, expand your search to surrounding cities, then the entire county, then the full state. Keep going until you reach at least 100 contacts with verified emails. Skip any that do not have a publicly listed email address.

When you're done, export the table as an Excel (.xlsx) file I can download.`;

    case 'senior-living':
      return `Find all Senior Living Communities, Retirement Communities, Assisted Living Facilities, Independent Living Communities, and 55+ Communities in [TYPE YOUR CITY HERE], [STATE]. For each one, provide: Community Name, Email Address, City, Region (county or area), Type (Senior Living, Retirement, Assisted Living, or 55+), and Phone Number.

Format the results as a table with these exact columns: Organization Name, Email, City, Region, Type, Phone.

Only include communities where you can find a real, verified email address. If you cannot find at least 100 results in this city, expand your search to surrounding cities, then the entire county, then the full state. Keep going until you reach at least 100 contacts with verified emails. Skip any community that does not have a publicly listed email address.

When you're done, export the table as an Excel (.xlsx) file I can download.`;

    case 'moving':
      return `Find all Moving Companies, Relocation Services, and Local Movers in [TYPE YOUR CITY HERE], [STATE]. For each one, provide: Company Name, Email Address, City, Region (county or area), Type (Moving Company), and Phone Number.

Format the results as a table with these exact columns: Organization Name, Email, City, Region, Type, Phone.

Only include companies where you can find a real, verified email address. If you cannot find at least 100 results in this city, expand your search to surrounding cities, then the entire county, then the full state. Keep going until you reach at least 100 contacts with verified emails. Skip any company that does not have a publicly listed email address.

When you're done, export the table as an Excel (.xlsx) file I can download.`;

    case 'storage':
      return `Find all Self Storage Facilities, Storage Unit Companies, and Mini Storage locations in [TYPE YOUR CITY HERE], [STATE]. For each one, provide: Facility Name, Email Address, City, Region (county or area), Type (Self Storage), and Phone Number.

Format the results as a table with these exact columns: Organization Name, Email, City, Region, Type, Phone.

Only include facilities where you can find a real, verified email address. If you cannot find at least 100 results in this city, expand your search to surrounding cities, then the entire county, then the full state. Keep going until you reach at least 100 contacts with verified emails. Skip any facility that does not have a publicly listed email address.

When you're done, export the table as an Excel (.xlsx) file I can download.`;

    case 'school':
      return `Find all PTA (Parent Teacher Association) and PTO (Parent Teacher Organization) groups at elementary schools, middle schools, and high schools in [TYPE YOUR CITY HERE], [STATE]. For each one, provide: School Name + PTA/PTO, Email Address, City, Region (county or school district), Type (PTA or PTO), and Phone Number.

Format the results as a table with these exact columns: Organization Name, Email, City, Region, Type, Phone.

Only include schools where you can find a real, verified PTA/PTO email address. If you cannot find at least 100 results in this city, expand your search to surrounding cities, then the entire school district, then the full county. Keep going until you reach at least 100 contacts with verified emails. Skip any school that does not have a publicly listed PTA/PTO email address.

When you're done, export the table as an Excel (.xlsx) file I can download.`;

    case 'parks-rec':
      return `Find all City Parks and Recreation Departments, County Recreation Departments, and Community Recreation Centers in [TYPE YOUR CITY HERE], [STATE]. For each one, provide: Department/Center Name, Email Address, City, Region (county or area), Type (Parks & Recreation), and Phone Number.

Format the results as a table with these exact columns: Organization Name, Email, City, Region, Type, Phone.

Only include departments where you can find a real, verified email address. If you cannot find at least 100 results in this city, expand your search to surrounding cities, then the entire county, then the full state. Keep going until you reach at least 100 contacts with verified emails. Skip any department that does not have a publicly listed email address.

When you're done, export the table as an Excel (.xlsx) file I can download.`;

    case 'chamber':
      return `Find all Chamber of Commerce offices, Business Associations, and Local Business Groups in [TYPE YOUR CITY HERE], [STATE]. For each one, provide: Chamber/Association Name, Email Address, City, Region (county or area), Type (Chamber of Commerce), and Phone Number.

Format the results as a table with these exact columns: Organization Name, Email, City, Region, Type, Phone.

Only include chambers where you can find a real, verified email address. If you cannot find at least 100 results in this city, expand your search to surrounding cities, then the entire county, then the full state. Keep going until you reach at least 100 contacts with verified emails. Skip any chamber that does not have a publicly listed email address.

When you're done, export the table as an Excel (.xlsx) file I can download.`;

    // ============================================================
    // NEW 16 CATEGORIES
    // ============================================================

    case 'thrift':
      return `Find all Thrift Stores, Consignment Shops, Resale Stores, and Secondhand Stores in [TYPE YOUR CITY HERE], [STATE]. For each one, provide: Store Name, Email Address, City, Region (county or area), Type (Thrift Store, Consignment Shop, or Resale Store), and Phone Number.

Format the results as a table with these exact columns: Organization Name, Email, City, Region, Type, Phone.

Only include stores where you can find a real, verified email address. If you cannot find at least 100 results in this city, expand your search to surrounding cities, then the entire county, then the full state. Keep going until you reach at least 100 contacts with verified emails. Skip any store that does not have a publicly listed email address.

When you're done, export the table as an Excel (.xlsx) file I can download.`;

    case 'organizer':
      return `Find all Professional Organizers, Home Organizers, Decluttering Services, and Downsizing Specialists in [TYPE YOUR CITY HERE], [STATE]. For each one, provide: Business Name, Email Address, City, Region (county or area), Type (Professional Organizer or Decluttering Service), and Phone Number.

Format the results as a table with these exact columns: Organization Name, Email, City, Region, Type, Phone.

Only include businesses where you can find a real, verified email address. If you cannot find at least 100 results in this city, expand your search to surrounding cities, then the entire county, then the full state. Keep going until you reach at least 100 contacts with verified emails. Skip any business that does not have a publicly listed email address.

When you're done, export the table as an Excel (.xlsx) file I can download.`;

    case 'junk-removal':
      return `Find all Junk Removal Companies, Hauling Services, and Trash Removal Companies in [TYPE YOUR CITY HERE], [STATE]. For each one, provide: Company Name, Email Address, City, Region (county or area), Type (Junk Removal), and Phone Number.

Format the results as a table with these exact columns: Organization Name, Email, City, Region, Type, Phone.

Only include companies where you can find a real, verified email address. If you cannot find at least 100 results in this city, expand your search to surrounding cities, then the entire county, then the full state. Keep going until you reach at least 100 contacts with verified emails. Skip any company that does not have a publicly listed email address.

When you're done, export the table as an Excel (.xlsx) file I can download.`;

    case 'antique':
      return `Find all Antique Shops, Antique Dealers, Vintage Stores, and Antique Malls in [TYPE YOUR CITY HERE], [STATE]. For each one, provide: Shop/Dealer Name, Email Address, City, Region (county or area), Type (Antique Shop, Vintage Store, or Antique Mall), and Phone Number.

Format the results as a table with these exact columns: Organization Name, Email, City, Region, Type, Phone.

Only include shops where you can find a real, verified email address. If you cannot find at least 100 results in this city, expand your search to surrounding cities, then the entire county, then the full state. Keep going until you reach at least 100 contacts with verified emails. Skip any shop that does not have a publicly listed email address.

When you're done, export the table as an Excel (.xlsx) file I can download.`;

    case 'probate':
      return `Find all Probate Attorneys, Estate Planning Attorneys, Estate Settlement Lawyers, and Trust & Estate Law Firms in [TYPE YOUR CITY HERE], [STATE]. For each one, provide: Firm/Attorney Name, Email Address, City, Region (county or area), Type (Probate Attorney or Estate Law Firm), and Phone Number.

Format the results as a table with these exact columns: Organization Name, Email, City, Region, Type, Phone.

Only include firms where you can find a real, verified email address. If you cannot find at least 100 results in this city, expand your search to surrounding cities, then the entire county, then the full state. Keep going until you reach at least 100 contacts with verified emails. Skip any firm that does not have a publicly listed email address.

When you're done, export the table as an Excel (.xlsx) file I can download.`;

    case 'library':
      return `Find all Public Libraries, Library Branches, and Community Library Systems in [TYPE YOUR CITY HERE], [STATE]. For each one, provide: Library Name, Email Address, City, Region (county or area), Type (Public Library), and Phone Number.

Format the results as a table with these exact columns: Organization Name, Email, City, Region, Type, Phone.

Only include libraries where you can find a real, verified email address. If you cannot find at least 100 results in this city, expand your search to surrounding cities, then the entire county, then the full state. Keep going until you reach at least 100 contacts with verified emails. Skip any library that does not have a publicly listed email address.

When you're done, export the table as an Excel (.xlsx) file I can download.`;

    case 'community-center':
      return `Find all Community Centers, Recreation Centers, Civic Centers, and Neighborhood Centers in [TYPE YOUR CITY HERE], [STATE]. For each one, provide: Center Name, Email Address, City, Region (county or area), Type (Community Center or Recreation Center), and Phone Number.

Format the results as a table with these exact columns: Organization Name, Email, City, Region, Type, Phone.

Only include centers where you can find a real, verified email address. If you cannot find at least 100 results in this city, expand your search to surrounding cities, then the entire county, then the full state. Keep going until you reach at least 100 contacts with verified emails. Skip any center that does not have a publicly listed email address.

When you're done, export the table as an Excel (.xlsx) file I can download.`;

    case 'veterans':
      return `Find all VFW (Veterans of Foreign Wars) Posts, American Legion Posts, DAV (Disabled American Veterans) Chapters, and Veterans Service Organizations in [TYPE YOUR CITY HERE], [STATE]. For each one, provide: Post/Chapter Name, Email Address, City, Region (county or area), Type (VFW, American Legion, DAV, or Veterans Org), and Phone Number.

Format the results as a table with these exact columns: Organization Name, Email, City, Region, Type, Phone.

Only include posts where you can find a real, verified email address. If you cannot find at least 100 results in this city, expand your search to surrounding cities, then the entire county, then the full state. Keep going until you reach at least 100 contacts with verified emails. Skip any post that does not have a publicly listed email address.

When you're done, export the table as an Excel (.xlsx) file I can download.`;

    case 'civic-clubs':
      return `Find all Rotary Clubs, Lions Clubs, Kiwanis Clubs, Optimist Clubs, Elks Lodges, and similar civic/service clubs in [TYPE YOUR CITY HERE], [STATE]. For each one, provide: Club Name, Email Address, City, Region (county or area), Type (Rotary, Lions, Kiwanis, Elks, or Civic Club), and Phone Number.

Format the results as a table with these exact columns: Organization Name, Email, City, Region, Type, Phone.

Only include clubs where you can find a real, verified email address. If you cannot find at least 100 results in this city, expand your search to surrounding cities, then the entire county, then the full state. Keep going until you reach at least 100 contacts with verified emails. Skip any club that does not have a publicly listed email address.

When you're done, export the table as an Excel (.xlsx) file I can download.`;

    case 'local-media':
      return `Find all Local Newspapers, Community Newspapers, Neighborhood Blogs, Community News Websites, and Local Online Publications in [TYPE YOUR CITY HERE], [STATE]. For each one, provide: Publication Name, Email Address (editor, news desk, or general contact), City, Region (county or area), Type (Newspaper, Blog, or Online Publication), and Phone Number.

Format the results as a table with these exact columns: Organization Name, Email, City, Region, Type, Phone.

Only include publications where you can find a real, verified email address. If you cannot find at least 100 results in this city, expand your search to surrounding cities, then the entire county, then the full state. Keep going until you reach at least 100 contacts with verified emails. Skip any publication that does not have a publicly listed email address.

When you're done, export the table as an Excel (.xlsx) file I can download.`;

    case 'college':
      return `Find all Colleges, Universities, Community Colleges, and Trade Schools with on-campus or student housing in [TYPE YOUR CITY HERE], [STATE]. For each one, provide: School Name + Housing Office, Email Address (housing office, student affairs, or residence life), City, Region (county or area), Type (University, Community College, or Trade School), and Phone Number.

Format the results as a table with these exact columns: Organization Name, Email, City, Region, Type, Phone.

Only include schools where you can find a real, verified email address for the housing or student affairs office. If you cannot find at least 100 results in this city, expand your search to surrounding cities, then the entire county, then the full state. Keep going until you reach at least 100 contacts with verified emails. Skip any school that does not have a publicly listed housing/student affairs email address.

When you're done, export the table as an Excel (.xlsx) file I can download.`;

    case 'apartment':
      return `Find all Apartment Complexes, Apartment Communities, Multifamily Properties, and Leasing Offices in [TYPE YOUR CITY HERE], [STATE]. For each one, provide: Property/Complex Name, Email Address (leasing office or property management), City, Region (county or area), Type (Apartment Complex), and Phone Number.

Format the results as a table with these exact columns: Organization Name, Email, City, Region, Type, Phone.

Only include properties where you can find a real, verified email address. If you cannot find at least 100 results in this city, expand your search to surrounding cities, then the entire county, then the full state. Keep going until you reach at least 100 contacts with verified emails. Skip any property that does not have a publicly listed email address.

When you're done, export the table as an Excel (.xlsx) file I can download.`;

    case 'relocation':
      return `Find all Corporate Relocation Companies, Employee Relocation Services, Relocation Management Companies, and Destination Services Providers in [TYPE YOUR CITY HERE], [STATE]. For each one, provide: Company Name, Email Address, City, Region (county or area), Type (Relocation Service), and Phone Number.

Format the results as a table with these exact columns: Organization Name, Email, City, Region, Type, Phone.

Only include companies where you can find a real, verified email address. If you cannot find at least 100 results in this city, expand your search to surrounding cities, then the entire county, then the full state. Keep going until you reach at least 100 contacts with verified emails. Skip any company that does not have a publicly listed email address.

When you're done, export the table as an Excel (.xlsx) file I can download.`;

    case 'flea-market':
      return `Find all Flea Markets, Swap Meets, Open-Air Markets, Community Markets, and Bazaars in [TYPE YOUR CITY HERE], [STATE]. For each one, provide: Market/Event Name, Email Address (organizer or management), City, Region (county or area), Type (Flea Market, Swap Meet, or Community Market), and Phone Number.

Format the results as a table with these exact columns: Organization Name, Email, City, Region, Type, Phone.

Only include markets where you can find a real, verified email address. If you cannot find at least 100 results in this city, expand your search to surrounding cities, then the entire county, then the full state. Keep going until you reach at least 100 contacts with verified emails. Skip any market that does not have a publicly listed email address.

When you're done, export the table as an Excel (.xlsx) file I can download.`;

    case 'auction':
      return `Find all Auction Houses, Auctioneers, Estate Auctioneers, and Online Auction Companies in [TYPE YOUR CITY HERE], [STATE]. For each one, provide: Company Name, Email Address, City, Region (county or area), Type (Auction House or Auctioneer), and Phone Number.

Format the results as a table with these exact columns: Organization Name, Email, City, Region, Type, Phone.

Only include companies where you can find a real, verified email address. If you cannot find at least 100 results in this city, expand your search to surrounding cities, then the entire county, then the full state. Keep going until you reach at least 100 contacts with verified emails. Skip any company that does not have a publicly listed email address.

When you're done, export the table as an Excel (.xlsx) file I can download.`;

    case 'habitat':
      return `Find all Habitat for Humanity ReStores, Habitat for Humanity chapters, and similar nonprofit home improvement resale stores in [TYPE YOUR CITY HERE], [STATE]. For each one, provide: Store/Chapter Name, Email Address, City, Region (county or area), Type (Habitat ReStore or Habitat Chapter), and Phone Number.

Format the results as a table with these exact columns: Organization Name, Email, City, Region, Type, Phone.

Only include locations where you can find a real, verified email address. If you cannot find at least 100 results in this city, expand your search to surrounding cities, then the entire county, then the full state. Keep going until you reach at least 100 contacts with verified emails. Skip any location that does not have a publicly listed email address.

When you're done, export the table as an Excel (.xlsx) file I can download.`;

    default:
      return `Find organizations in [TYPE YOUR CITY HERE], [STATE]. Provide: Organization Name, Email, City, Region, Type, Phone. Format as an Excel table. Find at least 100 with verified emails. If there are fewer than 100 in this city, expand the search to surrounding cities, then the county, then the full state.`;
  }
}
