import { ArrowRight, Boxes, Clock3, Gavel, PackageCheck, PackagePlus, ShieldCheck, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { currency } from '../shared'
import { useFarmer } from './context'
import { LISTING_STATUS, auctionPhase, bidsFor, timeLeft, topBid, useNow } from './helpers'

export default function FarmerDashboard() {
  const { farmer, listings, orders, bids } = useFarmer()
  const now = useNow()
  const firstName = farmer.name.trim().split(/\s+/)[0] || 'there'
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()

  const active = listings.filter(item => item.status === 'ACTIVE' || !item.status)
  const underReview = listings.filter(item => item.status === 'PENDING_APPROVAL')
  const auctions = listings.filter(item => item.listingType === 'AUCTION')
  const liveAuctions = auctions.filter(item => auctionPhase(item, now) === 'LIVE')
  const endedAuctions = auctions.filter(item => auctionPhase(item, now) === 'ENDED')
  const totalBids = auctions.reduce((sum, item) => sum + bidsFor(item.id, bids).length, 0)
  const requests = orders.filter(order => order.status === 'REQUESTED')
  const needPickup = orders.filter(order => order.status === 'PAID')
  const sales = orders.filter(order => ['PAID', 'IN_TRANSIT', 'DELIVERED'].includes(order.status)).reduce((sum, order) => sum + order.total, 0)

  const todo: { key: string; text: string; sub: string; to: string }[] = [
    ...(requests.length ? [{ key: 'req', text: `${requests.length} purchase request${requests.length === 1 ? '' : 's'} waiting`, sub: 'Accept or decline so buyers can pay', to: '/farmer/orders' }] : []),
    ...(needPickup.length ? [{ key: 'pickup', text: `${needPickup.length} paid order${needPickup.length === 1 ? '' : 's'} ready for pickup`, sub: 'Schedule pickup with the buyer', to: '/farmer/orders' }] : []),
    ...(endedAuctions.length ? [{ key: 'ended', text: `${endedAuctions.length} auction${endedAuctions.length === 1 ? '' : 's'} ended`, sub: 'Award the highest bidder, close or relist', to: '/farmer/auctions' }] : []),
    ...(underReview.length ? [{ key: 'review', text: `${underReview.length} listing${underReview.length === 1 ? '' : 's'} under review`, sub: 'Buyers see them once approved', to: '/farmer/listings' }] : []),
  ]

  return (
    <div className="content-width">
      <section className="welcome-row">
        <div>
          <span className="eyebrow">{today} <span className="eyebrow-dot" /> FARMER OVERVIEW</span>
          <h1>Hello, {firstName}<span className="wave">✳</span></h1>
          <p>Here's how your biomass is performing on AgriRevive.</p>
        </div>
        <Link className="button button-primary" to="/farmer/listings/new"><PackagePlus size={16} /> Create listing <ArrowRight size={16} /></Link>
      </section>

      <section className="metric-grid">
        <article className="metric-card"><div className="metric-top"><span>Active listings</span><span className="metric-icon mint"><Boxes size={18} /></span></div><strong className="metric-value">{String(active.length).padStart(2, '0')}</strong><span className="metric-detail">{underReview.length ? `${underReview.length} under review` : 'Visible to buyers'}</span></article>
        <article className="metric-card"><div className="metric-top"><span>Live auctions</span><span className="metric-icon peach"><Gavel size={18} /></span></div><strong className="metric-value">{String(liveAuctions.length).padStart(2, '0')}</strong><span className="metric-detail">{totalBids} bid{totalBids === 1 ? '' : 's'} received in total</span></article>
        <article className="metric-card"><div className="metric-top"><span>Order requests</span><span className="metric-icon lavender"><PackageCheck size={18} /></span></div><strong className="metric-value">{String(requests.length).padStart(2, '0')}</strong><span className="metric-detail">{requests.length ? 'Awaiting your response' : 'You are all caught up'}</span></article>
        <article className="metric-card"><div className="metric-top"><span>Confirmed sales</span><span className="metric-icon cream"><Wallet size={18} /></span></div><strong className="metric-value">{currency(sales)}</strong><span className="metric-detail">Paid, in transit or delivered</span></article>
      </section>

      {listings.length === 0 && (
        <div className="empty-state fm-first-listing">
          <span className="empty-icon large"><PackagePlus size={22} /></span>
          <h3>List your first biomass lot</h3>
          <p>Add the residue you have available, set a price or start an auction, and industry buyers can find it right away.</p>
          <Link to="/farmer/listings/new" className="button button-primary"><PackagePlus size={16} /> Create your first listing</Link>
        </div>
      )}

      <section className="lower-grid fm-lower">
        <div className="panel recent-panel">
          <div className="section-heading"><div><span className="eyebrow">KEEP THINGS MOVING</span><h2>Needs your attention</h2></div><Link to="/farmer/orders" className="subtle-link">All orders <ArrowRight size={15} /></Link></div>
          {todo.length ? <div className="fm-todo-list">{todo.map(item => <Link key={item.key} to={item.to} className="fm-todo"><span className="recent-order-icon"><Clock3 size={15} /></span><span><strong>{item.text}</strong><small>{item.sub}</small></span><ArrowRight size={15} /></Link>)}</div>
            : <div className="empty-inline"><span className="empty-icon"><ShieldCheck size={19} /></span><div><strong>Nothing needs you right now</strong><p>New requests, ended auctions and pickups will show up here.</p></div></div>}
        </div>
        <div className="panel auction-panel">
          <div className="section-heading"><div><span className="eyebrow">AUCTION WATCH</span><h2>Live auctions</h2></div><span className="live-indicator"><i /> LIVE</span></div>
          {liveAuctions.length ? <div className="auction-list">{liveAuctions.map(item => {
            const top = topBid(item, bids)
            return <Link key={item.id} to="/farmer/auctions" className="auction-row"><span className={`auction-thumb ${item.color}`} style={{ backgroundImage: `url("${item.image}")` }} /><span className="auction-info"><strong>{item.title}</strong><small>{bidsFor(item.id, bids).length} bids · {timeLeft(item.auctionEnds, now)}</small></span><span className="auction-price"><strong>{currency(top?.amount ?? item.price)}</strong><small>{top ? 'highest bid' : 'starting price'}</small></span><ArrowRight size={15} /></Link>
          })}</div> : <div className="empty-inline"><span className="empty-icon"><Gavel size={19} /></span><div><strong>No live auctions</strong><p>Run an auction to let buyers compete for your biomass.</p></div><Link to="/farmer/listings/new?type=auction">Start one <ArrowRight size={14} /></Link></div>}
        </div>
      </section>

      {listings.length > 0 && (
        <section className="section-block">
          <div className="section-heading"><div><span className="eyebrow">YOUR CATALOGUE</span><h2>Recent listings</h2></div><Link to="/farmer/listings" className="subtle-link">Manage listings <ArrowRight size={15} /></Link></div>
          <div className="fm-mini-list">{[...listings].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')).slice(0, 4).map(item => {
            const meta = LISTING_STATUS[item.status ?? 'ACTIVE']
            return <Link key={item.id} to={`/farmer/listings/${item.id}/edit`} className="fm-mini-row"><span className={`auction-thumb ${item.color}`} style={{ backgroundImage: `url("${item.image}")` }} /><span className="auction-info"><strong>{item.title}</strong><small>{item.quantity} t · {item.location}</small></span><span className={`status-pill ${meta.tone}`}><i />{meta.label}</span><span className="auction-price"><strong>{currency(item.price)}</strong><small>{item.listingType === 'AUCTION' ? 'starting / t' : 'per tonne'}</small></span></Link>
          })}</div>
        </section>
      )}
    </div>
  )
}
