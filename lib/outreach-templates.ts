// ============================================================
// FILE: lib/outreach-templates.ts
// PLACE AT: lib/outreach-templates.ts
// ============================================================

export interface OutreachCategory {
  id: string;
  label: string;
  description: string;
  icon: string;
}

export const OUTREACH_CATEGORIES: OutreachCategory[] = [
  { id: 'hoa', label: 'HOAs', description: 'Homeowner Associations', icon: '🏘️' },
  { id: 'property-management', label: 'Property Management', description: 'Property Management Companies', icon: '🏢' },
  { id: 'neighborhood', label: 'Neighborhood Assns', description: 'Neighborhood Associations (non-HOA)', icon: '🏡' },
  { id: 'church', label: 'Churches & Religious', description: 'Churches & Religious Organizations', icon: '⛪' },
  { id: 'estate-sale', label: 'Estate Sale Companies', description: 'Estate Sale Companies', icon: '🏷️' },
  { id: 'real-estate', label: 'Real Estate', description: 'Real Estate Agents & Brokerages', icon: '🔑' },
  { id: 'military', label: 'Military Bases', description: 'Military Bases (Family Support/MWR)', icon: '🎖️' },
  { id: 'senior-living', label: 'Senior Living', description: 'Senior Living & Retirement Communities', icon: '🏠' },
  { id: 'moving', label: 'Moving Companies', description: 'Moving Companies', icon: '🚚' },
  { id: 'storage', label: 'Self Storage', description: 'Self Storage Facilities', icon: '📦' },
  { id: 'school', label: 'Schools (PTA/PTO)', description: 'Schools — PTA/PTO Organizations', icon: '🎒' },
  { id: 'parks-rec', label: 'Parks & Recreation', description: 'City/County Recreation & Parks Departments', icon: '🌳' },
  { id: 'chamber', label: 'Chamber of Commerce', description: 'Chamber of Commerce', icon: '🤝' },
];

// ------ Subject generators per category ------
function getSubject(category: string, city: string): string {
  switch (category) {
    case 'hoa':
      return `Free Community Yard Sale Platform for ${city} Residents`;
    case 'property-management':
      return `Free Yard Sale Platform for Your ${city} Communities`;
    case 'neighborhood':
      return `Free Yard Sale Resource for ${city} Neighborhoods`;
    case 'church':
      return `Free Community Yard Sale Platform for ${city} Congregations`;
    case 'estate-sale':
      return `Free Platform to Promote Estate Sales in ${city}`;
    case 'real-estate':
      return `Free Yard Sale Tool for Your ${city} Clients`;
    case 'military':
      return `Free Yard Sale Platform for ${city} Military Families`;
    case 'senior-living':
      return `Free Yard Sale Resource for ${city} Senior Residents`;
    case 'moving':
      return `Free Yard Sale Platform for Your ${city} Customers`;
    case 'storage':
      return `Free Yard Sale Platform — Great Resource for Your ${city} Customers`;
    case 'school':
      return `Free Community Yard Sale Platform for ${city} School Families`;
    case 'parks-rec':
      return `Free Yard Sale Platform for ${city} Community Events`;
    case 'chamber':
      return `Free Local Commerce Tool for ${city} Businesses & Residents`;
    default:
      return `Free Community Yard Sale Platform for ${city} Residents`;
  }
}

