// ============================================================
// FILE: outreach-templates.ts
// WHERE TO PUT THIS:
//   C:\Users\citys\Documents\yardshoppers\lib\outreach-templates.ts
//
// CHANGES FROM V2:
//   - generateEmail() now accepts an optional 5th parameter: promoCode
//   - When promoCode is provided, a professional promo block is inserted
//     before the sign-off, encouraging orgs to share the code with their
//     community for a free listing boost
//   - All 29 category templates are unchanged
//   - OUTREACH_CATEGORIES array is unchanged
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
      cta = `If you'd like, I'd be happy to walk you through how easy it is to list your sales, or I can send a link your team can use.`;
      break;

    case 'real-estate':
      pitch = `I'm reaching out because I think YardShoppers could be a handy free tool for your clients in ${city}.

Here's what we offer:

${features}

When your clients are getting ready to sell, downsizing, or relocating, a yard sale is one of the fastest ways to declutter before staging and showing a home. Many real estate agents recommend YardShoppers to their clients as a pre-listing resource.`;
      cta = `If you'd like, I'd be happy to send over a link or a digital resource card you could share with your clients.`;
      break;

    case 'military':
      pitch = `I'm reaching out because I think YardShoppers could be a great free resource for veterans and military families in your ${city} post.

Here's what we offer:

${features}

Military families move frequently, and yard sales are one of the best ways to sell items before a PCS move or find affordable household goods after arriving at a new duty station. YardShoppers makes it easy — and it's completely free.`;
      cta = `If you'd like, I'd be happy to send over a flyer or link for your community board, MWR center, or family readiness group.`;
      break;

    case 'senior-living':
      pitch = `I'm reaching out because I think YardShoppers could be a great free resource for residents at your ${city} community.

Here's what we offer:

${features}

Many senior residents and their families use yard sales when downsizing, moving to assisted living, or simply clearing out extra belongings. YardShoppers makes it easy for them to host a sale and for nearby buyers to find great deals. It's free and mobile-friendly.`;
      cta = `If you'd like, I'd be happy to send over a link or short blurb you could share with your residents or their families.`;
      break;

    case 'moving':
      pitch = `I'm reaching out because I think YardShoppers could be a valuable free resource for the customers you serve in ${city}.

Here's what we offer:

${features}

Before a big move, many families want to sell items they don't plan to take. YardShoppers gives them a free, easy way to host a yard sale — which can help reduce moving costs and make the process smoother. It's a great free value-add for your customers.`;
      cta = `If you'd like, I'd be happy to send over a link or blurb you could include in your booking confirmations or customer materials.`;
      break;

    case 'storage':
      pitch = `I'm reaching out because I think YardShoppers could be a great free resource for the customers at your ${city} facility.

Here's what we offer:

${features}

Many storage customers eventually need to downsize or clear out their unit. A yard sale is one of the easiest ways to do that — and YardShoppers makes the process free and simple. Some storage facilities share our platform with tenants as a helpful community resource.`;
      cta = `If you'd like, I'd be happy to send over a flyer for your front office or a link to include in your customer communications.`;
      break;

    case 'school':
      pitch = `I'm reaching out because I think YardShoppers could be a great free resource for families in your ${city} school community.

Here's what we offer:

${features}

Many PTA and PTO groups use yard sales as fundraisers, community events, or school-wide garage sales. YardShoppers can help promote those events for free and give families an easy way to post their own individual sales, too.`;
      cta = `If you'd like, I'd be happy to send over a flyer or link you could share in your school newsletter or PTA communications.`;
      break;

    case 'parks-rec':
      pitch = `I'm reaching out because I think YardShoppers could be a great free addition to the community resources you offer in ${city}.

Here's what we offer:

${features}

Many city and county parks departments promote community yard sale events, swap meets, and neighborhood cleanup days. YardShoppers can help you promote those events for free, and residents can use it year-round to find local sales.`;
      cta = `If you'd like, I'd be happy to send over a resource link you could include on your community events page or social media.`;
      break;

    case 'chamber':
      pitch = `I'm reaching out because I think YardShoppers could be a valuable free tool for the local business community and residents in ${city}.

Here's what we offer:

${features}

Chamber of Commerce organizations across the country share YardShoppers as a community resource — it drives local foot traffic, helps residents connect, and supports the same buy-local mindset your members champion. There's no cost and no commitment.`;
      cta = `If you'd like, I'd be happy to send over a member resource link or a blurb you could feature in your next newsletter or business directory.`;
      break;

    // ---- NEW 16 ----
    case 'thrift':
      pitch = `I'm reaching out because I think YardShoppers could be a great free complement to your thrift or consignment business in ${city}.

Here's what we offer:

${features}

Your customers love finding great deals — and yard sales are a natural extension of that. By sharing YardShoppers with your shoppers and consignors, you help them find even more local deals and give them another outlet for items you might not carry. It's completely free and builds community.`;
      cta = `If you'd like, I'd be happy to send a flyer for your checkout counter or a link for your social media.`;
      break;

    case 'organizer':
      pitch = `I'm reaching out because I think YardShoppers could be a great free tool to recommend to your decluttering and organizing clients in ${city}.

Here's what we offer:

${features}

When your clients are done sorting, they often have piles of items to sell. A yard sale is one of the easiest and most rewarding ways to do that — and YardShoppers makes it free and simple. It's a natural next step after an organizing session.`;
      cta = `If you'd like, I'd be happy to send a link or resource card you could share with clients after a session.`;
      break;

    case 'junk-removal':
      pitch = `I'm reaching out because I think YardShoppers could be a helpful free resource for your customers in ${city}.

Here's what we offer:

${features}

Before calling for a pickup, many homeowners want to sell items that still have value. A yard sale is one of the best ways to do that — and YardShoppers makes it free and easy. It's a great value-add for customers who want to sell first and haul later.`;
      cta = `If you'd like, I'd be happy to send a link or blurb you could share with customers who might benefit from hosting a sale first.`;
      break;

    case 'antique':
      pitch = `I'm reaching out because I think YardShoppers could be a great free resource for your business and the antique community in ${city}.

Here's what we offer:

${features}

Yard sales and estate sales are a goldmine for antique and vintage dealers — and many of your customers are yard sale enthusiasts, too. By sharing YardShoppers, you help your customers find more local sales and keep the treasure-hunting community connected.`;
      cta = `If you'd like, I'd be happy to send a flyer for your shop or a link for your website and social media.`;
      break;

    case 'probate':
      pitch = `I'm reaching out because I think YardShoppers could be a useful free resource for your clients handling estate settlements in ${city}.

Here's what we offer:

${features}

When families are settling an estate, they often need to liquidate household items. A yard sale is one of the most practical and cost-effective options — and YardShoppers makes it free and easy to post one. It's a helpful tool to recommend alongside estate sale companies or auction houses.`;
      cta = `If you'd like, I'd be happy to send a resource link or blurb you could include in your client materials or estate settlement guides.`;
      break;

    case 'library':
      pitch = `I'm reaching out because I think YardShoppers could be a wonderful free resource for patrons at the ${city} library.

Here's what we offer:

${features}

Libraries are community hubs, and many patrons are interested in local events like yard sales, book sales, and swap meets. YardShoppers can help you promote library book sales for free — and gives your patrons a way to find sales in their area year-round.`;
      cta = `If you'd like, I'd be happy to send a flyer for your community board or a link to include on your events page.`;
      break;

    case 'community-center':
      pitch = `I'm reaching out because I think YardShoppers could be a great free resource for the ${city} community center and the residents you serve.

Here's what we offer:

${features}

Community centers often host events like neighborhood yard sales, swap meets, and cleanup days. YardShoppers can help promote those events for free — and gives your visitors a way to find and post local sales year-round.`;
      cta = `If you'd like, I'd be happy to send a flyer for your bulletin board or a link you could share on your website or social media.`;
      break;

    case 'veterans':
      pitch = `I'm reaching out because I think YardShoppers could be a great free resource for veterans and military families in your ${city} post.

Here's what we offer:

${features}

Veterans, military families, and post members often use yard sales when downsizing, relocating, or raising funds for community projects. YardShoppers makes it free and simple for them to host a sale and for nearby buyers to find great deals. It's also a great tool for post fundraisers and community events.`;
      cta = `If you'd like, I'd be happy to send over a flyer for your post board, or a link you can share with your members and their families.`;
      break;

    case 'civic-clubs':
      pitch = `I'm reaching out because I think YardShoppers could be a great free resource for your club and the ${city} community.

Here's what we offer:

${features}

Service clubs like yours often host community events, fundraisers, and garage sales. YardShoppers can help promote those events for free — and gives your members a way to find and post local sales year-round. It's a natural fit for any club focused on community service.`;
      cta = `If you'd like, I'd be happy to send over a link or blurb you could share in your next meeting agenda or club newsletter.`;
      break;

    case 'local-media':
      pitch = `I'm reaching out because I think YardShoppers could be a great free resource to share with your ${city} readers.

Here's what we offer:

${features}

Yard sales and garage sales are one of the most popular community activities in America — and your readers are always looking for ways to find great deals nearby. A mention or listing of YardShoppers could be a valuable free resource for your audience.`;
      cta = `If you'd like, I'd be happy to provide a short write-up, community listing, or press blurb about YardShoppers for your publication.`;
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

