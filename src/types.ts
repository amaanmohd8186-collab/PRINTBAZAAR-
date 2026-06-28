export type ProductCategory = 
  | 'Business Cards'
  | 'Visiting Cards'
  | 'Wedding Cards'
  | 'Banners'
  | 'Flex'
  | 'Posters'
  | 'Books'
  | 'Brochures'
  | 'Stationery'
  | 'Stickers'
  | 'Flyers'
  | 'ID Cards'
  | 'Certificates'
  | 'Canvas Prints'
  | 'Photo Frames'
  | 'T-Shirts'
  | 'Mugs'
  | 'Packaging'
  | 'Calendars'
  | 'Menus'
  | 'Labels'
  | 'QR Cards'
  | 'NFC Cards';

export interface ShippingRate {
  id: string;
  name: string;
  carrier: string;
  type: string;
  rate: number;
  tax: number;
  total: number;
  estimatedDays: string;
}

export interface PincodeInfo {
  pincode: string;
  city: string;
  state: string;
  district: string;
}

export interface ShippingServiceability {
  isServiceable: boolean;
  estimatedDays: string;
  pincode: string;
  city?: string;
  state?: string;
  printingTime?: string;
  shippingTime?: string;
  totalTime?: string;
  expressAvailable?: boolean;
  courierName?: string;
  shippingRate?: number;
  deliveryDate?: string;
  error?: string;
}

export interface LogisticsSettings {
  pickupPincode: string;
  defaultWeight: number;
  printingTimeDays: number;
  packagingTimeDays: number;
  dispatchCutoffTime: string;
  freeShippingThreshold: number;
  defaultCourier: string;
  shippingMarginPercent: number;
  expressPrintingEnabled: boolean;
  shiprocketApiKey?: string;
  shiprocketEmail?: string;
  shiprocketPassword?: string;
}

export interface ShippingRateRequest {
  pickupPincode: string;
  deliveryPincode: string;
  weight: number;
  cod: boolean;
}

export interface ShippingOrderRequest {
  orderId: string;
  pickupPincode: string;
  deliveryPincode: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  customerState: string;
  weight: number;
  dimensions: { length: number; width: number; height: number };
  paymentMode: 'Prepaid' | 'COD';
}

export interface BrandKit {
  userId: string;
  logoUrl?: string;
  companyName?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  gstNumber?: string;
  colors: string[];
  fonts: string[];
  qrCodeUrl?: string;
  barcodeUrl?: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    linkedin?: string;
  };
  updatedAt: string;
}

export type StaffRole = 
  | 'Production Manager'
  | 'Designer'
  | 'Operator'
  | 'Packing Staff'
  | 'Delivery Staff'
  | 'Customer Support'
  | 'Admin';

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  active: boolean;
  status?: 'Active' | 'On Leave' | 'Busy';
  assignedTasks?: number;
  permissions: string[];
  joinedAt: string;
}

export type BusinessReportType = 
  | 'Daily'
  | 'Weekly'
  | 'Monthly'
  | 'Yearly'
  | 'GST'
  | 'Profit'
  | 'Sales'
  | 'Customer'
  | 'Top Product'
  | 'Top Category';

export interface BusinessReport {
  id: string;
  type: BusinessReportType;
  title: string;
  startDate: string;
  endDate: string;
  data: any;
  exportUrl?: string;
  createdAt: string;
}

export type OrderStatus = 
  | 'Order Received'
  | 'Order Confirmed'
  | 'Artwork Review'
  | 'Design Review' // Alias/Support for legacy code
  | 'Preparing Design'
  | 'Customer Approval'
  | 'Waiting for Customer'
  | 'Printing'
  | 'Lamination'
  | 'Cutting'
  | 'Quality Check'
  | 'Packing'
  | 'Packed'
  | 'Courier Pickup'
  | 'Shipped'
  | 'Out For Delivery'
  | 'Delivered'
  | 'Cancelled'
  | 'Refunded'
  | 'Pending Payment';

export interface ArtworkAudit {
  qualityScore: number;
  dpi: number;
  colorSpace: 'CMYK' | 'RGB' | 'Unknown';
  bleedCheck: 'Passed' | 'Warning' | 'Failed';
  safeMarginCheck: 'Passed' | 'Warning' | 'Failed';
  resolution: { width: number; height: number };
  warnings: string[];
}

export interface ProductionLog {
  stage: OrderStatus;
  timestamp: string;
  operator?: string;
  notes?: string;
}

export interface Size {
  name: string;
  priceMultiplier: number;
  dimensions?: string;
}

export interface Material {
  name: string;
  priceMultiplier: number;
}

