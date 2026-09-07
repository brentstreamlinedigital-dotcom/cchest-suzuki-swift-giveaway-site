# Level 1 — Design Reference Prompts

## The Concept
Claude produces generic output because it has no benchmark.
Level 1 fixes this by giving it a real design system reference before asking it to build anything.

**Primary resource:** https://pageflows.com OR https://refero.design
Both have 2,000+ professional design systems with:
- Full color palettes + CSS variables
- Typography scales
- Component hierarchy
- Tailwind/design tokens ready to copy

---

## USE CASE A: Build Something New Using a Design Reference

**Step-by-step:**
1. Go to https://refero.design (or Pageflows)
2. Find a design system you like (e.g. Linear, Stripe, Vercel, Apple, Notion)
3. Click into it — copy the full design system block (colors, typography, tokens)
4. Paste into Claude with this prompt:

```
Hey — I want you to use this design architecture to build me a beautiful [DESCRIBE WHAT YOU'RE BUILDING].

[PASTE THE FULL DESIGN SYSTEM BLOCK HERE]

Requirements:
- Match the typography scale, color palette, and spacing system exactly
- Generate placeholder images if needed
- Build it as a single HTML file
- Make it look like it came from a design agency, not an AI tool
- Pay close attention to: hierarchy, white space, letter spacing, corner radius, shadow elevation

Output: complete HTML/CSS, ready to open in a browser.
```

**Example use (from video):**
Jack pasted Apple's design system from Refero and said:
> "Use this design architecture to build a beautiful website selling titanium protein shakes. Make it look gorgeous. Generate the images if you need to."

Result: bento grid layout, generated product images, on-brand typography — in one shot.

---

## USE CASE B: Ruthless Design Comparison (Upgrade Your Existing Site)

Use this to find the exact gaps between your site and a world-class reference.

**Step-by-step:**
1. Pick a website you admire (Jack used Linear — https://linear.app)
2. Go to Refero/Pageflows and find that brand's design system
3. Run this prompt:

```
I want you to compare two websites and be completely ruthless.

Website I want to improve: [YOUR URL]
Design benchmark I admire: [BENCHMARK URL e.g. https://linear.app]
Design system reference: [PASTE DESIGN SYSTEM BLOCK FROM REFERO]

Instructions:
- You can take screenshots of both sites directly
- Find every gap: typography, spacing, color, hierarchy, shadow, corner radius, letter spacing
- Be specific — not "improve the fonts" but "your letter spacing is 0.02em vs Linear's -0.01em"
- Output as a beautiful HTML breakdown
- Include an interactive before/after slider for the biggest differences
- List the top 3 gaps with exact values side by side
- Show the full design token comparison: colors, weights, spacing, radius
- Keep it concise and visual

I want to walk away knowing exactly what to fix and in what order.
```

**What you'll get:**
- Side-by-side visual comparison in HTML
- Exact values: letter spacing, line height, elevation ladder, color hex codes
- Interactive slider showing the difference
- Copyable hex palette for your brand

---

## USE CASE C: Upgrade a Specific Section

```
Here is my current [hero/nav/footer/pricing section]: [paste your code or URL]

Here is the design system from [LINEAR/STRIPE/VERCEL]: [paste tokens]

Rewrite just this section to match the quality of the benchmark.
Be specific about every change you make and why.
Output: clean HTML/CSS for the section only.
```

---

## Notes
- The best designs come from iteration — first output is a starting point, not the finish
- Jack's key insight: "sometimes we know it looks good but can't articulate it — that's what this comparison does"
- You can click individual hex values in the comparison output to copy them
- Refero also has page-type breakdowns: landing pages, pricing, onboarding, etc.
