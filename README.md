# Taskly

A minimal, journal-inspired daily planner built as a mobile-first progressive web app. Taskly combines task management with gratitude journaling and daily reflections — all styled to feel like writing in a physical notebook.

<!-- Add a screenshot of the app here for maximum recruiter impact -->
<!-- ![Taskly Screenshot](docs/screenshot.png) -->

## Features

- **Daily Planner** — Add, edit, prioritise (A1–C3 rank system), and complete tasks for any date
- **Gratitude & Affirmations** — Structured journaling prompts on the Today page
- **Calendar View** — Visual date picker with task dots; swipe between days
- **Notes** — Date-based freeform notes with auto-save
- **Daily Quotes** — 365 rotating inspirational quotes
- **Offline-First** — All data persisted in `localStorage`; works without internet
- **PWA-Ready** — Installable on mobile with web app manifest
- **Smooth Animations** — Task reordering powered by `@formkit/auto-animate`

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [React 19](https://react.dev/) with TypeScript |
| Build Tool | [Vite 8](https://vite.dev/) |
| Styling | [Tailwind CSS 3](https://tailwindcss.com/) |
| Date Handling | [date-fns](https://date-fns.org/) |
| Icons | [Lucide React](https://lucide.dev/) |
| Animation | [@formkit/auto-animate](https://auto-animate.formkit.com/) |
| Linting | ESLint 9 with TypeScript & React hooks plugins |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- npm 9+ (ships with Node)

### Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/taskly.git
cd taskly

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint across the project |

## Project Structure

```
src/
├── App.tsx              # Root layout — page routing & state
├── TodayPage.tsx        # Daily planner with tasks, gratitude & affirmations
├── CalendarPage.tsx     # Calendar date picker + task list
├── CalendarGrid.tsx     # Shared calendar grid component
├── NotesPage.tsx        # Date-based notes editor
├── TaskCard.tsx         # Individual task row component
├── TaskModal.tsx        # Bottom-sheet modal for add/edit task
├── RankColumn.tsx       # Priority rank selector (A1–C3)
├── BottomNav.tsx        # Tab navigation bar
├── QuoteFooter.tsx      # Daily inspirational quote
├── quotes.ts            # 365 curated daily quotes
├── types.ts             # TypeScript interfaces (Task, Note, Rank)
├── useTasks.ts          # Task state management hook
├── useNotes.ts          # Notes state management hook
├── storage.ts           # localStorage persistence layer
├── dateUtils.ts         # Date helper utilities
├── index.css            # Global styles & Tailwind directives
└── main.tsx             # App entry point
```

## Design Decisions

- **Journal aesthetic** — Warm paper background (`#faf8f5`), notebook-ruled lines via CSS gradients, Cormorant Garamond for quotes, Inter for body text
- **Mobile-first** — Capped at 480px width, `100dvh` for proper mobile viewport, touch-friendly targets
- **No backend** — `localStorage` keeps it simple and deployment-free; easily swappable for a database later
- **Component extraction** — Shared `CalendarGrid` ensures pixel-identical calendars across Calendar and Notes pages

---

Built with React + TypeScript + Vite
