# CLAUDE.md

This file provides guidance for AI assistants working with the Wedding Registry repository.

## Project Overview

A full-stack wedding registry application for Lærke & Micheal's wedding.
- **Frontend**: React-based single page application.
- **Backend**: Express.js API (supports Vercel serverless and local Node.js).
- **Database**: PostgreSQL (Supabase) for production, SQLite for development.

## Core Features
- **Gift Management**: Add/Edit/Delete gifts with categories, prices, and affiliate links.
- **Reservations**:
  - Full reservations (Claim a whole gift).
  - Partial reservations (Contribute a percentage/amount towards a gift).
  - Quantity-based reservations (Claim 1 of N items).
- **Privacy**: Guest names are obfuscated in the public UI (e.g., "L. ✨").
- **Currency**: Supports KES (Kenyan Shilling) and DKK (Danish Krone) with instant toggle.
- **Admin Dashboard**: Protected management interface with JWT authentication.

## Architecture

- `index.html`: Entry point, loads React/Tailwind/Framer Motion via CDN.
- `app.js`: Main React component containing all frontend logic and state.
- `api/index.js`: Main Express API entry point for Vercel deployment.
- `backend/`:
  - `server.js`: Local Express server.
  - `schema.sql`: Database schema definition.
  - `init-db.js`: Database initialization script.
  - `database/`: Local SQLite database storage.

## Technology Stack

- **Frontend**: React (Hooks), Tailwind CSS, Framer Motion, Lucide React.
- **Backend**: Node.js, Express.js, JWT, Bcrypt.
- **Database**: `pg` (PostgreSQL/Supabase), `sqlite3` (Local).
- **Deployment**: Vercel (Frontend & Serverless API).

## Development Commands

- **Local Server**: `node backend/server.js` (runs on port 3001).
- **Init DB**: `node backend/init-db.js`
- **Frontend**: Open `index.html` in a browser or serve via static server.

## Design Philosophy

- **Modern & Premium**: Uses a soft color palette (pink/rose/purple), glassmorphism, and smooth animations.
- **User-Centric**: Clear call-to-actions, mobile-responsive grid, and intuitive reservation flows.