// ------ Promo code block (inserted before sign-off when a promo code is provided) ------
function getPromoBlock(promoCode: string): string {
  return `--- Exclusive Community Offer ---

As a thank you for connecting with us, we'd like to offer an exclusive promo code your community can share. Anyone who uses this code on YardShoppers will receive a free listing boost — making their yard sale more visible to local buyers at no cost.

Promo Code: ${promoCode}
Redeem at: www.yardshoppers.com

Feel free to share this code in your newsletters, community boards, social media, or directly with members and residents. There's no limit to how many people can benefit — we just want to help your community get the most out of their yard sales!`;
}

// ------ Main export: generateEmail ------
// promoCode is optional — when provided, the promo block is inserted
// right before "Thank you for your time" in the email body.
export function generateEmail(
  category: string,
  orgName: string,
  city: string,
  orgType: string,
  promoCode?: string
): { subject: string; body: string } {
  const subject = getSubject(category, city);
  let body = getBody(category, orgName, city, orgType);

  if (promoCode) {
    // Insert promo block before "Thank you for your time"
    const marker = 'Thank you for your time';
    const markerIndex = body.indexOf(marker);
    if (markerIndex !== -1) {
      body =
        body.slice(0, markerIndex) +
        getPromoBlock(promoCode) +
        '\n\n' +
        body.slice(markerIndex);
    } else {
      // Fallback: append before the signoff (last 5 lines)
      const lines = body.split('\n');
      const signoffStart = lines.length - 6;
      body =
        lines.slice(0, signoffStart).join('\n') +
        '\n\n' +
        getPromoBlock(promoCode) +
        '\n\n' +
        lines.slice(signoffStart).join('\n');
    }
  }

  return { subject, body };
}
