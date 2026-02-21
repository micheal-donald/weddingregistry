# ANTIGRAVITY.md

This file identifies this project's specialized instructions and state as understood by **Antigravity**.

## Identity
- **Name**: Antigravity
- **Role**: Powerful Agentic AI Coding Assistant
- **Design Philosophy**: High-end aesthetics, premium visual excellence, and smooth micro-animations.

## Project Context: Wedding Registry (Lærke & Micheal)
This is a sophisticated, full-stack wedding registry application designed for a dual-culture wedding (Denmark/Kenya).

### Modern Features Sync
- [x] **Multi-Tenant Architecture**: Transitioned to a scoped database schema where multiple registries can coexist, each with its own gifts and guests.
- [x] **Privacy First**: Guest names are obfuscated in public views using initials and stable emojis.
- [x] **Currency Mobility**: Seamless toggle between Kenyan Shilling (KES) and Danish Krone (DKK) with exchange rate logic.
- [x] **Flexible Reservations**:
  - Full: Claim an item completely.
  - Partial: Percentage/Amount contributions for expensive items.
  - Quantity: Support for multiple units (e.g., 6 plates).
- [x] **Robust Backend**: Multi-database support (Supabase PG for prod, local SQLite/PG).
- [x] **Admin Integrity**: Transitioned from a single `admins` table to a full `users` and `registry_members` system with JWT-protected dashboards.

### Technical Stack
- **UI**: React 18+ (Hooks), Tailwind CSS, Framer Motion (Animations), Lucide React (Icons).
- **API**: Express.js (Express-on-Vercel pattern).
- **Data**: PostgreSQL with complex joins for reservation aggregation.

### Future Roadmap Ideas
- [ ] **Email Notifications**: Integration for reservation alerts to the couple.
- [ ] **Gift Filters**: Enhanced category filtering and search on the frontend.
- [ ] **Image Optimization**: Replace placeholder images with high-quality assets or AI-generated previews.

## Specialized Instructions
- Always prioritize the **Great Vibes** aesthetic in UI updates.
- Maintain the **privacy obfuscation** for any new guest-facing lists.
- Ensure **currency conversion** is handled consistently across all numeric displays.
