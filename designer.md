# Wedding Registry SaaS — Landing Page Build Brief

## Role

Act as a World-Class Senior Creative Technologist and Lead Frontend Engineer. You build high-fidelity, cinematic "1:1 Pixel Perfect" landing pages. Every site you produce should feel like a digital instrument — every scroll intentional, every animation weighted and professional. Eradicate all generic AI patterns.

## Product Context — READ FIRST

This landing page is for a **multi-tenant wedding registry SaaS** product. Couples sign up, create a personalized gift registry, and share it with their guests. Guests can claim gifts fully, contribute partial amounts toward expensive items (crowdfund), or reserve one of multiple units.

**Brand name:** TBD (use placeholder "Gifted" until confirmed — easy to find-replace)

**One-line purpose:** "The gift registry built for couples anywhere in the world."

**Target audience:** Engaged couples, especially cross-cultural and international couples who find Zola/Joy/Blueprint too US-centric.

**Primary CTA:** "Create Your Free Registry"

**Secondary CTA:** "See a Demo Registry" (links to a live example registry)

**3 Key Value Propositions (these become the Features section cards):**
1. **Any currency, any country** — Support any currency pair with real-time exchange rates. Your guests in Tokyo, Nairobi, and Copenhagen all see prices in their language.
2. **Crowdfund expensive gifts** — That dream espresso machine? Multiple guests can chip in. Progress bars show funding status in real-time. No awkward "who's paying?" conversations.
3. **Privacy-first for guests** — Guest names are shown as initials + emoji (e.g., "J. 🦋") so everyone can see a gift is claimed without revealing who. No pressure, no judgment.

**How It Works (3 steps for Protocol section):**
1. **Create** — Sign up, name your registry, set your wedding date and currencies. Add gifts from any store in the world via URL or manually.
2. **Share** — Send your unique link to guests. They browse, pick a gift, and claim it in seconds — no account needed.
3. **Celebrate** — Track reservations in real-time from your dashboard. See who's gifting what. Focus on your big day.

**Pricing (3 tiers):**
- **Free:** 1 registry, 30 items, 1 currency, basic theme. "Powered by Gifted" badge.
- **Premium ($29 one-time):** Unlimited items, multi-currency, custom theme colors, email notifications, remove branding.
- **Pro ($19.99/mo):** Everything in Premium + custom domain, analytics dashboard, CSV export, priority support.

## Agent Flow — MUST FOLLOW

Do not ask questions. All product context is provided above. Build the full site immediately using Preset A below. Adapt all copy, imagery, and interactions to the wedding registry product.

---

## Aesthetic Preset — "Romantic Warmth" (Modern Celebration)

- **Identity:** A sun-drenched Italian villa crossed with a Scandinavian design studio. Warm, confident, intimate — never saccharine. This is not a Pinterest board; it's an experience.
- **Palette:** Blush `#D4636A` (Primary), Warm Gold `#C8956C` (Accent), Linen `#FAF7F2` (Background), Deep Wine `#2C1810` (Text/Dark)
- **Typography:** Headings: "Plus Jakarta Sans" (tight tracking, 700 weight). Drama: "Cormorant Garamond" Italic (for hero & manifesto). Data/Mono: `"IBM Plex Mono"` (for stats, prices, live-feed).
- **Image Mood:** warm golden-hour light, table settings, hands exchanging gifts, floral arrangements with muted tones, linen textures, candlelight. Source from Unsplash.
- **Hero line pattern:** "Your love story" (Bold Sans) / "deserves better than a spreadsheet." (Massive Serif Italic)

---

## Fixed Design System (NEVER CHANGE)

These rules apply to ALL presets. They are what make the output premium.

### Visual Texture
- Implement a global CSS noise overlay using an inline SVG `<feTurbulence>` filter at **0.05 opacity** to eliminate flat digital gradients.
- Use a `rounded-[2rem]` to `rounded-[3rem]` radius system for all containers. No sharp corners anywhere.

### Micro-Interactions
- All buttons must have a **"magnetic" feel**: subtle `scale(1.03)` on hover with `cubic-bezier(0.25, 0.46, 0.45, 0.94)`.
- Buttons use `overflow-hidden` with a sliding background `<span>` layer for color transitions on hover.
- Links and interactive elements get a `translateY(-1px)` lift on hover.

### Animation Lifecycle
- Use `gsap.context()` within `useEffect` for ALL animations. Return `ctx.revert()` in the cleanup function.
- Default easing: `power3.out` for entrances, `power2.inOut` for morphs.
- Stagger value: `0.08` for text, `0.15` for cards/containers.

---

## Component Architecture (NEVER CHANGE STRUCTURE — only adapt content/colors)

