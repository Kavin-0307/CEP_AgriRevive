import { useEffect, useMemo, useRef, useState, type Dispatch, type FormEvent, type ReactNode, type SetStateAction } from 'react'
import {
  ArrowDownUp, ArrowLeft, ArrowRight, ArrowUpRight, Bell, Check, ChevronDown,
  CircleHelp, Clock3, Factory, Filter, Leaf, LogOut, Menu, PackageCheck,
  Search, Settings2, ShieldCheck, SlidersHorizontal, Sprout, TrendingUp, X,
} from 'lucide-react'
import {
  Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate, useParams,
  useSearchParams, Outlet as RoutesOutlet,
} from 'react-router-dom'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import {
  Brand, INDIAN_STATES, currency, isPubliclyVisible, useStoredState,
  type BidRecord, type Buyer, type BuyerOrder, type Listing, type OrderStatus,
} from './shared'
import api, { WS_URL, clearSessionStorage, mapBackendListingToFrontend, mapOrder } from './api'

import FarmerApp from './farmer/FarmerApp'

export default function App() {
  const [buyer, setBuyer] = useStoredState<Buyer | null>('agri-buyer', null)
  const [listings, setListings] = useState<Listing[]>([])
  const [orders, setOrders] = useStoredState<BuyerOrder[]>('agri-orders', [])
  const [bids, setBids] = useStoredState<BidRecord[]>('agri-bids', [])

  useEffect(() => {
    if (buyer && localStorage.getItem('token')) {
      api.get('/biomass').then(response => setListings(response.data.map(mapBackendListingToFrontend))).catch(err => console.error(err))
      api.get('/orders/mine').then(response => setOrders(response.data.map(mapOrder))).catch(err => console.error(err))
    }
  }, [buyer, setOrders])

  const marketListings = useMemo(() => listings.filter(item => isPubliclyVisible(item)).map(item => {
    if (item.listingType !== 'AUCTION') return item
    const top = Math.max(item.highestBid ?? 0, ...bids.filter(bid => bid.listingId === item.id).map(bid => bid.amount))
    return top > 0 ? { ...item, highestBid: top } : item
  }), [listings, bids])

  const buyerOrders = useMemo(
    () => orders.filter(o => o.orderType !== 'ECO_PRODUCT'),
    [orders],
  )

  const handleBuyerLogout = () => {
    clearSessionStorage()
    setBuyer(null)
    setListings([])
    setOrders([])
  }

  return (
    <Routes>
      <Route path="/farmer/*" element={<FarmerApp listings={listings} setListings={setListings} orders={orders} setOrders={setOrders} bids={bids} />} />
      <Route path="/login" element={buyer ? <Navigate to="/" replace /> : <AuthPage onAuth={setBuyer} />} />
      <Route path="/register" element={buyer ? <Navigate to="/" replace /> : <AuthPage register onAuth={setBuyer} />} />
      <Route element={buyer ? <MarketplaceLayout buyer={buyer} orders={buyerOrders} onLogout={handleBuyerLogout} /> : <Navigate to="/login" replace />}>
        <Route index element={<Dashboard buyer={buyer} listings={marketListings} orders={buyerOrders} bids={bids} />} />
        <Route path="browse" element={<BrowsePage listings={marketListings} />} />
        <Route path="listings/:id" element={<ListingDetail buyer={buyer} listings={marketListings} setListings={setListings} setOrders={setOrders} bids={bids} setBids={setBids} />} />
        <Route path="orders" element={<OrdersPage orders={buyerOrders} setOrders={setOrders} listings={listings} bids={bids} />} />
        <Route path="profile" element={<ProfilePage buyer={buyer} setBuyer={setBuyer} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

function AuthPage({ register = false, onAuth }: { register?: boolean; onAuth: (buyer: Buyer) => void }) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [organization, setOrganization] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (submitting) return
    const key = email.trim().toLowerCase()
    if (!key.includes('@') || password.length < 6) {
      setError('Enter a valid email and a password with at least 6 characters.')
      return
    }
    if (register && (!name.trim() || !organization.trim())) {
      setError('Add your name and organization to create a buyer account.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      let buyerData: Buyer
      if (register) {
        const response = await api.post('/auth/register', {
          name: name.trim(),
          email: key,
          password,
          phone: phone.trim() || '0000000000',
          organizationName: organization.trim(),
          role: 'INDUSTRY',
        })
        const u = response.data.user || {}
        localStorage.removeItem('agri-farmer')
        localStorage.setItem('token', response.data.token)
        buyerData = { name: u.name || name.trim(), email: u.email || key, organization: u.organizationName || organization.trim(), phone: u.phone || phone.trim(), state: u.state || '' }
      } else {
        const response = await api.post('/auth/login', { email: key, password })
        const u = response.data.user || {}
        if (u.role && u.role !== 'INDUSTRY') {
          setError(`This account is registered as a ${u.role.toLowerCase()}. Please use the Farmer portal to sign in.`)
          setSubmitting(false)
          return
        }
        localStorage.removeItem('agri-farmer')
        localStorage.setItem('token', response.data.token)
        buyerData = { name: u.name || 'Buyer', email: u.email || key, organization: u.organizationName || 'Industry buyer', phone: u.phone || '', state: u.state || '' }
      }

      localStorage.setItem('agri-buyer-profile', JSON.stringify(buyerData))
      onAuth(buyerData)
      navigate('/')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid credentials or server error. Make sure your Spring Boot backend is running!')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-brand"><Brand to="/" /></div>
      <div className="auth-layout">
        <section className="auth-story">
          <span className="eyebrow light"><ShieldCheck size={15} /> Reliable Biomass Supply</span>
          <h1>Source raw materials<br /><em>with confidence.</em></h1>
          <p>AgriRevive connects industry buyers directly with verified farmers to source sustainable agricultural residue.</p>
          <div className="auth-proof"><span><strong>Traceable</strong> supply chain</span><span><strong>Direct</strong> from farmers</span></div>
        </section>
        <section className="auth-card">
          <div className="auth-card-heading">
            <span className="eyebrow">BUYER PORTAL</span>
            <h2>{register ? 'Create a buyer account' : 'Welcome back'}</h2>
            <p>{register ? 'Join the network of industries sourcing sustainable biomass.' : 'Sign in to manage your biomass supply chain.'}</p>
          </div>
          <form onSubmit={submit} className="stack-form">
            {register && (
              <>
                <label>Full name<input required value={name} onChange={e => setName(e.target.value)} /></label>
                <label>Organization<input required value={organization} onChange={e => setOrganization(e.target.value)} /></label>
                <label>Phone number <small className="field-hint">Optional</small><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" /></label>
              </>
            )}
            <label>Email<input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></label>
            <label>Password<input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} /></label>
            {error && <p className="form-error">{error}</p>}
            <button className="button button-primary button-full" disabled={submitting}>
              {submitting ? (register ? 'Creating account…' : 'Signing in…') : (register ? 'Create account' : 'Sign in')} <ArrowRight size={16} />
            </button>
          </form>
          <p className="auth-switch">{register ? 'Already have an account?' : 'New to AgriRevive?'} <Link to={register ? '/login' : '/register'}>{register ? 'Sign in' : 'Create an account'}</Link></p>
          <p className="auth-switch auth-role-switch">Selling biomass? <Link to="/farmer/login">Farmer sign in</Link></p>
        </section>
      </div>
    </main>
  )
}

function MarketplaceLayout({ buyer, orders, onLogout }: { buyer: Buyer | null; orders: BuyerOrder[]; onLogout: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  useEffect(() => setMobileOpen(false), [location.pathname])
  const activeCount = orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'REJECTED').length
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-top"><Brand /><button className="icon-button mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={18} /></button></div>
        <div className="workspace-switch"><span className="workspace-icon"><Factory size={17} /></span><span><strong>{buyer?.organization || 'Industry buyer'}</strong><small>Buyer workspace</small></span><ChevronDown size={15} /></div>
        <span className="nav-section-title">WORKSPACE</span>
        <nav className="main-nav">
          <NavItem to="/" icon={<SlidersHorizontal size={17} />} label="Overview" end />
          <NavItem to="/browse" icon={<Search size={17} />} label="Browse biomass" />
          <NavItem to="/orders" icon={<PackageCheck size={17} />} label="My orders" count={activeCount} />
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card"><span className="help-icon"><CircleHelp size={17} /></span><strong>Need a hand?</strong><p>Our sourcing team is here to help.</p><a href="mailto:support@agrirevive.in">Contact support <ArrowUpRight size={13} /></a></div>
          <NavItem to="/profile" icon={<Settings2 size={17} />} label="Profile settings" />
          <button className="nav-item logout-button" onClick={onLogout}><LogOut size={17} /> Sign out</button>
          <div className="user-mini"><span className="avatar">{buyer?.name.slice(0, 1).toUpperCase() || 'B'}</span><span><strong>{buyer?.name || 'Buyer'}</strong><small>{buyer?.email}</small></span><span className="online-dot" /></div>
        </div>
      </aside>
      {mobileOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <div className="main-column">
        <header className="topbar">
          <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
          <div className="crumb"><span>Buyer portal</span><span className="crumb-slash">/</span><strong>{pageTitle(location.pathname)}</strong></div>
          <div className="topbar-right"><span className="demo-pill"><span /> BUYER WORKSPACE</span><Link to="/orders" className="icon-button notification-button" aria-label="Notifications"><Bell size={18} />{activeCount > 0 && <i />}</Link><span className="topbar-divider" /><span className="avatar avatar-small">{buyer?.name.slice(0, 1).toUpperCase() || 'B'}</span></div>
        </header>
        <main className="page-content"><RoutesOutlet /></main>
        <footer className="footer"><span>© 2026 AgriRevive</span><span>Growing a circular future <Leaf size={12} /></span></footer>
      </div>
    </div>
  )
}

function pageTitle(path: string) {
  if (path.startsWith('/browse')) return 'Browse biomass'
  if (path.startsWith('/listings')) return 'Listing details'
  if (path.startsWith('/orders')) return 'My orders'
  if (path.startsWith('/profile')) return 'Profile settings'
  return 'Overview'
}

function NavItem({ to, icon, label, end, count }: { to: string; icon: ReactNode; label: string; end?: boolean; count?: number }) {
  return <NavLink to={to} end={end} className={({ isActive }) => `nav-item ${isActive ? 'nav-active' : ''}`}>{icon}<span>{label}</span>{count ? <small>{count}</small> : null}</NavLink>
}

function Dashboard({ buyer, listings, orders, bids }: { buyer: Buyer | null; listings: Listing[]; orders: BuyerOrder[]; bids: BidRecord[] }) {
  const activeOrders = orders.filter(order => order.status !== 'DELIVERED' && order.status !== 'REJECTED').length
  const totalTonnes = orders.reduce((sum, order) => sum + order.quantity, 0)
  const auctions = listings.filter(listing => listing.listingType === 'AUCTION')
  const firstName = buyer?.name.trim().split(/\s+/)[0] || 'there'
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="content-width">
      <section className="welcome-row">
        <div><span className="eyebrow">{today} <span className="eyebrow-dot" /> BUYER OVERVIEW</span><h1>{greeting}, {firstName}<span className="wave">✳</span></h1><p>Here's what's happening across your biomass sourcing.</p></div>
        <Link className="button button-primary" to="/browse"><Search size={16} /> Explore biomass <ArrowRight size={16} /></Link>
      </section>
      <section className="hero-banner">
        <div className="hero-copy"><span className="hero-kicker"><span /> SOURCING, MADE SIMPLE</span><h2>Turn agricultural residue<br />into your next resource.</h2><p>Discover traceable biomass, direct from verified farming communities.</p><Link to="/browse" className="hero-link">Find your next supply <ArrowRight size={16} /></Link></div>
        <div className="hero-art"><div className="sun-disc" /><div className="field field-back" /><div className="field field-front" /><div className="hero-plant plant-one">✳</div><div className="hero-plant plant-two">✳</div><div className="hero-art-caption">BETTER MATERIALS.<br />HEALTHIER SOIL.</div></div>
      </section>
      <section className="metric-grid">
        <MetricCard label="Open orders" value={String(activeOrders).padStart(2, '0')} detail={activeOrders ? `${activeOrders} order${activeOrders === 1 ? '' : 's'} in progress` : 'Ready when you are'} icon={<PackageCheck size={18} />} tint="lavender" />
        <MetricCard label="Biomass sourced" value={`${totalTonnes} t`} detail="Across all your orders" icon={<Sprout size={18} />} tint="mint" />
        <MetricCard label="Active bids" value={String(bids.length).padStart(2, '0')} detail="On live auctions" icon={<TrendingUp size={18} />} tint="peach" />
        <MetricCard label="Available listings" value={String(listings.length).padStart(2, '0')} detail="Verified & ready to source" icon={<ShieldCheck size={18} />} tint="cream" />
      </section>
      <section className="section-block">
        <div className="section-heading"><div><span className="eyebrow">HANDPICKED FOR YOU</span><h2>Popular this week</h2></div><Link to="/browse" className="subtle-link">See all listings <ArrowRight size={15} /></Link></div>
        <div className="listing-grid compact-listings">{listings.slice(0, 3).map(item => <ListingCard key={item.id} listing={item} />)}</div>
      </section>
      <section className="lower-grid">
        <div className="panel recent-panel"><div className="section-heading"><div><span className="eyebrow">KEEP THINGS MOVING</span><h2>Recent orders</h2></div><Link to="/orders" className="subtle-link">All orders <ArrowRight size={15} /></Link></div>
          {orders.length ? <OrderRows orders={orders.slice(0, 3)} listings={listings} /> : <div className="empty-inline"><span className="empty-icon"><PackageCheck size={19} /></span><div><strong>No orders yet</strong><p>Your purchase requests and order updates will show up here.</p></div><Link to="/browse">Browse listings <ArrowRight size={14} /></Link></div>}
        </div>
        <div className="panel auction-panel"><div className="section-heading"><div><span className="eyebrow">DON'T MISS OUT</span><h2>Live auctions</h2></div><span className="live-indicator"><i /> LIVE</span></div>
          <div className="auction-list">{auctions.map(item => <Link key={item.id} to={`/listings/${item.id}`} className="auction-row"><span className={`auction-thumb ${item.color}`} style={{ backgroundImage: `url("${item.image}")` }} /><span className="auction-info"><strong>{item.title}</strong><small>{item.bidCount ?? (item.highestBid ? 1 : 0)} bids · Ends soon</small></span><span className="auction-price"><strong>{currency(item.highestBid || item.price)}</strong><small>{item.highestBid ? 'current bid' : 'starting price'}</small></span><ArrowRight size={15} /></Link>)}</div>
        </div>
      </section>
    </div>
  )
}

function MetricCard({ label, value, detail, icon, tint }: { label: string; value: string; detail: string; icon: ReactNode; tint: string }) {
  return <article className="metric-card"><div className="metric-top"><span>{label}</span><span className={`metric-icon ${tint}`}>{icon}</span></div><strong className="metric-value">{value}</strong><span className="metric-detail">{detail}</span></article>
}

function BrowsePage({ listings }: { listings: Listing[] }) {
  const [params, setParams] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)
  const searchInput = useRef<HTMLInputElement>(null)
  const search = params.get('q') || ''
  const type = params.get('type') || ''
  const state = params.get('state') || ''
  const district = params.get('district') || ''
  const minPrice = params.get('minPrice') || ''
  const maxPrice = params.get('maxPrice') || ''
  const minQuantity = params.get('minQuantity') || ''
  const grade = params.get('grade') || ''
  const sort = params.get('sort') || 'recommended'
  const filtered = useMemo(() => {
    const result = listings.filter(item => {
      const queryMatch = `${item.title} ${item.type} ${item.location}`.toLowerCase().includes(search.toLowerCase())
      const itemDistrict = item.location.split(',')[0].trim().toLowerCase()
      const districtMatch = !district || itemDistrict.includes(district.toLowerCase())
      const minPriceMatch = !minPrice || item.price >= Number(minPrice)
      const maxPriceMatch = !maxPrice || item.price <= Number(maxPrice)
      const quantityMatch = !minQuantity || item.quantity >= Number(minQuantity)
      return queryMatch && districtMatch && minPriceMatch && maxPriceMatch && quantityMatch &&
        (!type || item.type === type) && (!state || item.state === state) && (!grade || item.grade === grade)
    })
    if (sort === 'price-low') result.sort((a, b) => a.price - b.price)
    if (sort === 'price-high') result.sort((a, b) => b.price - a.price)
    if (sort === 'quantity') result.sort((a, b) => b.quantity - a.quantity)
    return result
  }, [district, grade, listings, maxPrice, minPrice, minQuantity, search, sort, state, type])
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    value ? next.set(key, value) : next.delete(key)
    setParams(next, { replace: true })
  }
  const clear = () => setParams({})
  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchInput.current?.focus()
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])
  return <div className="content-width">
    <div className="page-heading browse-heading"><div><span className="eyebrow">THE MARKETPLACE</span><h1>Browse biomass</h1><p>Quality-verified crop residue, sourced straight from the farm.</p></div><div className="verified-note"><ShieldCheck size={16} /><span>Every supplier is verified</span></div></div>
    <div className="browse-toolbar"><div className="search-box"><Search size={17} /><input ref={searchInput} value={search} onChange={e => update('q', e.target.value)} placeholder="Search residue, location..." aria-label="Search residue and location" />{search && <button onClick={() => update('q', '')} aria-label="Clear search"><X size={15} /></button>}<kbd>⌘ K</kbd></div><button className={`filter-toggle ${showFilters ? 'filter-on' : ''}`} onClick={() => setShowFilters(!showFilters)}><Filter size={16} /> Filters <span className="filter-count">{[type, state, district, minPrice, maxPrice, minQuantity, grade].filter(Boolean).length}</span></button><label className="sort-control"><ArrowDownUp size={15} /><span>Sort:</span><select value={sort} onChange={e => update('sort', e.target.value)}><option value="recommended">Recommended</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="quantity">Most available</option></select></label></div>
    {showFilters && <div className="filter-panel"><label>Residue type<select value={type} onChange={e => update('type', e.target.value)}><option value="">All residue types</option>{[...new Set(listings.map(item => item.type))].map(option => <option key={option}>{option}</option>)}</select></label><label>State<select value={state} onChange={e => update('state', e.target.value)}><option value="">All states</option>{[...new Set(listings.map(item => item.state))].map(option => <option key={option}>{option}</option>)}</select></label><label>District<input value={district} onChange={e => update('district', e.target.value)} placeholder="e.g. Ludhiana" /></label><label>Minimum price / tonne<input type="number" min="0" value={minPrice} onChange={e => update('minPrice', e.target.value)} placeholder="₹ min" /></label><label>Maximum price / tonne<input type="number" min="0" value={maxPrice} onChange={e => update('maxPrice', e.target.value)} placeholder="₹ max" /></label><label>Minimum quantity<input type="number" min="0" value={minQuantity} onChange={e => update('minQuantity', e.target.value)} placeholder="Tonnes" /></label><label>Grade<select value={grade} onChange={e => update('grade', e.target.value)}><option value="">Any grade</option><option value="A">Grade A</option><option value="B">Grade B</option><option value="C">Grade C</option></select></label><button className="text-button clear-filters" onClick={clear}>Clear all</button></div>}
    <div className="results-meta"><span><strong>{filtered.length} listings</strong> <span>available for sourcing</span></span><span className="results-tag"><span /> ACTIVE MARKET</span></div>
    {filtered.length ? <div className="listing-grid">{filtered.map(item => <ListingCard key={item.id} listing={item} />)}</div> : <div className="empty-state"><span className="empty-icon large"><Search size={22} /></span><h3>No biomass found</h3><p>Try a different search or clear the filters to see all available listings.</p><button className="button button-outline" onClick={clear}>Clear filters</button></div>}
    <div className="marketplace-footnote"><ShieldCheck size={15} /><span>Listings are reviewed for quality and authenticity before appearing on AgriRevive.</span></div>
  </div>
}

