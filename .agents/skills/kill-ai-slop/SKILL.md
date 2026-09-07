---
name: kill-ai-slop
description: >-
  Design quality system based on Jack Roberts' workflow. Provides 3 design levels: Level 1 (Design reference benchmarks), Level 2 (Multi-agent design loop critic system), Level 3 (Design OS asset indexing and style recipes). Use to upgrade web design, emails, imagery, and visual hierarchy.
---

# Kill AI Slop — Design Skill for Claude Projects

Based on Jack Roberts' "Killing AI Slop Forever" workflow.
Source: https://youtu.be/NAumQObJEwM

---

## What This Skill Does
Turns Claude into a proper design tool across three levels:
- **Level 1** — Use real design system references to build or upgrade anything
- **Level 2** — The Design Loop: multi-agent critic system that iterates until output matches a benchmark
- **Level 3** — A local Design OS with image generation, searchable asset library, and brand style recipes

---

## The Core Problem Jack Identifies
Claude produces slop because it has never seen what great design looks like.
The five telltale signs: **typography, imagery, hierarchy, color, spacing.**
Fix: give Claude a real benchmark before asking it to build anything.

---

## File Map

```
kill-ai-slop/
├── SKILL.md                      ← You are here (read first)
├── prompts/
│   ├── level1-design-ref.md      ← Build or upgrade using a design system reference
│   ├── level2-design-loop.md     ← Multi-agent critic loop prompt
│   └── level3-image-gen.md       ← Image generation + style recipe prompts
└── resources/
    └── links-and-tools.md        ← All tools, sites, and resources from the video
```

---

## When to Invoke This Skill

Trigger words: "make this look better", "design a website", "build a landing page",
"create an email", "upgrade the design", "match this style", "generate an image",
"thumbnail", "brand assets", "HTML email", "design system"

---

## Quick Workflow by Use Case

| Task | Go To |
|------|-------|
| Build a new site/page with premium design | `level1-design-ref.md` → paste Pageflows/Refero link |
| Compare your site against a great one | `level1-design-ref.md` → ruthless comparison prompt |
| Create an HTML email that matches a real brand | `level2-design-loop.md` |
| Generate on-brand images | `level3-image-gen.md` |
| Send a designed email via Zapier | `level2-design-loop.md` → Zapier step |
| Save a brand style recipe | `level3-image-gen.md` → style recipe section |

---

## Streamline Notes
- Replace Glaido in prompts with client brand/Streamline brand as needed
- Use Zapier as the auth layer for sending emails or connecting tools
- Level 2 loop works for HTML emails AND landing page sections
- Level 3 image gen works with OpenRouter (cost-efficient) or OpenAI
