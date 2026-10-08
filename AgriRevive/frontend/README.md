# AgriRevive frontend (buyer + farmer)

Buyer/industry marketplace and farmer/seller portal prototype built with React, TypeScript, Vite, and React Router.

- Buyer portal: `/login`, `/` (this is the original half)
- Farmer portal: `/farmer/login`, `/farmer` (added)

## Run locally

```sh
npm install
npm run dev
```

Open the Vite URL (normally `http://localhost:5173`). Create an account or sign in with any valid email and a password of at least six characters.

## Demo behavior

This frontend is intentionally labeled as a demo workspace. Listings, buyer profile, purchase requests, and bids are stored in browser `localStorage`; no payment is processed. The login/register forms are local demo flows, not backend authentication. The backend currently has no buyer profile update or bid REST endpoint, so the bid and profile interactions are not represented as live server operations.

## Included buyer flows

- Buyer login and registration
- Buyer overview dashboard and marketplace navigation
- Biomass listing search, filtering, sorting, and detail pages
- Fixed-price purchase requests
- Auction current bid, bid validation, and buyer bid history
- Buyer orders with request/payment status and a demo pay action
- Editable buyer organization profile and basic settings

The implementation follows the buyer-facing routes and interaction requirements in the AgriRevive Frontend PRD. Connect the demo state handlers to the backend API before treating orders, auctions, or payments as production transactions.

## Farmer / seller portal (`/farmer`)

Included farmer flows:

- Farmer login and registration (`/farmer/login`, `/farmer/register`)
- Farmer dashboard: active listings, live auctions, order requests, confirmed sales, and a "needs your attention" list
- Create biomass listing (fixed price or auction) with live buyer preview and optional photo upload
- My listings: filter by status, edit, pause/resume, delete (blocked while orders are open)
- Auctions: bid status, highest bid and bidder, bid history, extend/relist, end without sale, award the highest bidder
- Orders: accept or decline purchase requests, schedule pickup, mark delivered
- Profile and basic settings: farm details, default pickup address, notification preferences

How it connects to the buyer portal: both portals read and write the same `localStorage` keys (`agri-listings`, `agri-orders`, `agri-bids`), so a listing a farmer creates shows up in the buyer's Browse page, a buyer's purchase request or bid shows up on the farmer's Orders/Auctions pages, and accepting/declining/awarding updates the buyer's orders.

Demo shortcuts (these stand in for backend behaviour that does not exist in the frontend yet):

- New listings start as "Under review" (like `PENDING_APPROVAL` in the backend). Use **Demo: approve** on My listings to make them visible to buyers.
- Auctions can only be awarded to bids placed from the buyer portal in the same browser.
- Farmer accounts are local to the browser; any valid email and a 6+ character password work.
- Uploaded listing photos are downsized and stored in `localStorage`. If the browser's storage fills up, new data may not persist.

Suggested backend mapping when wiring this up: `POST /api/biomass` (create listing), `GET /api/biomass` (marketplace), `GET /api/orders/mine` (farmer orders). Edit/delete listing, auction management, order accept/decline/pickup/delivery and farmer profile endpoints don't exist in the backend yet.

### Source layout

- `src/shared.tsx`: shared types, seed listings, storage hook, helpers
- `src/farmer/`: `FarmerApp` (routes, auth, layout), `FarmerDashboard`, `ListingFormPage`, `MyListings`, `AuctionsPage`, `FarmerOrders`, `FarmerProfile`, `helpers.ts`, `context.ts`, `farmer.css`
