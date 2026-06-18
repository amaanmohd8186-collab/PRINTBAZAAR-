/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, ProductCategory, Order, UserSession } from './types';

export const CATEGORIES: ProductCategory[] = [
  'Business Cards',
  'Visiting Cards',
  'Wedding Cards',
  'Banners',
  'Flex',
  'Posters',
  'Books',
  'Brochures',
  'Stationery',
  'Stickers',
  'Flyers',
  'ID Cards',
  'Certificates',
  'Canvas Prints',
  'Photo Frames',
  'T-Shirts',
  'Mugs',
  'Packaging',
  'Calendars',
  'Menus',
  'Labels',
  'QR Cards',
  'NFC Cards'
];

import iconBiz from './assets/images/biz_card_1781270461093.jpg';
import iconWedding from './assets/images/wedding_card_1781270477784.jpg';
import iconTshirt from './assets/images/tshirt_print_1781270492400.jpg';
import iconMug from './assets/images/mug_mockup_1781270520269.jpg';
import iconBanner from './assets/images/banner_mockup_1781270533679.jpg';
import iconPoster from './assets/images/poster_mockup_1781270548900.jpg';
import iconStickers from './assets/images/sticker_mockup_1781270561752.jpg';
import iconPackaging from './assets/images/packaging_mockup_1781270577520.jpg';

export const CATEGORY_DEFAULT_IMAGES: Record<ProductCategory, string> = {
  'Business Cards': iconBiz,
  'Visiting Cards': iconBiz,
  'Wedding Cards': iconWedding,
  'Banners': iconBanner,
  'Flex': iconBanner,
  'Posters': iconPoster,
  'Books': iconPackaging,
  'Brochures': iconPoster,
  'Stationery': iconBiz,
  'Stickers': iconStickers,
  'Flyers': iconPoster,
  'ID Cards': iconBiz,
  'Certificates': iconPoster,
  'Canvas Prints': iconPoster,
  'Photo Frames': iconPoster,
  'T-Shirts': iconTshirt,
  'Mugs': iconMug,
  'Packaging': iconPackaging,
  'Calendars': iconPoster,
  'Menus': iconPoster,
  'Labels': iconStickers,
  'QR Cards': iconBiz,
  'NFC Cards': iconBiz
};

