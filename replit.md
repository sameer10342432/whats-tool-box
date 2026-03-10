# WhatsToolbox

A comprehensive WhatsApp utility app built with React Native (Expo) and an Express backend.

## Overview

WhatsToolbox is a mobile utility application that provides powerful tools to enhance the WhatsApp user experience. It combines multiple WhatsApp utilities in a single polished app.

## Features

### Phase 1 — Core Tools
- **Status Saver** — Scan WhatsApp status folder, grid view, save to gallery
- **Saved Status Gallery** — Full-screen gallery with share & delete
- **Direct Chat** — Open WhatsApp without saving a contact number (wa.me links)
- **Text Repeater** — Repeat messages 1–100x with separator options
- **Bulk Message Sender** — Send to multiple contacts sequentially
- **Fancy Text Generator** — 12+ Unicode font styles
- **AI Caption Generator** — AI-powered captions in 6 styles
- **Status Scheduler** — Schedule status reminders with image + caption

### Phase 2 — Advanced Tools
- **Chat Backup Viewer** — Import exported .txt chat files, parse & display in chat UI, search, copy, export summary
- **Status Analytics** — Scan saved statuses, show totals, image/video pie chart, activity bar chart by day, largest files
- **AI Sticker Generator** — AI-powered sticker pack creation (text prompts) + image-to-sticker from gallery
- **Chat Organizer** — Categorize contacts (Work/Friends/Family/Important), favorites, quick open in WhatsApp via wa.me deep links
- **Media Cleaner** — Scan WhatsApp media folders, filter old/large files, bulk delete with confirmation

## Architecture

### Frontend (Expo Router)
- `app/(tabs)/` — 5-tab navigation with Advanced Tools section on home
- `app/direct-chat.tsx`, `app/text-repeater.tsx`, `app/bulk-message.tsx` — core messaging tools
- `app/fancy-text.tsx`, `app/ai-caption.tsx` — creative tools
- `app/status-scheduler.tsx`, `app/saved-status.tsx` — status management
- `app/chat-backup.tsx` — Phase 2: Chat Backup Viewer
- `app/status-analytics.tsx` — Phase 2: Status Analytics with SVG charts
- `app/ai-sticker.tsx` — Phase 2: AI Sticker Generator
- `app/chat-organizer.tsx` — Phase 2: Chat Organizer
- `app/media-cleaner.tsx` — Phase 2: Media Cleaner

### Backend (Express + TypeScript)
- `server/index.ts` — Express server setup
- `server/routes.ts` — API routes: `/api/generate-caption`, `/api/generate-sticker`

### AI Integration
- Uses Replit AI Integrations (OpenAI-compatible) via `gpt-4o-mini` model
- No user API key required — charges billed to Replit credits
- Caption generation: `POST /api/generate-caption`
- Sticker generation: `POST /api/generate-sticker`

### Storage
- AsyncStorage for: saved statuses, scheduled statuses, app settings

## Theme

- Primary: #25D366 (WhatsApp Green)
- Secondary: #128C7E
- Deep Dark: #075E54
- Supports dark mode

## Running Locally

- Backend: `npm run server:dev` (port 5000)
- Frontend: `npm run expo:dev` (port 8081)