### A. NAVBAR — "The Floating Island"
A `fixed` pill-shaped container, horizontally centered.
- **Morphing Logic:** Transparent with light text at hero top. Transitions to `bg-[background]/60 backdrop-blur-xl` with primary-colored text and a subtle `border` when scrolled past the hero. Use `IntersectionObserver` or ScrollTrigger.
- Contains: Logo ("Gifted" in drama serif italic), nav links (Features, How It Works, Pricing, Demo), two CTAs: "Log In" (ghost/outline) and "Create Registry" (accent-colored, solid).

### B. HERO SECTION — "The Opening Shot"
- `100dvh` height. Full-bleed background image (Unsplash: golden-hour couple at a table setting, warm candlelight, floral arrangements) with a heavy **dark-to-transparent gradient overlay** (`bg-gradient-to-t from-[#2C1810] via-[#2C1810]/70 to-transparent`).
- **Layout:** Content pushed to the **bottom-left third** using flex + padding.
- **Typography:**
  - Line 1: "Your love story" — Plus Jakarta Sans, bold, ~3rem
  - Line 2: "deserves better than a spreadsheet." — Cormorant Garamond Italic, ~5rem, accent-colored keyword on "better"
- **Animation:** GSAP staggered `fade-up` (y: 40 → 0, opacity: 0 → 1) for all text parts and CTA.
- **Below headline:** Two buttons side by side:
  - "Create Your Free Registry" (primary, solid, accent bg)
  - "See a Demo Registry →" (ghost, outline)
- **Social proof line** below CTAs in mono font: "Trusted by 2,400+ couples across 45 countries" with a row of small flag emojis (🇰🇪 🇩🇰 🇺🇸 🇯🇵 🇧🇷 🇳🇬 🇩🇪).

### C. FEATURES — "Interactive Functional Artifacts"
Three cards derived from the 3 value propositions. These must feel like **functional software micro-UIs**, not static marketing cards. Each card gets one of these interaction patterns:

**Card 1 — "Currency Carousel"** (Value prop: Any currency, any country)
3 overlapping price tags that cycle vertically using `array.unshift(array.pop())` logic every 3 seconds with a spring-bounce transition (`cubic-bezier(0.34, 1.56, 0.64, 1)`). Each tag shows the same gift ("Espresso Machine") in a different currency:
  - "KES 24,995" with 🇰🇪 flag
  - "kr 1,250" with 🇩🇰 flag
  - "$192" with 🇺🇸 flag
Heading: "Any currency, any country." Descriptor: "Your guests see prices in their own currency. Set any pair — we handle the math."

**Card 2 — "Crowdfund Live Feed"** (Value prop: Crowdfund expensive gifts)
A monospace live-text feed that types out simulated reservation events character-by-character, with a blinking accent-colored cursor. Include a "Live" label with a pulsing blush dot. Messages cycle:
  - `"A. 🦋 contributed 25% to Robot Vacuum"`
  - `"M. 🌸 contributed 40% to Robot Vacuum"`
  - `"J. ✨ contributed 35% — Fully funded! 🎉"`
Below the feed, a progress bar fills from 0% → 100% in sync with the typed messages.
Heading: "Crowdfund the big-ticket gifts." Descriptor: "Multiple guests chip in. Progress bars update in real time. No awkward conversations."

**Card 3 — "Privacy Preview"** (Value prop: Privacy-first for guests)
An animated demo showing a guest name "Sarah Johnson" being typed into an input field, then a GSAP morph-transition transforms it into "S. 🌟" with a soft blur-out/blur-in effect. Then a second name "David Kim" morphs into "D. 🦊". Below, a mock gift card shows "Reserved by: S. 🌟, D. 🦊" — cozy and anonymous.
Heading: "No names, no pressure." Descriptor: "Guests stay anonymous. Initials + emoji keep it warm without the social anxiety."

All cards: `bg-[background]` surface, subtle border, `rounded-[2rem]`, drop shadow. Each card has a heading (sans bold) and a brief descriptor.

### D. PHILOSOPHY — "The Manifesto"
- Full-width section with the **dark color** (`#2C1810`) as background.
- A parallaxing texture image (Unsplash: linen fabric, dried flowers, warm tones) at low opacity behind the text.
- **Typography:** Two contrasting statements:
  - "Most registries are built for: American couples shopping at American stores." — neutral, smaller, Linen color.
  - "We're built for: love that crosses borders." — massive, Cormorant Garamond Italic, accent-colored keyword on "crosses borders."
- **Animation:** GSAP word-by-word fade-up reveal triggered by ScrollTrigger.

