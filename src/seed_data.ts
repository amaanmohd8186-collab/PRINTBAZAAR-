import { Product } from './types';

export const SEED_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Velvet-Touch Business Cards',
    category: 'Business Cards',
    description: 'Premium quality visiting cards with double-sided velvet matte lamination. Creates an unforgettable first impression.',
    estimatedProductionTime: '24-48 Hours',
    dispatchLeadTime: 'Within 3 Business Days',
    sizes: [
      { name: 'Standard (3.5" x 2.0")', priceMultiplier: 1.0 },
      { name: 'Rounded Corners (3.5" x 2.0")', priceMultiplier: 1.25 }
    ],
    materials: [
      { name: 'Premium Matt 350gsm', priceMultiplier: 1.0 },
      { name: 'Velvet Laminated 400gsm', priceMultiplier: 1.3 }
    ],
    quantitySlabs: [
      { quantity: 100, unitPrice: 4.5 },
      { quantity: 500, unitPrice: 3.0 }
    ],
    image: 'https://images.unsplash.com/photo-1589254065878-42c9da997008?auto=format&fit=crop&w=600&q=80',
    published: true,
    inventory: 100
  },
  {
    id: 'prod-2',
    name: 'Royal Wedding Invitations',
    category: 'Wedding Cards',
    description: 'Elegant gold-foiled wedding cards on premium textured paper.',
    estimatedProductionTime: '72-96 Hours',
    dispatchLeadTime: 'Within 5 Business Days',
    sizes: [
      { name: 'Classic A5', priceMultiplier: 1.0 },
      { name: 'Square Fold', priceMultiplier: 1.2 }
    ],
    materials: [
      { name: 'Textured Cream 300gsm', priceMultiplier: 1.0 },
      { name: 'Metallic Gold 350gsm', priceMultiplier: 1.5 }
    ],
    quantitySlabs: [
      { quantity: 50, unitPrice: 15 },
      { quantity: 100, unitPrice: 12 }
    ],
    image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=600&q=80',
    published: true,
    inventory: 50
  }
];
