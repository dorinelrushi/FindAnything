# KorcaCity Website

A premium web application for exploring Korça City, built with Next.js, MongoDB, and modern aesthetics.

## Features

- **Authentication**: Sign up as a **Person** or **Business**.
- **Business Dashboard**: Business owners can upload listings for Hotels, Restaurants, Bars, Bujtinas, and Rent Cars.
- **Listings**: Detailed pages with images, descriptions, and ratings.
- **Interactive Map**: Homepage features a Leaflet map showing all locations.
- **Search & Filter**: Easily find places by type or name.
- **Reviews**: Users can leave ratings and comments on listings.
- **Premium Design**: Dark mode with glassmorphism effects and smooth animations.

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   The `.env.local` file has been created with default values. Update `MONGODB_URI` if you are using a cloud database (e.g., MongoDB Atlas).
   ```
   MONGODB_URI=mongodb://localhost:27017/korcacity
   JWT_SECRET=supersecretkey123
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Open Browser**
   Visit `http://localhost:3000`.

## Project Structure

- `src/app`: Next.js App Router pages and API routes.
- `src/components`: Reusable UI components (Navbar, Map).
- `src/lib`: Database connection helper.
- `src/models`: Mongoose models (User, Listing, Review).
- `src/context`: Authentication state management.