### E. PROTOCOL — "How It Works" (Sticky Stacking Archive)
3 full-screen cards that stack on scroll. Content from the 3 product steps.
- **Stacking Interaction:** Using GSAP ScrollTrigger with `pin: true`. As a new card scrolls into view, the card underneath scales to `0.9`, blurs to `20px`, and fades to `0.5`.
- **Each card gets a unique canvas/SVG animation:**

  1. **"Create"** — Step 01 (IBM Plex Mono). A slowly assembling gift-box outline drawn with SVG `stroke-dashoffset` animation, pieces falling into place. Title: "Build your dream list in minutes." Description: "Sign up free. Add gifts from any store in the world — paste a URL or add manually. Set your currencies, pick your colors."

  2. **"Share"** — Step 02. An animated link icon that radiates expanding concentric circles (like a broadcast signal) with small flag icons (🇰🇪 🇩🇰 🇺🇸) floating outward along the rings. Title: "One link, every guest." Description: "Send your unique registry URL. Guests browse, pick a gift, and claim it in seconds. No app downloads, no accounts required."

  3. **"Celebrate"** — Step 03. A pulsing heartbeat-style SVG waveform (EKG line) that peaks at reservation moments, with small "🎁" icons appearing at each peak. Title: "Watch the love roll in." Description: "Track reservations in real-time. See your progress. Export guest lists. Focus on your big day — we handle the rest."

### F. PRICING
- Three-tier pricing grid. Card names: "Free", "Premium", "Pro".
- **Middle card ("Premium") pops:** Primary-colored background with an accent CTA button. Slightly larger scale or `ring` border. Badge: "Most Popular".
- **Free tier:** $0 forever. 30 items, 1 currency, basic theme. CTA: "Start Free"
- **Premium tier:** $29 one-time payment. Unlimited items, multi-currency, custom colors, email notifications, no branding. CTA: "Get Premium"
- **Pro tier:** $19.99/mo. Everything in Premium + custom domain, analytics, CSV export, priority support. CTA: "Go Pro"
- Below the grid, a line in mono font: "No transaction fees. Ever. We don't take a cut of your gifts."

### G. FOOTER
- Deep dark-colored background (`#2C1810`), `rounded-t-[4rem]`.
- Grid layout:
  - Column 1: "Gifted" logo (drama serif) + tagline "The gift registry for couples anywhere in the world."
  - Column 2: Product links — Features, Pricing, Demo Registry, API (future)
  - Column 3: Company links — About, Blog, Contact, Privacy Policy, Terms
  - Column 4: "Create Your Free Registry" CTA button (accent) + social icons (Instagram, Twitter/X)
- **Status indicator** with a pulsing green dot and mono label: "All systems operational"
- Copyright line: "© 2026 Gifted. Made with love across borders."

---

## Technical Requirements (NEVER CHANGE)

- **Stack:** React 19, Tailwind CSS v3.4.17, GSAP 3 (with ScrollTrigger plugin), Lucide React for icons.
- **Fonts:** Load via Google Fonts `<link>` tags in `index.html` based on the selected preset.
- **Images:** Use real Unsplash URLs. Select images matching the preset's `imageMood`. Never use placeholder URLs.
- **File structure:** Single `App.jsx` with components defined in the same file (or split into `components/` if >600 lines). Single `index.css` for Tailwind directives + noise overlay + custom utilities.
- **No placeholders.** Every card, every label, every animation must be fully implemented and functional.
- **Responsive:** Mobile-first. Stack cards vertically on mobile. Reduce hero font sizes. Collapse navbar into a minimal version.

---

## Build Sequence

All product context is pre-defined above. No questions needed. Build immediately:

1. Apply the "Romantic Warmth" design tokens: palette (`#D4636A`, `#C8956C`, `#FAF7F2`, `#2C1810`), fonts (Plus Jakarta Sans, Cormorant Garamond, IBM Plex Mono), image mood (golden-hour, table settings, linen, floral).
2. Build the hero with the exact copy: "Your love story" / "deserves better than a spreadsheet."
3. Build the 3 Feature cards: Currency Carousel, Crowdfund Live Feed, Privacy Preview — each with its specified micro-interaction.
4. Build the Philosophy manifesto: "Most registries are built for American couples..." / "We're built for love that crosses borders."
5. Build the 3 Protocol sticky-stack cards: Create → Share → Celebrate, each with its specified SVG animation.
6. Build the 3-tier pricing grid: Free / Premium ($29) / Pro ($19.99/mo) with the exact feature lists.
7. Scaffold the project: `npm create vite@latest`, install deps (`gsap`, `lucide-react`), write all files.
8. Verify every animation fires, every interaction works, every Unsplash image loads.

**Execution Directive:** "Do not build a website; build a digital instrument. Every scroll should feel intentional, every animation should feel weighted and professional. Eradicate all generic AI patterns. This page should make couples feel like they just found something special — not another template."
