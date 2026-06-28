import { adminDb } from './server/firebase';
import { FieldValue } from 'firebase-admin/firestore';

const CATEGORIES = [
  'Business Cards', 'Visiting Cards', 'Wedding Cards', 'Banners', 'Flex', 'Posters',
  'Books', 'Brochures', 'Stationery', 'Stickers', 'Flyers', 'ID Cards', 'Certificates',
  'Canvas Prints', 'Photo Frames', 'T-Shirts', 'Mugs', 'Packaging', 'Calendars',
  'Menus', 'Labels', 'QR Cards', 'NFC Cards'
];

const SEED_PRODUCTS = [
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

async function seed() {
  const db = adminDb();
  console.log('Seeding products...');
  
  const productsCol = db.collection('products');
  
  for (const product of SEED_PRODUCTS) {
    await productsCol.doc(product.id).set({
      ...product,
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp()
    }, { merge: true });
    console.log(`Seeded product: ${product.name}`);
  }

  const settingsRef = db.collection('platform_settings').doc('main');
  await settingsRef.set({
    lastSeededAt: FieldValue.serverTimestamp(),
    isProductionReady: true
  }, { merge: true });

  console.log('Seeding completed successfully.');
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
