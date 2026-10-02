# AgriRevive buyer frontend

Buyer/industry marketplace prototype built with React, TypeScript, Vite, and React Router.

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
