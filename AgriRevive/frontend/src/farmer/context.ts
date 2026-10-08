import { createContext, useContext, type Dispatch, type SetStateAction } from 'react'
import type { BidRecord, BuyerOrder, Farmer, Listing } from '../shared'

export type FarmerContextValue = {
  farmer: Farmer
  saveFarmer: (farmer: Farmer) => void
  /** Every listing in the shared marketplace store. */
  allListings: Listing[]
  setListings: Dispatch<SetStateAction<Listing[]>>
  /** Only this farmer's listings. */
  listings: Listing[]
  /** Orders placed against this farmer's listings. */
  orders: BuyerOrder[]
  setOrders: Dispatch<SetStateAction<BuyerOrder[]>>
  /** All bids placed in the buyer workspace (use bidsFor to narrow to a listing). */
  bids: BidRecord[]
}

export const FarmerContext = createContext<FarmerContextValue | null>(null)

export function useFarmer() {
  const value = useContext(FarmerContext)
  if (!value) throw new Error('useFarmer must be used inside the farmer portal')
  return value
}
