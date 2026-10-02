import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import {
  ArrowDownUp, ArrowLeft, ArrowRight, ArrowUpRight, Bell, Check, ChevronDown,
  CircleHelp, Clock3, Factory, Filter, Leaf, LogOut, Menu, PackageCheck,
  Search, Settings2, ShieldCheck, SlidersHorizontal, Sprout, TrendingUp, X,
} from 'lucide-react'
import {
  Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate, useParams,
  useSearchParams,
} from 'react-router-dom'

type Listing = {
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
}
type Buyer = { name: string; email: string; organization: string; phone: string; state: string }
type BuyerOrder = {
  id: string
  listingId: string
  title: string
  location: string
  quantity: number
  total: number
  status: 'REQUESTED' | 'ACCEPTED' | 'PAID' | 'IN_TRANSIT' | 'DELIVERED'
  date: string
}
type BidRecord = { listingId: string; amount: number; date: string }

const initialListings: Listing[] = [
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

const currency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)

function readStored<T>(key: string, fallback: T): T {
  const value = localStorage.getItem(key)
  return value ? (JSON.parse(value) as T) : fallback
}

function useStoredState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => readStored(key, initial))
  useEffect(() => localStorage.setItem(key, JSON.stringify(value)), [key, value])
  return [value, setValue] as const
}

export default function App() {
  const [buyer, setBuyer] = useStoredState<Buyer | null>('agri-buyer', null)
  const [listings] = useStoredState<Listing[]>('agri-listings', initialListings)
  const [orders, setOrders] = useStoredState<BuyerOrder[]>('agri-orders', [])
  const [bids, setBids] = useStoredState<BidRecord[]>('agri-bids', [])
  return (
    <Routes>
      <Route path="/login" element={buyer ? <Navigate to="/" replace /> : <AuthPage onAuth={setBuyer} />} />
      <Route path="/register" element={buyer ? <Navigate to="/" replace /> : <AuthPage register onAuth={setBuyer} />} />
      <Route element={buyer ? <MarketplaceLayout buyer={buyer} onLogout={() => setBuyer(null)} /> : <Navigate to="/login" replace />}>
        <Route index element={<Dashboard buyer={buyer} listings={listings} orders={orders} bids={bids} />} />
        <Route path="browse" element={<BrowsePage listings={listings} />} />
        <Route path="listings/:id" element={<ListingDetail listings={listings} setOrders={setOrders} bids={bids} setBids={setBids} />} />
        <Route path="orders" element={<OrdersPage orders={orders} setOrders={setOrders} listings={listings} bids={bids} />} />
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
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!email.includes('@') || password.length < 6) {
      setError('Enter a valid email and a password with at least 6 characters.')
      return
    }
    if (register && (!name.trim() || !organization.trim())) {
      setError('Add your name and organization to create a buyer account.')
      return
    }
    const stored = readStored<Buyer | null>('agri-buyer-profile', null)
    const buyer: Buyer = register
      ? { name: name.trim(), email, organization: organization.trim(), phone: '', state: '' }
      : stored?.email === email
        ? stored
        : { name: email.split('@')[0].replace(/[._-]/g, ' '), email, organization: 'Industry buyer', phone: '', state: '' }
    localStorage.setItem('agri-buyer-profile', JSON.stringify(buyer))
    onAuth(buyer)
    navigate('/')
  }
  return (
    <main className="auth-page">
      <div className="auth-brand"><Brand /></div>
      <div className="auth-layout">
        <section className="auth-story">
          <span className="eyebrow light"><Sprout size={15} /> A better way to source</span>
          <h1>Good for your business.<br /><em>Better for the earth.</em></h1>
          <p>Build a resilient supply chain with quality-verified agricultural biomass, sourced directly from farming communities.</p>
          <div className="auth-proof"><span><strong>1,200+</strong> verified suppliers</span><span><strong>18</strong> states covered</span></div>
          <div className="story-orbit orbit-one" /><div className="story-orbit orbit-two" />
        </section>
        <section className="auth-card">
          <div className="auth-card-heading">
            <span className="eyebrow">INDUSTRY BUYER PORTAL</span>
            <h2>{register ? 'Create your account' : 'Welcome back'}</h2>
            <p>{register ? 'Join a more circular supply chain.' : 'Sign in to your AgriRevive workspace.'}</p>
          </div>
          <form onSubmit={submit} className="stack-form">
            {register && <>
              <label>Full name<input required value={name} onChange={e => setName(e.target.value)} placeholder="Your name" autoComplete="name" /></label>
              <label>Organization<input required value={organization} onChange={e => setOrganization(e.target.value)} placeholder="Company or organization" /></label>
            </>}
            <label>Work email<input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" autoComplete="email" /></label>
            <label>Password<input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" autoComplete={register ? 'new-password' : 'current-password'} /></label>
            {error && <p className="form-error">{error}</p>}
            {!register && <div className="form-meta"><label className="check-label"><input type="checkbox" /> Remember me</label><button type="button" className="text-button" onClick={() => setError('For this demo, use any valid email and a password with 6+ characters.')}>Forgot password?</button></div>}
            <button className="button button-primary button-full" type="submit">{register ? 'Create buyer account' : 'Sign in'} <ArrowRight size={17} /></button>
          </form>
          <p className="auth-switch">{register ? 'Already have an account?' : 'New to AgriRevive?'} <Link to={register ? '/login' : '/register'}>{register ? 'Sign in' : 'Create an account'}</Link></p>
          <p className="demo-note"><ShieldCheck size={14} /> Demo account is stored locally in this browser.</p>
        </section>
      </div>
    </main>
  )
}