export interface QuantitySlab {
  quantity: number;
  unitPrice: number;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  description: string;
  image: string;
  galleryImages?: string[];
  bannerImages?: string[];
  video?: string;
  inventory?: number;
  sizes: Size[];
  materials: Material[];
  quantitySlabs: QuantitySlab[];
  slabs?: QuantitySlab[]; // Alias for quantitySlabs
  estimatedProductionTime?: string;
  dispatchLeadTime?: string;
  published: boolean;
  sellerId?: string;
  commissionPercent?: number; // Override for specific products
  isNew?: boolean;
  isBestseller?: boolean;
}

export interface DesignFile {
  name: string;
  size: number;
  type: string;
  url?: string;
  fileData?: string;
  variations?: DesignFile[];
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productCategory: string;
  selectedSize: Size;
  selectedMaterial: Material;
  selectedQuantity: number;
  designFile?: DesignFile;
  itemTotal: number;
  advanceAmount: number;
  balanceAmount: number;
  productImage: string;
}

export interface PaymentDetails {
  method: 'UPI' | 'Card' | 'Wallet' | 'Net Banking';
  txId: string;
  amount: number;
  timestamp: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: CartItem[];
  totalAmount: number;
  gstAmount?: number;
  advancePaid: boolean;
  balancePaid: boolean;
  payments: PaymentDetails[];
  status: OrderStatus;
  productionTimeline?: ProductionLog[];
  artworkAudit?: ArtworkAudit;
  trackingNumber?: string;
  courierName?: string;
  shippingAddress?: Address;
  invoiceUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  shippingCharge?: number;
  taxAmount?: number;
  notifyOnDispatch?: boolean;
  feedback?: any;
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin' | 'seller';
  subscriptionTier?: string;
}

export interface Address {
  id: string;
  label: string;
  name: string;
  phone: string;
  pincode: string;
  addressLine1: string;
  line1?: string; // Legacy support
  addressLine2?: string;
  city: string;
  state: string;
  isDefault: boolean;
}

export interface UserStatsBase {
  totalSpent: number;
  ordersCount: number;
  wishlistCount: number;
  walletBalance: number;
  pendingBalance?: number;
  cashback?: number;
  refundBalance?: number;
  aiCredits: number;
  usedCredits?: number;
  referralCode?: string;
  referralEarnings: number;
  loyaltyPoints: number;
  rewardPoints?: number;
  lifetimePoints?: number;
  redeemedPoints?: number;
  subscriptionTier: 'Free' | 'Starter' | 'Pro' | 'Business' | 'Enterprise' | 'Elite' | 'none';
  subscriptionExpiry?: string;
  premiumStatus?: string;
  premiumExpiry?: string | null;
  mobile?: string;
  dob?: string;
  addresses?: Address[];
  savedDesigns?: any[];
}

