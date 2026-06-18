# Study App

A study planner with to-do list, focus timer, XP system, and browser notifications.

## Files
- `index.html` — the app structure
- `style.css` — all styling
- `app.js` — all the logic

## How to run it

### Option 1 — Just open it (simplest)
Double-click `index.html` and it opens in your browser. Done!

### Option 2 — Run a local server (recommended for notifications to work)
```bash
npx serve .
```
Then open http://localhost:3000

### Option 3 — With Claude Code
Open your terminal in this folder and type:
```
claude
```
Then tell Claude Code what you want to add or change, like:
- "Add a dark mode toggle"
- "Save my tasks so they don't disappear when I refresh"
- "Add a confetti animation when I complete a task"
- "Turn this into a React app"

## Features
- To-do list with priority levels and XP rewards
- Browser notifications for task reminders
- Focus timer with 25/45/60 min presets and a progress ring
- Session mood logging
- XP + leveling system (Rookie → Legend)
- Stats page
