# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a wedding registry application built as a single React component. The application allows couples to:
- Display wedding registry items with categories, pricing, and affiliate links
- Allow guests to reserve items by entering their name
- Manage the registry through add/edit/delete functionality with a modal interface
- Show reservation status and statistics

## Architecture

The application is contained in a single file (`app.js`) that exports a React functional component with the following key features:

### State Management
- Uses React hooks (`useState`) for all state management
- Main state includes:
  - `items`: Array of registry items with properties (id, name, price, image, affiliateLink, reserved, reservedBy, category)
  - `showAddForm`/`editingItem`: Modal state for item management
  - `newItem`: Form data for adding/editing items
  - `guestName`/`selectedItem`: Guest reservation flow state

### Component Structure
- Single-page application with header, hero section, registry grid, and footer
- Modal overlay for add/edit item functionality
- Responsive grid layout for registry items
- Uses Framer Motion for animations

### Key Functionality
- CRUD operations for registry items (handleAddItem, handleEditItem, handleUpdateItem, handleDeleteItem)
- Guest reservation system (handleReserveItem, handleUnreserveItem)
- Category-based organization with predefined categories: Kitchen, Cookware, Home, Bedroom, Bathroom, Electronics, Other

## Technology Stack

- **React**: Functional components with hooks
- **Lucide React**: Icon library (Heart, Gift, Users, Calendar, MapPin, Check, Plus, Edit, Trash2, ExternalLink)
- **Framer Motion**: Animation library for smooth transitions
- **Tailwind CSS**: Utility-first CSS framework for styling
- **No build system**: Single file application without package.json or build configuration

## Development Notes

- The application uses inline hardcoded sample data for initial registry items
- Uses placeholder images from placehold.co for demonstration
- No backend integration - all data is stored in component state
- No persistence - data resets on page reload
- Uses modern React patterns (functional components, hooks)