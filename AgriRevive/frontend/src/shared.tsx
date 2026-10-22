import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Leaf } from 'lucide-react'

export type ListingStatus = 'PENDING_APPROVAL' | 'ACTIVE' | 'REJECTED' | 'PAUSED' | 'SOLD_OUT' | 'CLOSED'

export type ResidueTypeDTO = {
  id: number
  name: string
  description?: string
}

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
  farmerEmail?: string
  farmerName?: string
  district?: string
  pickupAddress?: string
  availableFrom?: string
  status?: ListingStatus
  aiVerifiedStatus?: string
  adminRemarks?: string
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
  orderType?: string
  farmerEmail?: string
  buyerName?: string
  buyerOrganization?: string
  source?: 'PURCHASE_REQUEST' | 'AUCTION_WIN'
  rejectionReason?: string
  pickupDate?: string
  vehicleNumber?: string
  pickupNotes?: string
  deliveryRemarks?: string
  subsidyClaimed?: boolean
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

export const currency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number.isFinite(amount) ? amount : 0)

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

export const RESIDUE_TYPES: { id: number; name: string; color: string; image: string }[] = [
  { id: 1, name: 'Rice straw', color: 'sage', image: RICE },
  { id: 2, name: 'Wheat straw', color: 'wheat', image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=1200&q=85' },
  { id: 3, name: 'Bagasse', color: 'gold', image: 'https://images.unsplash.com/photo-1595841696677-6489ff3f8cd1?auto=format&fit=crop&w=1200&q=85' },
  { id: 4, name: 'Cotton stalk', color: 'rust', image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1200&q=85' },
  { id: 5, name: 'Groundnut shells', color: 'olive', image: 'https://images.unsplash.com/photo-1601593768794-35f4d8e137c2?auto=format&fit=crop&w=1200&q=85' },
  { id: 6, name: 'Maize residue', color: 'corn', image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=1200&q=85' },
  { id: 7, name: 'Other residue', color: 'sage', image: RICE },
]

export function residueMetaFor(typeName?: string) {
  if (!typeName) return RESIDUE_TYPES[0]
  const normalized = typeName.trim().toLowerCase()
  return RESIDUE_TYPES.find(item => item.name.toLowerCase() === normalized) || RESIDUE_TYPES[0]
}

/** 'YYYY-MM-DD' -> 'Oct 12, 2026' */
export function formatDisplayDate(isoDate?: string) {
  if (!isoDate) return 'now'
  const [y, m, d] = isoDate.slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return isoDate
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/** A listing buyers may see: ACTIVE and (for auctions) not already ended. */
export function isPubliclyVisible(listing: Listing, now = Date.now()) {
  if (listing.status && listing.status !== 'ACTIVE') return false
  if (listing.listingType === 'AUCTION' && listing.auctionEnds) {
    return new Date(listing.auctionEnds).getTime() > now
  }
  return true
}