// ------ Body generators per category ------
function getBody(
  category: string,
  orgName: string,
  city: string,
  orgType: string
): string {
  // Determine greeting style based on org_type sub-type
  let greeting: string;
  if (orgType.toLowerCase().includes('management')) {
    greeting = `Hello ${orgName} Team`;
  } else if (orgType.toLowerCase().includes('board')) {
    greeting = `Hello`;
  } else {
    greeting = `Hello ${orgName}`;
  }

  const intro = `My name is Levi Erwin, and together with my father Gary — a disabled veteran — we run YardShoppers (www.yardshoppers.com), a free, nationwide platform that helps residents post and find yard sales, garage sales, and estate sales in their area.`;

  const features = `- Residents can post yard sales for free in under 2 minutes
- Buyers can search by location, category, and date to find sales nearby
- A built-in Route Planner maps out the best route to hit multiple sales in one trip
- Everything is mobile-friendly and easy to use`;

  const signoff = `Best regards,
Levi & Gary Erwin
Founders, YardShoppers
www.yardshoppers.com
admin@yardshoppers.com`;

  let pitch: string;
  let cta: string;

  switch (category) {
    case 'hoa':
      pitch = `I'm reaching out because I think YardShoppers could be a great free resource for ${orgType.toLowerCase().includes('management') ? 'the communities you manage' : 'your neighborhood'} in ${city}. Here's what we offer:

${features}

Many HOAs and community organizations share YardShoppers in their newsletters or community boards as a helpful resource for residents. There's no cost and no commitment — it's simply a better way for your residents to connect with local buyers.`;
      cta = `If you'd like, I'd be happy to send over a short blurb you could include in your next newsletter or community update.`;
      break;

    case 'property-management':
      pitch = `I'm reaching out because I think YardShoppers could be a valuable free resource for the communities you manage in ${city}. Here's what we offer:

${features}

Property managers across the country share YardShoppers with their residents as a community engagement tool. It helps reduce clutter complaints, encourages neighbor interaction, and gives your residents a reason to feel good about their community. There's no cost and no commitment.`;
      cta = `I'd be happy to send over a short blurb you could share with your community managers or include in resident communications.`;
      break;

    case 'neighborhood':
      pitch = `I'm reaching out because I think YardShoppers could be a great free resource for residents in ${city}'s ${orgName} community. Here's what we offer:

${features}

Neighborhood associations across the country share YardShoppers with their members as a way to encourage community engagement and help residents declutter. There's no cost and no commitment — it's simply a better way for your neighbors to connect with local buyers.`;
      cta = `If you'd like, I'd be happy to send over a short blurb you could include in your next neighborhood newsletter or community board post.`;
      break;

    case 'church':
      pitch = `I'm reaching out because I think YardShoppers could be a wonderful free resource for your congregation and the ${city} community. Here's what we offer:

${features}

Many churches and faith-based organizations use YardShoppers to help promote church yard sales, fundraiser sales, and community events. Members can also use it to find great deals in their area. There's no cost and no commitment.`;
      cta = `If your church ever hosts yard sales or community events, we'd love to help promote them. I'd also be happy to send a short blurb you could include in a church bulletin or announcement.`;
      break;

    case 'estate-sale':
      pitch = `I'm reaching out because I think YardShoppers could be a great free tool to help promote your estate sales in ${city} and beyond. Here's what we offer:

${features}

Estate sale companies across the country are listing their sales on YardShoppers to reach a larger audience of motivated local buyers. It's completely free, and each listing takes less than 2 minutes to post.`;
      cta = `If you'd like, I can walk you through how easy it is to list your upcoming sales, or I can set up your first listing for you at no cost.`;
      break;

    case 'real-estate':
      pitch = `I'm reaching out because I think YardShoppers could be a useful free resource to share with your clients in ${city}. Here's what we offer:

${features}

Real estate agents find YardShoppers helpful for two reasons: sellers can use it to host a yard sale before listing their home (decluttering and attracting foot traffic), and new homeowners can find great deals on furniture and household items from nearby sales. It's completely free.`;
      cta = `If you'd like, I'd be happy to send over a short blurb or a link you could include in your client welcome packets or newsletters.`;
      break;

    case 'military':
      pitch = `I'm reaching out because I think YardShoppers could be a great free resource for military families at your installation in ${city}. Here's what we offer:

${features}

Military families moving during PCS season often hold yard sales to sell household items before a move — and families arriving at a new duty station love finding affordable deals nearby. YardShoppers makes both sides easy and free.`;
      cta = `If you'd like, I'd be happy to send over a flyer or short blurb your MWR or Family Support Center could share with service members and their families.`;
      break;

    case 'senior-living':
      pitch = `I'm reaching out because I think YardShoppers could be a helpful free resource for your residents in ${city}. Here's what we offer:

${features}

Many seniors and their families use yard sales as a way to downsize, declutter, or find affordable household items. YardShoppers makes it easy for your residents to post a sale or browse what's available nearby — all for free, with a simple, mobile-friendly design.`;
      cta = `If you'd like, I'd be happy to send over a short blurb or flyer your community could share with residents and their families.`;
      break;

    case 'moving':
      pitch = `I'm reaching out because I think YardShoppers could be a valuable free resource to share with your customers in ${city}. Here's what we offer:

${features}

Many people hold yard sales before a big move to lighten their load and earn some extra cash. By sharing YardShoppers with your customers, you're giving them a free tool that helps them declutter before moving day — which can even reduce the size (and cost) of their move.`;
      cta = `If you'd like, I'd be happy to send over a short blurb or link you could include in your booking confirmations or customer communications.`;
      break;

    case 'storage':
      pitch = `I'm reaching out because I think YardShoppers could be a helpful free resource to share with your customers in ${city}. Here's what we offer:

${features}

Some of your customers may be storing items they no longer need. By sharing YardShoppers, you can help them sell those items through a yard sale instead of paying for extra storage. It's a great value-add — free for you and free for them.`;
      cta = `If you'd like, I'd be happy to send over a flyer or short blurb you could share at your facility or include in customer communications.`;
      break;

    case 'school':
      pitch = `I'm reaching out because I think YardShoppers could be a great free resource for families at your school in ${city}. Here's what we offer:

${features}

Many PTA and PTO groups use YardShoppers to promote school-wide yard sales, fundraiser events, and community swap meets. Parents can also use it to find affordable school supplies, sports gear, and kids' items from nearby sales. It's completely free.`;
      cta = `If your school ever hosts community yard sales or fundraisers, we'd love to help promote them. I'd also be happy to send a short blurb for your next PTA newsletter.`;
      break;

    case 'parks-rec':
      pitch = `I'm reaching out because I think YardShoppers could be a great free resource for the ${city} community. Here's what we offer:

${features}

City and county recreation departments across the country partner with YardShoppers to help promote community-wide yard sale events, seasonal swap meets, and neighborhood clean-up sales. It's completely free for both the department and residents.`;
      cta = `If ${city} ever hosts community-wide yard sale events or would like to promote local sales, we'd love to support that. I'd be happy to send more details.`;
      break;

    case 'chamber':
      pitch = `I'm reaching out because I think YardShoppers could be a great free resource for the ${city} business community and local residents. Here's what we offer:

${features}

Chambers of Commerce across the country share YardShoppers as a way to support local commerce and community engagement. Yard sales bring foot traffic to neighborhoods, support small sellers, and give residents a fun reason to explore their community. It's completely free.`;
      cta = `If you'd like, I'd be happy to send over a short blurb you could include in your member newsletter or community event calendar.`;
      break;

    default:
      pitch = `I'm reaching out because I think YardShoppers could be a great free resource for the ${city} community. Here's what we offer:

${features}`;
      cta = `If you'd like to learn more, feel free to reach out anytime.`;
  }

  return `${greeting},

${intro}

${pitch}

${cta}

Thank you for your time, and feel free to reach out with any questions!

${signoff}
`;
}

export function generateEmail(
  category: string,
  orgName: string,
  city: string,
  orgType: string
): { subject: string; body: string } {
  return {
    subject: getSubject(category, city),
    body: getBody(category, orgName, city, orgType),
  };
}
