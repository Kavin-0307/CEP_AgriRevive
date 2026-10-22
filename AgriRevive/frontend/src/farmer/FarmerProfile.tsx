import { useState, type FormEvent } from 'react'
import { ArrowRight, Check, Settings2, ShieldCheck } from 'lucide-react'
import { INDIAN_STATES, type Farmer } from '../shared'
import { useFarmer } from './context'

export default function FarmerProfile() {
  const { farmer, saveFarmer, listings } = useFarmer()
  const [form, setForm] = useState<Farmer>(() => ({
    name: farmer.name || '',
    email: farmer.email || '',
    phone: farmer.phone || '',
    farmName: farmer.farmName || '',
    state: farmer.state || '',
    district: farmer.district || '',
    pickupAddress: farmer.pickupAddress || '',
    notifyOrders: farmer.notifyOrders ?? true,
    notifyBids: farmer.notifyBids ?? true,
  }))
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const update = <K extends keyof Farmer>(field: K, value: Farmer[K]) => { setForm(current => ({ ...current, [field]: value })); setSaved(false); setError('') }

  const save = (event: FormEvent) => {
    event.preventDefault()
    const name = (form.name || '').trim()
    const phone = (form.phone || '').trim()
    if (!name) { setError('Your name is required.'); return }
    if (phone && !/^[+\d][\d\s-]{6,}$/.test(phone)) { setError('Enter a valid phone number, or leave it blank.'); return }
    saveFarmer({
      ...form,
      name,
      farmName: (form.farmName || '').trim(),
      phone,
      district: (form.district || '').trim(),
      pickupAddress: (form.pickupAddress || '').trim(),
    })
    setSaved(true)
  }

  return (
    <div className="content-width profile-page">
      <div className="page-heading"><div><span className="eyebrow">YOUR ACCOUNT</span><h1>Profile &amp; settings</h1><p>Keep your farm details current so buyers know who they're working with.</p></div></div>
      <div className="profile-layout">
        <aside className="profile-menu">
          <div className="profile-avatar">{(form.name || '').slice(0, 1).toUpperCase() || 'F'}</div>
          <strong>{form.name || 'Farmer profile'}</strong>
          <span>{form.farmName || 'Your farm'}</span>
          <div className="profile-menu-rule" />
          <div className="profile-menu-item selected"><Settings2 size={16} /> Farm &amp; contact</div>
          <div className="profile-menu-item"><ShieldCheck size={16} /> Account security <span className="coming-soon">SOON</span></div>
          <div className="profile-menu-note">{listings.length} listing{listings.length === 1 ? '' : 's'} on AgriRevive. Buyers see your name and location on your listings.</div>
        </aside>
        <form onSubmit={save} className="profile-form panel">
          <div className="profile-form-heading"><div><h2>Farm profile</h2><p>This information is shown to buyers who order from you.</p></div><span className="profile-status"><i /> ACTIVE ACCOUNT</span></div>
          <div className="profile-fields">
            <label>Full name<input required value={form.name || ''} onChange={e => update('name', e.target.value)} /></label>
            <label>Email<input type="email" value={form.email || ''} readOnly className="readonly-field" /><small>Email is linked to your sign-in.</small></label>
            <label>Farm or group name<input value={form.farmName || ''} onChange={e => update('farmName', e.target.value)} placeholder="e.g. Green Valley Farms" /></label>
            <label>Phone number<input type="tel" value={form.phone || ''} onChange={e => update('phone', e.target.value)} placeholder="+91 98765 43210" /></label>
            <label>State<select value={form.state || ''} onChange={e => update('state', e.target.value)}><option value="">Select your state</option>{INDIAN_STATES.map(item => <option key={item}>{item}</option>)}</select></label>
            <label>District<input value={form.district || ''} onChange={e => update('district', e.target.value)} placeholder="e.g. Ludhiana" /></label>
            <label className="field-wide">Default pickup address<input value={form.pickupAddress || ''} onChange={e => update('pickupAddress', e.target.value)} placeholder="Pre-filled on new listings" /><small>Used to pre-fill the pickup address when you create a listing.</small></label>
          </div>

          <div className="fm-settings-block">
            <h3>Notifications</h3>
            <label className="fm-toggle"><input type="checkbox" checked={Boolean(form.notifyOrders)} onChange={e => update('notifyOrders', e.target.checked)} /><span><strong>Order updates</strong><small>Tell me when a buyer requests or pays for my biomass.</small></span></label>
            <label className="fm-toggle"><input type="checkbox" checked={Boolean(form.notifyBids)} onChange={e => update('notifyBids', e.target.checked)} /><span><strong>Auction bids</strong><small>Tell me when someone bids on or wins one of my auctions.</small></span></label>
            <p className="fm-hint">Preferences are saved to your profile for this workspace.</p>
          </div>

          {error && <p className="form-error fm-form-error" role="alert">{error}</p>}
          <div className="profile-form-footer"><span>{saved && <><Check size={15} /> Profile preferences saved.</>}</span><button className="button button-primary">Save changes <ArrowRight size={15} /></button></div>
        </form>
      </div>
      <div className="demo-disclosure"><ShieldCheck size={15} /><span><strong>Connected workspace:</strong> your listings, auctions, and orders sync with the AgriRevive backend; extended farm profile preferences are saved locally on this device.</span></div>
    </div>
  )
}
