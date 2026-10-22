import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Gavel, ImagePlus, Tag, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { INDIAN_STATES, RESIDUE_TYPES, currency, residueMetaFor, type Listing, type ResidueTypeDTO } from '../shared'
import { useFarmer } from './context'
import { bidsFor, fileToDataUrl, formatDisplayDate, newId, toDateInput, toLocalInput } from './helpers'
import api, { fetchResidueTypes, mapBackendListingToFrontend } from '../api'

type FormState = {
  listingType: 'FIXED_PRICE' | 'AUCTION'
  residue: string
  title: string
  description: string
  quantity: string
  price: string
  grade: 'A' | 'B' | 'C'
  moisture: string
  state: string
  district: string
  pickupAddress: string
  availableFrom: string
  auctionEnds: string
  image: string // empty = use the default photo for the residue type
}

export default function ListingFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { farmer, listings, setListings, bids } = useFarmer()
  const existing = isEdit ? listings.find(item => item.id === id) : undefined
  const [serverResidueTypes, setServerResidueTypes] = useState<ResidueTypeDTO[]>([])

  useEffect(() => {
    fetchResidueTypes()
      .then(types => {
        if (Array.isArray(types) && types.length > 0) setServerResidueTypes(types)
      })
      .catch(() => {})
  }, [])

  const [form, setForm] = useState<FormState>(() => {
    if (existing) {
      const defaultPhoto = RESIDUE_TYPES.some(item => item.image === existing.image)
      return {
        listingType: existing.listingType,
        residue: existing.type || RESIDUE_TYPES[0].name,
        title: existing.title || '',
        description: existing.description || '',
        quantity: String(existing.quantity ?? ''),
        price: String(existing.price ?? ''),
        grade: existing.grade || 'A',
        moisture: String(existing.moisture ?? ''),
        state: existing.state || '',
        district: existing.district ?? (existing.location || '').split(',')[0].trim(),
        pickupAddress: existing.pickupAddress ?? '',
        availableFrom: existing.availableFrom ?? toDateInput(new Date()),
        auctionEnds: existing.auctionEnds ? existing.auctionEnds.slice(0, 16) : '',
        image: defaultPhoto ? '' : (existing.image || ''),
      }
    }
    const inThreeDays = new Date(Date.now() + 3 * 24 * 3600 * 1000)
    inThreeDays.setMinutes(0, 0, 0)
    return {
      listingType: params.get('type') === 'auction' ? 'AUCTION' : 'FIXED_PRICE',
      residue: RESIDUE_TYPES[0].name,
      title: '',
      description: '',
      quantity: '',
      price: '',
      grade: 'A',
      moisture: '',
      state: farmer.state || '',
      district: farmer.district || '',
      pickupAddress: farmer.pickupAddress || '',
      availableFrom: toDateInput(new Date()),
      auctionEnds: toLocalInput(inThreeDays),
      image: '',
    }
  })
  const [error, setError] = useState('')
  const [photoBusy, setPhotoBusy] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const placedBids = existing ? bidsFor(existing.id, bids).length : 0
  const auctionLocked = Boolean(existing && existing.listingType === 'AUCTION' && placedBids > 0)
  const isAuction = form.listingType === 'AUCTION'
  const residueMeta = residueMetaFor(form.residue)
  const previewImage = form.image || residueMeta.image
  const residueOptions = useMemo<{ name: string }[]>(() => {
    const base = serverResidueTypes.length > 0 ? serverResidueTypes.map(t => ({ name: t.name })) : RESIDUE_TYPES
    return existing && !base.some(item => item.name === existing.type) ? [{ name: existing.type }, ...base] : base
  }, [existing, serverResidueTypes])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(current => ({ ...current, [key]: value }))
    setError('')
  }

  const onPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please choose an image file (JPG, PNG or WebP).'); return }
    if (file.size > 10 * 1024 * 1024) { setError('That photo is larger than 10 MB. Please choose a smaller one.'); return }
    setPhotoBusy(true)
    try { set('image', await fileToDataUrl(file)) } catch (problem) { setError(problem instanceof Error ? problem.message : 'Could not use that photo.') }
    setPhotoBusy(false)
  }

  if (isEdit && !existing) {
    return <div className="content-width"><div className="empty-state"><h3>Listing not found</h3><p>It may have been deleted, or it belongs to another farmer account.</p><Link to="/farmer/listings" className="button button-outline">Back to my listings</Link></div></div>
  }

  const resolveResidueTypeId = (name: string): number => {
    const normalized = name.trim().toLowerCase()
    const fromServer = serverResidueTypes.find(t => t.name.trim().toLowerCase() === normalized)
    if (fromServer) return fromServer.id
    const fromDefault = RESIDUE_TYPES.find(t => t.name.toLowerCase() === normalized)
    return fromDefault ? fromDefault.id : 1
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (submitting || photoBusy) return
    const quantity = Number(form.quantity)
    const price = Number(form.price)
    const moisture = Number(form.moisture)
    const title = (form.title || '').trim()
    const description = (form.description || '').trim()
    const district = (form.district || '').trim()
    const pickupAddress = (form.pickupAddress || '').trim()

    if (title.length < 4) return setError('Give your listing a clear title (at least 4 characters).')
    if (!(quantity > 0)) return setError('Enter the available quantity in tonnes (more than 0).')
    if (!(price > 0)) return setError(isAuction ? 'Enter a starting price per tonne.' : 'Enter a price per tonne.')
    if (form.moisture === '' || !(moisture >= 0 && moisture <= 100)) return setError('Moisture must be a percentage between 0 and 100.')
    if (!form.state || !district) return setError('Select the state and enter the district where the biomass is stored.')
    if (!pickupAddress) return setError('Add a pickup address so buyers know where to collect.')
    if (!form.availableFrom) return setError('Choose the date the biomass is available from.')
    if (isAuction && !isEdit) {
      if (!form.auctionEnds) return setError('Choose when the auction ends.')
      if (new Date(form.auctionEnds).getTime() <= Date.now()) return setError('Auction end time must be in the future.')
    }

    const payload = {
      residueTypeId: resolveResidueTypeId(form.residue),
      title,
      description: description || 'Farm-fresh biomass.',
      quantityAvailable: quantity,
      pricePerTonne: price,
      qualityGrade: form.grade,
      moisturePercent: moisture,
      state: form.state,
      district,
      pickupAddress,
      availableFrom: form.availableFrom,
      listingType: form.listingType === 'AUCTION' ? 'AUCTION' : 'FIXED',
      auctionEndTime: isAuction && form.auctionEnds ? (form.auctionEnds.length === 16 ? `${form.auctionEnds}:00` : form.auctionEnds) : null,
    }

    setSubmitting(true)
    try {
      const res = isEdit && id
        ? await api.put(`/biomass/${id}`, payload)
        : await api.post('/biomass', payload)

      const mapped = res.data?.id ? mapBackendListingToFrontend(res.data) : null
      const saved: Listing = {
        id: mapped?.id || (id ?? newId('ag')),
        title,
        type: form.residue,
        location: `${district}, ${form.state}`,
        state: form.state,
        district,
        quantity,
        price,
        grade: form.grade,
        moisture,
        available: formatDisplayDate(form.availableFrom),
        availableFrom: form.availableFrom,
        description: description || 'Farm-fresh biomass.',
        image: form.image || mapped?.image || previewImage,
        color: residueMeta.color,
        listingType: form.listingType,
        auctionEnds: isAuction ? form.auctionEnds : undefined,
        highestBid: mapped?.highestBid ?? existing?.highestBid,
        farmerEmail: farmer.email,
        farmerName: farmer.name,
        pickupAddress,
        status: mapped?.status || existing?.status || 'PENDING_APPROVAL',
        aiVerifiedStatus: mapped?.aiVerifiedStatus,
        adminRemarks: mapped?.adminRemarks,
        createdAt: mapped?.createdAt || existing?.createdAt || new Date().toISOString(),
      }
      setListings(old => [saved, ...old.filter(item => item.id !== saved.id)])

      navigate('/farmer/listings', {
        state: {
          flash: isEdit
            ? `Changes to “${title}” were saved.`
            : `“${title}” was submitted for AI quality review!`,
        },
      })
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save listing to the server. Make sure the Spring Boot backend is running.')
    } finally {
      setSubmitting(false)
    }
  }

  const moistureValue = form.moisture !== '' ? Number(form.moisture) : null

  return (
    <div className="content-width">
      <Link to="/farmer/listings" className="back-link"><ArrowLeft size={15} /> Back to my listings</Link>
      <div className="page-heading">
        <div><span className="eyebrow">{isEdit ? 'EDIT LISTING' : 'NEW LISTING'}</span><h1>{isEdit ? 'Edit your listing' : 'Create biomass listing'}</h1><p>{isEdit ? 'Update the details buyers see on the marketplace.' : 'Tell buyers what you have, where it is and how you would like to sell it.'}</p></div>
      </div>
      <div className="fm-form-layout">
        <form onSubmit={submit} className="panel fm-form" noValidate>
          <fieldset className="fm-fieldset">
            <legend>How do you want to sell?</legend>
            <div className="fm-segment" role="radiogroup" aria-label="Listing type">
              <button type="button" role="radio" aria-checked={!isAuction} disabled={isEdit} className={!isAuction ? 'on' : ''} onClick={() => set('listingType', 'FIXED_PRICE')}><Tag size={15} /><span><strong>Fixed price</strong><small>Buyers send purchase requests</small></span></button>
              <button type="button" role="radio" aria-checked={isAuction} disabled={isEdit} className={isAuction ? 'on' : ''} onClick={() => set('listingType', 'AUCTION')}><Gavel size={15} /><span><strong>Auction</strong><small>Buyers bid, highest bid wins</small></span></button>
            </div>
            {isEdit && <p className="fm-hint">The selling method can't be changed after a listing is created.</p>}
          </fieldset>

          <fieldset className="fm-fieldset">
            <legend>Biomass details</legend>
            <div className="fm-grid">
              <label>Residue type<select value={form.residue} onChange={e => set('residue', e.target.value)}>{residueOptions.map(item => <option key={item.name}>{item.name}</option>)}</select></label>
              <label>Quality grade<select value={form.grade} onChange={e => set('grade', e.target.value as FormState['grade'])}><option value="A">Grade A · premium</option><option value="B">Grade B · standard</option><option value="C">Grade C · basic</option></select></label>
              <label className="fm-wide">Title<input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Premium rice straw, sun-dried" maxLength={150} /></label>
              <label className="fm-wide">Description <small>Optional</small><textarea rows={4} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe the condition, how it is baled or stored, and anything buyers should know." /></label>
              <label>Quantity available (tonnes)<input type="number" min="0" step="0.1" inputMode="decimal" value={form.quantity} onChange={e => set('quantity', e.target.value)} placeholder="e.g. 25" /></label>
              <label>Moisture (%)<input type="number" min="0" max="100" step="0.1" inputMode="decimal" value={form.moisture} onChange={e => set('moisture', e.target.value)} placeholder="e.g. 12" />
                {moistureValue !== null && moistureValue > 20 && (
                  <small className="fm-hint" style={{ color: '#bb5a3e' }}>Note: AI verification automatically rejects lots with moisture above 20%.</small>
                )}
              </label>
            </div>
          </fieldset>

          <fieldset className="fm-fieldset">
            <legend>{isAuction ? 'Auction pricing' : 'Pricing'}</legend>
            <div className="fm-grid">
              <label>{isAuction ? 'Starting price per tonne' : 'Price per tonne'}<span className="money-input fm-money"><span>₹</span><input type="number" min="0" step="1" inputMode="numeric" disabled={auctionLocked} value={form.price} onChange={e => set('price', e.target.value)} placeholder="e.g. 1800" /></span>{auctionLocked && <small className="fm-hint">Locked because bidding has started.</small>}</label>
              {isAuction ? <label>Auction ends<input type="datetime-local" disabled={auctionLocked} value={form.auctionEnds} onChange={e => set('auctionEnds', e.target.value)} />{auctionLocked && <small className="fm-hint">Use “Extend” on the Auctions page to give bidders more time.</small>}</label>
                : <label>Available from<input type="date" value={form.availableFrom} onChange={e => set('availableFrom', e.target.value)} /></label>}
              {isAuction && <label>Available from<input type="date" value={form.availableFrom} onChange={e => set('availableFrom', e.target.value)} /></label>}
            </div>
          </fieldset>

          <fieldset className="fm-fieldset">
            <legend>Location &amp; pickup</legend>
            <div className="fm-grid">
              <label>State<select value={form.state} onChange={e => set('state', e.target.value)}><option value="">Select state</option>{INDIAN_STATES.map(item => <option key={item}>{item}</option>)}</select></label>
              <label>District<input value={form.district} onChange={e => set('district', e.target.value)} placeholder="e.g. Ludhiana" /></label>
              <label className="fm-wide">Pickup address<input value={form.pickupAddress} onChange={e => set('pickupAddress', e.target.value)} placeholder="Village, landmark, road" maxLength={255} /></label>
            </div>
          </fieldset>

          <fieldset className="fm-fieldset">
            <legend>Photo</legend>
            <div className="fm-photo">
              <span className="fm-photo-thumb" style={{ backgroundImage: `url("${previewImage}")` }} />
              <span className="fm-photo-copy"><strong>{form.image ? 'Your photo' : 'Default photo'}</strong><small>{form.image ? 'This photo is shown to buyers.' : `We'll show a stock image for ${form.residue.toLowerCase()} unless you add your own.`}</small></span>
              <label className="button button-outline fm-upload"><ImagePlus size={15} /> {photoBusy ? 'Processing…' : form.image ? 'Replace' : 'Upload photo'}<input type="file" accept="image/*" onChange={onPhoto} hidden /></label>
              {form.image && <button type="button" className="icon-button" onClick={() => set('image', '')} aria-label="Remove photo" title="Remove photo"><Trash2 size={16} /></button>}
            </div>
          </fieldset>

          {error && <p className="form-error fm-form-error" role="alert">{error}</p>}
          <div className="fm-form-footer">
            <Link to="/farmer/listings" className="button button-outline">Cancel</Link>
            <button className="button button-primary" type="submit" disabled={photoBusy || submitting}>
              {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Submit listing'} <ArrowRight size={16} />
            </button>
          </div>
        </form>

        <aside className="fm-preview">
          <span className="eyebrow">BUYER PREVIEW</span>
          <article className="listing-card">
            <div className="listing-image" style={{ backgroundImage: `linear-gradient(180deg, rgba(18,31,22,0) 50%, rgba(18,31,22,.35) 100%), url("${previewImage}")` }}>
              <span className="grade-chip"><span className="grade-dot" /> Grade {form.grade}</span>
              {isAuction && <span className="auction-chip"><span /> LIVE AUCTION</span>}
              <span className="image-location"><span className="pin-dot">⌖</span> {(form.district || '').trim() || 'District'}{form.state ? `, ${form.state}` : ''}</span>
            </div>
            <div className="listing-card-body">
              <div className="listing-type">{form.residue.toUpperCase()} <span>·</span> {form.moisture || '–'}% MOISTURE</div>
              <span className="listing-title">{(form.title || '').trim() || 'Your listing title'}</span>
              <div className="listing-meta"><span><strong>{form.quantity || '–'} t</strong> available</span></div>
              <div className="listing-card-footer"><div><strong>{form.price ? currency(Number(form.price)) : '₹ –'}</strong><small>{isAuction ? 'starting bid' : 'per tonne'}</small></div></div>
            </div>
          </article>
          <p className="fm-hint">{isEdit ? 'Changes appear for buyers right after you save.' : 'New listings are verified by AI within seconds before appearing on the marketplace.'}</p>
        </aside>
      </div>
    </div>
  )
}
