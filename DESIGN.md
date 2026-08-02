---
name: Ethos Refined
colors:
  surface: '#f9f9ff'
  surface-dim: '#d4daea'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3ff'
  surface-container: '#e8eeff'
  surface-container-high: '#e3e8f9'
  surface-container-highest: '#dde2f3'
  on-surface: '#161c27'
  on-surface-variant: '#414943'
  inverse-surface: '#2a303d'
  inverse-on-surface: '#ecf0ff'
  outline: '#717973'
  outline-variant: '#c0c9c1'
  surface-tint: '#376850'
  primary: '#043d27'
  on-primary: '#ffffff'
  primary-container: '#22543d'
  on-primary-container: '#93c7a9'
  inverse-primary: '#9ed2b4'
  secondary: '#006d40'
  on-secondary: '#ffffff'
  secondary-container: '#8ef5b5'
  on-secondary-container: '#007243'
  tertiary: '#2f353b'
  on-tertiary: '#ffffff'
  tertiary-container: '#454c52'
  on-tertiary-container: '#b6bcc4'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b9efcf'
  primary-fixed-dim: '#9ed2b4'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#1d5039'
  secondary-fixed: '#91f8b8'
  secondary-fixed-dim: '#74db9d'
  on-secondary-fixed: '#002110'
  on-secondary-fixed-variant: '#00522f'
  tertiary-fixed: '#dde3eb'
  tertiary-fixed-dim: '#c1c7cf'
  on-tertiary-fixed: '#161c22'
  on-tertiary-fixed-variant: '#41474e'
  background: '#f9f9ff'
  on-background: '#161c27'
  surface-variant: '#dde2f3'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  price-main:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 24px
  price-strikethrough:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  margin-mobile: 16px
  gutter-mobile: 12px
---

## Brand & Style
The brand personality is rooted in transparency, reliability, and precision. It aims to elevate the perception of pre-owned goods from "used" to "curated." The target audience consists of value-conscious but quality-driven mobile users who prioritize trust in a peer-to-peer or B2C commerce environment.

This design system utilizes a **Minimalist** style with **Corporate/Modern** undertones. It leverages heavy whitespace and a restricted color palette to create a sense of organized calm. The interface avoids "clutter" typically associated with discount marketplaces, instead adopting the high-end aesthetic of luxury boutiques to reassure the user of the product's quality and the enterprise's professionalism.

## Colors
The color strategy is functional and conversion-oriented. 
- **Primary (Forest Green):** Reserved exclusively for "Buy" actions, WhatsApp triggers, and final pricing. This builds a psychological association between the color and successful progress.
- **Secondary (Mint/Soft Green):** Used for "Condition Badges" (e.g., "Like New") to denote health and positivity.
- **Neutral Palette:** A range of whites (#FFFFFF) and cool grays (#F7FAFC to #EDF2F7) forms the foundation, ensuring the product photography remains the focal point.
- **Text:** Dark slate (#1A202C) is used instead of pure black to maintain a premium, softer contrast that improves readability on mobile screens.

## Typography
The system uses **Inter** for all roles to maintain a systematic, utilitarian aesthetic. 
- **Hierarchy:** Large display sizes are used sparingly for category headers. Product titles use `headline-sm` for clarity.
- **Price Contrast:** Sale prices are rendered in `price-main` (Forest Green), while original prices use `price-strikethrough` in a mid-tone gray to emphasize the value proposition without appearing "cheap."
- **Labels:** Small caps are utilized for technical specifications and condition headers to provide a distinct visual texture from body copy.

## Layout & Spacing
The layout follows a **Fluid Grid** model optimized for mobile-first commerce. 
- **Mobile (Default):** A 2-column grid is used for product listings to maximize vertical "scannability." Margins are set to 16px with a 12px gutter between cards.
- **Vertical Rhythm:** A strict 4px baseline grid ensures consistent spacing between image, title, and price metadata.
- **Safe Areas:** Heavy bottom padding (80px+) is maintained on product pages to account for the sticky "Contact on WhatsApp" bar.

## Elevation & Depth
This design system uses **Tonal Layers** and **Low-contrast Outlines** rather than heavy shadows to maintain a minimalist profile.
- **Surfaces:** The main background is pure white. Secondary containers (like technical spec blocks) use a subtle #F7FAFC fill.
- **Borders:** All product cards and input fields use a 1px border (#E2E8F0). This provides structure without the "weight" of traditional shadows.
- **Active State:** Only the primary "WhatsApp" CTA button receives a soft, diffused shadow (0px 4px 12px) tinted with the primary green to indicate its priority in the stack.

## Shapes
The shape language is **Soft** and professional. 
- **Cards & Buttons:** A standard 4px (0.25rem) radius is applied to maintain a precise, engineered feel suitable for electronics and refurbished goods. 
- **Condition Badges:** Use a pill-shape (full rounding) to differentiate them from functional buttons.
- **Images:** Product photography should have a subtle 4px corner clip to match the container, ensuring a cohesive "integrated" look.

## Components
- **Product Cards:** Must include a fixed-aspect ratio image (1:1), followed by a `label-caps` condition badge, product title, and the dual-price component.
- **WhatsApp CTA:** A sticky bottom-anchor button. It features the WhatsApp icon, "Order on WhatsApp" text, and the primary green background.
- **Condition Badges:** Small, high-contrast pills. "Mint" uses a secondary green tint; "Good" uses a neutral gray tint.
- **Input Fields:** Minimalist design with only a bottom border that transforms into a 2px forest green line on focus.
- **Lists:** Technical specifications are displayed in a clean vertical list with 1px dividers and `label-caps` for the keys (e.g., STORAGE: 256GB).
- **Price Tags:** A dedicated component that places the current price in bold primary green next to the smaller, grayed-out original price.