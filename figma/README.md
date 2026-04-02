# FrameKart — Figma UI Kit

## How to generate the design file in 60 seconds

1. Open Figma and create a new blank **Design** file
2. Go to **Plugins → Development → Open Console** (or press Ctrl+Alt+I / Cmd+Option+I)
3. Click the **"Run Script"** tab in the console
4. Paste the entire contents of `framekart-ui-kit.js`
5. Press **Enter / Run**

The script will generate:

### Components
- Color swatches (Brand, Semantic, Neutrals)
- Typography scale (Display → Caption → Mono)
- Buttons (Primary, Secondary, Ghost)
- Status Badges (Pending, Accepted, Completed, Rejected)
- GigCard component with all layers
- Pricing Tier cards (Basic, Standard, Premium)

### Screens
- Navigation Bar (1440px)
- Hero Section with search bar
- Gig Grid (3-up layout)
- Dashboard stats row

### Colors used
| Token | Hex | Usage |
|---|---|---|
| Brand/Emerald | `#10B981` | Primary actions, prices, active states |
| Brand/Emerald Dark | `#059669` | Hover states |
| Neutral/Background | `#000000` | Page background |
| Neutral/Surface | `#18181B` | Cards, inputs |
| Neutral/Surface 2 | `#27272A` | Hover states, nested surfaces |
| Neutral/Border | `#3F3F46` | Card borders, dividers |
| Neutral/Muted | `#71717A` | Secondary text, placeholders |
| Neutral/Text | `#F4F4F5` | Primary text |
| Semantic/Amber | `#F59E0B` | Pending, warnings, star ratings |
| Semantic/Red | `#EF4444` | Errors, rejected |
| Semantic/Blue | `#60A5FA` | Accepted, info |

### Fonts
- **Syne** — Display headings (logo, page titles, hero h1)
- **DM Sans** — Body text, UI elements
- **JetBrains Mono** — Prices (₹25,000)

> Note: The script uses Inter as a fallback since those fonts may not be available
> in all Figma accounts. Replace font references with Syne/DM Sans if available.