function Brand() {
  return <Link to="/" className="brand"><span className="brand-mark"><Leaf size={20} fill="currentColor" /></span><span>agri<span>revive</span></span></Link>
}

function MarketplaceLayout({ buyer, onLogout }: { buyer: Buyer | null; onLogout: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  useEffect(() => setMobileOpen(false), [location.pathname])
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-top"><Brand /><button className="icon-button mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={18} /></button></div>
        <div className="workspace-switch"><span className="workspace-icon"><Factory size={17} /></span><span><strong>{buyer?.organization || 'Industry buyer'}</strong><small>Buyer workspace</small></span><ChevronDown size={15} /></div>
        <span className="nav-section-title">WORKSPACE</span>
        <nav className="main-nav">
          <NavItem to="/" icon={<SlidersHorizontal size={17} />} label="Overview" end />
          <NavItem to="/browse" icon={<Search size={17} />} label="Browse biomass" />
          <NavItem to="/orders" icon={<PackageCheck size={17} />} label="My orders" count={0} />
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
          <div className="topbar-right"><span className="demo-pill"><span /> DEMO WORKSPACE</span><button className="icon-button notification-button" aria-label="Notifications"><Bell size={18} /><i /></button><span className="topbar-divider" /><span className="avatar avatar-small">{buyer?.name.slice(0, 1).toUpperCase() || 'B'}</span></div>
        </header>
        <main className="page-content"><RoutesOutlet /></main>
        <footer className="footer"><span>© 2026 AgriRevive</span><span>Growing a circular future <Leaf size={12} /></span></footer>
      </div>
    </div>
  )
}

