import { useEffect, useState } from 'react'
import { Check, Gavel, Pause, PencilLine, PackagePlus, Play, Trash2, TriangleAlert, X } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { currency, type Listing } from '../shared'
import { useFarmer } from './context'
import { bidsFor, listingStatusMeta, timeLeft, topBid, useNow } from './helpers'

const TABS = ['All', 'Active', 'Under review', 'Auctions', 'Paused / ended'] as const
type Tab = (typeof TABS)[number]

export default function MyListings() {
  const { listings, setListings, orders, bids } = useFarmer()
  const location = useLocation()
  const navigate = useNavigate()
  const now = useNow()
  const [tab, setTab] = useState<Tab>('All')
  const [flash, setFlash] = useState<string>((location.state as { flash?: string } | null)?.flash ?? '')
  const [toDelete, setToDelete] = useState<Listing | null>(null)

  // Clear the router state so a refresh doesn't show the same message again.
  useEffect(() => {
    if ((location.state as { flash?: string } | null)?.flash) navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state, navigate])

  const status = (item: Listing) => item.status ?? 'ACTIVE'
  const matches = (item: Listing, which: Tab) =>
    which === 'All' ? true
      : which === 'Active' ? status(item) === 'ACTIVE'
        : which === 'Under review' ? status(item) === 'PENDING_APPROVAL'
          : which === 'Auctions' ? item.listingType === 'AUCTION'
            : ['PAUSED', 'CLOSED', 'SOLD_OUT', 'REJECTED'].includes(status(item))
  const shown = listings.filter(item => matches(item, tab))

  const update = (id: string, patch: Partial<Listing>) => setListings(old => old.map(item => item.id === id ? { ...item, ...patch } : item))
  const openOrdersFor = (item: Listing) => orders.filter(order => order.listingId === item.id && ['REQUESTED', 'ACCEPTED', 'PAID', 'IN_TRANSIT'].includes(order.status))

  const confirmDelete = () => {
    if (!toDelete) return
    setListings(old => old.filter(item => item.id !== toDelete.id))
    setFlash(`“${toDelete.title}” was removed from your workspace.`)
    setToDelete(null)
  }
  const blockingOrders = toDelete ? openOrdersFor(toDelete) : []

  return (
    <div className="content-width">
      <div className="page-heading">
        <div><span className="eyebrow">YOUR CATALOGUE</span><h1>My listings</h1><p>Edit, pause or remove the biomass you have on the marketplace.</p></div>
        <Link to="/farmer/listings/new" className="button button-primary"><PackagePlus size={16} /> Create listing</Link>
      </div>

      {flash && <div className="fm-flash" role="status"><Check size={15} /><span>{flash}</span><button className="icon-button" onClick={() => setFlash('')} aria-label="Dismiss"><X size={15} /></button></div>}

      <div className="order-tabs">{TABS.map(item => <button key={item} onClick={() => setTab(item)} className={tab === item ? 'order-tab active-tab' : 'order-tab'}>{item}<span>{listings.filter(listing => matches(listing, item)).length}</span></button>)}</div>

      {shown.length ? (
        <div className="orders-table-wrap fm-table-wrap">
          <table className="orders-table fm-table">
            <thead><tr><th>LISTING</th><th>TYPE</th><th>QUANTITY</th><th>PRICE</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
            <tbody>{shown.map(item => {
              const meta = listingStatusMeta(status(item))
              const isAuction = item.listingType === 'AUCTION'
              const top = isAuction ? topBid(item, bids) : null
              const canToggle = status(item) === 'ACTIVE' || status(item) === 'PAUSED'
              return (
                <tr key={item.id}>
                  <td><div className="order-product"><span className={`order-product-img ${item.color}`} style={{ backgroundImage: `url("${item.image}")` }} /><span><strong>{item.title}</strong><small>{item.type} · {item.location} · {item.moisture}% moisture</small></span></div></td>
                  <td>{isAuction ? <span className="fm-type-chip auction"><Gavel size={11} /> Auction</span> : <span className="fm-type-chip">Fixed price</span>}{isAuction && <small className="fm-sub">{timeLeft(item.auctionEnds, now)}</small>}</td>
                  <td><strong>{item.quantity} t</strong><small className="fm-sub">Grade {item.grade}</small></td>
                  <td><strong>{currency(top?.amount ?? item.price)}</strong><small className="fm-sub">{isAuction ? (top ? `highest of ${bidsFor(item.id, bids).length || 'recorded'} bids` : 'starting price') : 'per tonne'}</small></td>
                  <td>
                    <span className={`status-pill ${meta.tone}`}><i />{meta.label}</span>
                    {status(item) === 'REJECTED' && item.adminRemarks && (
                      <small className="fm-sub" title={item.adminRemarks}>{item.adminRemarks}</small>
                    )}
                  </td>
                  <td>
                    <div className="fm-actions">
                      {canToggle && !isAuction && <button className="icon-button" onClick={() => update(item.id, { status: status(item) === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' })} aria-label={status(item) === 'ACTIVE' ? 'Pause listing' : 'Resume listing'} title={status(item) === 'ACTIVE' ? 'Pause listing' : 'Resume listing'}>{status(item) === 'ACTIVE' ? <Pause size={16} /> : <Play size={16} />}</button>}
                      {isAuction && <Link className="icon-button" to="/farmer/auctions" aria-label="Manage auction" title="Manage auction"><Gavel size={16} /></Link>}
                      <Link className="icon-button" to={`/farmer/listings/${item.id}/edit`} aria-label={`Edit ${item.title}`} title="Edit"><PencilLine size={16} /></Link>
                      <button className="icon-button fm-danger" onClick={() => setToDelete(item)} aria-label={`Delete ${item.title}`} title="Delete"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              )
            })}</tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state"><span className="empty-icon large"><PackagePlus size={22} /></span><h3>{listings.length ? 'Nothing in this view' : 'No listings yet'}</h3><p>{listings.length ? 'None of your listings match this filter.' : 'Create your first listing to start receiving purchase requests and bids.'}</p>{!listings.length && <Link to="/farmer/listings/new" className="button button-primary"><PackagePlus size={16} /> Create listing</Link>}</div>
      )}

      {toDelete && (
        <div className="fm-modal-backdrop" onClick={() => setToDelete(null)}>
          <div className="fm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-title" onClick={event => event.stopPropagation()}>
            <span className={`fm-modal-icon ${blockingOrders.length ? 'warn' : 'danger'}`}><TriangleAlert size={20} /></span>
            <h3 id="delete-title">{blockingOrders.length ? 'This listing has open orders' : 'Delete this listing?'}</h3>
            <p>{blockingOrders.length
              ? `“${toDelete.title}” has ${blockingOrders.length} order${blockingOrders.length === 1 ? '' : 's'} in progress. Finish or decline ${blockingOrders.length === 1 ? 'it' : 'them'} before deleting. You can pause the listing in the meantime.`
              : `“${toDelete.title}” will be removed from the marketplace${toDelete.listingType === 'AUCTION' ? ' along with its auction' : ''}. This can't be undone.`}</p>
            <div className="fm-modal-actions">
              <button className="button button-outline" onClick={() => setToDelete(null)}>{blockingOrders.length ? 'Close' : 'Keep listing'}</button>
              {blockingOrders.length ? <Link to="/farmer/orders" className="button button-primary">View orders</Link> : <button className="button fm-button-danger" onClick={confirmDelete}><Trash2 size={15} /> Delete listing</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
