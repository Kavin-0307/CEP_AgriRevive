import axios from 'axios' ;
import {Listing,BuyerOrder} from './shared';
const api=axios.create({baseURL:'http://localhost:8080/api'});
api.interceptors.request.use((config)=>{
    const token=localStorage.getItem('token');
    if(token)config.headers.Authorization=`Bearer ${token}`
    return config
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    if (error.response && error.response.status === 401 && !url.includes('/auth/')) {
      localStorage.removeItem('token');
      localStorage.removeItem('agri-buyer');
      localStorage.removeItem('agri-farmer');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const mapBackendListingToFrontend=(backendItem:any):Listing=>{
    const state = backendItem.state || '';
    const district = backendItem.district || '';
    const availableFrom = backendItem.availableFrom || new Date().toISOString().slice(0, 10);
    return{
        id:backendItem.id.toString(),
        title:backendItem.title||'Untitled',
        type: backendItem.residueType?.name || 'Rice straw',
        location: district && state ? `${district}, ${state}` : state || district || 'India',
        state,
        district,
        quantity: Number(backendItem.quantityAvailable ?? 0),
        price: Number(backendItem.pricePerTonne ?? 0),
        grade: (backendItem.qualityGrade as 'A' | 'B' | 'C') || 'B',
        moisture: Number(backendItem.moisturePercent ?? 0),
        available: availableFrom,
        availableFrom,
        description: backendItem.description || '',
        image: backendItem.imagePath || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef',
        color: 'sage', // Default UI color
        listingType: backendItem.listingType === 'AUCTION' ? 'AUCTION' : 'FIXED_PRICE',
        auctionEnds: backendItem.auctionEndTime || undefined,
        highestBid: backendItem.highestBidAmount != null ? Number(backendItem.highestBidAmount) : undefined,
        farmerName: backendItem.farmer?.name || 'Verified Farmer',
        farmerEmail: backendItem.farmer?.email || '',
        pickupAddress: backendItem.pickupAddress || '',
        status: backendItem.status || 'ACTIVE',
        createdAt: backendItem.createdAt || new Date().toISOString()
    };

};
// Map Backend Order JSON to Frontend UI shape
export const mapOrder = (data: any): BuyerOrder => ({
    id: data.id.toString(),
    listingId: data.listingId?.toString() || '',
    title: data.title || 'Biomass Order',
    location: data.deliveryAddress || '', 
    quantity: Number(data.quantity ?? 0),
    total: Number(data.totalAmount ?? 0),
    status: (data.status === 'AWAITING_PAYMENT' ? 'ACCEPTED' : data.status) as any,
    date: data.createdAt || new Date().toISOString(),
    farmerEmail: data.seller?.email || '',
    buyerName: data.buyer?.name || 'Industry buyer',
    buyerOrganization: data.buyer?.organizationName || data.deliveryAddress || 'Industry buyer',
    rejectionReason: data.rejectionReason || undefined,
    pickupDate: data.pickupDate || undefined,
    vehicleNumber: data.vehicleNumber || undefined,
    pickupNotes: data.pickupNotes || undefined,
    deliveryRemarks: data.deliveryRemarks || undefined
});
export const fetchActiveListings=async():Promise<Listing[]>=>{
    const response=await api.get('/biomass');
    return response.data.map(mapBackendListingToFrontend);
}
export const createListing = async (listingData: any) => {
    return await api.post('/biomass', listingData);
};
export default api;