import { Outlet as RoutesOutlet } from 'react-router-dom'

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
  const activeOrders = orders.filter(order => order.status !== 'DELIVERED').length
  const totalTonnes = orders.reduce((sum, order) => sum + order.quantity, 0)
  const auctions = listings.filter(listing => listing.listingType === 'AUCTION')
  const firstName = buyer?.name.trim().split(/\s+/)[0] || 'there'
  return (
    <div className="content-width">
      <section className="welcome-row">
        <div><span className="eyebrow">THURSDAY, OCTOBER 2, 2026 <span className="eyebrow-dot" /> BUYER OVERVIEW</span><h1>Good morning, {firstName}<span className="wave">✳</span></h1><p>Here's what's happening across your biomass sourcing.</p></div>
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
          {orders.length ? <OrderRows orders={orders.slice(0, 3)} /> : <div className="empty-inline"><span className="empty-icon"><PackageCheck size={19} /></span><div><strong>No orders yet</strong><p>Your purchase requests and order updates will show up here.</p></div><Link to="/browse">Browse listings <ArrowRight size={14} /></Link></div>}
        </div>
        <div className="panel auction-panel"><div className="section-heading"><div><span className="eyebrow">DON'T MISS OUT</span><h2>Live auctions</h2></div><span className="live-indicator"><i /> LIVE</span></div>
          <div className="auction-list">{auctions.map(item => <Link key={item.id} to={`/listings/${item.id}`} className="auction-row"><span className={`auction-thumb ${item.color}`} style={{ backgroundImage: `url("${item.image}")` }} /><span className="auction-info"><strong>{item.title}</strong><small>{item.bidCount ?? 0} bids · Ends soon</small></span><span className="auction-price"><strong>{currency(item.highestBid || item.price)}</strong><small>current bid</small></span><ArrowRight size={15} /></Link>)}</div>
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
      <div className="listing-meta"><span><strong>{listing.quantity} t</strong> available</span><span className="meta-divider" /><span>Ready {listing.available.split(',')[0]}</span></div>
      <div className="listing-card-footer"><div><strong>{currency(listing.listingType === 'AUCTION' ? listing.highestBid || listing.price : listing.price)}</strong><small>{listing.listingType === 'AUCTION' ? 'current bid' : 'per tonne'}</small></div><Link to={`/listings/${listing.id}`} className="round-arrow" aria-label={`View ${listing.title}`}><ArrowUpRight size={17} /></Link></div>
    </div>
  </article>
}

