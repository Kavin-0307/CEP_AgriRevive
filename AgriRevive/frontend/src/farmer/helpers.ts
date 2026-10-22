import { useEffect, useState } from 'react'
import { formatDisplayDate, type BidRecord, type Listing, type ListingStatus } from '../shared'

export { formatDisplayDate }

/** Re-renders on an interval so countdowns and "ended" states stay current. */
export function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(timer)
  }, [intervalMs])
  return now
}

export function newId(prefix: string) {
  return `${prefix}-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 10)}`
}

export const LISTING_STATUS: Record<ListingStatus, { label: string; tone: string }> = {
  PENDING_APPROVAL: { label: 'Under review', tone: 'status-waiting' },
  ACTIVE: { label: 'Active', tone: 'status-done' },
  REJECTED: { label: 'Rejected by AI', tone: 'status-due' },
  PAUSED: { label: 'Paused', tone: 'status-muted' },
  SOLD_OUT: { label: 'Sold out', tone: 'status-progress' },
  CLOSED: { label: 'Closed', tone: 'status-muted' },
}

export function listingStatusMeta(status?: ListingStatus) {
  return (status && LISTING_STATUS[status]) || LISTING_STATUS.ACTIVE
}

export function bidsFor(listingId: string, bids: BidRecord[]) {
  return bids
    .filter(bid => bid.listingId === listingId)
    .sort((a, b) => b.amount - a.amount || b.date.localeCompare(a.date))
}

export type TopBid = { amount: number; bidderName?: string; bidderOrganization?: string; fromBuyerWorkspace: boolean }

/** Highest bid on a listing: bids placed in this browser's buyer workspace, or the listing's own recorded highest bid. */
export function topBid(listing: Listing, bids: BidRecord[]): TopBid | null {
  const placed = bidsFor(listing.id, bids)[0]
  const recorded = listing.highestBid
  if (placed && (!recorded || placed.amount >= recorded)) {
    return { amount: placed.amount, bidderName: placed.bidderName, bidderOrganization: placed.bidderOrganization, fromBuyerWorkspace: true }
  }
  if (recorded) return { amount: recorded, fromBuyerWorkspace: false }
  return null
}

export type AuctionPhase = 'REVIEW' | 'LIVE' | 'ENDED' | 'AWARDED' | 'CLOSED' | 'PAUSED'

export function auctionPhase(listing: Listing, now: number): AuctionPhase {
  if (listing.status === 'PENDING_APPROVAL') return 'REVIEW'
  if (listing.status === 'SOLD_OUT') return 'AWARDED'
  if (listing.status === 'CLOSED' || listing.status === 'REJECTED') return 'CLOSED'
  if (listing.status === 'PAUSED') return 'PAUSED'
  const end = listing.auctionEnds ? new Date(listing.auctionEnds).getTime() : 0
  return end > now ? 'LIVE' : 'ENDED'
}

export function timeLeft(iso: string | undefined, now: number) {
  if (!iso) return '—'
  const diff = new Date(iso).getTime() - now
  if (diff <= 0) return 'Ended'
  const minutes = Math.floor(diff / 60000)
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  if (days > 0) return `${days}d ${hours}h left`
  if (hours > 0) return `${hours}h ${minutes % 60}m left`
  return `${Math.max(1, minutes)}m left`
}

export function formatDateTime(iso: string | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** Value for <input type="datetime-local"> in local time. */
export function toLocalInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

/** Value for <input type="date"> in local time. */
export function toDateInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/** Reads an image file and downsizes it so it fits comfortably in localStorage. */
export function fileToDataUrl(file: File, maxDimension = 1000): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read that file.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('That file is not a valid image.'))
      img.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const context = canvas.getContext('2d')
        if (!context) { reject(new Error('Image processing is not available.')); return }
        context.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}
