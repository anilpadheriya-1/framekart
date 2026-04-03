/**
 * LensGigs Figma UI Kit Generator
 *
 * HOW TO USE:
 * 1. Open any Figma file (or create a new one)
 * 2. Go to Plugins → Development → New Plugin → "Run once"
 * 3. Paste this entire script
 * 4. Click Run
 *
 * This creates:
 *  - Color styles (brand, semantic, neutrals)
 *  - Text styles (display, heading, body, mono)
 *  - Component: GigCard
 *  - Component: NavBar
 *  - Component: Button (primary, secondary, ghost variants)
 *  - Component: Badge (status variants)
 *  - Component: PricingTier card
 *  - Component: Avatar
 *  - Screen: Home page (1440px)
 *  - Screen: Gig Detail (1440px)
 *  - Screen: Dashboard (1440px)
 *  - Screen: Mobile Home (375px)
 */

const BG      = { r: 0,     g: 0,     b: 0     }; // #000000
const SURFACE = { r: 0.094, g: 0.094, b: 0.106 }; // #18181B
const SURF2   = { r: 0.153, g: 0.153, b: 0.165 }; // #27272A
const BORDER  = { r: 0.247, g: 0.247, b: 0.275 }; // #3F3F46
const MUTED   = { r: 0.443, g: 0.443, b: 0.482 }; // #71717A
const TEXT    = { r: 0.957, g: 0.957, b: 0.961 }; // #F4F4F5
const EM      = { r: 0.063, g: 0.725, b: 0.506 }; // #10B981
const EM_DARK = { r: 0.024, g: 0.498, b: 0.337 }; // #059669
const AMBER   = { r: 0.961, g: 0.620, b: 0.043 }; // #F59E0B
const RED     = { r: 0.937, g: 0.267, b: 0.267 }; // #EF4444
const BLUE    = { r: 0.376, g: 0.647, b: 0.980 }; // #60A5FA