function ListingCard({ listing }: { listing: Listing }) {
  return <article className="listing-card">
    <Link to={`/listings/${listing.id}`} className={`listing-image ${listing.color}`} style={{ backgroundImage: `linear-gradient(180deg, rgba(18,31,22,0) 50%, rgba(18,31,22,.35) 100%), url("${listing.image}")` }} aria-label={`View ${listing.title}`}>
      <span className="grade-chip"><span className="grade-dot" /> Grade {listing.grade}</span>
      {listing.listingType === 'AUCTION' && <span className="auction-chip"><span /> LIVE AUCTION</span>}
      <span className="image-location"><span className="pin-dot">⌖</span> {listing.location}</span>
    </Link>
    <div className="listing-card-body">
      <div className="listing-type">{listing.type.toUpperCase()} <span>·</span> {listing.moisture}% MOISTURE</div>
      <Link to={`/listings/${listing.id}`} className="listing-title">{listing.title}</Link>
      <div className="listing-meta"><span><strong>{listing.quantity} t</strong> available</span><span className="meta-divider" /><span>Ready {(listing.available || 'now').split(',')[0]}</span></div>
      <div className="listing-card-footer"><div><strong>{currency(listing.listingType === 'AUCTION' ? listing.highestBid || listing.price : listing.price)}</strong><small>{listing.listingType === 'AUCTION' ? (listing.highestBid ? 'current bid' : 'starting bid') : 'per tonne'}</small></div><Link to={`/listings/${listing.id}`} className="round-arrow" aria-label={`View ${listing.title}`}><ArrowUpRight size={17} /></Link></div>
    </div>
  </article>
}

