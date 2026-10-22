import { useEffect, useState } from 'react'
import { Award, Check, Clock3, Gavel, History, PackagePlus, TrendingUp, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { currency, type Listing } from '../shared'
import { useFarmer } from './context'
import { auctionPhase, bidsFor, formatDateTime, timeLeft, toLocalInput, topBid, useNow, type AuctionPhase } from './helpers'
import api, { WS_URL, mapBackendListingToFrontend, mapOrder } from '../api'

const PHASE: Record<AuctionPhase, { label: string; tone: string }> = {
  REVIEW: { label: 'Under review', tone: 'status-waiting' },
  LIVE: { label: 'Live', tone: 'status-due' },
  ENDED: { label: 'Ended · settling', tone: 'status-progress' },
  AWARDED: { label: 'Awarded', tone: 'status-done' },
  CLOSED: { label: 'Closed', tone: 'status-muted' },
  PAUSED: { label: 'Paused', tone: 'status-muted' },
}

const TABS = ['Live', 'Needs action', 'Completed', 'All'] as const
type Tab = (typeof TABS)[number]

export default function AuctionsPage() {
  const { listings, setListings, setOrders, bids } = useFarmer()
  const now = useNow(15000)
  const [tab, setTab] = useState<Tab>('Live')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [extendDays, setExtendDays] = useState<Record<string, string>>({})

  const auctions = listings.filter(item => item.listingType === 'AUCTION')
  const auctionIdsKey = auctions.map(a => a.id).sort().join(',')

  // Subscribe to real-time WebSocket bids for all farmer auctions
  useEffect(() => {
    const token = localStorage.getItem('token')
    const ids = auctionIdsKey ? auctionIdsKey.split(',') : []
    if (!token || ids.length === 0) return

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        for (const listingId of ids) {
          client.subscribe(`/topic/bids/${listingId}`, frame => {
            try {
              const payload = JSON.parse(frame.body)
              const amount = Number(payload.amount)
              if (amount > 0) {
                setListings(old =>
                  old.map(item =>
                    item.id === String(payload.listingId)
                      ? { ...item, highestBid: Math.max(item.highestBid ?? 0, amount), bidCount: (item.bidCount ?? 0) + 1 }
                      : item,
                  ),
                )
                setMessage(`New live bid of ${currency(amount)} / t placed by ${payload.bidderName || 'a buyer'}!`)
              }
            } catch {
              // ignore malformed message
            }
          })
        }
      },
    })
    client.activate()
    return () => {
      client.deactivate()
    }
  }, [auctionIdsKey, setListings])

  const phaseOf = (item: Listing) => auctionPhase(item, now)
  const inTab = (item: Listing, which: Tab) => {
    const phase = phaseOf(item)
    return which === 'All' ? true : which === 'Live' ? phase === 'LIVE' || phase === 'REVIEW' : which === 'Needs action' ? phase === 'ENDED' : phase === 'AWARDED' || phase === 'CLOSED'
  }
  const shown = auctions.filter(item => inTab(item, tab))
  const totalBids = auctions.reduce((sum, item) => sum + Math.max(bidsFor(item.id, bids).length, item.bidCount ?? (item.highestBid ? 1 : 0)), 0)
  const bestBid = auctions.reduce((max, item) => Math.max(max, topBid(item, bids)?.amount ?? 0), 0)

  const patch = (id: string, changes: Partial<Listing>) => setListings(old => old.map(item => item.id === id ? { ...item, ...changes } : item))

  const extend = (item: Listing) => {
    const days = Number(extendDays[item.id] ?? '1')
    const base = Math.max(now, item.auctionEnds ? new Date(item.auctionEnds).getTime() : now)
    const end = toLocalInput(new Date(base + days * 24 * 3600 * 1000))
    patch(item.id, { auctionEnds: end, status: item.status === 'CLOSED' || item.status === 'PENDING_APPROVAL' ? item.status : 'ACTIVE' })
    setMessage(`“${item.title}” now ends ${formatDateTime(end)}.`)
  }

  const closeAuction = (item: Listing) => {
    patch(item.id, { status: 'CLOSED' })
    setMessage(`“${item.title}” was closed without a sale.`)
  }

  const reopen = (item: Listing) => {
    const end = toLocalInput(new Date(Date.now() + 3 * 24 * 3600 * 1000))
    patch(item.id, { status: 'ACTIVE', auctionEnds: end })
    setMessage(`“${item.title}” was relisted and ends ${formatDateTime(end)}.`)
  }

  const syncWithServer = async () => {
    try {
      const [mineRes, ordersRes] = await Promise.all([
        api.get('/biomass/mine'),
        api.get('/orders/mine'),
      ])
      setListings(mineRes.data.map(mapBackendListingToFrontend))
      setOrders(ordersRes.data.map(mapOrder))
      setMessage('Synced auction status and orders from the server.')
    } catch {
      setMessage('Could not sync with server.')
    }
  }

  return (
    <div className="content-width">
      <div className="page-heading">
        <div><span className="eyebrow">SELL BY BIDDING</span><h1>Auctions</h1><p>Watch live bids arrive in real time. Expired auctions with bids are automatically converted into orders.</p></div>
        <Link to="/farmer/listings/new?type=auction" className="button button-primary"><Gavel size={16} /> Create auction</Link>
      </div>

      <div className="order-summary-strip">
        <div><span className="order-summary-icon"><Gavel size={18} /></span><span><strong>{auctions.filter(item => phaseOf(item) === 'LIVE').length} live auctions</strong><small>{auctions.length} in total</small></span></div>
        <div><span className="order-summary-icon paid"><TrendingUp size={18} /></span><span><strong>{totalBids} bids received</strong><small>Across all your auctions</small></span></div>
        <div><span className="order-summary-icon"><Award size={18} /></span><span><strong>{bestBid ? `${currency(bestBid)} / t` : '—'}</strong><small>Best bid so far</small></span></div>
      </div>

      {message && <div className="fm-flash" role="status"><Check size={15} /><span>{message}</span><button className="icon-button" onClick={() => setMessage('')} aria-label="Dismiss"><X size={15} /></button></div>}

      <div className="order-tabs">{TABS.map(item => <button key={item} onClick={() => setTab(item)} className={tab === item ? 'order-tab active-tab' : 'order-tab'}>{item}<span>{auctions.filter(auction => inTab(auction, item)).length}</span></button>)}</div>

      {shown.length ? <div className="fm-auction-list">{shown.map(item => {
        const phase = phaseOf(item)
        const pill = PHASE[phase]
        const history = bidsFor(item.id, bids)
        const top = topBid(item, bids)
        const open = expanded === item.id
        const recordedBidCount = Math.max(history.length, item.bidCount ?? (top ? 1 : 0))
        return (
          <article key={item.id} className="panel fm-auction">
            <div className="fm-auction-head">
              <span className={`auction-thumb fm-auction-thumb ${item.color}`} style={{ backgroundImage: `url("${item.image}")` }} />
              <div className="fm-auction-title"><strong>{item.title}</strong><small>{item.quantity} t · Grade {item.grade} · {item.location}</small></div>
              <span className={`status-pill ${pill.tone}`}><i />{pill.label}</span>
            </div>

            <div className="fm-stat-grid">
              <div><small>HIGHEST BID</small><strong className={top ? 'fm-highlight' : ''}>{top ? `${currency(top.amount)} / t` : 'No bids yet'}</strong><span>{top ? (top.bidderName ? `${top.bidderName}${top.bidderOrganization ? ` · ${top.bidderOrganization}` : ''}` : 'Verified industry bidder') : `Opens at ${currency(item.price)} / t`}</span></div>
              <div><small>STARTING PRICE</small><strong>{currency(item.price)} / t</strong><span>{top && top.amount >= item.price ? `+${currency(top.amount - item.price)} over start` : 'Per tonne'}</span></div>
              <div><small>BIDS</small><strong>{recordedBidCount}</strong><span>{recordedBidCount === 1 ? '1 active bid' : `${recordedBidCount} bids`}</span></div>
              <div><small>{phase === 'LIVE' ? 'TIME LEFT' : 'ENDS'}</small><strong className="fm-inline-icon"><Clock3 size={14} />{phase === 'LIVE' ? timeLeft(item.auctionEnds, now) : formatDateTime(item.auctionEnds)}</strong><span>{phase === 'LIVE' ? formatDateTime(item.auctionEnds) : phase === 'ENDED' ? 'Bidding has closed' : ' '}</span></div>
            </div>

            {top && top.amount > 0 && <p className="fm-total-line">At the highest bid, the order value is <strong>{currency(top.amount * item.quantity)}</strong> for {item.quantity} t.</p>}

            <div className="fm-auction-actions">
              {(phase === 'LIVE' || phase === 'ENDED') && <span className="fm-extend"><select value={extendDays[item.id] ?? '1'} onChange={e => setExtendDays(old => ({ ...old, [item.id]: e.target.value }))} aria-label="Extend by"><option value="1">1 day</option><option value="2">2 days</option><option value="3">3 days</option><option value="7">7 days</option></select><button className="button button-outline" onClick={() => extend(item)}><Clock3 size={14} /> {phase === 'ENDED' ? 'Relist / extend' : 'Extend'}</button></span>}
              {phase === 'ENDED' && top && <button className="button button-primary" onClick={syncWithServer}><Award size={15} /> Check settlement &amp; orders</button>}
              {(phase === 'LIVE' || phase === 'ENDED') && <button className="button button-outline fm-button-quiet" onClick={() => closeAuction(item)}>{phase === 'LIVE' ? 'End without sale' : 'Close auction'}</button>}
              {phase === 'CLOSED' && <button className="button button-outline" onClick={() => reopen(item)}><Gavel size={14} /> Relist auction</button>}
              {phase === 'AWARDED' && <Link to="/farmer/orders" className="button button-outline">View order</Link>}
              {phase === 'REVIEW' && <small className="fm-note">Goes live automatically once AI quality review completes.</small>}
              <button className="text-button fm-history-toggle" onClick={() => setExpanded(open ? null : item.id)}><History size={13} /> {open ? 'Hide bid history' : `Bid history (${history.length})`}</button>
            </div>

            {open && (history.length ? <ol className="fm-bid-history">{history.slice(0, 12).map((bid, index) => <li key={`${bid.date}-${index}`}><span className="fm-rank">{index + 1}</span><span><strong>{bid.bidderName ?? 'Industry buyer'}</strong><small>{bid.bidderOrganization ?? 'Buyer'} · {formatDateTime(bid.date)}</small></span><strong>{currency(bid.amount)} / t</strong></li>)}</ol> : <p className="fm-empty-history">{top ? `Current highest bid is ${currency(top.amount)} / t on the server.` : 'No bids have been placed yet.'}</p>)}
          </article>
        )
      })}</div>
        : <div className="empty-state"><span className="empty-icon large"><Gavel size={22} /></span><h3>{auctions.length ? 'No auctions in this view' : 'No auctions yet'}</h3><p>{auctions.length ? 'Try another tab to see your other auctions.' : 'Create an auction listing and let buyers compete for your biomass.'}</p>{!auctions.length && <Link to="/farmer/listings/new?type=auction" className="button button-primary"><PackagePlus size={16} /> Create auction</Link>}</div>}
    </div>
  )
}
