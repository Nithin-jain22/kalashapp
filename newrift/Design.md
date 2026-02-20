🎨 UI DESIGN SPECIFICATION DOCUMENT

Project: Autonomous CI/CD Healing Agent
Style Reference: AI / SRE Dark SaaS (Dribbble #26399940)
Design Language: Modern Enterprise AI Dashboard
Theme: Dark-first, high contrast, soft neon accents

⸻

1️⃣ Color Palette (HEX + Tailwind Tokens)

🎯 Primary Brand

Token HEX Usage
--color-primary #7C5CFF Main CTA, highlights
--color-primary-glow #9F87FF Hover glow
--color-accent #00E0B8 Success, active status
--color-danger #FF4D6D Errors
--color-warning #FFB020 Warnings

⸻

🌑 Backgrounds

Token HEX Usage
--bg-main #0B0F1A Page background
--bg-surface #111827 Cards
--bg-elevated #1F2937 Modals
--bg-hover #1A2235 Hover states

⸻

✏ Text

Token HEX
--text-primary #F9FAFB
--text-secondary #9CA3AF
--text-muted #6B7280

⸻

Tailwind Extension Example

theme: {
extend: {
colors: {
primary: "#7C5CFF",
accent: "#00E0B8",
danger: "#FF4D6D",
warning: "#FFB020",
bgmain: "#0B0F1A",
bgsurface: "#111827",
bgelevated: "#1F2937"
}
}
}

⸻

2️⃣ Typography

Font Family

Primary:

Inter, sans-serif

Headings:

Space Grotesk (optional for premium feel)

⸻

Font Scale

Element Size Weight
H1 36px 700
H2 28px 600
H3 22px 600
Body 16px 400
Small 14px 400
Table 14px 500
Badge 12px 600

Tailwind Example:

text-4xl font-bold
text-xl font-semibold
text-sm font-medium

Line-height:

1.4 for headings
1.6 for body

⸻

3️⃣ Layout Grid System

Max width container:

max-w-7xl mx-auto px-6

Grid:

grid grid-cols-12 gap-6

Cards:

col-span-12 md:col-span-6 lg:col-span-4

Dashboard Layout:

Header
↓
Input Section (Full width)
↓
Summary Card + Score Panel (2 column layout)
↓
Fix Table (Full width)
↓
Timeline (Full width)

⸻

4️⃣ Component Structure

Layout
├── Header
├── InputForm
├── RunSummaryCard
├── ScorePanel
├── FixesTable
├── CICDTimeline
├── LoadingOverlay
└── Footer

State handled via:
• Context API or Zustand

⸻

5️⃣ Spacing System

Base unit: 4px

Tailwind mapping:

Token Tailwind
4px p-1
8px p-2
12px p-3
16px p-4
24px p-6
32px p-8

Section spacing:

py-12

Card padding:

p-6

⸻

6️⃣ Card Design Rules

Base card:

background: #111827;
border: 1px solid rgba(255,255,255,0.05);
border-radius: 16px;
box-shadow: 0 10px 30px rgba(0,0,0,0.4);

Tailwind:

bg-bgsurface border border-white/5 rounded-2xl shadow-xl p-6

Hover:

hover:bg-bg-hover transition duration-300

⸻

7️⃣ Table Styling Rules

Header:

bg-[#0F172A]
text-sm font-semibold text-gray-400 uppercase tracking-wide

Row:

border-b border-white/5
hover:bg-[#1A2235]

Cell padding:

px-4 py-3

Alternate row:

even:bg-[#0F1625]

⸻

8️⃣ Status Badge Styling

PASSED

bg-green-500/20 text-green-400 border border-green-400/30

FAILED

bg-red-500/20 text-red-400 border border-red-400/30

IN PROGRESS

bg-yellow-500/20 text-yellow-400 border border-yellow-400/30

Badge style:

px-3 py-1 rounded-full text-xs font-semibold

⸻

9️⃣ Timeline Component Styling

Vertical line:

absolute left-4 top-0 bottom-0 w-px bg-white/10

Timeline node:

w-3 h-3 rounded-full bg-primary shadow-lg shadow-primary/40

Iteration card:

ml-10 bg-bgsurface border border-white/5 p-4 rounded-xl

Timestamp:

text-xs text-gray-500

⸻

🔟 Button States

Primary Button:

bg-primary text-white px-6 py-3 rounded-xl font-semibold

Hover:

hover:bg-primary/90
hover:shadow-lg hover:shadow-primary/30

Active:

active:scale-95

Loading:

opacity-70 cursor-not-allowed

Secondary Button:

bg-[#1F2937] text-white border border-white/10

⸻

11️⃣ Responsive Design Rules

Breakpoints:

Device Tailwind
Mobile default
Tablet md
Desktop lg
Large xl

Mobile rules:
• Stack cards vertically
• Table scroll horizontally
• Timeline full width

Use:

overflow-x-auto

⸻

12️⃣ Dark Mode Base Rules

Dark-first system.

Global:

body {
background: #0B0F1A;
color: #F9FAFB;
}

No light mode required.

All components assume dark background.

⸻

13️⃣ Accessibility Considerations
• Minimum contrast ratio 4.5:1
• Buttons min height: 44px
• Focus state:

focus:outline-none focus:ring-2 focus:ring-primary

    •	ARIA labels on buttons
    •	Keyboard navigation supported

⸻

14️⃣ Animation & Microinteraction Guidelines

Duration:

200ms – 300ms

Easing:

ease-out

Card hover:

transition transform hover:-translate-y-1

Loading spinner:
• Subtle rotate animation

Success state:
• Green glow pulse once

Timeline node:
• Fade in with slight upward motion

⸻

🔥 Visual Identity Summary

The UI should feel:
• Confident
• AI-powered
• Enterprise-grade
• Clean
• Not flashy
• High contrast
• Subtle neon accents

⸻
