import axios from 'axios'
import {
  formatDisplayDate,
  residueMetaFor,
  type BuyerOrder,
  type Listing,
  type OrderStatus,
  type ResidueTypeDTO,
} from './shared'

const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
const defaultApiUrl = isLocal ? 'http://localhost:8080/api' : `${window.location.origin}/api`
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || defaultApiUrl
export const WS_URL = API_BASE_URL.replace(/\/api\/?$/, '') + '/ws'

export function clearSessionStorage() {
  localStorage.removeItem('token')
  localStorage.removeItem('agri-buyer')
  localStorage.removeItem('agri-buyer-profile')
  localStorage.removeItem('agri-farmer')
  localStorage.removeItem('agri-orders')
  localStorage.removeItem('agri-bids')
  localStorage.removeItem('agri-subsidy-claims')
}

const api = axios.create({ baseURL: API_BASE_URL })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  response => response,
  error => {
    const url = error.config?.url || ''
    const status = error.response?.status
    if ((status === 401 || (status === 403 && !localStorage.getItem('token'))) && !url.includes('/auth/')) {
      const inFarmer = window.location.pathname.startsWith('/farmer')
      clearSessionStorage()
      window.location.href = inFarmer ? '/farmer/login' : '/login'
    }
    return Promise.reject(error)
  },
)

export const mapBackendListingToFrontend = (backendItem: any): Listing => {
  const state = backendItem.state || ''
  const district = backendItem.district || ''
  const availableFrom = backendItem.availableFrom || new Date().toISOString().slice(0, 10)
  const type = backendItem.residueType?.name || 'Rice straw'
  const meta = residueMetaFor(type)

  return {
    id: String(backendItem.id),
    title: backendItem.title || 'Untitled',
    type,
    location: district && state ? `${district}, ${state}` : state || district || 'India',
    state,
    district,
    quantity: Number(backendItem.quantityAvailable ?? 0),
    price: Number(backendItem.pricePerTonne ?? 0),
    grade: (backendItem.qualityGrade as 'A' | 'B' | 'C') || 'B',
    moisture: Number(backendItem.moisturePercent ?? 0),
    available: formatDisplayDate(availableFrom),
    availableFrom,
    description: backendItem.description || '',
    image: backendItem.imagePath || meta.image,
    color: meta.color,
    listingType: backendItem.listingType === 'AUCTION' ? 'AUCTION' : 'FIXED_PRICE',
    auctionEnds: backendItem.auctionEndTime || undefined,
    highestBid: backendItem.highestBidAmount != null ? Number(backendItem.highestBidAmount) : undefined,
    farmerName: backendItem.farmer?.name || 'Verified Farmer',
    farmerEmail: backendItem.farmer?.email || '',
    pickupAddress: backendItem.pickupAddress || '',
    status: backendItem.status || 'ACTIVE',
    aiVerifiedStatus: backendItem.aiVerifiedStatus || undefined,
    adminRemarks: backendItem.adminRemarks || undefined,
    createdAt: backendItem.createdAt || new Date().toISOString(),
  }
}

const KNOWN_ORDER_STATUSES = new Set<OrderStatus>([
  'REQUESTED',
  'ACCEPTED',
  'PAID',
  'IN_TRANSIT',
  'DELIVERED',
  'REJECTED',
])

export const mapOrder = (data: any): BuyerOrder => {
  const rawStatus = data.status === 'AWAITING_PAYMENT' ? 'ACCEPTED' : data.status
  const status: OrderStatus = KNOWN_ORDER_STATUSES.has(rawStatus) ? rawStatus : 'REQUESTED'

  return {
    id: String(data.id),
    listingId: data.listingId != null ? String(data.listingId) : '',
    title: data.title || 'Biomass Order',
    location: data.deliveryAddress || '',
    quantity: Number(data.quantity ?? 0),
    total: Number(data.totalAmount ?? 0),
    status,
    date: data.createdAt || new Date().toISOString(),
    orderType: data.orderType || 'BIOMASS',
    farmerEmail: data.seller?.email || '',
    buyerName: data.buyer?.name || 'Industry buyer',
    buyerOrganization: data.buyer?.organizationName || data.deliveryAddress || 'Industry buyer',
    source: data.status === 'AWAITING_PAYMENT' ? 'AUCTION_WIN' : undefined,
    rejectionReason: data.rejectionReason || undefined,
    pickupDate: data.pickupDate || undefined,
    vehicleNumber: data.vehicleNumber || undefined,
    pickupNotes: data.pickupNotes || undefined,
    deliveryRemarks: data.deliveryRemarks || undefined,
  }
}

export const fetchActiveListings = async (): Promise<Listing[]> => {
  const response = await api.get('/biomass')
  return response.data.map(mapBackendListingToFrontend)
}

export const fetchMyListings = async (): Promise<Listing[]> => {
  const response = await api.get('/biomass/mine')
  return response.data.map(mapBackendListingToFrontend)
}

export const createListing = async (listingData: any) => {
  return await api.post('/biomass', listingData)
}

export const updateListing = async (id: string | number, listingData: any) => {
  return await api.put(`/biomass/${id}`, listingData)
}

export const fetchResidueTypes = async (): Promise<ResidueTypeDTO[]> => {
  const response = await api.get('/residue-types')
  return response.data
}

export default api
