# WhatsToolbox

A comprehensive WhatsApp utility app built with React Native (Expo) and an Express backend.

## Overview

WhatsToolbox is a mobile utility application that provides powerful tools to enhance the WhatsApp user experience. It combines multiple WhatsApp utilities in a single polished app.

## Features

### Status Management
- **Status Saver** — Save WhatsApp statuses from gallery, view saved statuses
- **Saved Status Gallery** — Full-screen gallery with share & delete

### Messaging Tools
- **Direct Chat** — Open WhatsApp without saving a contact number (wa.me links)
- **Text Repeater** — Repeat messages 1–100x with separator options
- **Bulk Message Sender** — Send to multiple contacts sequentially

### Creative Tools
- **Fancy Text Generator** — 12+ Unicode font styles (bold, italic, script, bubble, gothic, etc.)
- **AI Caption Generator** — AI-powered captions in 6 styles (funny, motivational, romantic, business, aesthetic, sarcastic)
- **Status Scheduler** — Schedule status reminders with image + caption

## Architecture

### Frontend (Expo Router)
- `app/(tabs)/` — 5-tab navigation: Home, Status, Tools, Creative, Settings
- `app/direct-chat.tsx` — Direct Chat tool
- `app/text-repeater.tsx` — Text Repeater tool
- `app/bulk-message.tsx` — Bulk Message Sender
- `app/fancy-text.tsx` — Fancy Text Generator
- `app/ai-caption.tsx` — AI Caption Generator
- `app/status-scheduler.tsx` — Status Scheduler
- `app/saved-status.tsx` — Saved Status Gallery

### Backend (Express + TypeScript)
- `server/index.ts` — Express server setup
- `server/routes.ts` — API routes including `/api/generate-caption`

### AI Integration
- Uses Replit AI Integrations (OpenAI-compatible) via `gpt-5-nano` model
- No user API key required — charges billed to Replit credits
- Server-side caption generation at `POST /api/generate-caption`

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