export interface SavedDesign {
  id: string;
  name: string;
  preview: string;
  imageUrl?: string;
  type?: string;
  data: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Design {
  id?: string;
  name: string;
  data: any; // Fabric.js canvas JSON
  preview?: string; // Base64
  userId: string;
  createdAt?: any;
  updatedAt?: any;
}

export type ToolType = 
  | 'select' 
  | 'text' 
  | 'shape' 
  | 'image' 
  | 'ai' 
  | 'background' 
  | 'verification'
  | 'urdu'
  | 'typography'
  | 'vector';

export interface VerificationAudit {
  id: string;
  type: 'request' | 'verify' | 'block' | 'resend';
  identifier: string;
  status: 'success' | 'failure' | 'blocked';
  provider: string;
  timestamp: any;
  metadata?: any;
}

// REVENUE ENGINE TYPES
export interface SellerProfile {
  id: string;
  storeName?: string;
  ownerName?: string;
  name?: string; // Legacy support
  dob?: string; // Legacy support
  email: string;
  mobile: string;
  gstin?: string;
  pan?: string;
  bankDetails?: {
    accountNumber: string;
    ifsc: string;
    bankName: string;
    holderName: string;
  };
  commissionRate?: number; // Percentage defined by admin
  withdrawableBalance?: number;
  pendingBalance?: number;
  totalEarnings?: number;
  status: 'pending' | 'verified' | 'rejected' | 'suspended' | 'Draft' | 'Pending Verification' | 'Verified' | 'Rejected';
  verificationStep?: number;
  level?: string;
  aiRiskScore?: number;
  trustScore?: number;
  aiFraudFlags?: string[];
  ocrExtractedName?: string;
  ocrExtractedDob?: string;
  auditLogs?: any[];
    documents?: {
      aadhaarFront?: string | null;
      aadhaarBack?: string | null;
      panCard?: string | null;
      cancelledCheque?: string | null;
      gstCert?: string | null;
      videoKycUrl?: string | null;
      governmentIdType?: string;
    governmentIdNumber?: string;
    governmentIdFile?: string;
    businessGst?: string;
    businessRegistration?: string;
    businessShopLicense?: string;
    businessPan?: string;
    addressLine?: string;
    pincode?: string;
    city?: string;
    state?: string;
    utilityBillFile?: string;
    bankHolderName?: string;
    bankAccountNumber?: string;
    bankIfscCode?: string;
    bankName?: string;
    upiId?: string;
    cancelledChequeFile?: string;
    tradeLicense?: string | null;
    msmeCert?: string | null;
    mobileOtpVerified?: boolean;
    emailOtpVerified?: boolean;
  };
}

export interface SizeOption {
  name: string;
  priceMultiplier: number;
  dimensions?: string;
}

export interface MaterialOption {
  name: string;
  priceMultiplier: number;
}

export interface CustomFile {
  name: string;
  size: number;
  type: string;
  data?: string;
  fileData?: string;
  variations?: CustomFile[];
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: 'credit' | 'debit';
  amount: number;
  purpose: 'order_payment' | 'refund' | 'payout' | 'referral' | 'bonus' | 'credit_purchase';
  status: 'completed' | 'pending' | 'failed';
  txId?: string;
  timestamp: any;
  metadata?: any;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  type: 'credit' | 'debit';
  amount: number;
  toolUsed?: string; // e.g. 'background_removal'
  timestamp: any;
}

export interface BulkQuote {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  productType: string;
  quantity: number;
  specifications: string;
  materialPreference: string;
  location: string;
  estimatedCost?: number;
  estimatedShipping?: number;
  tax?: number;
  status: 'requested' | 'analyzing' | 'quote_sent' | 'order_converted' | 'archived';
  pdfUrl?: string;
  createdAt: any;
}

export interface DesignTemplate {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  designerId: string;
  designerName: string;
  previewUrl: string;
  canvasData: string;
  salesCount: number;
  rating: number;
}

// SOCIAL COMMERCE TYPES
export type PostContentType = 'image' | 'video' | 'design_preview';

export interface PostMedia {
  type: PostContentType;
  url: string;
  previewUrl?: string;
  thumbnail?: string;
}

export interface CreatorBadge {
  id: string;
  label: string;
  icon: string; // lucide icon name
  color: string;
  description: string;
}

export interface SocialPost {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  creatorBadges: string[]; // Badge IDs
  caption: string;
  media: PostMedia[];
  tags: string[];
  productCategory?: ProductCategory;
  linkedProductId?: string;
  linkedDesignId?: string;
  likesCount: number;
  commentCount: number;
  shareCount: number;
  saveCount: number;
  isAiGenerated: boolean;
  isVerified: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface SocialComment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  replies?: SocialComment[];
  likesCount: number;
  isPinned: boolean;
  createdAt: any;
}

export interface CreatorFollow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: any;
}

export interface DesignCollection {
  id: string;
  userId: string;
  name: string;
  isPublic: boolean;
  itemIds: string[]; // Design IDs or Post IDs
  coverImage?: string;
  createdAt: any;
}

export interface DesignChallenge {
  id: string;
  title: string;
  description: string;
  theme: string;
  prizePool: string;
  startDate: any;
  endDate: any;
  status: 'upcoming' | 'active' | 'judging' | 'completed';
  participantsCount: number;
  winnerIds?: string[];
  bannerImage: string;
}

export interface SocialNotification {
  id: string;
  recipientId: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'challenge' | 'product_launch';
  actorId: string;
  actorName: string;
  actorAvatar?: string;
  targetId?: string; // Post ID or Design ID
  content: string;
  isRead: boolean;
  createdAt: any;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  fileUrl?: string;
  status: 'sent' | 'delivered' | 'read';
  createdAt: any;
}

export interface UserStats extends UserStatsBase {
  // Social extensions
  bio?: string;
  userName?: string;
  coverBanner?: string;
  followersCount: number;
  followingCount: number;
  totalDesignsCount: number;
  likesReceived: number;
  badges: string[];
  achievements: Achievement[];
  socialLinks?: {
    instagram?: string;
    behanace?: string;
    dribbble?: string;
  };
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'promo' | 'system' | 'artwork';
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  category: 'Order Issue' | 'Technical' | 'Payment' | 'Design Help' | 'Feedback' | 'General';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  messages: {
    sender: 'user' | 'agent';
    text: string;
    timestamp: string;
    attachments?: string[];
  }[];
  orderId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  expiryDate: string;
  usageLimit?: number;
  usedCount: number;
  description: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: any;
}