function ListingDetail({
  buyer,
  listings,
  setListings,
  setOrders,
  bids,
  setBids,
}: {
  buyer: Buyer | null
  listings: Listing[]
  setListings: Dispatch<SetStateAction<Listing[]>>
  setOrders: Dispatch<SetStateAction<BuyerOrder[]>>
  bids: BidRecord[]
  setBids: Dispatch<SetStateAction<BidRecord[]>>
}) {
  const { id = '' } = useParams()
  const listing = listings.find(item => item.id === id)
  const navigate = useNavigate()
  const [quantity, setQuantity] = useState(1)
  const [bid, setBid] = useState('')
  const [notice, setNotice] = useState('')
  const [submittingOrder, setSubmittingOrder] = useState(false)
  const stompRef = useRef<Client | null>(null)

  const userBids = bids.filter(item => item.listingId === id).sort((a, b) => b.date.localeCompare(a.date))
  const latestBidRef = useRef(0)
  latestBidRef.current = Math.max(listing?.highestBid ?? 0, ...userBids.map(item => item.amount))

  // Connect STOMP over SockJS for real-time live auction bidding
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token || !listing || listing.listingType !== 'AUCTION') return

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/bids/${id}`, frame => {
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
              setBids(old => {
                if (old.some(b => b.listingId === id && b.amount === amount)) return old
                return [{ listingId: id, amount, date: new Date().toISOString(), bidderName: payload.bidderName }, ...old]
              })
            }
          } catch {
            // ignore malformed frame
          }
        })
      },
    })
    client.activate()
    stompRef.current = client
    return () => {
      stompRef.current = null
      client.deactivate()
    }
  }, [id, listing?.listingType, setBids, setListings])

  if (!listing) return <div className="empty-state"><h3>Listing not found</h3><Link to="/browse" className="button button-outline">Back to browse</Link></div>

  const hasAnyBids = Boolean(listing.highestBid || userBids.length > 0)
  const currentBid = Math.max(listing.highestBid || listing.price, ...userBids.map(item => item.amount))
  const minNextBid = hasAnyBids ? currentBid + 50 : listing.price

  const placeOrder = async (event: FormEvent) => {
    event.preventDefault()
    if (submittingOrder) return
    setSubmittingOrder(true)
    setNotice('')
    try {
      const res = await api.post('/orders/biomass', {
        listingId: Number(id),
        quantity,
        offeredPrice: listing.price,
        deliveryAddress: buyer?.organization || buyer?.state || 'Buyer Facility',
        buyerNote: `Order for ${listing.title}`,
      })
      const saved = mapOrder(res.data)
      const order: BuyerOrder = {
        ...saved,
        title: listing.title,
        location: listing.location,
        farmerEmail: listing.farmerEmail || saved.farmerEmail,
        buyerName: buyer?.name || saved.buyerName,
        buyerOrganization: buyer?.organization || saved.buyerOrganization,
        source: 'PURCHASE_REQUEST',
      }
      setOrders(old => [order, ...old])
      setListings(old =>
        old.map(item =>
          item.id === listing.id
            ? {
                ...item,
                quantity: Math.max(0, Number((item.quantity - quantity).toFixed(2))),
                status: item.quantity - quantity <= 0 ? 'SOLD_OUT' : item.status,
              }
            : item,
        ),
      )
      navigate('/orders')
    } catch (err: any) {
      setNotice(err?.response?.data?.message || 'Could not place order. Please check available quantity and try again.')
    } finally {
      setSubmittingOrder(false)
    }
  }

  const placeBid = (event: FormEvent) => {
    event.preventDefault()
    const amount = Number(bid)
    if (!amount || amount < minNextBid) {
      setNotice(`Enter at least ${currency(minNextBid)}.`)
      return
    }

    if (!stompRef.current?.connected) {
      setNotice('The live bidding connection is not ready yet. Please wait a moment and try again.')
      return
    }

    // The server broadcasts every accepted bid on /topic/bids/{id}; the subscription above
    // updates the listing and bid list, so we don't update optimistically (avoids double counting).
    stompRef.current.publish({
      destination: '/app/bid',
      body: JSON.stringify({ listingId: Number(id), amount }),
    })
    setNotice('Your bid was sent. Waiting for the server to confirm…')
    setBid('')
    window.setTimeout(() => {
      if (latestBidRef.current >= amount) {
        setNotice('Your bid was accepted and is now the highest bid.')
      } else {
        setNotice('Bid not accepted. It must be higher than the current highest bid, the auction must still be live, and you cannot bid on your own listing.')
      }
    }, 1800)
  }

  return <div className="content-width detail-page">
    <Link to="/browse" className="back-link"><ArrowLeft size={15} /> Back to browse</Link>
    <div className="detail-title-row"><div><div className="detail-kicker">{listing.type.toUpperCase()} <span>·</span> LISTING #{listing.id.toUpperCase()}</div><h1>{listing.title}</h1><p className="detail-location"><span className="pin-dot">⌖</span> {listing.location} <span className="location-divider">·</span> Available from {listing.available}</p></div><span className="verified-badge"><ShieldCheck size={15} /> VERIFIED LISTING</span></div>
    <div className="detail-layout">
      <div className="detail-main">
        <div className={`detail-image ${listing.color}`} style={{ backgroundImage: `linear-gradient(180deg, transparent 55%, rgba(13,29,19,.3)), url("${listing.image}")` }}><span className="grade-chip"><span className="grade-dot" /> Grade {listing.grade} quality</span>{listing.listingType === 'AUCTION' && <span className="auction-chip"><span /> LIVE AUCTION</span>}</div>
        <div className="detail-facts"><Fact icon={<PackageCheck size={17} />} label="Available quantity" value={`${listing.quantity} tonnes`} /><Fact icon={<Sprout size={17} />} label="Quality grade" value={`Grade ${listing.grade}`} /><Fact icon={<Clock3 size={17} />} label="Moisture level" value={`${listing.moisture}%`} /><Fact icon={<ShieldCheck size={17} />} label="Supplier status" value="AI Verified" /></div>
        <section className="detail-description"><span className="eyebrow">ABOUT THIS LISTING</span><h2>Farm-fresh. Ready for your supply chain.</h2><p>{listing.description}</p></section>
        <section className="supplier-card"><div className="supplier-avatar"><Sprout size={21} /></div><div><span className="eyebrow">SUPPLIED BY</span><strong>{listing.farmerName || 'Verified farming partner'}</strong><small>{listing.location} · Verified AgriRevive supplier</small></div><span className="supplier-rating"><ShieldCheck size={14} /> Verified</span></section>
      </div>
      <aside className="purchase-card">
        {listing.listingType === 'AUCTION' ? <>
          <div className="purchase-topline"><span className="auction-chip inline-chip"><span /> LIVE AUCTION</span><span className="ends-in">{listing.auctionEnds ? `Ends ${new Date(listing.auctionEnds).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}` : 'Ends soon'}</span></div>
          <div className="current-bid-label">{hasAnyBids ? 'CURRENT HIGHEST BID' : 'STARTING BID'}</div><div className="current-bid-value">{currency(currentBid)}<small> / tonne</small></div>
          <div className="bid-context"><span><TrendingUp size={14} /> {Math.max(listing.bidCount ?? 0, userBids.length)} bids placed</span><span>{listing.quantity} t in lot</span></div>
          <div className="card-rule" />
          <form onSubmit={placeBid} className="bid-form"><label htmlFor="bid-amount">Your bid <span>Min. {currency(minNextBid)}</span></label><div className="money-input"><span>₹</span><input id="bid-amount" type="number" min={minNextBid} step="1" required value={bid} onChange={e => setBid(e.target.value)} placeholder="Enter amount per tonne" /></div><button className="button button-primary button-full">Place your bid <ArrowRight size={16} /></button></form>
          {notice && <p className={`notice ${notice.startsWith('Your') ? 'notice-success' : ''}`}>{notice}</p>}
          <div className="your-bid-list">{userBids.length > 0 && <><span className="eyebrow">RECENT BIDS</span>{userBids.slice(0, 3).map((item, index) => <div className="your-bid-row" key={`${item.date}-${index}`}><span>{currency(item.amount)} / t</span><small>{item.bidderName ? `${item.bidderName} · ` : ''}{new Date(item.date).toLocaleDateString('en-IN')}</small></div>)}</>}</div>
          <div className="secure-note"><ShieldCheck size={14} /> No payment is taken until you win the auction.</div>
        </> : <>
          <span className="eyebrow">LISTED PRICE</span><div className="fixed-price">{currency(listing.price)}<small> / tonne</small></div>
          <div className="fixed-subline"><span><Check size={14} /> Price set by the farmer</span></div>
          <div className="card-rule" />
          <form onSubmit={placeOrder} className="bid-form">
            <label htmlFor="order-quantity">Quantity <span>Max. {listing.quantity} t</span></label>
            <div className="quantity-control"><button type="button" aria-label="Decrease quantity" onClick={() => setQuantity(Math.max(0.5, Number((quantity - 1).toFixed(2))))}>−</button><input id="order-quantity" type="number" min="0.1" max={listing.quantity} step="0.1" value={quantity} onChange={e => setQuantity(Number(e.target.value))} /><span>tonnes</span><button type="button" aria-label="Increase quantity" onClick={() => setQuantity(Math.min(listing.quantity, Number((quantity + 1).toFixed(2))))}>+</button></div>
            <div className="estimate-line"><span>Estimated total</span><strong>{currency(quantity * listing.price)}</strong></div>
            <button className="button button-primary button-full" disabled={submittingOrder || !(quantity > 0) || quantity > listing.quantity}>
              {submittingOrder ? 'Sending request…' : 'Send purchase request'} <ArrowRight size={16} />
            </button>
          </form>
          <p className="estimate-note">The farmer will confirm availability before payment.</p>
          {notice && <p className="notice">{notice}</p>}
        </>}
        <div className="card-rule" />
        <div className="purchase-help"><span className="purchase-help-icon"><CircleHelp size={15} /></span><span><strong>Need help sourcing?</strong><small>Our team can help with bulk orders.</small></span><a href="mailto:support@agrirevive.in" aria-label="Email sourcing team"><ArrowUpRight size={16} /></a></div>
      </aside>
    </div>
  </div>
}

function Fact({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="fact"><span className="fact-icon">{icon}</span><span><small>{label}</small><strong>{value}</strong></span></div>
}

function OrdersPage({ orders, setOrders, listings, bids }: { orders: BuyerOrder[]; setOrders: Dispatch<SetStateAction<BuyerOrder[]>>; listings: Listing[]; bids: BidRecord[] }) {
  const [tab, setTab] = useState('All orders')
  const [payingId, setPayingId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const filtered = orders.filter(order => tab === 'All orders' || (tab === 'Needs attention' ? order.status === 'ACCEPTED' : order.status === 'PAID' || order.status === 'IN_TRANSIT' || order.status === 'DELIVERED'))

  const updateStatus = async (id: string, newStatus: OrderStatus) => {
    setPayingId(id)
    setNotice(null)
    try {
      await api.patch(`/orders/${id}/status?status=${newStatus}`)
      setOrders(old => old.map(order => order.id === id ? { ...order, status: newStatus } : order))
    } catch {
      setNotice('Could not update order status. Please check your connection and try again.')
    } finally {
      setPayingId(null)
    }
  }

  const statusLabel = (status: OrderStatus) =>
    ({
      REQUESTED: 'Awaiting farmer',
      ACCEPTED: 'Payment due',
      PAID: 'Payment held',
      IN_TRANSIT: 'In transit',
      DELIVERED: 'Delivered',
      REJECTED: 'Declined',
    })[status] || status

  return <div className="content-width">
    <div className="page-heading"><div><span className="eyebrow">YOUR SOURCING ACTIVITY</span><h1>My orders</h1><p>Track purchase requests, payments and delivery in one place.</p></div>{orders.length > 0 && <Link to="/browse" className="button button-outline"><Search size={16} /> Find more biomass</Link>}</div>
    <div className="order-summary-strip"><div><span className="order-summary-icon"><PackageCheck size={18} /></span><span><strong>{orders.length} total orders</strong><small>All sourcing activity</small></span></div><div><span className="order-summary-icon paid"><ShieldCheck size={18} /></span><span><strong>{currency(orders.filter(order => order.status !== 'REQUESTED' && order.status !== 'REJECTED').reduce((sum, order) => sum + order.total, 0))}</strong><small>Order value in progress</small></span></div><div><span className="order-summary-icon">{bids.length ? <TrendingUp size={18} /> : <Clock3 size={18} />}</span><span><strong>{bids.length} active bids</strong><small>Across live auctions</small></span></div></div>
    {notice && <p className="form-error" role="alert">{notice}</p>}
    <div className="order-tabs">{['All orders', 'Needs attention', 'In progress & complete'].map(item => <button key={item} onClick={() => setTab(item)} className={tab === item ? 'order-tab active-tab' : 'order-tab'}>{item}<span>{item === 'All orders' ? orders.length : item === 'Needs attention' ? orders.filter(order => order.status === 'ACCEPTED').length : orders.filter(order => ['PAID', 'IN_TRANSIT', 'DELIVERED'].includes(order.status)).length}</span></button>)}</div>
    {filtered.length ? <div className="orders-table-wrap"><table className="orders-table"><thead><tr><th>ORDER</th><th>BIOMASS</th><th>QUANTITY</th><th>ORDER VALUE</th><th>PAYMENT / STATUS</th><th>NEXT STEP</th><th /></tr></thead><tbody>{filtered.map(order => {
      const matchedListing = listings.find(item => item.id === order.listingId)
      const displayTitle = (order.title && order.title !== 'Biomass Order') ? order.title : (matchedListing?.title || 'Biomass Order')
      return (
        <tr key={order.id}>
          <td><strong className="order-id">#{order.id}</strong><small>{new Date(order.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</small></td>
          <td><div className="order-product"><span className={`order-product-img ${matchedListing?.color || 'sage'}`} style={{ backgroundImage: `url("${matchedListing?.image || ''}")` }} /><span><strong>{displayTitle}</strong><small>{order.location || matchedListing?.location}</small></span></div></td>
          <td>{order.quantity} t</td>
          <td><strong>{currency(order.total)}</strong><small>{order.status === 'REQUESTED' || order.status === 'REJECTED' ? 'Payment not due' : order.status === 'ACCEPTED' ? 'Payment due' : order.status === 'DELIVERED' ? 'Payment released' : 'Payment held securely'}</small></td>
          <td><StatusPill status={statusLabel(order.status)} /></td>
          <td>
            {order.status === 'ACCEPTED' ? (
              <button className="table-action" onClick={() => updateStatus(order.id, 'PAID')} disabled={payingId === order.id}>
                {payingId === order.id ? 'Processing…' : 'Pay now'} <ArrowRight size={13} />
              </button>
            ) : order.status === 'IN_TRANSIT' ? (
              <button className="table-action" onClick={() => updateStatus(order.id, 'DELIVERED')} disabled={payingId === order.id}>
                {payingId === order.id ? 'Updating…' : 'Confirm delivery'} <Check size={13} />
              </button>
            ) : order.status === 'REJECTED' ? (
              <span className="next-step" title={order.rejectionReason}>{order.rejectionReason ? `Farmer: ${order.rejectionReason.slice(0, 28)}${order.rejectionReason.length > 28 ? '…' : ''}` : 'Request declined'}</span>
            ) : order.status === 'REQUESTED' ? (
              <span className="next-step">Waiting for the farmer</span>
            ) : (
              <span className="next-step">{order.status === 'PAID' ? 'Pickup to be scheduled' : 'Order complete'}</span>
            )}
          </td>
          <td><Link className="icon-button row-more" to={`/listings/${order.listingId}`} aria-label={`View ${displayTitle} listing`} title="View listing"><ArrowUpRight size={16} /></Link></td>
        </tr>
      )
    })}</tbody></table></div> : <div className="empty-state"><span className="empty-icon large"><PackageCheck size={22} /></span><h3>{orders.length ? 'Nothing in this view' : 'Your supply story starts here'}</h3><p>{orders.length ? 'There are no orders in this category yet.' : 'When you request biomass or bid on an auction, your orders and payment status will appear here.'}</p><Link to="/browse" className="button button-primary"><Search size={16} /> Browse biomass</Link></div>}
    <div className="payment-explainer"><span className="payment-shield"><ShieldCheck size={19} /></span><div><strong>Your payment is protected</strong><p>Payments are held securely until delivery is confirmed. You stay in control at every step.</p></div><span className="escrow-tag">BUYER PROTECTION</span></div>
  </div>
}

function StatusPill({ status }: { status: string }) {
  const tone = status === 'Awaiting farmer' ? 'status-waiting' : status === 'Payment due' || status === 'Declined' ? 'status-due' : status === 'Delivered' ? 'status-done' : 'status-progress'
  return <span className={`status-pill ${tone}`}><i />{status}</span>
}

function OrderRows({ orders, listings }: { orders: BuyerOrder[]; listings: Listing[] }) {
  return <div className="recent-rows">{orders.map(order => {
    const matched = listings.find(l => l.id === order.listingId)
    const displayTitle = (order.title && order.title !== 'Biomass Order') ? order.title : (matched?.title || 'Biomass Order')
    return (
      <div className="recent-row" key={order.id}>
        <span className="recent-order-icon"><PackageCheck size={15} /></span>
        <span className="recent-product"><strong>{displayTitle}</strong><small>#{order.id} · {order.quantity} tonnes</small></span>
        <StatusPill status={order.status === 'REQUESTED' ? 'Awaiting farmer' : order.status === 'ACCEPTED' ? 'Payment due' : order.status === 'DELIVERED' ? 'Delivered' : order.status === 'REJECTED' ? 'Declined' : 'Payment held'} />
        <strong className="recent-value">{currency(order.total)}</strong>
      </div>
    )
  })}</div>
}

function ProfilePage({ buyer, setBuyer }: { buyer: Buyer | null; setBuyer: (buyer: Buyer | null) => void }) {
  const [form, setForm] = useState<Buyer>(buyer || { name: '', email: '', organization: '', phone: '', state: '' })
  const [saved, setSaved] = useState(false)
  const update = (field: keyof Buyer, value: string) => { setForm(current => ({ ...current, [field]: value })); setSaved(false) }
  const save = (event: FormEvent) => {
    event.preventDefault()
    setBuyer(form)
    localStorage.setItem('agri-buyer-profile', JSON.stringify(form))
    setSaved(true)
  }
  return <div className="content-width profile-page">
    <div className="page-heading"><div><span className="eyebrow">YOUR ACCOUNT</span><h1>Profile settings</h1><p>Keep your buyer details up to date for smoother sourcing.</p></div></div>
    <div className="profile-layout"><aside className="profile-menu"><div className="profile-avatar">{form.name.slice(0, 1).toUpperCase() || 'B'}</div><strong>{form.name || 'Buyer profile'}</strong><span>{form.organization || 'Industry organization'}</span><div className="profile-menu-rule" /><div className="profile-menu-item selected"><Settings2 size={16} /> Personal information</div><div className="profile-menu-item"><ShieldCheck size={16} /> Account security <span className="coming-soon">SOON</span></div><div className="profile-menu-note">Your information is only shared with farmers when you place an order.</div></aside>
      <form onSubmit={save} className="profile-form panel"><div className="profile-form-heading"><div><h2>Business profile</h2><p>This helps farmers know who they're working with.</p></div><span className="profile-status"><i /> ACTIVE ACCOUNT</span></div>
        <div className="profile-fields"><label>Full name<input required value={form.name} onChange={e => update('name', e.target.value)} /></label><label>Work email<input type="email" value={form.email} readOnly className="readonly-field" /><small>Email is linked to your sign-in.</small></label><label>Organization name<input required value={form.organization} onChange={e => update('organization', e.target.value)} placeholder="Company or organization" /></label><label>Phone number<input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+91 98765 43210" /></label><label className="field-wide">Business location<select value={form.state} onChange={e => update('state', e.target.value)}><option value="">Select your state</option>{INDIAN_STATES.map(state => <option key={state}>{state}</option>)}</select></label></div>
        <div className="profile-form-footer"><span>{saved && <><Check size={15} /> Changes saved.</>}</span><button className="button button-primary">Save changes <ArrowRight size={15} /></button></div>
      </form>
    </div>
  </div>
}