export const INITIAL_PRODUCTS: Product[] = [
  {
      id: 'prod-1',
      name: 'Velvet-Touch Business Cards',
      category: 'Business Cards',
      description: 'Premium quality visiting cards with double-sided velvet matte lamination. Creates an unforgettable first impression.',
      estimatedProductionTime: '24-48 Hours',
      dispatchLeadTime: 'Within 3 Business Days',
      sizes: [
        { name: 'Standard (3.5" x 2.0")', priceMultiplier: 1.0 },
        { name: 'Rounded Corners (3.5" x 2.0")', priceMultiplier: 1.25 },
        { name: 'Square Edition (2.5" x 2.5")', priceMultiplier: 1.15 }
      ],
      materials: [
        { name: 'Premium Matt 350gsm', priceMultiplier: 1.0 },
        { name: 'Velvet Laminated 400gsm', priceMultiplier: 1.3 },
        { name: 'Professional Offset (3mm Bleed)', priceMultiplier: 1.5 },
        { name: 'Golden Foil Highlights 350gsm', priceMultiplier: 1.75 }
      ],
      quantitySlabs: [
        { quantity: 100, unitPrice: 4.5 },
        { quantity: 250, unitPrice: 3.8 },
        { quantity: 500, unitPrice: 3.0 },
        { quantity: 1000, unitPrice: 2.2 },
        { quantity: 5000, unitPrice: 1.6 }
      ],
      image: CATEGORY_DEFAULT_IMAGES['Business Cards'],
      published: true,
      inventory: 12
    },
    {
    id: 'prod-2',
    name: 'Premium Standee Banner',
    category: 'Banners',
    description: 'Self-standing collapsible display banner. Complete with vertical aluminium retracting stand and high-durability vinyl print.',
    sizes: [
      { name: 'Standard (2.0\' x 5.0\')', priceMultiplier: 1.0 },
      { name: 'Executive Large (3.0\' x 6.0\')', priceMultiplier: 1.45 },
      { name: 'Grand Exhibition (4.0\' x 7.0\')', priceMultiplier: 1.95 }
    ],
    materials: [
      { name: 'Eco-Solvent flex sheet 340gsm', priceMultiplier: 1.0 },
      { name: 'Premium Non-Teat star flex 440gsm', priceMultiplier: 1.35 },
      { name: 'High-Definition Matte Vinyl', priceMultiplier: 1.6 }
    ],
    quantitySlabs: [
      { quantity: 1, unitPrice: 1200 },
      { quantity: 5, unitPrice: 1050 },
      { quantity: 10, unitPrice: 950 },
      { quantity: 25, unitPrice: 850 },
      { quantity: 100, unitPrice: 750 }
    ],
    image: CATEGORY_DEFAULT_IMAGES['Banners'],
    published: true
  },
  {
    id: 'prod-3',
    name: 'Heavy Duty Outdoor Flex Banner',
    category: 'Flex',
    description: 'Perfect for outdoor billboards, shop front boards, or dynamic event headers. Tear-resistant, completely waterproof material.',
    sizes: [
      { name: 'Small Stage (4\' x 6\')', priceMultiplier: 0.8 },
      { name: 'Standard Hoarding (8\' x 12\')', priceMultiplier: 1.5 },
      { name: 'Mega Exhibition (10\' x 20\')', priceMultiplier: 2.5 }
    ],
    materials: [
      { name: 'Frontlit Flex 320gsm', priceMultiplier: 1.0 },
      { name: 'Backlit High-Glow Flex 510gsm', priceMultiplier: 1.8 },
      { name: 'Blackback Premium blockout 440gsm', priceMultiplier: 1.4 }
    ],
    quantitySlabs: [
      { quantity: 1, unitPrice: 850 },
      { quantity: 5, unitPrice: 750 },
      { quantity: 10, unitPrice: 680 },
      { quantity: 50, unitPrice: 550 }
    ],
    image: CATEGORY_DEFAULT_IMAGES['Flex'],
    published: true,
    inventory: 5
  },
  {
    id: 'prod-4',
    name: 'Gamer & Artwork Posters',
    category: 'Posters',
    description: 'High-fidelity prints on thick coated stock. Perfect for merch, retail store exhibits, wall frames, or promotional events.',
    sizes: [
      { name: 'A4 Dimension (8.3" x 11.7")', priceMultiplier: 0.75 },
      { name: 'A3 Premium (11.7" x 16.5")', priceMultiplier: 1.0 },
      { name: 'A2 Giant (16.5" x 23.4")', priceMultiplier: 1.6 },
      { name: 'A1 Exhibition Size (23.4" x 33.1")', priceMultiplier: 2.4 }
    ],
    materials: [
      { name: 'Premium Coated Glossy 220gsm', priceMultiplier: 1.0 },
      { name: 'Ultra-Fine Royal Velvet 280gsm', priceMultiplier: 1.35 },
      { name: 'Laminated Satin Photo-silk 250gsm', priceMultiplier: 1.5 }
    ],
    quantitySlabs: [
      { quantity: 10, unitPrice: 38 },
      { quantity: 50, unitPrice: 28 },
      { quantity: 100, unitPrice: 22 },
      { quantity: 500, unitPrice: 15 },
      { quantity: 1000, unitPrice: 11 }
    ],
    image: CATEGORY_DEFAULT_IMAGES['Posters'],
    published: true,
    inventory: 45
  },
  {
    id: 'prod-5',
    name: 'Tri-Fold Company Brochures',
    category: 'Brochures',
    description: 'Two-sided full color tri-fold brochures. Perfect for displaying product ranges, service listings, or restaurant menus.',
    sizes: [
      { name: 'Standard A4 Open (Tri-Fold)', priceMultiplier: 1.0 },
      { name: 'Premium Compact A5 Open (Bi-Fold)', priceMultiplier: 0.85 }
    ],
    materials: [
      { name: 'Art Paper Matt 130gsm', priceMultiplier: 1.0 },
      { name: 'Luxe Heavy Art Card 170gsm', priceMultiplier: 1.25 },
      { name: 'Professional Offset (3mm Bleed)', priceMultiplier: 1.4 },
      { name: 'Non-tearable Synthetic Matte Card', priceMultiplier: 1.75 }
    ],
    quantitySlabs: [
      { quantity: 100, unitPrice: 9.5 },
      { quantity: 500, unitPrice: 7.2 },
      { quantity: 1000, unitPrice: 5.5 },
      { quantity: 5000, unitPrice: 3.8 }
    ],
    image: CATEGORY_DEFAULT_IMAGES['Brochures'],
    published: true,
    inventory: 65
  },
  {
    id: 'prod-6',
    name: 'Corporate Executive Letterheads',
    category: 'Stationery',
    description: 'High grade executive stationery sheets suitable for ink-jet, laser jet, and fountain Pen writing, complete with official watermark textures.',
    sizes: [
      { name: 'Standard A4 Letterhead Sheets', priceMultiplier: 1.0 },
      { name: 'Compact Custom Memorial Fold A5', priceMultiplier: 0.8 }
    ],
    materials: [
      { name: 'Classic Alabaster Executive 90gsm', priceMultiplier: 1.0 },
      { name: 'Royal Laid premium Bond 120gsm', priceMultiplier: 1.45 },
      { name: 'Recycled Organic Eco Kraft 100gsm', priceMultiplier: 1.15 }
    ],
    quantitySlabs: [
      { quantity: 100, unitPrice: 6.0 },
      { quantity: 500, unitPrice: 4.5 },
      { quantity: 1000, unitPrice: 3.5 },
      { quantity: 5000, unitPrice: 2.2 }
    ],
    image: CATEGORY_DEFAULT_IMAGES['Stationery'],
    published: true
  },
  {
    id: 'prod-7',
    name: 'Custom Printed T-Shirts',
    category: 'T-Shirts',
    description: 'High quality 180gsm combed cotton t-shirts with durable DTF printing. Perfect for corporate events or casual wear.',
    sizes: [
      { name: 'Medium (M)', priceMultiplier: 1.0 },
      { name: 'Large (L)', priceMultiplier: 1.0 },
      { name: 'Extra Large (XL)', priceMultiplier: 1.05 },
      { name: 'Double Extra Large (XXL)', priceMultiplier: 1.1 }
    ],
    materials: [
      { name: '100% Combed Cotton 180gsm', priceMultiplier: 1.0 },
      { name: 'Premium Bio-Washed Cotton 220gsm', priceMultiplier: 1.25 },
      { name: 'Dry-Fit Polyester', priceMultiplier: 0.9 }
    ],
    quantitySlabs: [
      { quantity: 1, unitPrice: 450 },
      { quantity: 10, unitPrice: 380 },
      { quantity: 50, unitPrice: 320 },
      { quantity: 100, unitPrice: 280 }
    ],
    image: CATEGORY_DEFAULT_IMAGES['T-Shirts'],
    published: true
  },
  {
    id: 'prod-8',
    name: 'Personalized Photo Mugs',
    category: 'Mugs',
    description: 'Premium ceramic mugs with vivid sublimation printing. Microwave safe and perfect for gifting.',
    sizes: [
      { name: 'Standard 330ml (11oz)', priceMultiplier: 1.0 },
      { name: 'Large 450ml (15oz)', priceMultiplier: 1.3 }
    ],
    materials: [
      { name: 'Glossy White Ceramic', priceMultiplier: 1.0 },
      { name: 'Magic Color Changing (Heat Reveal)', priceMultiplier: 1.5 },
      { name: 'Inner Color Handle Ceramic', priceMultiplier: 1.2 }
    ],
    quantitySlabs: [
      { quantity: 1, unitPrice: 250 },
      { quantity: 10, unitPrice: 199 },
      { quantity: 50, unitPrice: 165 },
      { quantity: 100, unitPrice: 145 }
    ],
    image: CATEGORY_DEFAULT_IMAGES['Mugs'],
    published: true
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'PB-2026-6101',
    customerId: 'cust-1',
    customerName: 'Rohit Sharma',
    customerEmail: 'rohit@printbazaar.in',
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        productName: 'Velvet-Touch Business Cards',
        productCategory: 'Business Cards',
        selectedSize: { name: 'Standard (3.5" x 2.0")', priceMultiplier: 1.0 },
        selectedMaterial: { name: 'Velvet Laminated 400gsm', priceMultiplier: 1.3 },
        selectedQuantity: 500,
        designFile: {
          name: 'rohit_business_card_v2.pdf',
          size: 4500000,
          type: 'application/pdf'
        },
        itemTotal: 1950, // 500 * ₹3.0 * 1.0 * 1.3
        advanceAmount: 1950,
        balanceAmount: 0,
        productImage: CATEGORY_DEFAULT_IMAGES['Business Cards']
      }
    ],
    totalAmount: 1950,
    advancePaid: true,
    balancePaid: true,
    payments: [
      {
        method: 'UPI',
        txId: 'TXN82749381739',
        amount: 1950,
        timestamp: '2026-06-09T11:22:45Z'
      }
    ],
    status: 'Delivered',
    createdAt: '2026-06-09T11:20:10Z',
    updatedAt: '2026-06-09T14:45:00Z'
  },
  {
    id: 'PB-2026-6102',
    customerId: 'cust-2',
    customerName: 'Aditi Verma',
    customerEmail: 'aditi@fashionhub.co',
    items: [
      {
        id: 'item-2',
        productId: 'prod-2',
        productName: 'Premium Standee Banner',
        productCategory: 'Banners',
        selectedSize: { name: 'Executive Large (3.0\' x 6.0\')', priceMultiplier: 1.45 },
        selectedMaterial: { name: 'High-Definition Matte Vinyl', priceMultiplier: 1.6 },
        selectedQuantity: 2,
        designFile: {
          name: 'fashionhub_summer_collection.ai',
          size: 24500000,
          type: 'application/postscript'
        },
        itemTotal: 3828, // 2 * ₹1200 * 1.45 * 1.6 = 3828 (1200 is slab unit price for qty 2 since slab 1 applies)
        advanceAmount: 3828,
        balanceAmount: 0,
        productImage: CATEGORY_DEFAULT_IMAGES['Banners']
      }
    ],
    totalAmount: 3828,
    advancePaid: true,
    balancePaid: true,
    payments: [
      {
        method: 'Card',
        txId: 'TXN55283749449',
        amount: 3828,
        timestamp: '2026-06-08T09:12:00Z'
      }
    ],
    status: 'Shipped',
    trackingNumber: 'DEL-IN-889274921',
    courierName: 'Delhivery',
    createdAt: '2026-06-08T09:05:00Z',
    updatedAt: '2026-06-10T10:30:00Z'
  }
];

