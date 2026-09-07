# Level 2 — The Design Loop

## The Concept
The Design Loop (originally called "the Gauntlet Loop") is a multi-agent critic system.
Claude builds something, then spins up three internal critic agents that keep iterating
until the output hits a quality benchmark you set.

**Original technique by:** George Harley (shared the HTML email benchmark resource)
**Used by Jack for:** HTML emails, landing page sections, brand assets

---

## How It Works

You provide:
1. A screenshot or image of a design you want to match (the benchmark)
2. What you actually want built (your content)
3. The loop runs 3 critic agents:
   - **Critic 1:** Does it hit the brief?
   - **Critic 2:** Is the design quality high?
   - **Critic 3:** Visual impact — would this stop someone scrolling?

Claude iterates until all three critics are satisfied.

---

## Benchmark Resource
Jack used this HTML email gallery shared by George Harley:
Real HTML email campaigns from brands like Apple, Figma, Notion, Stripe.
Find one you like → screenshot it → use as your benchmark.

Good sources for email benchmarks:
- https://reallygoodemails.com
- https://htmlemails.io
- Screenshot any email in your own inbox you love

---

## THE DESIGN LOOP PROMPT

```
Use the design loop technique for this task.

BENCHMARK: [paste screenshot / describe the design you want to match]

WHAT TO BUILD: [describe your actual content — product launch, announcement, etc.]

Design loop instructions:
You are going to run three internal critic agents after your first draft.

Agent 1 — Brief Check:
Does this output match everything requested? List any gaps.

Agent 2 — Design Quality:
Score the design 1-10 on: typography, hierarchy, color, spacing, visual balance.
If any score is below 8, identify the fix and apply it.

Agent 3 — Visual Impact:
Would this stop someone scrolling? Is there a clear focal point?
Does the CTA stand out? Is there enough contrast?

After all three agents review, apply every fix identified and output the final version.
Run the loop until all three agents score the output 8+ across the board.

OUTPUT FORMAT: Complete, self-contained HTML file.
Pay close attention to: luminosity, spacing rhythm, typographic hierarchy, CTA contrast.

CONTENT:
[YOUR ACTUAL CONTENT — product name, headline, body copy, CTA, etc.]
```

---

## EXAMPLE: Product Launch Email (from the video)

Jack's exact use:
1. Screenshotted an Apple product launch email from the benchmark gallery
2. Ran the design loop prompt
3. Content: "Glaido for Windows — launching November 12, 2026"
4. Output: pixel-perfect HTML email matching Apple's structure, in one shot

```
Use the design loop technique.

BENCHMARK: [screenshot of Apple product launch email]

WHAT TO BUILD: A product launch HTML email.

Content:
- Product: [YOUR PRODUCT NAME]
- Launch date: [DATE]
- Headline: [YOUR HEADLINE]
- Sub-copy: [1-2 sentences]
- CTA button: [BUTTON TEXT] → [URL]
- Brand colors: [HEX CODES or describe]

Run the three-critic loop (brief, design quality, visual impact).
Output a complete HTML email I can paste directly into any email client.
```

---

## STEP 2: Send It via Zapier (the auth layer)

Once you have the HTML email output, send it to Claude Code and say:

```
Use my Zapier connection to grab this HTML and send it as an email to [EMAIL ADDRESS].
Use a subject line: [SUBJECT]

[PASTE YOUR HTML HERE]
```

**Why Zapier:**
- Single authentication layer that works across Claude, Claude Code, AntiGravity, Hermes
- Gives access to Gmail, Outlook, Skool, and 6,000+ other apps from one connection
- No need to re-auth in every tool

**Zapier link:** https://bit.ly/4pJhh0K (Jack's affiliate link from the video)

---

## OTHER USE CASES FOR THE DESIGN LOOP

Beyond emails — works for any HTML output:
- Landing page hero section
- Pricing table
- Blog post template
- Pitch deck slide (exported as image)
- Social media graphic (as SVG)

Just swap the benchmark screenshot for whatever you want to match.

---

## Pro Tips
- Screenshot quality matters — use a clean, full-width screenshot with no browser chrome
- The loop works best when you give it a *specific* benchmark, not a vague style direction
- For client work: screenshot their competitor's best page as the benchmark
- "Anthropic-esque" example from video: Jack cloned Anthropic's Claude platform welcome page just from a screenshot + the loop