function ListingDetail({ listings, setOrders, bids, setBids }: { listings: Listing[]; setOrders: (orders: BuyerOrder[] | ((old: BuyerOrder[]) => BuyerOrder[])) => void; bids: BidRecord[]; setBids: (bids: BidRecord[] | ((old: BidRecord[]) => BidRecord[])) => void }) {
  const { id = '' } = useParams()
  const listing = listings.find(item => item.id === id)
  const navigate = useNavigate()
  const [quantity, setQuantity] = useState(5)
  const [bid, setBid] = useState('')
  const [notice, setNotice] = useState('')
  const userBids = bids.filter(item => item.listingId === id).sort((a, b) => b.date.localeCompare(a.date))
  if (!listing) return <div className="empty-state"><h3>Listing not found</h3><Link to="/browse" className="button button-outline">Back to browse</Link></div>
  const currentBid = Math.max(listing.highestBid || listing.price, ...userBids.map(item => item.amount))
  const placeOrder = (event: FormEvent) => {
    event.preventDefault()
    const order: BuyerOrder = { id: `AR-${Date.now().toString().slice(-6)}`, listingId: id, title: listing.title, location: listing.location, quantity, total: quantity * listing.price, status: 'REQUESTED', date: new Date().toISOString() }
    setOrders(old => [order, ...old])
    navigate('/orders')
  }
  const placeBid = (event: FormEvent) => {
    event.preventDefault()
    const amount = Number(bid)
    if (!amount || amount < currentBid + 50) {
      setNotice(`Enter at least ${currency(currentBid + 50)}. Bids must be at least ₹50 above the current bid.`)
      return
    }
    setBids(old => [{ listingId: id, amount, date: new Date().toISOString() }, ...old])
    setNotice('Your bid has been placed and saved in this demo workspace.')
    setBid('')
  }
  return <div className="content-width detail-page">
    <Link to="/browse" className="back-link"><ArrowLeft size={15} /> Back to browse</Link>
    <div className="detail-title-row"><div><div className="detail-kicker">{listing.type.toUpperCase()} <span>·</span> LISTING #{listing.id.toUpperCase()}</div><h1>{listing.title}</h1><p className="detail-location"><span className="pin-dot">⌖</span> {listing.location} <span className="location-divider">·</span> Available from {listing.available}</p></div><span className="verified-badge"><ShieldCheck size={15} /> VERIFIED LISTING</span></div>
    <div className="detail-layout">
      <div className="detail-main">
        <div className={`detail-image ${listing.color}`} style={{ backgroundImage: `linear-gradient(180deg, transparent 55%, rgba(13,29,19,.3)), url("${listing.image}")` }}><span className="grade-chip"><span className="grade-dot" /> Grade {listing.grade} quality</span>{listing.listingType === 'AUCTION' && <span className="auction-chip"><span /> LIVE AUCTION</span>}</div>
        <div className="detail-facts"><Fact icon={<PackageCheck size={17} />} label="Available quantity" value={`${listing.quantity} tonnes`} /><Fact icon={<Sprout size={17} />} label="Quality grade" value={`Grade ${listing.grade}`} /><Fact icon={<Clock3 size={17} />} label="Moisture level" value={`${listing.moisture}%`} /><Fact icon={<ShieldCheck size={17} />} label="Supplier status" value="Verified farmer" /></div>
        <section className="detail-description"><span className="eyebrow">ABOUT THIS LISTING</span><h2>Farm-fresh. Ready for your supply chain.</h2><p>{listing.description}</p></section>
        <section className="supplier-card"><div className="supplier-avatar"><Sprout size={21} /></div><div><span className="eyebrow">SUPPLIED BY</span><strong>Verified farming partner</strong><small>{listing.state} · On AgriRevive since 2024</small></div><span className="supplier-rating">★ 4.8 <small>(16 reviews)</small></span></section>
      </div>
      <aside className="purchase-card">
        {listing.listingType === 'AUCTION' ? <>
          <div className="purchase-topline"><span className="auction-chip inline-chip"><span /> LIVE AUCTION</span><span className="ends-in">Ends Oct {listing.id === 'ag-2052' ? '06' : '08'}</span></div>
          <div className="current-bid-label">CURRENT HIGHEST BID</div><div className="current-bid-value">{currency(currentBid)}<small> / tonne</small></div>
          <div className="bid-context"><span><TrendingUp size={14} /> {listing.bidCount! + userBids.length} bids placed</span><span>{listing.quantity} t in lot</span></div>
          <div className="card-rule" />
          <form onSubmit={placeBid} className="bid-form"><label htmlFor="bid-amount">Your bid <span>Min. {currency(currentBid + 50)}</span></label><div className="money-input"><span>₹</span><input id="bid-amount" type="number" min={currentBid + 50} step="1" required value={bid} onChange={e => setBid(e.target.value)} placeholder="Enter amount per tonne" /></div><button className="button button-primary button-full">Place your bid <ArrowRight size={16} /></button></form>
          {notice && <p className={`notice ${notice.startsWith('Your') ? 'notice-success' : ''}`}>{notice}</p>}
          <div className="your-bid-list">{userBids.length > 0 && <><span className="eyebrow">YOUR RECENT BIDS</span>{userBids.slice(0, 3).map((item, index) => <div className="your-bid-row" key={`${item.date}-${index}`}><span>{currency(item.amount)} / t</span><small>{new Date(item.date).toLocaleDateString('en-IN')}</small></div>)}</>}</div>
          <div className="secure-note"><ShieldCheck size={14} /> No payment is taken until your bid is accepted.</div>
        </> : <>
          <span className="eyebrow">LISTED PRICE</span><div className="fixed-price">{currency(listing.price)}<small> / tonne</small></div>
          <div className="fixed-subline"><span><Check size={14} /> Price set by the farmer</span></div>
          <div className="card-rule" />
          <form onSubmit={placeOrder} className="bid-form">
            <label htmlFor="order-quantity">Quantity <span>Max. {listing.quantity} t</span></label>
            <div className="quantity-control"><button type="button" aria-label="Decrease quantity" onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button><input id="order-quantity" type="number" min="1" max={listing.quantity} step="1" value={quantity} onChange={e => setQuantity(Number(e.target.value))} /><span>tonnes</span><button type="button" aria-label="Increase quantity" onClick={() => setQuantity(Math.min(listing.quantity, quantity + 1))}>+</button></div>
            <div className="estimate-line"><span>Estimated total</span><strong>{currency(quantity * listing.price)}</strong></div>
            <button className="button button-primary button-full" disabled={quantity < 1 || quantity > listing.quantity}>Send purchase request <ArrowRight size={16} /></button>
          </form>
          <p className="estimate-note">The farmer will confirm availability before payment.</p>
          {notice && <p className="notice notice-success">{notice}</p>}
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

function OrdersPage({ orders, setOrders, listings, bids }: { orders: BuyerOrder[]; setOrders: (orders: BuyerOrder[] | ((old: BuyerOrder[]) => BuyerOrder[])) => void; listings: Listing[]; bids: BidRecord[] }) {
  const [tab, setTab] = useState('All orders')
  const [payingId, setPayingId] = useState<string | null>(null)
  const filtered = orders.filter(order => tab === 'All orders' || (tab === 'Needs attention' ? order.status === 'ACCEPTED' : order.status === 'PAID' || order.status === 'IN_TRANSIT' || order.status === 'DELIVERED'))
  const pay = (id: string) => {
    setPayingId(id)
    window.setTimeout(() => {
      setOrders(old => old.map(order => order.id === id ? { ...order, status: 'PAID' } : order))
      setPayingId(null)
    }, 350)
  }
  const statusLabel = (status: BuyerOrder['status']) => ({ REQUESTED: 'Awaiting farmer', ACCEPTED: 'Payment due', PAID: 'Payment held', IN_TRANSIT: 'In transit', DELIVERED: 'Delivered' })[status]
  return <div className="content-width">
    <div className="page-heading"><div><span className="eyebrow">YOUR SOURCING ACTIVITY</span><h1>My orders</h1><p>Track purchase requests, payments and delivery in one place.</p></div>{orders.length > 0 && <Link to="/browse" className="button button-outline"><Search size={16} /> Find more biomass</Link>}</div>
    <div className="order-summary-strip"><div><span className="order-summary-icon"><PackageCheck size={18} /></span><span><strong>{orders.length} total orders</strong><small>All sourcing activity</small></span></div><div><span className="order-summary-icon paid"><ShieldCheck size={18} /></span><span><strong>{currency(orders.filter(order => order.status !== 'REQUESTED').reduce((sum, order) => sum + order.total, 0))}</strong><small>Order value in progress</small></span></div><div><span className="order-summary-icon">{bids.length ? <TrendingUp size={18} /> : <Clock3 size={18} />}</span><span><strong>{bids.length} active bids</strong><small>Across live auctions</small></span></div></div>
    <div className="order-tabs">{['All orders', 'Needs attention', 'In progress & complete'].map(item => <button key={item} onClick={() => setTab(item)} className={tab === item ? 'order-tab active-tab' : 'order-tab'}>{item}<span>{item === 'All orders' ? orders.length : item === 'Needs attention' ? orders.filter(order => order.status === 'ACCEPTED').length : orders.filter(order => ['PAID', 'IN_TRANSIT', 'DELIVERED'].includes(order.status)).length}</span></button>)}</div>
    {filtered.length ? <div className="orders-table-wrap"><table className="orders-table"><thead><tr><th>ORDER</th><th>BIOMASS</th><th>QUANTITY</th><th>ORDER VALUE</th><th>PAYMENT / STATUS</th><th>NEXT STEP</th><th /></tr></thead><tbody>{filtered.map(order => <tr key={order.id}><td><strong className="order-id">{order.id}</strong><small>{new Date(order.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</small></td><td><div className="order-product"><span className={`order-product-img ${listings.find(item => item.id === order.listingId)?.color || 'sage'}`} style={{ backgroundImage: `url("${listings.find(item => item.id === order.listingId)?.image || ''}")` }} /><span><strong>{order.title}</strong><small>{order.location}</small></span></div></td><td>{order.quantity} t</td><td><strong>{currency(order.total)}</strong><small>{order.status === 'REQUESTED' ? 'Payment not due' : order.status === 'ACCEPTED' ? 'Payment due' : order.status === 'DELIVERED' ? 'Payment released' : 'Payment held securely'}</small></td><td><StatusPill status={statusLabel(order.status)} /></td><td>{order.status === 'ACCEPTED' ? <button className="table-action" onClick={() => pay(order.id)} disabled={payingId === order.id}>{payingId === order.id ? 'Processing…' : 'Pay now'} <ArrowRight size={13} /></button> : order.status === 'REQUESTED' ? <button className="table-action" onClick={() => setOrders(old => old.map(item => item.id === order.id ? { ...item, status: 'ACCEPTED' } : item))}>Demo: simulate acceptance <ArrowRight size={13} /></button> : <span className="next-step">{order.status === 'PAID' ? 'Pickup to be scheduled' : order.status === 'IN_TRANSIT' ? 'Confirm delivery' : 'Order complete'}</span>}</td><td><Link className="icon-button row-more" to={`/listings/${order.listingId}`} aria-label={`View ${order.title} listing`} title="View listing"><ArrowUpRight size={16} /></Link></td></tr>)}</tbody></table></div> : <div className="empty-state"><span className="empty-icon large"><PackageCheck size={22} /></span><h3>{orders.length ? 'Nothing in this view' : 'Your supply story starts here'}</h3><p>{orders.length ? 'There are no orders in this category yet.' : 'When you request biomass or bid on an auction, your orders and payment status will appear here.'}</p><Link to="/browse" className="button button-primary"><Search size={16} /> Browse biomass</Link></div>}
    <div className="payment-explainer"><span className="payment-shield"><ShieldCheck size={19} /></span><div><strong>Your payment is protected</strong><p>Payments are held securely until delivery is confirmed. You stay in control at every step.</p></div><span className="escrow-tag">BUYER PROTECTION</span></div>
  </div>
}

function StatusPill({ status }: { status: string }) {
  const tone = status === 'Awaiting farmer' ? 'status-waiting' : status === 'Payment due' ? 'status-due' : status === 'Delivered' ? 'status-done' : 'status-progress'
  return <span className={`status-pill ${tone}`}><i />{status}</span>
}

function OrderRows({ orders }: { orders: BuyerOrder[] }) {
  return <div className="recent-rows">{orders.map(order => <div className="recent-row" key={order.id}><span className="recent-order-icon"><PackageCheck size={15} /></span><span className="recent-product"><strong>{order.title}</strong><small>{order.id} · {order.quantity} tonnes</small></span><StatusPill status={order.status === 'REQUESTED' ? 'Awaiting farmer' : order.status === 'ACCEPTED' ? 'Payment due' : order.status === 'DELIVERED' ? 'Delivered' : 'Payment held'} /><strong className="recent-value">{currency(order.total)}</strong></div>)}</div>
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
        <div className="profile-fields"><label>Full name<input required value={form.name} onChange={e => update('name', e.target.value)} /></label><label>Work email<input type="email" value={form.email} readOnly className="readonly-field" /><small>Email is linked to your sign-in.</small></label><label>Organization name<input required value={form.organization} onChange={e => update('organization', e.target.value)} placeholder="Company or organization" /></label><label>Phone number<input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+91 98765 43210" /></label><label className="field-wide">Business location<select value={form.state} onChange={e => update('state', e.target.value)}><option value="">Select your state</option>{['Andhra Pradesh', 'Gujarat', 'Haryana', 'Karnataka', 'Madhya Pradesh', 'Maharashtra', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Uttar Pradesh'].map(state => <option key={state}>{state}</option>)}</select></label></div>
        <div className="profile-form-footer"><span>{saved && <><Check size={15} /> Changes saved to this browser.</>}</span><button className="button button-primary">Save changes <ArrowRight size={15} /></button></div>
      </form>
    </div>
    <div className="demo-disclosure"><ShieldCheck size={15} /><span><strong>Demo workspace:</strong> profile, bids and orders are saved in your browser only. No payment is processed.</span></div>
  </div>
}
