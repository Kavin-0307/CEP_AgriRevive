import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Leaf } from 'lucide-react'

export type ListingStatus = 'PENDING_APPROVAL' | 'ACTIVE' | 'PAUSED' | 'SOLD_OUT' | 'CLOSED'

export type Listing = {
  id: string
  title: string
  type: string
  location: string
  state: string
  quantity: number
  price: number
  grade: 'A' | 'B' | 'C'
  moisture: number
  available: string
  description: string
  image: string
  color: string
  listingType: 'FIXED_PRICE' | 'AUCTION'
  auctionEnds?: string
  highestBid?: number
  bidCount?: number
  // Farmer-side fields. Seed listings have none of these and stay publicly visible.
  farmerEmail?: string
  farmerName?: string
  district?: string
  pickupAddress?: string
  availableFrom?: string
  status?: ListingStatus
  createdAt?: string
}

export type Buyer = { name: string; email: string; organization: string; phone: string; state: string }

export type OrderStatus = 'REQUESTED' | 'ACCEPTED' | 'PAID' | 'IN_TRANSIT' | 'DELIVERED' | 'REJECTED'

export type BuyerOrder = {
  id: string
  listingId: string
  title: string
  location: string
  quantity: number
  total: number
  status: OrderStatus
  date: string
  // Added for the farmer side (all optional so older saved orders still load).
  farmerEmail?: string
  buyerName?: string
  buyerOrganization?: string
  source?: 'PURCHASE_REQUEST' | 'AUCTION_WIN'
  rejectionReason?: string
  pickupDate?: string
  vehicleNumber?: string
  pickupNotes?: string
  deliveryRemarks?: string
}

export type BidRecord = {
  listingId: string
  amount: number
  date: string
  bidderName?: string
  bidderOrganization?: string
}

export type Farmer = {
  name: string
  email: string
  phone: string
  farmName: string
  state: string
  district: string
  pickupAddress: string
  notifyOrders: boolean
  notifyBids: boolean
}

export const initialListings: Listing[] = [
  {
    id: 'ag-2048', title: 'Premium rice straw', type: 'Rice straw', location: 'Ludhiana, Punjab', state: 'Punjab',
    quantity: 28, price: 1800, grade: 'A', moisture: 12, available: 'Oct 12, 2026',
    description: 'Clean, sun-dried paddy straw from the latest harvest. Baled and ready for pickup with consistent quality across the lot.',
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=85',
    color: 'sage', listingType: 'FIXED_PRICE',
  },
  {
    id: 'ag-2049', title: 'Sugarcane bagasse', type: 'Bagasse', location: 'Kolhapur, Maharashtra', state: 'Maharashtra',
    quantity: 62, price: 1150, grade: 'A', moisture: 18, available: 'Oct 16, 2026',
    description: 'Uniform fibrous bagasse from a local sugar mill. Ideal for bioenergy applications, supplied in bulk by the tonne.',
    image: 'https://images.unsplash.com/photo-1595841696677-6489ff3f8cd1?auto=format&fit=crop&w=1200&q=85',
    color: 'gold', listingType: 'AUCTION', auctionEnds: '2026-10-08T18:00:00', highestBid: 1280, bidCount: 8,
  },
  {
    id: 'ag-2050', title: 'Cotton stalk bales', type: 'Cotton stalk', location: 'Nagpur, Maharashtra', state: 'Maharashtra',
    quantity: 15, price: 2400, grade: 'B', moisture: 15, available: 'Oct 10, 2026',
    description: 'Mechanically harvested cotton stalks, neatly bundled for transport. Available from a verified farmer cooperative.',
    image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1200&q=85',
    color: 'rust', listingType: 'FIXED_PRICE',
  },
  {
    id: 'ag-2051', title: 'Wheat straw · Grade A', type: 'Wheat straw', location: 'Karnal, Haryana', state: 'Haryana',
    quantity: 40, price: 1650, grade: 'A', moisture: 10, available: 'Oct 14, 2026',
    description: 'Low-moisture wheat straw sourced from a small farmer group. Suitable for animal bedding and biomass processing.',
    image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=1200&q=85',
    color: 'wheat', listingType: 'FIXED_PRICE',
  },
  {
    id: 'ag-2052', title: 'Groundnut shells', type: 'Groundnut shells', location: 'Junagadh, Gujarat', state: 'Gujarat',
    quantity: 22, price: 2100, grade: 'B', moisture: 13, available: 'Oct 18, 2026',
    description: 'Dry, screened groundnut shells stored under cover. A dependable fuel feedstock with reliable year-round supply.',
    image: 'https://images.unsplash.com/photo-1601593768794-35f4d8e137c2?auto=format&fit=crop&w=1200&q=85',
    color: 'olive', listingType: 'AUCTION', auctionEnds: '2026-10-06T15:30:00', highestBid: 2250, bidCount: 12,
  },
  {
    id: 'ag-2053', title: 'Maize cobs & husk', type: 'Maize residue', location: 'Dewas, Madhya Pradesh', state: 'Madhya Pradesh',
    quantity: 34, price: 1350, grade: 'B', moisture: 16, available: 'Oct 20, 2026',
    description: 'Mixed maize cobs and husk collected after shelling. Packed loose and ready for bulk collection.',
    image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=1200&q=85',
    color: 'corn', listingType: 'FIXED_PRICE',
  },
]

export const currency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)

export function readStored<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}

export function useStoredState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => readStored(key, initial))
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Storage can be full (e.g. large uploaded photos). Keep the app running with in-memory state.
    }
  }, [key, value])
  return [value, setValue] as const
}

export function Brand({ to = '/' }: { to?: string }) {
  return <Link to={to} className="brand"><span className="brand-mark"><Leaf size={20} fill="currentColor" /></span><span>agri<span>revive</span></span></Link>
}

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Gujarat', 'Haryana', 'Karnataka', 'Madhya Pradesh',
  'Maharashtra', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Uttar Pradesh',
]

const RICE = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=85'

export const RESIDUE_TYPES: { name: string; color: string; image: string }[] = [
  { name: 'Rice straw', color: 'sage', image: RICE },
  { name: 'Wheat straw', color: 'wheat', image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=1200&q=85' },
  { name: 'Bagasse', color: 'gold', image: 'https://images.unsplash.com/photo-1595841696677-6489ff3f8cd1?auto=format&fit=crop&w=1200&q=85' },
  { name: 'Cotton stalk', color: 'rust', image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1200&q=85' },
  { name: 'Groundnut shells', color: 'olive', image: 'https://images.unsplash.com/photo-1601593768794-35f4d8e137c2?auto=format&fit=crop&w=1200&q=85' },
  { name: 'Maize residue', color: 'corn', image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=1200&q=85' },
  { name: 'Other residue', color: 'sage', image: RICE },
]

/** A listing buyers may see: not paused/under review/sold, and (for farmer-made auctions) not already ended. */
export function isPubliclyVisible(listing: Listing, now = Date.now()) {
  if (listing.status && listing.status !== 'ACTIVE') return false
  if (listing.farmerEmail && listing.listingType === 'AUCTION' && listing.auctionEnds) {
    return new Date(listing.auctionEnds).getTime() > now
  }
  return true
}
