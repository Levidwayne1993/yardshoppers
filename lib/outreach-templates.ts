// ============================================================
// FILE: outreach-templates.ts
// WHERE TO PUT THIS:
//   C:\Users\citys\Documents\yardshoppers\lib\outreach-templates.ts
// ============================================================

export interface OutreachCategory {
  id: string;
  label: string;
  description: string;
  icon: string;
}

export const OUTREACH_CATEGORIES: OutreachCategory[] = [
  // ---- ORIGINAL 13 ----
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

  // ---- NEW 16 CATEGORIES ----
  { id: 'thrift', label: 'Thrift & Consignment', description: 'Thrift Stores & Consignment Shops', icon: '👗' },
  { id: 'organizer', label: 'Professional Organizers', description: 'Professional Organizers & Decluttering Services', icon: '🗂️' },
  { id: 'junk-removal', label: 'Junk Removal', description: 'Junk Removal Companies', icon: '🗑️' },
  { id: 'antique', label: 'Antique & Vintage', description: 'Antique Dealers & Vintage Shops', icon: '🪑' },
  { id: 'probate', label: 'Probate & Estate Law', description: 'Probate & Estate Attorneys', icon: '⚖️' },
  { id: 'library', label: 'Public Libraries', description: 'Public Libraries', icon: '📚' },
  { id: 'community-center', label: 'Community Centers', description: 'Community Centers & Rec Centers', icon: '🏛️' },
  { id: 'veterans', label: 'Veterans Organizations', description: 'VFW Posts & American Legion', icon: '🎗️' },
  { id: 'civic-clubs', label: 'Civic & Service Clubs', description: 'Rotary, Lions, Kiwanis & Similar Clubs', icon: '🦁' },
  { id: 'local-media', label: 'Local Media & Blogs', description: 'Local Newspapers & Community Blogs', icon: '📰' },
  { id: 'college', label: 'College Housing', description: 'College & University Housing Offices', icon: '🎓' },
  { id: 'apartment', label: 'Apartment Complexes', description: 'Apartment Complexes & Leasing Offices', icon: '🏗️' },
  { id: 'relocation', label: 'Relocation Services', description: 'Relocation & Corporate Moving Services', icon: '🌐' },
  { id: 'flea-market', label: 'Flea Markets & Swaps', description: 'Flea Markets & Swap Meets', icon: '🛍️' },
  { id: 'auction', label: 'Auction Houses', description: 'Auction Houses & Auctioneers', icon: '🔨' },
  { id: 'habitat', label: 'Habitat ReStores', description: 'Habitat for Humanity ReStores', icon: '🔧' },
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
    // ---- NEW 16 ----
    case 'thrift':
      return `Free Yard Sale Platform — Drive More Shoppers in ${city}`;
    case 'organizer':
      return `Free Yard Sale Tool for Your ${city} Decluttering Clients`;
    case 'junk-removal':
      return `Free Yard Sale Platform — A Resource for Your ${city} Customers`;
    case 'antique':
      return `Free Platform to Discover Yard Sales & Estate Sales in ${city}`;
    case 'probate':
      return `Free Yard Sale Platform for ${city} Estate Settlements`;
    case 'library':
      return `Free Community Yard Sale Resource for ${city} Library Patrons`;
    case 'community-center':
      return `Free Yard Sale Platform for ${city} Community Events`;
    case 'veterans':
      return `Free Yard Sale Platform for ${city} Veterans & Military Families`;
    case 'civic-clubs':
      return `Free Community Yard Sale Platform for ${city} Service Clubs`;
    case 'local-media':
      return `Free Yard Sale Listings for Your ${city} Readers`;
    case 'college':
      return `Free Yard Sale Platform for ${city} College Students`;
    case 'apartment':
      return `Free Yard Sale Platform for Your ${city} Residents`;
    case 'relocation':
      return `Free Yard Sale Tool for Your ${city} Relocating Clients`;
    case 'flea-market':
      return `Free Online Platform to Promote ${city} Flea Markets & Swap Meets`;
    case 'auction':
      return `Free Yard Sale Platform — Complement Your ${city} Auction Business`;
    case 'habitat':
      return `Free Yard Sale Platform for the ${city} Community`;
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
      pitch = `I'm reaching out because I think YardShoppers could be a great free resource for ${orgType.toLowerCase().includes('management') ? 'the communities you manage' : 'your neighborhood'} in ${city}.

Here's what we offer:

${features}

Many HOAs and community organizations share YardShoppers in their newsletters or community boards as a helpful resource for residents. There's no cost and no commitment — it's simply a better way for your residents to connect with local buyers.`;
      cta = `If you'd like, I'd be happy to send over a short blurb you could include in your next newsletter or community update.`;
      break;

    case 'property-management':
      pitch = `I'm reaching out because I think YardShoppers could be a valuable free resource for the communities you manage in ${city}.

Here's what we offer:

${features}

Property managers across the country share YardShoppers with their residents as a community engagement tool. It helps reduce clutter complaints, encourages neighbor interaction, and gives your residents a reason to feel good about their community. There's no cost and no commitment.`;
      cta = `I'd be happy to send over a short blurb you could share with your community managers or include in resident communications.`;
      break;

    case 'neighborhood':
      pitch = `I'm reaching out because I think YardShoppers could be a great free resource for residents in ${city}'s ${orgName} community.

Here's what we offer:

${features}

Neighborhood associations across the country share YardShoppers with their members as a way to encourage community engagement and help residents declutter. There's no cost and no commitment — it's simply a better way for your neighbors to connect with local buyers.`;
      cta = `If you'd like, I'd be happy to send over a short blurb you could include in your next neighborhood newsletter or community board post.`;
      break;

    case 'church':
      pitch = `I'm reaching out because I think YardShoppers could be a wonderful free resource for your congregation and the ${city} community.

Here's what we offer:

${features}

Many churches and faith-based organizations use YardShoppers to help promote church yard sales, fundraiser sales, and community events. Members can also use it to find great deals in their area. There's no cost and no commitment.`;
      cta = `If your church ever hosts yard sales or community events, we'd love to help promote them. I'd also be happy to send a short blurb you could include in a church bulletin or announcement.`;
      break;

    case 'estate-sale':
      pitch = `I'm reaching out because I think YardShoppers could be a great free tool to help promote your estate sales in ${city} and beyond.

Here's what we offer:

${features}

Estate sale companies across the country are listing their sales on YardShoppers to reach a larger audience of motivated local buyers. It's completely free, and each listing takes less than 2 minutes to post.`;
      cta = `If you'd like, I can walk you through how easy it is to list your upcoming sales, or I can set up your first listing for you at no cost.`;
      break;

    case 'real-estate':
      pitch = `I'm reaching out because I think YardShoppers could be a useful free resource to share with your clients in ${city}.

Here's what we offer:

${features}

Real estate agents find YardShoppers helpful for two reasons: sellers can use it to host a yard sale before listing their home (decluttering and attracting foot traffic), and new homeowners can find great deals on furniture and household items from nearby sales. It's completely free.`;
      cta = `If you'd like, I'd be happy to send over a short blurb or a link you could include in your client welcome packets or newsletters.`;
      break;

    case 'military':
      pitch = `I'm reaching out because I think YardShoppers could be a great free resource for military families at your installation in ${city}.

Here's what we offer:

${features}

Military families moving during PCS season often hold yard sales to sell household items before a move — and families arriving at a new duty station love finding affordable deals nearby. YardShoppers makes both sides easy and free.`;
      cta = `If you'd like, I'd be happy to send over a flyer or short blurb your MWR or Family Support Center could share with service members and their families.`;
      break;

    case 'senior-living':
      pitch = `I'm reaching out because I think YardShoppers could be a helpful free resource for your residents in ${city}.

Here's what we offer:

${features}

Many seniors and their families use yard sales as a way to downsize, declutter, or find affordable household items. YardShoppers makes it easy for your residents to post a sale or browse what's available nearby — all for free, with a simple, mobile-friendly design.`;
      cta = `If you'd like, I'd be happy to send over a short blurb or flyer your community could share with residents and their families.`;
      break;

    case 'moving':
      pitch = `I'm reaching out because I think YardShoppers could be a valuable free resource to share with your customers in ${city}.

Here's what we offer:

${features}

Many people hold yard sales before a big move to lighten their load and earn some extra cash. By sharing YardShoppers with your customers, you're giving them a free tool that helps them declutter before moving day — which can even reduce the size (and cost) of their move.`;
      cta = `If you'd like, I'd be happy to send over a short blurb or link you could include in your booking confirmations or customer communications.`;
      break;

    case 'storage':
      pitch = `I'm reaching out because I think YardShoppers could be a helpful free resource to share with your customers in ${city}.

Here's what we offer:

${features}

Some of your customers may be storing items they no longer need. By sharing YardShoppers, you can help them sell those items through a yard sale instead of paying for extra storage. It's a great value-add — free for you and free for them.`;
      cta = `If you'd like, I'd be happy to send over a flyer or short blurb you could share at your facility or include in customer communications.`;
      break;

    case 'school':
      pitch = `I'm reaching out because I think YardShoppers could be a great free resource for families at your school in ${city}.

Here's what we offer:

${features}

Many PTA and PTO groups use YardShoppers to promote school-wide yard sales, fundraiser events, and community swap meets. Parents can also use it to find affordable school supplies, sports gear, and kids' items from nearby sales. It's completely free.`;
      cta = `If your school ever hosts community yard sales or fundraisers, we'd love to help promote them. I'd also be happy to send a short blurb for your next PTA newsletter.`;
      break;

    case 'parks-rec':
      pitch = `I'm reaching out because I think YardShoppers could be a great free resource for the ${city} community.

Here's what we offer:

${features}

City and county recreation departments across the country partner with YardShoppers to help promote community-wide yard sale events, seasonal swap meets, and neighborhood clean-up sales. It's completely free for both the department and residents.`;
      cta = `If ${city} ever hosts community-wide yard sale events or would like to promote local sales, we'd love to support that. I'd be happy to send more details.`;
      break;

    case 'chamber':
      pitch = `I'm reaching out because I think YardShoppers could be a great free resource for the ${city} business community and local residents.

Here's what we offer:

${features}

Chambers of Commerce across the country share YardShoppers as a way to support local commerce and community engagement. Yard sales bring foot traffic to neighborhoods, support small sellers, and give residents a fun reason to explore their community. It's completely free.`;
      cta = `If you'd like, I'd be happy to send over a short blurb you could include in your member newsletter or community event calendar.`;
      break;

    // ============================================================
    // NEW 16 CATEGORIES
    // ============================================================

    case 'thrift':
      pitch = `I'm reaching out because I think YardShoppers could be a great complement to your thrift or consignment business in ${city}.

Here's what we offer:

${features}

Thrift stores and consignment shops thrive on the same community of bargain hunters and treasure seekers who love yard sales. By sharing YardShoppers with your customers, you're giving them another way to find and sell great items locally — and driving more foot traffic into the resale ecosystem that benefits your business. It's completely free.`;
      cta = `If you'd like, I'd be happy to send over a flyer you could display at your store, or a link to share on your social media.`;
      break;

    case 'organizer':
      pitch = `I'm reaching out because I think YardShoppers could be a valuable free tool for the clients you work with in ${city}.

Here's what we offer:

${features}

Professional organizers and decluttering specialists often help clients sort through years of belongings. Instead of donating or discarding everything, your clients can host a yard sale through YardShoppers to earn money from items they no longer need — making the decluttering process even more rewarding. It's completely free.`;
      cta = `If you'd like, I'd be happy to send over a short blurb or link you could share with your clients as part of your decluttering process.`;
      break;

    case 'junk-removal':
      pitch = `I'm reaching out because I think YardShoppers could be a helpful free resource for your customers in ${city}.

Here's what we offer:

${features}

Many of your customers may have items that are too good to throw away but they don't want to keep. By recommending YardShoppers before a junk removal appointment, you can help them sell valuable items first — and your team hauls away what's left. It's a win-win, and it's completely free for everyone.`;
      cta = `If you'd like, I'd be happy to send over a short blurb or link you could share with customers when they book a pickup.`;
      break;

    case 'antique':
      pitch = `I'm reaching out because I think YardShoppers could be a great free sourcing tool for your antique or vintage business in ${city}.

Here's what we offer:

${features}

Yard sales and estate sales are where many of the best antique and vintage finds come from. YardShoppers makes it easy to search for sales by location, category, and date — and our Route Planner helps you map out the most efficient path to hit multiple sales in one trip. It's completely free.`;
      cta = `If you'd like, I can show you how to set up alerts for new yard sales and estate sales in your area — or share a link your team can use to scout for inventory.`;
      break;

    case 'probate':
      pitch = `I'm reaching out because I think YardShoppers could be a helpful free resource for families you work with during estate settlements in ${city}.

Here's what we offer:

${features}

When a family is settling an estate, there are often household items, furniture, and personal belongings that need to be sold or distributed. YardShoppers gives families a free, easy way to host an estate sale or yard sale to liquidate those items — without the cost of hiring a professional estate sale company. It's simple, free, and takes less than 2 minutes to set up.`;
      cta = `If you'd like, I'd be happy to send over a resource card or link you could share with clients going through the estate settlement process.`;
      break;

    case 'library':
      pitch = `I'm reaching out because I think YardShoppers could be a wonderful free resource for library patrons and the ${city} community.

Here's what we offer:

${features}

Many public libraries serve as community hubs where residents look for local events and resources. YardShoppers fits right in — it helps residents find and post yard sales in their neighborhood, encourages community engagement, and supports sustainable reuse of household items. It's completely free.`;
      cta = `If you'd like, I'd be happy to send over a flyer for your community bulletin board, or a link your library could include on its community resources page.`;
      break;

    case 'community-center':
      pitch = `I'm reaching out because I think YardShoppers could be a great free resource for the ${city} community center and the residents you serve.

Here's what we offer:

${features}

Community centers are often the heart of a neighborhood — the place people go to find events, activities, and resources. YardShoppers is a natural fit, helping residents find and host yard sales, swap meets, and community sale events. It's completely free.`;
      cta = `If you'd like, I'd be happy to send over a flyer for your bulletin board, or a link to include in your newsletter or events calendar.`;
      break;

    case 'veterans':
      pitch = `I'm reaching out because I think YardShoppers could be a great free resource for veterans and military families in your ${city} post.

Here's what we offer:

${features}

As a veteran-founded company (my father Gary is a disabled veteran), we understand the military community. Veterans and their families frequently hold yard sales during PCS moves, downsizing, or just to declutter. YardShoppers makes it free and easy — and your post can share it as a helpful member benefit. No cost, no commitment.`;
      cta = `If you'd like, I'd be happy to send over a flyer for your post's bulletin board, or a short blurb for your newsletter.`;
      break;

    case 'civic-clubs':
      pitch = `I'm reaching out because I think YardShoppers could be a great free resource for your club members and the ${city} community.

Here's what we offer:

${features}

Service clubs like Rotary, Lions, and Kiwanis are built around community improvement. YardShoppers supports that mission by helping residents buy and sell locally, reducing waste, and encouraging neighborhood engagement. Many clubs have shared YardShoppers with their members or used it to promote community-wide yard sale events. It's completely free.`;
      cta = `If your club ever sponsors community events or publishes a newsletter, I'd be happy to send a short blurb or link to share with members.`;
      break;

    case 'local-media':
      pitch = `I'm reaching out because I think YardShoppers could be a great free resource to share with your readers in ${city}.

Here's what we offer:

${features}

Many local newspapers and community blogs already list yard sale and garage sale announcements. YardShoppers takes that a step further — it gives your readers a free, searchable platform to post and find sales, with a Route Planner that maps out the best route to hit multiple sales. It's a great resource to link to or mention in your community events coverage.`;
      cta = `If you'd like, I'd be happy to provide a short write-up, press release, or blurb you could include in your publication or website.`;
      break;

    case 'college':
      pitch = `I'm reaching out because I think YardShoppers could be an incredibly useful free resource for students at your campus in ${city}.

Here's what we offer:

${features}

At the end of every semester, students sell furniture, textbooks, dorm supplies, appliances, and more. YardShoppers gives them a free, easy way to post a sale and reach local buyers — no shipping, no fees, no hassle. It's also great for incoming students looking for affordable deals on move-in essentials.`;
      cta = `If you'd like, I'd be happy to send over a digital flyer or link your housing office could share with residents during move-in/move-out season.`;
      break;

    case 'apartment':
      pitch = `I'm reaching out because I think YardShoppers could be a great free amenity to share with residents at your ${city} properties.

Here's what we offer:

${features}

Apartment residents are always moving in and out — and yard sales are a natural part of that process. By sharing YardShoppers with your tenants, you give them a free way to sell items they don't need and find affordable furniture and household goods from neighbors. It reduces move-out clutter and builds community. No cost, no commitment.`;
      cta = `If you'd like, I'd be happy to send over a flyer for your leasing office or a link to include in your resident welcome packet.`;
      break;

    case 'relocation':
      pitch = `I'm reaching out because I think YardShoppers could be a valuable free resource for the clients you help relocate in ${city} and beyond.

Here's what we offer:

${features}

When employees or families are relocating, they often need to sell furniture, household items, and other belongings before the move. YardShoppers gives them a free, fast way to host a yard sale — which can also help reduce moving costs by downsizing before the truck arrives.`;
      cta = `If you'd like, I'd be happy to send over a resource link or blurb you could include in your relocation packets or client communications.`;
      break;

    case 'flea-market':
      pitch = `I'm reaching out because I think YardShoppers could be a great free tool to help promote your flea market or swap meet in ${city}.

Here's what we offer:

${features}

Flea market operators and swap meet organizers can list their events on YardShoppers for free to reach a larger audience of bargain hunters and treasure seekers. Your vendors and shoppers are the exact same community that uses YardShoppers — so cross-promotion is a natural fit.`;
      cta = `If you'd like, I'd be happy to help you list your upcoming events on YardShoppers for free, or send a link you can share with your vendors.`;
      break;

    case 'auction':
      pitch = `I'm reaching out because I think YardShoppers could be a useful free complement to your auction business in ${city}.

Here's what we offer:

${features}

Not every item meets the value threshold for a formal auction. YardShoppers gives your clients another option — they can sell lower-value items through a yard sale while you handle the high-value pieces. It's a free value-add for your clients and keeps the entire liquidation process smooth.`;
      cta = `If you'd like, I'd be happy to send over a link or resource card you could share with clients who have mixed-value estates or households.`;
      break;

    case 'habitat':
      pitch = `I'm reaching out because I think YardShoppers could be a wonderful free resource for the ${city} Habitat for Humanity ReStore and the community you serve.

Here's what we offer:

${features}

ReStores and YardShoppers share the same mission — keeping usable items out of landfills and making them available to people who need them. By sharing YardShoppers with your donors and shoppers, you give them another free way to buy and sell locally. Items that don't fit your ReStore inventory can still find a home through a yard sale.`;
      cta = `If you'd like, I'd be happy to send over a flyer for your store or a link to share on your website and social media.`;
      break;

    default:
      pitch = `I'm reaching out because I think YardShoppers could be a great free resource for the ${city} community.

Here's what we offer:

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