// Helper to calculate total price based on configuration
export function calculateItemPrice(
  product: Product,
  size: { priceMultiplier: number },
  material: { priceMultiplier: number },
  quantity: number
): number {
  // Find unit price from matching bulk slabs (nearest quantity slab <= selected quantity)
  // Sorted descending to search from largest down
  const sortedSlabs = [...product.quantitySlabs].sort((a, b) => b.quantity - a.quantity);
  const matchingSlab = sortedSlabs.find(slab => quantity >= slab.quantity) || sortedSlabs[sortedSlabs.length - 1];
  
  if (!matchingSlab) return 0;
  
  const baseUnitPrice = matchingSlab.unitPrice;
  const rawTotal = quantity * baseUnitPrice * size.priceMultiplier * material.priceMultiplier;
  
  return Math.round(rawTotal);
}

export const DEMO_SOCIAL_POSTS: any[] = [
  {
    id: 'demo-1',
    creatorId: 'print_bazaar_official',
    creatorName: 'PrintBazaar Official',
    creatorAvatar: 'https://i.pravatar.cc/150?u=pb',
    creatorBadges: ['verified', 'official'],
    caption: 'Discover the new standard in printing. Our luxury wedding card collection is now live! 👑✨ #LuxuryWedding #WeddingCards #PrintBazaar',
    media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1544365558-35aa4afcf11f?q=80&w=800&auto=format&fit=crop' }],
    tags: ['LuxuryWedding', 'WeddingCards', 'PrintBazaar'],
    likesCount: 1450,
    commentCount: 124,
    shareCount: 450,
    saveCount: 890,
    isAiGenerated: false,
    isVerified: true,
    linkedProductId: 'p-wedding-card',
    productCategory: 'Wedding Cards',
    createdAt: new Date('2026-06-16T10:00:00Z')
  },
  {
    id: 'demo-2',
    creatorId: 'creative_kartik',
    creatorName: 'Creative Kartik',
    creatorAvatar: 'https://i.pravatar.cc/150?u=kartik',
    creatorBadges: ['verified_seller', 'top_rated'],
    caption: 'Minimalist business cards speaking volumes. Matte finish with spot UV. 💼 #BusinessCards #Minimalist #CorporateIdentity',
    media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1589118949245-7d38baf380d6?q=80&w=800&auto=format&fit=crop' }],
    tags: ['BusinessCards', 'Minimalist', 'CorporateIdentity'],
    likesCount: 890,
    commentCount: 45,
    shareCount: 120,
    saveCount: 450,
    isAiGenerated: false,
    isVerified: true,
    linkedProductId: 'p-business-card',
    createdAt: new Date('2026-06-15T14:30:00Z')
  },
  {
    id: 'demo-3',
    creatorId: 'design_hub',
    creatorName: 'Design Hub',
    creatorAvatar: 'https://i.pravatar.cc/150?u=hub',
    creatorBadges: ['verified_creator'],
    caption: 'Behind the scenes of our latest vintage poster prints! 🎬 Watch till the end for the final result. #PosterDesign #VintageArt #Printing',
    media: [{ type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4', thumbnail: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=800&auto=format&fit=crop' }],
    tags: ['PosterDesign', 'VintageArt', 'Printing'],
    likesCount: 3200,
    commentCount: 210,
    shareCount: 890,
    saveCount: 1200,
    isAiGenerated: false,
    isVerified: true,
    linkedProductId: 'p-poster-a3',
    createdAt: new Date('2026-06-14T09:15:00Z')
  },
  {
    id: 'demo-4',
    creatorId: 'mumbai_printer',
    creatorName: 'Standard Printing House',
    creatorAvatar: 'https://i.pravatar.cc/150?u=sph',
    creatorBadges: ['verified_seller'],
    caption: 'Live from the floor: 10,000 festival flyers ready for dispatch. High-speed offset calibration at its best! 🖨️💥 #Printing #Mumbai #Logistics',
    media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1562654501-a0ccc0fa3fb1?q=80&w=800&auto=format&fit=crop' }],
    tags: ['Printing', 'Flyers', 'BulkOrder'],
    likesCount: 432,
    commentCount: 24,
    shareCount: 52,
    saveCount: 115,
    isAiGenerated: false,
    isVerified: true,
    linkedProductId: 'p-flyers',
    createdAt: new Date('2026-06-16T18:00:00Z')
  },
  {
    id: 'demo-5',
    creatorId: 'pb_ai_bot',
    creatorName: 'PrintAI Gen',
    creatorAvatar: 'https://i.pravatar.cc/150?u=ai',
    creatorBadges: ['ai_creator'],
    caption: 'Futuristic packaging concepts using the new AI Remix tool. Neon-cyber theme looks mesmerizing. 🤖✨ #AIArt #Packaging #Neon',
    media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop' }],
    tags: ['AIArt', 'Packaging', 'Business'],
    likesCount: 1850,
    commentCount: 142,
    shareCount: 220,
    saveCount: 560,
    isAiGenerated: true,
    isVerified: false,
    createdAt: new Date('2026-06-13T11:20:00Z')
  },
  {
    id: 'demo-6',
    creatorId: 'restaurant_branding',
    creatorName: 'Menu Masters',
    creatorAvatar: 'https://i.pravatar.cc/150?u=menu',
    creatorBadges: ['verified_seller'],
    caption: 'Elegant fine-dining menus with gold foil stamping. First impressions matter! 🍽️✨ #RestaurantMenu #FoilStamping #Branding',
    media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800&auto=format&fit=crop' }],
    tags: ['Menu', 'Restaurant', 'Luxury'],
    likesCount: 670,
    commentCount: 38,
    shareCount: 95,
    saveCount: 210,
    isAiGenerated: false,
    isVerified: true,
    createdAt: new Date('2026-06-12T16:45:00Z')
  },
  {
    id: 'demo-7',
    creatorId: 'wedding_studio',
    creatorName: 'Royal Wedding Studio',
    creatorAvatar: 'https://i.pravatar.cc/150?u=royal',
    creatorBadges: ['verified', 'trending'],
    caption: 'Traditional patterns reinvented for modern couples. Velvet touch invitation cards. 🌺💍 #IndianWedding #InvitationCards #Royal',
    media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=800&auto=format&fit=crop' }],
    tags: ['Wedding', 'Traditional', 'Invitation'],
    likesCount: 5400,
    commentCount: 312,
    shareCount: 1450,
    saveCount: 2300,
    isAiGenerated: false,
    isVerified: true,
    createdAt: new Date('2026-06-11T13:10:00Z')
  },
  {
    id: 'demo-8',
    creatorId: 'print_magic',
    creatorName: 'Print Magic',
    creatorAvatar: 'https://i.pravatar.cc/150?u=magic',
    creatorBadges: ['verified_seller'],
    caption: 'How to assemble our 3D pop-up packaging! Satisfying to watch. 📦🪄 #PackagingDesign #Tutorial #PrintMagic',
    media: [{ type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4', thumbnail: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=800&auto=format&fit=crop' }],
    tags: ['Packaging', 'Tutorial', 'Design'],
    likesCount: 4200,
    commentCount: 185,
    shareCount: 940,
    saveCount: 1560,
    isAiGenerated: false,
    isVerified: true,
    createdAt: new Date('2026-06-10T15:20:00Z')
  },
  {
    id: 'demo-9',
    creatorId: 'logo_lab',
    creatorName: 'Logo Lab',
    creatorAvatar: 'https://i.pravatar.cc/150?u=logo',
    creatorBadges: ['verified_creator'],
    caption: 'Corporate identity re-imagined. Bold typography on textured cotton paper. ✍️🏢 #LogoDesign #Corporate #Identity',
    media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=800&auto=format&fit=crop' }],
    tags: ['Logo', 'Corporate', 'Branding'],
    likesCount: 890,
    commentCount: 56,
    shareCount: 110,
    saveCount: 420,
    isAiGenerated: false,
    isVerified: true,
    createdAt: new Date('2026-06-09T09:40:00Z')
  },
  {
    id: 'demo-10',
    creatorId: 'sticker_boss',
    creatorName: 'Sticker Boss',
    creatorAvatar: 'https://i.pravatar.cc/150?u=sticker',
    creatorBadges: ['trending'],
    caption: 'Die-cut holographic stickers fresh off the roll! Perfect for laptops. ✨💻 #Stickers #Holographic #DieCut',
    media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1572374984501-c9183ccce2eb?q=80&w=800&auto=format&fit=crop' }],
    tags: ['Stickers', 'Holographic', 'DieCut'],
    likesCount: 1250,
    commentCount: 89,
    shareCount: 340,
    saveCount: 670,
    isAiGenerated: false,
    isVerified: false,
    createdAt: new Date('2026-06-08T11:00:00Z')
  },
  {
    id: 'demo-11',
    creatorId: 'creative_kartik',
    creatorName: 'Creative Kartik',
    creatorAvatar: 'https://i.pravatar.cc/150?u=kartik',
    creatorBadges: ['verified_seller', 'top_rated'],
    caption: 'Custom coffee cup sleeves for local cafe. Eco-friendly kraft paper prints! ☕🌿 #EcoPackaging #CoffeeShop #Branding',
    media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=80&w=800&auto=format&fit=crop' }],
    tags: ['Packaging', 'EcoFriendly', 'Coffee'],
    likesCount: 740,
    commentCount: 42,
    shareCount: 85,
    saveCount: 230,
    isAiGenerated: false,
    isVerified: true,
    createdAt: new Date('2026-06-07T14:15:00Z')
  },
  {
    id: 'demo-12',
    creatorId: 'poster_king',
    creatorName: 'Poster King',
    creatorAvatar: 'https://i.pravatar.cc/150?u=king',
    creatorBadges: ['verified_creator', 'trending'],
    caption: 'Abstract geometric poster series. A3 size, fine art litho print. 🖼️📐 #AbstractArt #PosterDesign #WallArt',
    media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=800&auto=format&fit=crop' }],
    tags: ['Poster', 'AbstractArt', 'LithoPrint'],
    likesCount: 2100,
    commentCount: 154,
    shareCount: 680,
    saveCount: 1420,
    isAiGenerated: false,
    isVerified: true,
    linkedProductId: 'p-poster-a3',
    createdAt: new Date('2026-06-06T10:30:00Z')
  },
  {
    id: 'demo-13',
    creatorId: 'pb_ai_bot',
    creatorName: 'PrintAI Gen',
    creatorAvatar: 'https://i.pravatar.cc/150?u=ai',
    creatorBadges: ['ai_creator'],
    caption: 'AI generated seamless patterns for custom wrapping paper! 🎁✨ #WrappingPaper #AIArt #Patterns',
    media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?q=80&w=800&auto=format&fit=crop' }],
    tags: ['AIArt', 'Patterns', 'WrappingPaper'],
    likesCount: 950,
    commentCount: 67,
    shareCount: 210,
    saveCount: 480,
    isAiGenerated: true,
    isVerified: false,
    createdAt: new Date('2026-06-05T08:50:00Z')
  },
  {
    id: 'demo-14',
    creatorId: 'festival_prints',
    creatorName: 'Festival Prints',
    creatorAvatar: 'https://i.pravatar.cc/150?u=fest',
    creatorBadges: ['verified_seller'],
    caption: 'Diwali hamper boxes customized with company logos. Preparing for the festive rush! 🪔📦 #CorporateGifting #Diwali #Packaging',
    media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1584449830571-0811b7dfb340?q=80&w=800&auto=format&fit=crop' }],
    tags: ['Packaging', 'Festival', 'Corporate'],
    likesCount: 1650,
    commentCount: 120,
    shareCount: 450,
    saveCount: 890,
    isAiGenerated: false,
    isVerified: true,
    createdAt: new Date('2026-06-04T12:00:00Z')
  },
  {
    id: 'demo-15',
    creatorId: 'wedding_studio',
    creatorName: 'Royal Wedding Studio',
    creatorAvatar: 'https://i.pravatar.cc/150?u=royal',
    creatorBadges: ['verified', 'trending'],
    caption: 'Unboxing our new acrylic invitation cards. Pure luxury! ✨✉️ #WeddingCards #AcrylicInvitation #Unboxing',
    media: [{ type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4', thumbnail: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=800&auto=format&fit=crop' }],
    tags: ['Wedding', 'Acrylic', 'Unboxing'],
    likesCount: 6800,
    commentCount: 450,
    shareCount: 1800,
    saveCount: 3100,
    isAiGenerated: false,
    isVerified: true,
    createdAt: new Date('2026-06-03T16:20:00Z')
  },
  {
    id: 'demo-16',
    creatorId: 'design_hub',
    creatorName: 'Design Hub',
    creatorAvatar: 'https://i.pravatar.cc/150?u=hub',
    creatorBadges: ['verified_creator'],
    caption: 'Event tickets with UV security watermarks. Cool and secure! 🎫🔒 #EventTickets #SecurityPrint #Design',
    media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1542038385-d85c5a083f2a?q=80&w=800&auto=format&fit=crop' }],
    tags: ['Tickets', 'PrintSecurity', 'Event'],
    likesCount: 540,
    commentCount: 32,
    shareCount: 78,
    saveCount: 150,
    isAiGenerated: false,
    isVerified: true,
    createdAt: new Date('2026-06-02T10:10:00Z')
  },
  {
    id: 'demo-17',
    creatorId: 'print_bazaar_official',
    creatorName: 'PrintBazaar Official',
    creatorAvatar: 'https://i.pravatar.cc/150?u=pb',
    creatorBadges: ['verified', 'official'],
    caption: 'Introducing transparent business cards! Stand out from the crowd. 🪟💼 #TransparentCard #BusinessCards #Innovation',
    media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1589118949822-7936d5e49dfc?q=80&w=800&auto=format&fit=crop' }],
    tags: ['BusinessCards', 'Innovation', 'PrintBazaar'],
    likesCount: 3200,
    commentCount: 280,
    shareCount: 950,
    saveCount: 1400,
    isAiGenerated: false,
    isVerified: true,
    linkedProductId: 'p-business-card',
    createdAt: new Date('2026-06-01T09:00:00Z')
  },
  {
    id: 'demo-18',
    creatorId: 'logo_lab',
    creatorName: 'Logo Lab',
    creatorAvatar: 'https://i.pravatar.cc/150?u=logo',
    creatorBadges: ['verified_creator'],
    caption: 'Creating a cohesive brand identity: From logo to letterheads and envelopes. ✉️✒️ #Branding #Letterhead #Identity',
    media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?q=80&w=800&auto=format&fit=crop' }],
    tags: ['Branding', 'Letterhead', 'Identity'],
    likesCount: 1100,
    commentCount: 85,
    shareCount: 230,
    saveCount: 540,
    isAiGenerated: false,
    isVerified: true,
    createdAt: new Date('2026-05-31T14:40:00Z')
  },
  {
    id: 'demo-19',
    creatorId: 'tshirt_pro',
    creatorName: 'T-Shirt Pro',
    creatorAvatar: 'https://i.pravatar.cc/150?u=tshirt',
    creatorBadges: ['verified_seller'],
    caption: 'DTF printing in action! Vibrant colors on black cotton tees. 👕🎨 #DTFPrint #Tshirts #Apparel',
    media: [{ type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4', thumbnail: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?q=80&w=800&auto=format&fit=crop' }],
    tags: ['Tshirts', 'Apparel', 'DTF'],
    likesCount: 2800,
    commentCount: 190,
    shareCount: 560,
    saveCount: 890,
    isAiGenerated: false,
    isVerified: true,
    linkedProductId: 'p-tshirt',
    createdAt: new Date('2026-05-30T11:20:00Z')
  },
  {
    id: 'demo-20',
    creatorId: 'creative_kartik',
    creatorName: 'Creative Kartik',
    creatorAvatar: 'https://i.pravatar.cc/150?u=kartik',
    creatorBadges: ['verified_seller', 'top_rated'],
    caption: 'Elegant save-the-date magnets. A unique way to announce your big day! 🧲💖 #SaveTheDate #Magnets #Wedding',
    media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1522031580979-37bd180d55e0?q=80&w=800&auto=format&fit=crop' }],
    tags: ['Wedding', 'Magnets', 'SaveTheDate'],
    likesCount: 1450,
    commentCount: 110,
    shareCount: 320,
    saveCount: 650,
    isAiGenerated: false,
    isVerified: true,
    createdAt: new Date('2026-05-29T15:50:00Z')
  }
];

// Fallback to old name just in case
export const INITIAL_SOCIAL_POSTS = DEMO_SOCIAL_POSTS;

// Global Storage Hook mimics standard hooks
export function getLocalStorageData<T>(key: string, initialValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : initialValue;
  } catch (error) {
    console.warn('Error reading localStorage key', key, error);
    return initialValue;
  }
}

export function setLocalStorageData<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Error setting localStorage key', key, error);
  }
}

INITIAL_PRODUCTS.forEach(p => {
  if (!p.estimatedProductionTime) p.estimatedProductionTime = '3-5 Business Days';
  if (!p.dispatchLeadTime) p.dispatchLeadTime = 'Same Day after Production';
});
