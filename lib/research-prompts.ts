// ============================================================
// FILE: research-prompts.ts
// WHERE TO PUT THIS:
//   C:\Users\citys\Documents\yardshoppers\lib\research-prompts.ts
// ============================================================

export function getResearchPrompt(category: string): string {
  switch (category) {
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

    default:
      return `Find organizations in [TYPE YOUR CITY HERE], [STATE]. Provide: Organization Name, Email, City, Region, Type, Phone. Format as an Excel table. Find at least 100 with verified emails.`;
  }
}
