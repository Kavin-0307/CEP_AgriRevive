import { useEffect, useMemo, useState, type Dispatch, type FormEvent, type ReactNode, type SetStateAction } from 'react'
import { ArrowRight, ArrowUpRight, Bell, CircleHelp, Gavel, LayoutDashboard, LogOut, Menu, PackagePlus, PackageCheck, Settings2, ShieldCheck, Sprout, Tractor, ChevronDown, Boxes, X } from 'lucide-react'
import { Link, Navigate, NavLink, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { Brand, INDIAN_STATES, useStoredState, type BidRecord, type BuyerOrder, type Farmer, type Listing } from '../shared'
import { FarmerContext, useFarmer, type FarmerContextValue } from './context'
import FarmerDashboard from './FarmerDashboard'
import ListingFormPage from './ListingFormPage'
import MyListings from './MyListings'
import AuctionsPage from './AuctionsPage'
import FarmerOrders from './FarmerOrders'
import FarmerProfile from './FarmerProfile'

type Props = {
  listings: Listing[]
  setListings: Dispatch<SetStateAction<Listing[]>>
  orders: BuyerOrder[]
  setOrders: Dispatch<SetStateAction<BuyerOrder[]>>
  bids: BidRecord[]
}

export default function FarmerApp({ listings, setListings, orders, setOrders, bids }: Props) {
  const [farmer, setFarmer] = useStoredState<Farmer | null>('agri-farmer', null)
  const [registry, setRegistry] = useStoredState<Record<string, Farmer>>('agri-farmers', {})

  const saveFarmer = (next: Farmer) => {
    setFarmer(next)
    setRegistry(old => ({ ...old, [next.email.toLowerCase()]: next }))
  }

  const mine = useMemo(() => (farmer ? listings.filter(item => item.farmerEmail === farmer.email) : []), [farmer, listings])
  const myOrders = useMemo(() => {
    if (!farmer) return []
    const ids = new Set(mine.map(item => item.id))
    return orders.filter(order => order.farmerEmail === farmer.email || ids.has(order.listingId))
  }, [farmer, mine, orders])

  const context: FarmerContextValue | null = farmer
    ? { farmer, saveFarmer, allListings: listings, setListings, listings: mine, orders: myOrders, setOrders, bids }
    : null

  return (
    <Routes>
      <Route path="login" element={farmer ? <Navigate to="/farmer" replace /> : <FarmerAuth registry={registry} onAuth={saveFarmer} />} />
      <Route path="register" element={farmer ? <Navigate to="/farmer" replace /> : <FarmerAuth register registry={registry} onAuth={saveFarmer} />} />
      <Route element={context ? <FarmerContext.Provider value={context}><FarmerLayout onLogout={() => setFarmer(null)} /></FarmerContext.Provider> : <Navigate to="/farmer/login" replace />}>
        <Route index element={<FarmerDashboard />} />
        <Route path="listings" element={<MyListings />} />
        <Route path="listings/new" element={<ListingFormPage />} />
        <Route path="listings/:id/edit" element={<ListingFormPage />} />
        <Route path="auctions" element={<AuctionsPage />} />
        <Route path="orders" element={<FarmerOrders />} />
        <Route path="profile" element={<FarmerProfile />} />
        <Route path="*" element={<Navigate to="/farmer" replace />} />
      </Route>
    </Routes>
  )
}

function FarmerAuth({ register = false, registry, onAuth }: { register?: boolean; registry: Record<string, Farmer>; onAuth: (farmer: Farmer) => void }) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [farmName, setFarmName] = useState('')
  const [phone, setPhone] = useState('')
  const [state, setState] = useState('')
  const [district, setDistrict] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const key = email.trim().toLowerCase()
    if (!key.includes('@') || password.length < 6) {
      setError('Enter a valid email and a password with at least 6 characters.')
      return
    }
    if (register) {
      if (!name.trim() || !state || !district.trim()) {
        setError('Add your name, state and district to create a farmer account.')
        return
      }
      if (registry[key]) {
        setError('A farmer account with this email already exists in this browser. Please sign in instead.')
        return
      }
      onAuth({
        name: name.trim(), email: key, phone: phone.trim(), farmName: farmName.trim() || `${name.trim()}'s farm`,
        state, district: district.trim(), pickupAddress: '', notifyOrders: true, notifyBids: true,
      })
    } else {
      const existing = registry[key]
      onAuth(existing ?? {
        name: key.split('@')[0].replace(/[._-]/g, ' '), email: key, phone: '', farmName: 'My farm',
        state: '', district: '', pickupAddress: '', notifyOrders: true, notifyBids: true,
      })
    }
    navigate('/farmer')
  }

  return (
    <main className="auth-page">
      <div className="auth-brand"><Brand to="/farmer" /></div>
      <div className="auth-layout">
        <section className="auth-story">
          <span className="eyebrow light"><Sprout size={15} /> Grow beyond the harvest</span>
          <h1>Turn crop residue<br /><em>into income.</em></h1>
          <p>List your straw, husk and stalks, sell at a fixed price or run an auction, and manage every order from one place.</p>
          <div className="auth-proof"><span><strong>Your price</strong> fixed or auction</span><span><strong>Direct</strong> to industry buyers</span></div>
          <div className="story-orbit orbit-one" /><div className="story-orbit orbit-two" />
        </section>
        <section className="auth-card">
          <div className="auth-card-heading">
            <span className="eyebrow">FARMER PORTAL</span>
            <h2>{register ? 'Create your farmer account' : 'Welcome back, farmer'}</h2>
            <p>{register ? 'Start selling your agricultural biomass.' : 'Sign in to manage your listings and orders.'}</p>
          </div>
          <form onSubmit={submit} className="stack-form">
            {register && <>
              <label>Full name<input required value={name} onChange={e => setName(e.target.value)} placeholder="Your name" autoComplete="name" /></label>
              <label>Farm or group name <small className="field-hint">Optional</small><input value={farmName} onChange={e => setFarmName(e.target.value)} placeholder="e.g. Green Valley Farms" /></label>
              <label>Phone number <small className="field-hint">Optional</small><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" autoComplete="tel" /></label>
              <div className="form-row-2">
                <label>State<select className="plain-select" required value={state} onChange={e => setState(e.target.value)}><option value="">Select state</option>{INDIAN_STATES.map(item => <option key={item}>{item}</option>)}</select></label>
                <label>District<input required value={district} onChange={e => setDistrict(e.target.value)} placeholder="e.g. Ludhiana" /></label>
              </div>
            </>}
            <label>Email<input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" /></label>
            <label>Password<input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" autoComplete={register ? 'new-password' : 'current-password'} /></label>
            {error && <p className="form-error">{error}</p>}
            {!register && <div className="form-meta"><label className="check-label"><input type="checkbox" /> Remember me</label><button type="button" className="text-button" onClick={() => setError('For this demo, use any valid email and a password with 6+ characters.')}>Forgot password?</button></div>}
            <button className="button button-primary button-full" type="submit">{register ? 'Create farmer account' : 'Sign in'} <ArrowRight size={17} /></button>
          </form>
          <p className="auth-switch">{register ? 'Already have an account?' : 'New to AgriRevive?'} <Link to={register ? '/farmer/login' : '/farmer/register'}>{register ? 'Sign in' : 'Create an account'}</Link></p>
          <p className="demo-note"><ShieldCheck size={14} /> Demo account is stored locally in this browser.</p>
          <p className="auth-switch auth-role-switch">Looking to buy biomass? <Link to="/login">Industry buyer sign in</Link></p>
        </section>
      </div>
    </main>
  )
}

