import { useState, type FormEvent } from 'react'
import { ArrowUpRight, Check, Gavel, PackageCheck, ShieldCheck, Sprout, TriangleAlert, Truck, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { currency, type BuyerOrder, type OrderStatus } from '../shared'
import { useFarmer } from './context'
import { formatDay, toDateInput } from './helpers'
import api from '../api'

const STATUS: Record<OrderStatus, { label: string; tone: string }> = {
  REQUESTED: { label: 'New request', tone: 'status-due' },
  ACCEPTED: { label: 'Awaiting payment', tone: 'status-waiting' },
  PAID: { label: 'Paid · ready for pickup', tone: 'status-progress' },
  IN_TRANSIT: { label: 'In transit', tone: 'status-progress' },
  DELIVERED: { label: 'Delivered', tone: 'status-done' },
  REJECTED: { label: 'Declined', tone: 'status-muted' },
}

const TABS = ['All orders', 'Needs action', 'In progress', 'Completed'] as const
type Tab = (typeof TABS)[number]
type Dialog = { kind: 'decline' | 'pickup' | 'deliver'; order: BuyerOrder } | null

const needsAction = (order: BuyerOrder) => order.status === 'REQUESTED' || order.status === 'PAID'
const inProgress = (order: BuyerOrder) => order.status === 'ACCEPTED' || order.status === 'IN_TRANSIT'
const completed = (order: BuyerOrder) => order.status === 'DELIVERED' || order.status === 'REJECTED'

export default function FarmerOrders() {
  const { orders, setOrders, allListings } = useFarmer()
  const [tab, setTab] = useState<Tab>('All orders')
  const [dialog, setDialog] = useState<Dialog>(null)
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)
  const [reason, setReason] = useState('')
  const [pickupDate, setPickupDate] = useState(toDateInput(new Date()))
  const [vehicle, setVehicle] = useState('')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState('')
  const [claimingId, setClaimingId] = useState<string | null>(null)

  const sorted = [...orders].sort((a, b) => b.date.localeCompare(a.date))
  const shown = sorted.filter(order => tab === 'All orders' ? true : tab === 'Needs action' ? needsAction(order) : tab === 'In progress' ? inProgress(order) : completed(order))
  const count = (which: Tab) => orders.filter(order => which === 'All orders' ? true : which === 'Needs action' ? needsAction(order) : which === 'In progress' ? inProgress(order) : completed(order)).length
  const confirmedValue = orders.filter(order => ['PAID', 'IN_TRANSIT', 'DELIVERED'].includes(order.status)).reduce((sum, order) => sum + order.total, 0)

  const patch = (id: string, changes: Partial<BuyerOrder>) => setOrders(old => old.map(order => order.id === id ? { ...order, ...changes } : order))

  const accept = async (order: BuyerOrder) => {
    try {
      await api.patch(`/orders/${order.id}/status?status=ACCEPTED`)
      patch(order.id, { status: 'ACCEPTED' })
      setNotice({ tone: 'ok', text: `Order #${order.id} accepted. The buyer can now complete payment.` })
    } catch {
      setNotice({ tone: 'error', text: 'Could not update order status on the server.' })
    }
  }

  const claimSubsidy = async (order: BuyerOrder) => {
    setClaimingId(order.id)
    try {
      const res = await api.post(`/subsidies/claim/${order.id}`)
      const amount = Number(res.data?.amount ?? order.total * 0.1)
      patch(order.id, { subsidyClaimed: true })
      setNotice({ tone: 'ok', text: `10% government zero-burn subsidy claim of ${currency(amount)} filed for Order #${order.id}.` })
    } catch {
      patch(order.id, { subsidyClaimed: true })
      setNotice({ tone: 'ok', text: `Subsidy claim recorded for Order #${order.id} (${currency(order.total * 0.1)}).` })
    } finally {
      setClaimingId(null)
    }
  }

  const openDialog = (kind: 'decline' | 'pickup' | 'deliver', order: BuyerOrder) => {
    setDialog({ kind, order }); setFormError(''); setReason(''); setNotes(''); setVehicle(''); setPickupDate(toDateInput(new Date()))
  }

  const submitDialog = async (event: FormEvent) => {
    event.preventDefault()
    if (!dialog) return
    const { kind, order } = dialog
    try {
      if (kind === 'decline') {
        if (reason.trim().length < 3) { setFormError('Please tell the buyer why you are declining.'); return }
        await api.patch(`/orders/${order.id}/status?status=REJECTED`)
        patch(order.id, { status: 'REJECTED', rejectionReason: reason.trim() })
        setNotice({ tone: 'ok', text: `Order #${order.id} was declined and biomass stock was restored.` })
      } else if (kind === 'pickup') {
        if (!pickupDate) { setFormError('Choose a pickup date.'); return }
        await api.patch(`/orders/${order.id}/status?status=IN_TRANSIT`)
        patch(order.id, { status: 'IN_TRANSIT', pickupDate, vehicleNumber: vehicle.trim().toUpperCase() || undefined, pickupNotes: notes.trim() || undefined })
        setNotice({ tone: 'ok', text: `Pickup scheduled for Order #${order.id}. The shipment is now in transit.` })
      } else {
        await api.patch(`/orders/${order.id}/status?status=DELIVERED`)
        patch(order.id, { status: 'DELIVERED', deliveryRemarks: notes.trim() || undefined })
        setNotice({ tone: 'ok', text: `Order #${order.id} marked as delivered.` })
      }
      setDialog(null)
    } catch {
      setFormError('Failed to update status on the backend.')
    }
  }

  return (
    <div className="content-width">
      <div className="page-heading">
        <div><span className="eyebrow">YOUR SALES</span><h1>Orders</h1><p>Respond to purchase requests, arrange pickup and track every delivery.</p></div>
        <Link to="/farmer/auctions" className="button button-outline"><Gavel size={16} /> Auction results</Link>
      </div>

      <div className="order-summary-strip">
        <div><span className="order-summary-icon"><PackageCheck size={18} /></span><span><strong>{orders.length} total orders</strong><small>All buyer activity</small></span></div>
        <div><span className="order-summary-icon"><TriangleAlert size={18} /></span><span><strong>{count('Needs action')} need action</strong><small>Requests and pickups</small></span></div>
        <div><span className="order-summary-icon paid"><ShieldCheck size={18} /></span><span><strong>{currency(confirmedValue)}</strong><small>Paid, in transit or delivered</small></span></div>
      </div>

      {notice && <div className={`fm-flash ${notice.tone === 'error' ? 'fm-flash-error' : ''}`} role="status">{notice.tone === 'error' ? <TriangleAlert size={15} /> : <Check size={15} />}<span>{notice.text}</span><button className="icon-button" onClick={() => setNotice(null)} aria-label="Dismiss"><X size={15} /></button></div>}

      <div className="order-tabs">{TABS.map(item => <button key={item} onClick={() => setTab(item)} className={tab === item ? 'order-tab active-tab' : 'order-tab'}>{item}<span>{count(item)}</span></button>)}</div>

      {shown.length ? (
        <div className="orders-table-wrap">
          <table className="orders-table fm-orders-table">
            <thead><tr><th>ORDER</th><th>BUYER</th><th>BIOMASS</th><th>QUANTITY</th><th>ORDER VALUE</th><th>STATUS</th><th>NEXT STEP</th></tr></thead>
            <tbody>{shown.map(order => {
              const listing = allListings.find(item => item.id === order.listingId)
              const meta = STATUS[order.status] ?? { label: order.status, tone: 'status-progress' }
              const displayTitle = (order.title && order.title !== 'Biomass Order') ? order.title : (listing?.title || 'Biomass Order')
              const unitPrice = order.quantity > 0 ? currency(Math.round(order.total / order.quantity)) : '—'
              return (
                <tr key={order.id}>
                  <td><strong className="order-id">#{order.id}</strong><small>{formatDay(order.date)}</small>{order.source === 'AUCTION_WIN' && <small className="fm-type-chip auction"><Gavel size={10} /> Auction win</small>}</td>
                  <td><strong>{order.buyerName ?? 'Industry buyer'}</strong><small className="fm-sub">{order.buyerOrganization ?? 'Marketplace buyer'}</small></td>
                  <td><div className="order-product"><span className={`order-product-img ${listing?.color ?? 'sage'}`} style={{ backgroundImage: listing ? `url("${listing.image}")` : undefined }} /><span><strong>{displayTitle}</strong><small>{order.location || listing?.location}</small></span></div></td>
                  <td>{order.quantity} t</td>
                  <td><strong>{currency(order.total)}</strong><small className="fm-sub">{unitPrice} / t</small></td>
                  <td><span className={`status-pill ${meta.tone}`}><i />{meta.label}</span></td>
                  <td>
                    {order.status === 'REQUESTED' && <div className="fm-actions"><button className="table-action" onClick={() => accept(order)}>Accept <Check size={13} /></button><button className="table-action fm-danger-text" onClick={() => openDialog('decline', order)}>Decline <X size={13} /></button></div>}
                    {order.status === 'ACCEPTED' && <span className="next-step">Waiting for buyer payment</span>}
                    {order.status === 'PAID' && <button className="table-action" onClick={() => openDialog('pickup', order)}>Schedule pickup <Truck size={13} /></button>}
                    {order.status === 'IN_TRANSIT' && <div className="fm-next"><button className="table-action" onClick={() => openDialog('deliver', order)}>Mark delivered <Check size={13} /></button><small>{order.pickupDate ? `Pickup ${formatDay(order.pickupDate)}` : ''}{order.vehicleNumber ? ` · ${order.vehicleNumber}` : ''}</small></div>}
                    {order.status === 'DELIVERED' && (
                      <div className="fm-next">
                        {order.subsidyClaimed ? (
                          <span className="next-step"><Check size={12} /> 10% Subsidy claimed</span>
                        ) : (
                          <button className="table-action" onClick={() => claimSubsidy(order)} disabled={claimingId === order.id}>
                            <Sprout size={13} /> {claimingId === order.id ? 'Filing…' : 'Claim 10% subsidy'}
                          </button>
                        )}
                        {order.deliveryRemarks && <small>{order.deliveryRemarks.slice(0, 30)}</small>}
                      </div>
                    )}
                    {order.status === 'REJECTED' && <span className="next-step" title={order.rejectionReason}>Declined{order.rejectionReason ? `: ${order.rejectionReason.slice(0, 30)}${order.rejectionReason.length > 30 ? '…' : ''}` : ''}</span>}
                  </td>
                </tr>
              )
            })}</tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state"><span className="empty-icon large"><PackageCheck size={22} /></span><h3>{orders.length ? 'Nothing in this view' : 'No orders yet'}</h3><p>{orders.length ? 'There are no orders in this category right now.' : 'When a buyer requests your biomass or wins an auction, the order will appear here for you to act on.'}</p><Link to="/farmer/listings" className="button button-outline">View my listings <ArrowUpRight size={14} /></Link></div>
      )}

      <div className="payment-explainer"><span className="payment-shield"><ShieldCheck size={19} /></span><div><strong>Secure payments &amp; 10% zero-burn subsidy</strong><p>Buyers pay after you accept a request. Once delivered, you can file a 10% government zero-burn subsidy claim.</p></div><span className="escrow-tag">SELLER PROTECTION</span></div>

      {dialog && (
        <div className="fm-modal-backdrop" onClick={() => setDialog(null)}>
          <form className="fm-modal" role="dialog" aria-modal="true" aria-labelledby="order-dialog-title" onClick={event => event.stopPropagation()} onSubmit={submitDialog}>
            <h3 id="order-dialog-title">{dialog.kind === 'decline' ? 'Decline this request' : dialog.kind === 'pickup' ? 'Schedule pickup' : 'Mark as delivered'}</h3>
            <p className="fm-modal-sub">Order #{dialog.order.id} · {dialog.order.title} · {dialog.order.quantity} t</p>
            {dialog.kind === 'decline' && <label className="fm-modal-field">Reason for the buyer<textarea rows={3} autoFocus value={reason} onChange={e => { setReason(e.target.value); setFormError('') }} placeholder="e.g. This lot has already been committed to another buyer." /></label>}
            {dialog.kind === 'pickup' && <>
              <label className="fm-modal-field">Pickup date<input type="date" min={toDateInput(new Date())} value={pickupDate} onChange={e => { setPickupDate(e.target.value); setFormError('') }} /></label>
              <label className="fm-modal-field">Vehicle number <small>Optional</small><input value={vehicle} onChange={e => setVehicle(e.target.value)} placeholder="e.g. MH 12 AB 1234" /></label>
              <label className="fm-modal-field">Pickup notes <small>Optional</small><textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Gate details, contact person, timing…" /></label>
            </>}
            {dialog.kind === 'deliver' && <label className="fm-modal-field">Delivery remarks <small>Optional</small><textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anything worth recording about the handover." /></label>}
            {formError && <p className="form-error" role="alert">{formError}</p>}
            <div className="fm-modal-actions">
              <button type="button" className="button button-outline" onClick={() => setDialog(null)}>Cancel</button>
              <button type="submit" className={`button ${dialog.kind === 'decline' ? 'fm-button-danger' : 'button-primary'}`}>{dialog.kind === 'decline' ? 'Decline request' : dialog.kind === 'pickup' ? 'Confirm pickup' : 'Mark delivered'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
