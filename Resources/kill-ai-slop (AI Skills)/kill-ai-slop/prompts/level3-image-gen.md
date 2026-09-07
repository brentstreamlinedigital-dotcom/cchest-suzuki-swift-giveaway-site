# Level 3 — Design OS: Image Generation + Style Recipes

## The Concept
A local Design OS built inside Claude Code that gives you:
1. Multi-platform image generation (OpenAI, OpenRouter, Higgsfield/alternatives)
2. A searchable local asset library (indexed by content, not just filename)
3. Saved brand style recipes for consistent output every time

Jack built this for his own workflow and shared it with his community.
This file gives you the prompts to replicate the core capabilities.

---

## PART 1: Image Generation

### Basic Image Gen Prompt (works in Claude Code with API access)

```
Generate an image with the following spec:

Subject: [DESCRIBE SUBJECT IN DETAIL]
Style: [cinematic / clean product / lifestyle / dark premium / editorial]
Aspect ratio: [16:9 / 1:1 / 9:16 / 4:5]
Resolution: [2K / 4K]
Model: [use OpenAI DALL-E 3 / or route via OpenRouter for cost efficiency]

Additional style notes:
- [lighting preference — natural, studio, golden hour, moody]
- [color palette — warm, cool, neutral, brand colors: HEX]
- [mood — professional, energetic, calm, luxurious]

Output: image file + the exact prompt used so I can iterate.
```

### Model Routing (cost efficiency — Jack's approach)
Use **OpenRouter** to route to the cheapest model that hits quality:
- Cheap + fast: `google/gemini-flash` or `nano` tier models
- Higher quality: `openai/dall-e-3` or `black-forest-labs/flux-dev`
- Track cost per generation so you know what you're spending

OpenRouter: https://openrouter.ai

---

## PART 2: Brand Style Recipe

A style recipe is a saved description + reference images that locks in your brand's visual identity.
Once saved, every image generation pulls from it automatically — consistent thumbnails, social assets, web visuals.

### How to Create a Style Recipe

In Claude Code, create a file called `style-recipes/[BRAND-NAME].md` and fill in:

```markdown
# Style Recipe: [BRAND / CLIENT NAME]

## Identity
Brand name: [NAME]
Primary colors: [HEX, HEX, HEX]
Secondary colors: [HEX, HEX]
Typography feel: [e.g. clean sans-serif, editorial serif, monospace tech]

## Visual Language
Mood: [e.g. premium / approachable / bold / minimal]
Lighting: [e.g. natural daylight / studio clean / moody dramatic]
Background: [e.g. white, dark, gradient, contextual]
Composition: [e.g. centered product, rule of thirds, full bleed]

## Reference Images
[Attach 2-4 images that represent the look you want]

## What to AVOID
- [e.g. busy backgrounds, stock photo feel, oversaturated colors]
- [e.g. clipart style, cartoonish, dated gradients]

## Thumbnail Format (if applicable)
- Face position: [left / right / center]
- Text overlay position: [top right / bottom left / none]
- Text color: [HEX]
- Expression: [energetic / authoritative / curious]
```

### Using the Style Recipe in a Generation Prompt

```
Use the [BRAND NAME] style recipe to generate the following image:

[DESCRIBE THE NEW IMAGE — e.g. "replace the person with a giant protein shake"]

Keep everything else consistent with the recipe:
colors, lighting, composition, mood.

Output: 2 variations, [RATIO], [RESOLUTION].
```

---

## PART 3: Searchable Asset Library (local Claude Code setup)

Jack built an image indexer into his Claude Code OS that:
- Scans your local computer for all images
- Indexes them with a cheap vision model (content-aware, not just filename)
- Lets you search by what's *in* the image (e.g. "burger" returns all burger images)

### To replicate this in Claude Code:

```
I want you to build me a local image indexer.

Requirements:
- Scan [FOLDER PATH] recursively for all image files (.jpg, .png, .webp, .svg)
- For each image, use a vision model (via OpenRouter — use cheapest available) to generate a 1-sentence content description
- Store the index as a JSON file: { "filename": "path/to/file.jpg", "description": "...", "tags": [...] }
- Build a simple search function: given a keyword, return all images whose description or tags match
- Update the index with a "magic scan" command that only processes new/changed files

Output: working Python script + instructions to run it.
```

Once built, search like this:

```
Search my image library for: [KEYWORD]
Return file paths I can copy directly.
```

---

## Tools Referenced in This Level

| Tool | Purpose | Link |
|------|---------|------|
| OpenAI | DALL-E 3 image generation | https://openai.com |
| OpenRouter | Route to cheapest model | https://openrouter.ai |
| Higgsfield | Video generation + voice | https://bit.ly/4fjvSg0 |
| AntiGravity | Claude Code OS (Google) | https://antigravity.google |
| Hermes | AI agent layer | https://nousresearch.com |

---

## Streamline Use Cases
- **Client websites:** Generate on-brand hero images without a photoshoot
- **Thumbnails:** Save a style recipe per client channel, generate consistently
- **Email campaigns:** Generate product/lifestyle images as part of the Level 2 loop
- **Brand decks:** Drop generated images directly into proposals
- **Asset library:** Index client's existing brand assets so Claude can find and reuse them