function pageTitle(path: string) {
  if (path.startsWith('/farmer/listings/new')) return 'Create listing'
  if (path.includes('/edit')) return 'Edit listing'
  if (path.startsWith('/farmer/listings')) return 'My listings'
  if (path.startsWith('/farmer/auctions')) return 'Auctions'
  if (path.startsWith('/farmer/orders')) return 'Orders'
  if (path.startsWith('/farmer/profile')) return 'Profile & settings'
  return 'Overview'
}

function FarmerNavItem({ to, icon, label, end, count }: { to: string; icon: ReactNode; label: string; end?: boolean; count?: number }) {
  return <NavLink to={to} end={end} className={({ isActive }) => `nav-item ${isActive ? 'nav-active' : ''}`}>{icon}<span>{label}</span>{count ? <small>{count}</small> : null}</NavLink>
}

function FarmerLayout({ onLogout }: { onLogout: () => void }) {
  const { farmer, listings, orders } = useFarmer()
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  useEffect(() => setMobileOpen(false), [location.pathname])
  const pending = orders.filter(order => order.status === 'REQUESTED').length
  const initial = farmer.name.slice(0, 1).toUpperCase() || 'F'
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-top"><Brand to="/farmer" /><button className="icon-button mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={18} /></button></div>
        <div className="workspace-switch"><span className="workspace-icon"><Tractor size={17} /></span><span><strong>{farmer.farmName || 'My farm'}</strong><small>Farmer workspace</small></span><ChevronDown size={15} /></div>
        <span className="nav-section-title">WORKSPACE</span>
        <nav className="main-nav">
          <FarmerNavItem to="/farmer" icon={<LayoutDashboard size={17} />} label="Overview" end />
          <FarmerNavItem to="/farmer/listings/new" icon={<PackagePlus size={17} />} label="Create listing" />
          <FarmerNavItem to="/farmer/listings" icon={<Boxes size={17} />} label="My listings" count={listings.length} end />
          <FarmerNavItem to="/farmer/auctions" icon={<Gavel size={17} />} label="Auctions" />
          <FarmerNavItem to="/farmer/orders" icon={<PackageCheck size={17} />} label="Orders" count={pending} />
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card"><span className="help-icon"><CircleHelp size={17} /></span><strong>Need a hand?</strong><p>Our farmer support team is here to help.</p><a href="mailto:support@agrirevive.in">Contact support <ArrowUpRight size={13} /></a></div>
          <FarmerNavItem to="/farmer/profile" icon={<Settings2 size={17} />} label="Profile & settings" />
          <button className="nav-item logout-button" onClick={onLogout}><LogOut size={17} /> Sign out</button>
          <div className="user-mini"><span className="avatar">{initial}</span><span><strong>{farmer.name}</strong><small>{farmer.email}</small></span><span className="online-dot" /></div>
        </div>
      </aside>
      {mobileOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <div className="main-column">
        <header className="topbar">
          <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
          <div className="crumb"><span>Farmer portal</span><span className="crumb-slash">/</span><strong>{pageTitle(location.pathname)}</strong></div>
          <div className="topbar-right"><span className="demo-pill"><span /> DEMO WORKSPACE</span><Link to="/farmer/orders" className="icon-button notification-button" aria-label={pending ? `${pending} order requests waiting` : 'Notifications'}><Bell size={18} />{pending > 0 && <i />}</Link><span className="topbar-divider" /><span className="avatar avatar-small">{initial}</span></div>
        </header>
        <main className="page-content"><Outlet /></main>
        <footer className="footer"><span>© 2026 AgriRevive</span><span>Growing a circular future <Sprout size={12} /></span></footer>
      </div>
    </div>
  )
}

