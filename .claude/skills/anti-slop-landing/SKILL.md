---
name: anti-slop-landing
description: Build $10K+ quality landing pages that don't look like AI slop. Techniques from premium web agencies — Spline 3D, GSAP ScrollTrigger, Lenis smooth scroll, distinctive typography, custom backgrounds, micro-interactions.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Anti-Slop Landing Page Builder

## Philosophy
Every AI-generated landing page looks the same: Inter font, purple gradient, dark mode, generic cards. This skill builds pages that look HUMAN-DESIGNED by combining 8 premium techniques.

## The 8 Techniques

### 1. CLAUDE.MD Instructions
Tell Claude to behave like a senior UI designer + frontend developer. Not a code generator.

### 2. Clone Inspiration (Not Copy)
- Find a site you love (Railway, Linear, Stripe, Notion)
- Screenshot it
- Analyze its DNA: spacing, typography rhythm, color ratios, motion patterns
- Rebuild the FEEL, not the pixels

### 3. Tailwind + shadcn/ui Foundation
- shadcn/ui for accessible primitives (Accordion, Dialog, Tabs)
- Tailwind for custom styling on top
- NEVER use default shadcn styles — always customize

### 4. Custom Backgrounds (NOT solid colors)
```css
/* Radial gradient with blurred circles */
background: radial-gradient(circle at 20% 50%, rgba(37,99,235,0.08) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(8,145,178,0.06) 0%, transparent 50%),
            radial-gradient(circle at 50% 80%, rgba(236,72,153,0.04) 0%, transparent 50%);
```
- Mesh gradients > solid colors
- Noise/grain textures for depth
- CSS `backdrop-filter: blur()` for glassmorphism on cards
- Subtle grid patterns behind hero sections

### 5. Animations (GSAP + Framer Motion)
- **GSAP ScrollTrigger**: scroll-linked reveals, pinned sections, scrub animations
- **Framer Motion**: hover effects (scale 1.02, 300ms), layout animations, exit animations
- **Lenis**: smooth scroll (lerp-based, 60fps, butter-smooth)
- Rules:
  - 200-400ms durations (not 100ms = jagged, not 800ms = sluggish)
  - cubic-bezier(0.16, 1, 0.3, 1) easing (Expo.out — the "premium" curve)
  - Stagger children 50-100ms apart
  - `prefers-reduced-motion` respect

### 6. 3D Graphics (Spline + Three.js)
- **Spline** (spline.design): pre-made 3D scenes, embed via iframe or @splinetool/react-spline
- **Three.js** via React Three Fiber (@react-three/fiber + @react-three/drei)
- Use 3D for: hero background, CTA section accent, floating product mockups
- NOT for: every section (too heavy), navigation, text overlays

### 7. Typography (Google Fonts — DISTINCTIVE)
- NEVER: Inter, Roboto, Arial, system fonts, Space Grotesk
- Display fonts (headlines): Instrument Serif, Playfair Display, Fraunces, Cabinet Grotesk, Clash Display, Satoshi
- Body fonts: Outfit, Plus Jakarta Sans, General Sans, Onest, Geist
- Rules:
  - 2 fonts max (display + body)
  - Headlines: clamp(36px, 5vw, 72px), letter-spacing: -0.03em, line-height: 1.08
  - Body: 16-18px, line-height: 1.6-1.7
  - Tight letter-spacing on large text, normal on body

### 8. Screenshot-Based Iteration
- Take screenshot of each section
- Describe what's wrong in natural language
- Claude fixes based on visual context
- Repeat until pixel-perfect

## Premium Component Libraries (all free, all React+Tailwind compatible)

| Library | What | Install |
|---------|------|---------|
| Aceternity UI | Spotlight, Aurora, 3D cards, Lamp | Copy-paste from ui.aceternity.com |
| Magic UI | Shimmer text, Marquee, counters | Copy-paste from magicui.design |
| Motion Primitives | Text Scramble, Morphing Dialog | Copy-paste from motion-primitives.com |
| ui.ibelick | Spotlight cards, gradient badges | Copy-paste from ui.ibelick.com |

## NPM Dependencies to Install

```bash
# Smooth scroll
npm install lenis

# Animations (already have framer-motion, add GSAP)
npm install gsap @gsap/react

# 3D (optional but premium)
npm install @splinetool/react-spline three @react-three/fiber @react-three/drei

# Google Fonts (via next/font or link tag)
# No install needed — use next/font/google
```

## Anti-Patterns (NEVER DO)

- ❌ Inter/Roboto/Arial as primary font
- ❌ Purple gradient on white background
- ❌ Dark mode by default (unless the product IS dark)
- ❌ Generic card grid with icon + title + description (the "AI trifecta")
- ❌ Stock illustrations/icons (Undraw, Storyset)
- ❌ "Trusted by 10,000+ companies" with fake logos
- ❌ Symmetric layouts everywhere
- ❌ Same padding/margin on every section
- ❌ Cookie-cutter hero: badge → headline → subtitle → 2 buttons
- ❌ Using emojis as icons in production

## What Makes It Look HUMAN

- ✅ Asymmetric layouts (text left, visual right, then flip)
- ✅ Varying section heights and padding
- ✅ One "hero moment" that's unforgettable (3D, video, interactive)
- ✅ Typography that has CHARACTER (serif display + clean body)
- ✅ Backgrounds with DEPTH (gradients, noise, patterns)
- ✅ Micro-interactions that SURPRISE (hover states, scroll reveals)
- ✅ Generous whitespace (let it breathe)
- ✅ Real product screenshots (not mockups)
- ✅ Color used as ACCENT, not flood (90% neutral, 10% brand color)
- ✅ Motion that feels NATURAL (spring physics, not linear)