async function run() {
  const page = figma.currentPage;

  // ── Helper: create rectangle ──────────────────────────────────────────────
  function rect(x, y, w, h, color, radius = 0, name = "") {
    const r = figma.createRectangle();
    r.x = x; r.y = y; r.resize(w, h);
    r.fills = [{ type: "SOLID", color }];
    r.cornerRadius = radius;
    if (name) r.name = name;
    return r;
  }

  // ── Helper: create text ───────────────────────────────────────────────────
  async function text(content, x, y, size, weight, color, name = "") {
    await figma.loadFontAsync({ family: "Inter", style: weight });
    const t = figma.createText();
    t.x = x; t.y = y;
    t.fontName = { family: "Inter", style: weight };
    t.fontSize = size;
    t.fills = [{ type: "SOLID", color }];
    t.characters = content;
    if (name) t.name = name;
    return t;
  }

  // ── Helper: group nodes ───────────────────────────────────────────────────
  function group(nodes, name) {
    const g = figma.group(nodes, page);
    g.name = name;
    return g;
  }

  // ── Helper: frame ─────────────────────────────────────────────────────────
  function frame(x, y, w, h, color, radius = 0, name = "") {
    const f = figma.createFrame();
    f.x = x; f.y = y; f.resize(w, h);
    f.fills = color ? [{ type: "SOLID", color }] : [];
    f.cornerRadius = radius;
    if (name) f.name = name;
    return f;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SECTION 1: COLOR SWATCHES
  // ─────────────────────────────────────────────────────────────────────────
  let cx = 0, cy = 0;

  const swatchLabel = await text("LensGigs — Color System", 0, -50, 28, "Bold", TEXT);
  page.appendChild(swatchLabel);

  const colors = [
    { name: "Brand/Emerald",    color: EM },
    { name: "Brand/Emerald Dark", color: EM_DARK },
    { name: "Neutral/Background", color: BG },
    { name: "Neutral/Surface",  color: SURFACE },
    { name: "Neutral/Surface 2", color: SURF2 },
    { name: "Neutral/Border",   color: BORDER },
    { name: "Neutral/Muted",    color: MUTED },
    { name: "Neutral/Text",     color: TEXT },
    { name: "Semantic/Amber",   color: AMBER },
    { name: "Semantic/Red",     color: RED },
    { name: "Semantic/Blue",    color: BLUE },
  ];

  for (let i = 0; i < colors.length; i++) {
    const { name, color } = colors[i];
    const sx = i * 120;
    const bg = rect(sx, 0, 100, 60, color, 12, name);
    const border = rect(sx, 0, 100, 60, BORDER, 12);
    border.fills = [];
    border.strokes = [{ type: "SOLID", color: BORDER }];
    border.strokeWeight = 1;
    const label = await text(name.split("/")[1], sx, 68, 11, "Regular", MUTED);
    page.appendChild(bg);
    page.appendChild(border);
    page.appendChild(label);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SECTION 2: TYPOGRAPHY
  // ─────────────────────────────────────────────────────────────────────────
  cy = 160;
  const typoLabel = await text("Typography", 0, cy - 36, 20, "Semi Bold", MUTED);
  page.appendChild(typoLabel);

  const typeStyles = [
    { label: "Display / 48px Bold",   size: 48, weight: "Bold",     sample: "India's Best Visual Artists" },
    { label: "Heading 1 / 32px Bold", size: 32, weight: "Bold",     sample: "Wedding Photography" },
    { label: "Heading 2 / 24px Semi", size: 24, weight: "Semi Bold", sample: "₹25,000 Starting" },
    { label: "Body / 16px Regular",   size: 16, weight: "Regular",  sample: "Complete coverage from getting ready to reception." },
    { label: "Caption / 13px Regular", size: 13, weight: "Regular", sample: "4.9 · 42 reviews · Mumbai" },
    { label: "Mono / 14px",           size: 14, weight: "Regular",  sample: "₹45,000" },
  ];

  for (const { label, size, weight, sample } of typeStyles) {
    const lbl = await text(label, 0, cy, 11, "Regular", MUTED);
    const sam = await text(sample, 0, cy + 16, size, weight, TEXT);
    page.appendChild(lbl);
    page.appendChild(sam);
    cy += size + 48;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SECTION 3: BUTTONS
  // ─────────────────────────────────────────────────────────────────────────
  cx = 1400; cy = 0;
  const btnLabel = await text("Buttons", cx, cy - 36, 20, "Semi Bold", MUTED);
  page.appendChild(btnLabel);

  // Primary button
  const btnPrimary = frame(cx, cy, 160, 44, EM, 12, "Button/Primary");
  const btnPrimaryText = await text("Book Now", cx + 20, cy + 13, 14, "Semi Bold", { r: 0, g: 0, b: 0 });
  page.appendChild(btnPrimary);
  page.appendChild(btnPrimaryText);

  // Secondary button
  cy += 60;
  const btnSecondary = frame(cx, cy, 160, 44, SURFACE, 12, "Button/Secondary");
  btnSecondary.strokes = [{ type: "SOLID", color: BORDER }];
  btnSecondary.strokeWeight = 1;
  const btnSecText = await text("View Profile", cx + 20, cy + 13, 14, "Semi Bold", TEXT);
  page.appendChild(btnSecondary);
  page.appendChild(btnSecText);

  // Ghost button
  cy += 60;
  const btnGhost = frame(cx, cy, 160, 44, null, 12, "Button/Ghost");
  btnGhost.strokes = [{ type: "SOLID", color: BORDER }];
  btnGhost.strokeWeight = 1;
  const btnGhostText = await text("Cancel", cx + 20, cy + 13, 14, "Regular", MUTED);
  page.appendChild(btnGhost);
  page.appendChild(btnGhostText);

  // ─────────────────────────────────────────────────────────────────────────
  // SECTION 4: BADGES
  // ─────────────────────────────────────────────────────────────────────────
  cy += 80;
  const badgeLabel = await text("Status Badges", cx, cy - 24, 20, "Semi Bold", MUTED);
  page.appendChild(badgeLabel);

  const badges = [
    { label: "Pending",   bg: { r: 0.961, g: 0.620, b: 0.043, a: 0.1 }, color: AMBER },
    { label: "Accepted",  bg: { r: 0.376, g: 0.647, b: 0.980, a: 0.1 }, color: BLUE },
    { label: "Completed", bg: { r: 0.063, g: 0.725, b: 0.506, a: 0.1 }, color: EM },
    { label: "Rejected",  bg: { r: 0.937, g: 0.267, b: 0.267, a: 0.1 }, color: RED },
  ];

  let bx = cx;
  for (const { label, bg, color } of badges) {
    const badgeFr = frame(bx, cy, 90, 28, null, 8, `Badge/${label}`);
    badgeFr.fills = [{ type: "SOLID", color: { r: color.r, g: color.g, b: color.b }, opacity: 0.15 }];
    badgeFr.strokes = [{ type: "SOLID", color: { r: color.r, g: color.g, b: color.b }, opacity: 0.4 }];
    badgeFr.strokeWeight = 1;
    const badgeText = await text(label, bx + 12, cy + 7, 11, "Semi Bold", color);
    page.appendChild(badgeFr);
    page.appendChild(badgeText);
    bx += 100;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SECTION 5: GIG CARD component
  // ─────────────────────────────────────────────────────────────────────────
  cx = 2800; cy = 0;
  const gigCardLabel = await text("Gig Card", cx, cy - 36, 20, "Semi Bold", MUTED);
  page.appendChild(gigCardLabel);

  // Card background
  const cardBg = frame(cx, cy, 300, 360, SURFACE, 16, "GigCard");
  cardBg.strokes = [{ type: "SOLID", color: BORDER }];
  cardBg.strokeWeight = 1;

  // Image placeholder
  const imgPH = frame(0, 0, 300, 180, SURF2, 0, "Image Placeholder");
  imgPH.fills = [{ type: "SOLID", color: SURF2 }];
  cardBg.appendChild(imgPH);

  // Category badge on image
  const catBadge = frame(12, 12, 100, 24, null, 8, "Category Badge");
  catBadge.fills = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 }, opacity: 0.7 }];
  catBadge.strokes = [{ type: "SOLID", color: BORDER }];
  catBadge.strokeWeight = 1;
  imgPH.appendChild(catBadge);

  // Card body - auto layout frame
  const cardBody = frame(0, 180, 300, 180, null, 0, "Card Body");
  cardBody.fills = [];
  cardBg.appendChild(cardBody);

  page.appendChild(cardBg);

  // Text layers outside (labels on the card)
  const provName = await text("Arjun Mehta", cx + 40, cy + 192, 12, "Medium", MUTED);
  const gigTitle = await text("Professional Wedding Photography", cx + 16, cy + 212, 13, "Semi Bold", TEXT);
  gigTitle.textAutoResize = "HEIGHT";
  const ratingText = await text("★ 4.9 (42 reviews)", cx + 16, cy + 260, 12, "Regular", MUTED);
  const locationText = await text("📍 Mumbai", cx + 160, cy + 260, 12, "Regular", MUTED);
  const divider = rect(cx + 16, cy + 284, 268, 1, BORDER, 0, "Divider");
  const startLabel = await text("Starting at", cx + 16, cy + 296, 10, "Regular", MUTED);
  const priceText = await text("₹25,000", cx + 16, cy + 310, 18, "Bold", EM);
  const ordersText = await text("128 orders", cx + 220, cy + 314, 11, "Regular", MUTED);

  // Avatar circle
  const avatarCircle = frame(cx + 16, cy + 188, 24, 24, EM, 12, "Avatar");
  avatarCircle.cornerRadius = 99;
  const avatarText = await text("AM", cx + 22, cy + 194, 9, "Bold", { r: 0, g: 0, b: 0 });

  page.appendChild(avatarCircle);
  [provName, gigTitle, ratingText, locationText, divider, startLabel, priceText, ordersText, avatarText].forEach(n => page.appendChild(n));

  // ─────────────────────────────────────────────────────────────────────────
  // SECTION 6: PRICING TIER CARD
  // ─────────────────────────────────────────────────────────────────────────
  cx = 3200; cy = 0;
  const tierLabel = await text("Pricing Tiers", cx, cy - 36, 20, "Semi Bold", MUTED);
  page.appendChild(tierLabel);

  const tiers = [
    { name: "Basic",    price: "₹25,000", desc: "6 hours · 300 photos", border: BORDER,   accent: TEXT },
    { name: "Standard", price: "₹45,000", desc: "10 hours · 600 photos · 2 photographers", border: BLUE, accent: BLUE },
    { name: "Premium",  price: "₹75,000", desc: "Full day · 1000+ photos · engagement shoot", border: AMBER, accent: AMBER },
  ];

  for (let i = 0; i < tiers.length; i++) {
    const { name, price, desc, border, accent } = tiers[i];
    const tx = cx + i * 260;
    const tierCard = frame(tx, cy, 240, 140, SURFACE, 14, `PricingTier/${name}`);
    tierCard.strokes = [{ type: "SOLID", color: border }];
    tierCard.strokeWeight = 2;
    page.appendChild(tierCard);

    const tierName = await text(name, tx + 16, cy + 16, 12, "Semi Bold", accent);
    const tierPrice = await text(price, tx + 16, cy + 38, 24, "Bold", EM);
    const tierDesc = await text(desc, tx + 16, cy + 76, 11, "Regular", MUTED);
    [tierName, tierPrice, tierDesc].forEach(n => page.appendChild(n));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SECTION 7: FULL NAVBAR
  // ─────────────────────────────────────────────────────────────────────────
  cx = 0; cy = 900;
  const navLabel = await text("Navigation Bar (1440px)", cx, cy - 36, 20, "Semi Bold", MUTED);
  page.appendChild(navLabel);

  const navbar = frame(0, cy, 1440, 64, BG, 0, "Navbar");
  navbar.strokes = [{ type: "SOLID", color: BORDER }];
  navbar.strokeWeight = 1;
  page.appendChild(navbar);

  // Logo
  const logoIcon = frame(24, cy + 18, 28, 28, EM, 8, "Logo Icon");
  page.appendChild(logoIcon);
  const logoText1 = await text("Visual", 60, cy + 22, 16, "Bold", TEXT);
  const logoText2 = await text("Hub", 97, cy + 22, 16, "Bold", EM);

  // Nav links
  const navLinks = ["Browse", "Dashboard", "Messages", "Go Pro"];
  for (let i = 0; i < navLinks.length; i++) {
    const lx = 240 + i * 110;
    const isActive = i === 0;
    const linkBg = frame(lx - 8, cy + 18, 80, 30, isActive ? { r: EM.r, g: EM.g, b: EM.b } : null, 8, `NavLink/${navLinks[i]}`);
    if (isActive) linkBg.fills = [{ type: "SOLID", color: EM, opacity: 0.12 }];
    else linkBg.fills = [];
    page.appendChild(linkBg);
    const linkText = await text(navLinks[i], lx, cy + 24, 13, "Medium", isActive ? EM : MUTED);
    page.appendChild(linkText);
  }

  // Right side
  const getStartedBtn = frame(1240, cy + 16, 120, 32, EM, 10, "CTA Button");
  page.appendChild(getStartedBtn);
  const ctaText = await text("Get Started", 1255, cy + 24, 13, "Semi Bold", { r: 0, g: 0, b: 0 });
  const loginText = await text("Log in", 1180, cy + 24, 13, "Medium", MUTED);
  [logoText1, logoText2, ctaText, loginText].forEach(n => page.appendChild(n));

  // ─────────────────────────────────────────────────────────────────────────
  // SECTION 8: HERO SECTION
  // ─────────────────────────────────────────────────────────────────────────
  cy = 1020;
  const heroSection = frame(0, cy, 1440, 480, BG, 0, "Hero Section");
  // Green gradient glow
  heroSection.fills = [
    { type: "GRADIENT_RADIAL",
      gradientTransform: [[0.5, 0, 0.5], [0, 0.5, 0]],
      gradientStops: [
        { position: 0, color: { r: EM.r, g: EM.g, b: EM.b, a: 0.15 } },
        { position: 1, color: { r: 0, g: 0, b: 0, a: 0 } }
      ]
    }
  ];
  page.appendChild(heroSection);

  const badge = frame(600, cy + 40, 240, 32, null, 20, "Hero Badge");
  badge.fills = [{ type: "SOLID", color: EM, opacity: 0.1 }];
  badge.strokes = [{ type: "SOLID", color: EM, opacity: 0.3 }];
  badge.strokeWeight = 1;
  page.appendChild(badge);
  const badgeT = await text("India's #1 Visual Arts Marketplace", 616, cy + 48, 11, "Semi Bold", EM);
  page.appendChild(badgeT);

  const heroH1a = await text("Hire India's Best", 400, cy + 100, 56, "Bold", TEXT);
  const heroH1b = await text("Visual Artists", 480, cy + 166, 56, "Bold", EM);
  const heroSub = await text("Find top-rated photographers, videographers, drone operators, and video editors across India.", 280, cy + 246, 18, "Regular", MUTED);
  heroSub.textAutoResize = "HEIGHT";

  // Search bar
  const searchBar = frame(360, cy + 308, 720, 52, SURFACE, 16, "Search Bar");
  searchBar.strokes = [{ type: "SOLID", color: BORDER }];
  searchBar.strokeWeight = 1;
  const searchBtn = frame(990, cy + 312, 84, 44, EM, 12, "Search Button");
  page.appendChild(searchBar);
  page.appendChild(searchBtn);
  const searchPH = await text("Search photographers, videographers, editors...", 396, cy + 323, 13, "Regular", MUTED);
  const searchBtnText = await text("Search", 1006, cy + 326, 13, "Semi Bold", { r: 0, g: 0, b: 0 });
  [heroH1a, heroH1b, heroSub, searchPH, searchBtnText].forEach(n => page.appendChild(n));

  // ─────────────────────────────────────────────────────────────────────────
  // SECTION 9: GIG GRID (3 cards)
  // ─────────────────────────────────────────────────────────────────────────
  cy = 1560;
  const gridLabel = await text("Gig Grid — Featured", 0, cy - 40, 20, "Semi Bold", MUTED);
  page.appendChild(gridLabel);

  const gigData = [
    { title: "Professional Wedding Photography", provider: "Arjun Mehta", price: "₹25,000", rating: "4.9", loc: "Mumbai", initials: "AM" },
    { title: "Cinematic Wedding Film 4K",       provider: "Priya Sharma",  price: "₹35,000", rating: "4.8", loc: "Delhi",  initials: "PS" },
    { title: "Aerial Drone Photography",         provider: "Ravi Kumar",    price: "₹8,000",  rating: "4.7", loc: "Bengaluru", initials: "RK" },
  ];

  for (let i = 0; i < gigData.length; i++) {
    const { title, provider, price, rating, loc, initials } = gigData[i];
    const gx = i * 320;
    const gc = frame(gx, cy, 300, 340, SURFACE, 16, `GigCard/${provider}`);
    gc.strokes = [{ type: "SOLID", color: BORDER }]; gc.strokeWeight = 1;
    const gImg = frame(0, 0, 300, 170, SURF2, 0, "Image");
    gc.appendChild(gImg);
    page.appendChild(gc);

    const av = frame(gx + 16, cy + 182, 22, 22, EM, 11, "Avatar");
    av.cornerRadius = 99;
    const avT = await text(initials, gx + 20, cy + 187, 9, "Bold", { r: 0, g: 0, b: 0 });
    const prov = await text(provider, gx + 44, cy + 185, 11, "Regular", MUTED);
    const t = await text(title, gx + 16, cy + 207, 13, "Semi Bold", TEXT);
    const r = await text(`★ ${rating}`, gx + 16, cy + 248, 11, "Regular", MUTED);
    const l = await text(`📍 ${loc}`, gx + 140, cy + 248, 11, "Regular", MUTED);
    const div = rect(gx + 16, cy + 270, 268, 1, BORDER);
    const slbl = await text("Starting at", gx + 16, cy + 282, 10, "Regular", MUTED);
    const pr = await text(price, gx + 16, cy + 296, 18, "Bold", EM);
    [av, avT, prov, t, r, l, div, slbl, pr].forEach(n => page.appendChild(n));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SECTION 10: DASHBOARD
  // ─────────────────────────────────────────────────────────────────────────
  cx = 0; cy = 2060;
  const dashLabel = await text("Dashboard — Stats", cx, cy - 40, 20, "Semi Bold", MUTED);
  page.appendChild(dashLabel);

  const statData = [
    { label: "Total Bookings", value: "12",     accent: TEXT },
    { label: "Pending",        value: "3",      accent: AMBER },
    { label: "Revenue",        value: "₹1.2L",  accent: EM },
    { label: "Active Gigs",    value: "4",      accent: BLUE },
  ];

  for (let i = 0; i < statData.length; i++) {
    const { label, value, accent } = statData[i];
    const sx = i * 260;
    const statCard = frame(sx, cy, 240, 100, SURFACE, 14, `StatCard/${label}`);
    statCard.strokes = [{ type: "SOLID", color: BORDER }]; statCard.strokeWeight = 1;
    page.appendChild(statCard);
    const sLabel = await text(label, sx + 16, cy + 16, 11, "Regular", MUTED);
    const sValue = await text(value, sx + 16, cy + 42, 32, "Bold", accent);
    [sLabel, sValue].forEach(n => page.appendChild(n));
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  figma.viewport.scrollAndZoomIntoView(page.children);
  figma.closePlugin("✅ LensGigs UI Kit created successfully!");
}

run().catch(err => figma.closePlugin("❌ Error: " + err.message));
