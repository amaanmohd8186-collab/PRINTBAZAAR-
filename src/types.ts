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

export type OrderStatus = 
  | 'Pending Payment'
  | 'Order Placed'
  | 'Order Received'
  | 'Design Check'
  | 'Design Review'
  | 'Approved'
  | 'Printing In Progress'
  | 'Quality Check'
  | 'Ready for Dispatch'
  | 'Dispatched'
  | 'Delivered'
  | 'Cancelled';

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
  advancePaid: boolean;
  balancePaid: boolean;
  payments: PaymentDetails[];
  status: OrderStatus;
  trackingNumber?: string;
  courierName?: string;
  shippingAddress?: Address;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  shippingCharge?: number;
  taxAmount?: number;
  notifyOnDispatch?: boolean;
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
  | 'verification';

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
    selfie?: string | null;
    cancelledCheque?: string | null;
    gstCert?: string | null;
    tradeLicense?: string | null;
    msmeCert?: string | null;
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
    cancelledChequeFile?: string;
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

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: any;
}
