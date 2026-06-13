/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Printer, 
  ShoppingBag, 
  ShieldCheck, 
  Settings, 
  User, 
  Search, 
  Clock, 
  Truck,
  ChevronRight, 
  Plus, 
  Sparkles, 
  Info, 
  CheckCircle2, 
  AlertTriangle,
  Grid,
  LogOut,
  Sparkle,
  Heart,
  Wand2,
  QrCode,
  Receipt
} from 'lucide-react';
import { Product, ProductCategory, Order, CartItem, OrderStatus, PaymentDetails, UserSession, UserStats, Address } from './types';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { 
  CATEGORIES, 
  CATEGORY_DEFAULT_IMAGES,
  INITIAL_PRODUCTS, 
  INITIAL_ORDERS, 
  getLocalStorageData, 
  setLocalStorageData 
} from './data';
import { 
  collection, 
  addDoc,
  doc, 
  setDoc, 
  getDoc,
  getDocs,
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where,
  getDocFromServer
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import CustomizeModal from './components/CustomizeModal';
import CartView from './components/CartView';
import OrdersTracker from './components/OrdersTracker';
import AdminWorkspace from './components/AdminWorkspace';
import PrintQualitySlider from './components/PrintQualitySlider';
import SplashPreview from './components/SplashPreview';
import SellerVerificationSystem from './components/SellerVerificationSystem';
import BannerManager from './components/BannerManager';
import BulkQuoteGenerator from './components/BulkQuoteGenerator';
import FranchiseModule from './components/FranchiseModule';
import AiCustomerAssistant from './components/AiCustomerAssistant';
import PBWallet from './components/PBWallet';
import AICredits from './components/AICredits';
import ProfileAddresses from './components/ProfileAddresses';
import LoyaltyRewards from './components/LoyaltyRewards';
import SavedDesigns from './components/SavedDesigns';
import PremiumUpgrade from './components/PremiumUpgrade';
import PaymentHistory from './components/PaymentHistory';
import WhatsAppFloatingButton from './components/WhatsAppFloatingButton';
import AiStudioWorkspace from './components/AiStudioWorkspace';
import { DesignEditor } from './components/DesignEditor';
import { VerificationAuditDashboard } from './components/VerificationAuditDashboard';
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';
import { AnimatePresence, motion } from 'motion/react';

// Helper to recursively remove undefined fields so Firestore doesn't reject writes
function removeUndefinedFields(obj: any): any {
  if (obj === null || obj === undefined) {
    return null;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefinedFields(item));
  }
  if (typeof obj === 'object') {
    const newObj: any = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val !== undefined) {
        newObj[key] = removeUndefinedFields(val);
      }
    }
    return newObj;
  }
  return obj;
}

interface ZoomableImageProps {
  src: string;
  alt: string;
  className?: string;
  category?: string;
}

function ZoomableImage({ src, alt, className = "", category }: ZoomableImageProps) {
  const [coords, setCoords] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const activeSrc = src || (category ? CATEGORY_DEFAULT_IMAGES[category as any] : CATEGORY_DEFAULT_IMAGES['Business Cards']);
    setImgSrc(activeSrc);
    setIsLoading(true);
    setHasError(false);

    const img = new Image();
    img.src = activeSrc;
    img.onload = () => {
      setIsLoading(false);
    };
    img.onerror = () => {
      setIsLoading(false);
      setHasError(true);
      console.warn(`[Image Preload Failure] Failed to load: ${src}. Falling back.`);
      const fallback = CATEGORY_DEFAULT_IMAGES[category as any] || CATEGORY_DEFAULT_IMAGES['Business Cards'];
      setImgSrc(fallback);
    };
  }, [src, category]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setCoords({ x, y });
  };

  return (
    <div
      className="relative overflow-hidden w-full h-full cursor-zoom-in rounded-[30px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-zinc-100 animate-pulse flex items-center justify-center">
          <span className="text-[10px] font-mono text-zinc-400">Loading...</span>
        </div>
      )}
      <img
        src={imgSrc}
        alt={alt}
        referrerPolicy="no-referrer"
        className={`w-full h-full object-cover transition-transform duration-250 ease-out ${isLoading ? 'opacity-0' : 'opacity-100'} ${className}`}
        style={{
          transform: isHovered ? 'scale(2.2)' : 'scale(1)',
          transformOrigin: `${coords.x}% ${coords.y}%`
        }}
        onError={() => {
          if (!hasError) {
            setHasError(true);
            const fallback = CATEGORY_DEFAULT_IMAGES[category as any] || CATEGORY_DEFAULT_IMAGES['Business Cards'];
            console.warn(`[Image Run Error] Broken URL fallback details: ${src}`);
            setImgSrc(fallback);
          }
        }}
      />
    </div>
  );
}

function HoverVideoPlayer({ src, thumbnail, alt, category }: { src: string; thumbnail: string; alt: string; category: string }) {
  const [hovered, setHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [imgSrc, setImgSrc] = useState(thumbnail);

  useEffect(() => {
    setImgSrc(thumbnail || CATEGORY_DEFAULT_IMAGES[category as any] || CATEGORY_DEFAULT_IMAGES['Business Cards']);
  }, [thumbnail, category]);

  useEffect(() => {
    if (videoRef.current) {
      if (hovered) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [hovered]);

  return (
    <div 
      className="w-full h-full relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img
        src={imgSrc}
        alt={alt}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 z-10 ${hovered ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        onError={(e) => {
          console.warn(`[HoverVideoPlayer Image Error] fallback active`);
          const fallback = CATEGORY_DEFAULT_IMAGES[category as any] || CATEGORY_DEFAULT_IMAGES['Business Cards'];
          setImgSrc(fallback);
        }}
      />
      <video
        ref={videoRef}
        src={src}
        loop
        muted
        playsInline
        className={`w-full h-full object-cover transition-opacity duration-300 ${hovered ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}

export default function App() {
  const { theme, setTheme } = useTheme();
  const [showSplash, setShowSplash] = useState(true);
  // 1. Core State shifted to Firestore only
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>(() => 
    getLocalStorageData<CartItem[]>('pb_cart', [])
  );
  const [wishlistProducts, setWishlistProducts] = useState<string[]>([]);

  // 2. Navigation & View Modes
  // 'customer' mode lets you browse and order. 'admin' mode lets you manage pipeline stages.
  const [roleMode, setRoleMode] = useState<'customer' | 'admin'>('customer');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [customerActiveTab, setCustomerActiveTab] = useState<'shop' | 'cart' | 'status' | 'wishlist' | 'profile' | 'aistudio'>(() =>
    getLocalStorageData<'shop' | 'cart' | 'status' | 'wishlist' | 'profile'>('pb_active_tab', 'shop')
  );
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'All'>('All');
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  
  // Subscriber states
  const [subscriberEmail, setSubscriberEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  
  // Dynamic screen size type (mobile, tablet, laptop, desktop)
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'laptop' | 'desktop'>('desktop');

  // 3. User session info custom assigned
  const [session, setSession] = useState<UserSession>({
    id: 'amaanmohd8186_gmail_com', // derived or set on login
    name: 'Amaan Mohd',
    email: 'amaanmohd8186@gmail.com',
    role: 'customer'
  });

  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [focusConfigProduct, setFocusConfigProduct] = useState<Product | null>(null);
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'warn'; text: string } | null>(null);
  const [enterprisePortal, setEnterprisePortal] = useState<'none' | 'seller' | 'banners' | 'quotes' | 'franchise' | 'audit'>('none');
  const [profilePortal, setProfilePortal] = useState<'none' | 'wallet' | 'credits' | 'profile_addresses' | 'rewards' | 'saved_designs' | 'premium' | 'editor' | 'history'>('none');
  const [activePolicyView, setActivePolicyView] = useState<'none' | 'terms' | 'privacy'>('none');
  const [showQrModal, setShowQrModal] = useState<boolean>(false);

  useEffect(() => {
    if (activePolicyView !== 'none') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activePolicyView]);

  const prevOrdersRef = useRef<Order[]>([]);

  // Support globally dispatched custom toast actions
  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        triggerToast(customEvent.detail.text, customEvent.detail.type || 'success');
      }
    };
    const handleSwitchEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.type === 'enterprise') {
        setEnterprisePortal(customEvent.detail.portal);
      }
      if (customEvent.detail?.activeTab) {
        setCustomerActiveTab(customEvent.detail.activeTab);
      }
    };
    window.addEventListener('show-toast', handleToastEvent);
    window.addEventListener('switch-tab', handleSwitchEvent);
    return () => {
      window.removeEventListener('show-toast', handleToastEvent);
      window.removeEventListener('switch-tab', handleSwitchEvent);
    };
  }, []);

  // Request browser Notification permission on load
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(err => console.warn("Error requesting notification permission:", err));
    }
  }, []);

  // Dispatch message to registered Service Worker for system alert
  const triggerServiceWorkerNotification = (title: string, body: string) => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        payload: {
          title,
          options: {
            body,
            icon: '/manifest.json',
            vibrate: [200, 100, 200]
          }
        }
      });
    } else if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/manifest.json' });
      }
    }
  };

  // Sync session ID with Firebase User UID if available
  useEffect(() => {
    if (user) {
      setSession(prev => ({ ...prev, id: user.uid, email: user.email || prev.email, name: user.displayName || prev.name }));
    }
  }, [user]);

  const [userStats, setUserStats] = useState<UserStats>({
    totalSpent: 0,
    ordersCount: 0,
    wishlistCount: 0,
    walletBalance: 0,
    aiCredits: 10,
    referralEarnings: 0,
    loyaltyPoints: 0,
    subscriptionTier: 'Free'
  });

  // Fetch real-time stats from server
  useEffect(() => {
    if (user) {
      const statsRef = doc(db, 'user_stats', user.uid);
      const unsubscribe = onSnapshot(statsRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as UserStats;
          setUserStats(data);
        } else {
          // If stats doc doesn't exist yet, we don't force local resets
          // because it might be a new user.
        }
      }, (error) => {
        console.error("Stats listener failed:", error);
      });
      return () => unsubscribe();
    }
  }, [user]);

  // (No local storage sync for stats - Firestore is ground truth)

  // Auto-detection of responsive screens on resize & orientation shifts
  useEffect(() => {
    const detectScreenSize = () => {
      const w = window.innerWidth;
      if (w < 768) setScreenSize('mobile');
      else if (w < 1024) setScreenSize('tablet');
      else if (w < 1440) setScreenSize('laptop');
      else setScreenSize('desktop');
    };
    detectScreenSize();
    window.addEventListener('resize', detectScreenSize);
    return () => window.removeEventListener('resize', detectScreenSize);
  }, []);

  // Sync active tab to preserve on resumption / reload
  useEffect(() => {
    setLocalStorageData('pb_active_tab', customerActiveTab);
  }, [customerActiveTab]);

  // Unsaved changes warning blocker
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (cartItems.length > 0 || focusConfigProduct !== null) {
        const msg = 'You have unsaved changes. Are you sure you want to leave?';
        e.preventDefault();
        e.returnValue = msg;
        return msg;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [cartItems, focusConfigProduct]);

  // Native hardware/browser back gesture interception flow
  useEffect(() => {
    // Intercept physical Back triggers via popstate tracking
    window.history.replaceState({ step: 'home' }, '');
    window.history.pushState({ step: 'home_active' }, '');

    let lastBackClick = 0;

    const handleBackAction = () => {
      // If modal or subviews are active, override back button to close them instead of exiting
      if (focusConfigProduct) {
        setFocusConfigProduct(null);
        window.history.pushState({ step: 'home_active' }, '');
        return true;
      }
      if (showFaqModal) {
        setShowFaqModal(false);
        window.history.pushState({ step: 'home_active' }, '');
        return true;
      }
      if (enterprisePortal !== 'none') {
        setEnterprisePortal('none');
        window.history.pushState({ step: 'home_active' }, '');
        return true;
      }
      if (customerActiveTab !== 'shop') {
        setCustomerActiveTab('shop');
        window.history.pushState({ step: 'home_active' }, '');
        return true;
      }

      // If at home and back is pressed on Android/PWA: Double press warning triggers exit
      const currentTime = Date.now();
      if (currentTime - lastBackClick < 2000) {
        triggerToast("Exiting PrintBazaar...", 'success');
        setTimeout(() => {
          if (Capacitor.isNativePlatform()) {
            CapacitorApp.exitApp();
          } else {
            window.close();
          }
        }, 150);
        return true;
      } else {
        lastBackClick = currentTime;
        triggerToast("Press back again within 2 seconds to exit PrintBazaar.", 'warn');
        window.history.pushState({ step: 'home_active' }, '');
        return false;
      }
    };

    const handleSystemBack = (event: PopStateEvent) => {
      handleBackAction();
    };

    window.addEventListener('popstate', handleSystemBack);

    // Capacitor hardware back button handling
    let nativeListener: any = null;
    if (Capacitor.isNativePlatform()) {
      nativeListener = CapacitorApp.addListener('backButton', () => {
        handleBackAction();
      });
    }

    return () => {
      window.removeEventListener('popstate', handleSystemBack);
      if (nativeListener) {
        nativeListener.remove();
      }
    };
  }, [focusConfigProduct, showFaqModal, customerActiveTab]);

  // Automatically correct dummy placeholder images to category-specific real images
  useEffect(() => {
    setProducts(prevProducts => {
      let changed = false;
      const updated = prevProducts.map(p => {
        const isDummy = p.image.includes('unsplash.com') || p.image.includes('placeholder') || p.image.includes('random');
        // also, some old dummy unsplash urls might not match the specific category defaults perfectly 
        // we can force update any unsplash.com url that doesn't exactly match our new defaults (since the new ones are also unsplash.com but correct IDs)
        const isMismatch = isDummy && p.image !== CATEGORY_DEFAULT_IMAGES[p.category];

        if (isMismatch) {
          changed = true;
          return { ...p, image: CATEGORY_DEFAULT_IMAGES[p.category] || CATEGORY_DEFAULT_IMAGES['Business Cards'] };
        }
        return p;
      });
      if (changed) {
        setLocalStorageData('pb_products', updated);
        return updated;
      }
      return prevProducts;
    });

    setOrders(prevOrders => {
      let changed = false;
      const updated = prevOrders.map(o => {
        let orderChanged = false;
        const newItems = o.items.map(item => {
          if (item.productImage) {
            const isDummy = item.productImage.includes('unsplash.com') || item.productImage.includes('placeholder') || item.productImage.includes('random');
            const isMismatch = isDummy && item.productImage !== CATEGORY_DEFAULT_IMAGES[item.productCategory as ProductCategory];
            if (isMismatch) {
              orderChanged = true;
              return { ...item, productImage: CATEGORY_DEFAULT_IMAGES[item.productCategory as ProductCategory] || CATEGORY_DEFAULT_IMAGES['Business Cards'] };
            }
          }
          return item;
        });
        if (orderChanged) {
          changed = true;
          return { ...o, items: newItems };
        }
        return o;
      });
      if (changed) {
        setLocalStorageData('pb_orders', updated);
        return updated;
      }
      return prevOrders;
    });

    setCartItems(prevCart => {
      let changed = false;
      const updated = prevCart.map(item => {
        if (item.productImage) {
          const isDummy = item.productImage.includes('unsplash.com') || item.productImage.includes('placeholder') || item.productImage.includes('random');
          const isMismatch = isDummy && item.productImage !== CATEGORY_DEFAULT_IMAGES[item.productCategory as ProductCategory];
          if (isMismatch) {
            changed = true;
            return { ...item, productImage: CATEGORY_DEFAULT_IMAGES[item.productCategory as ProductCategory] || CATEGORY_DEFAULT_IMAGES['Business Cards'] };
          }
        }
        return item;
      });
      if (changed) {
        setLocalStorageData('pb_cart', updated);
        return updated;
      }
      return prevCart;
    });
  }, []);

  // Require Auth Action Wrapper
  const requireUserAuthAction = (action: () => void) => {
    if (!user) {
      alert("Please Connect your Google Account or Sign In first to access this feature.");
      setCustomerActiveTab('profile'); // Send them to the profile screen showing sign in button
      return;
    }
    action();
  };

  // Sync state to local storage when state switches (as a client fallback)
  useEffect(() => {
    setLocalStorageData('pb_products', products);
  }, [products]);

  useEffect(() => {
    setLocalStorageData('pb_orders', orders);
  }, [orders]);

  useEffect(() => {
    setLocalStorageData('pb_cart', cartItems);
  }, [cartItems]);

  useEffect(() => {
    setLocalStorageData('pb_wishlist', wishlistProducts);
  }, [wishlistProducts]);

  const toggleWishlist = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWishlistProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      }
      return [...prev, productId];
    });
    triggerToast(wishlistProducts.includes(productId) ? 'Removed from Wishlist' : 'Added to Wishlist');
  };

  // Toast notifier helper
  const triggerToast = (text: string, type: 'success' | 'warn' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleQuickBuy = (product: Product) => {
    const defaultQty = product.quantitySlabs[0]?.quantity || 100;
    const defaultSize = product.sizes[0] || { name: 'Standard size (Base)', priceMultiplier: 1.0 };
    const defaultMaterial = product.materials[0] || { name: 'Premium Gloss Card (350 GSM)', priceMultiplier: 1.0 };
    const baseUnitPrice = product.quantitySlabs[0]?.unitPrice || 4.5;
    const itemTotal = defaultQty * baseUnitPrice * defaultSize.priceMultiplier * defaultMaterial.priceMultiplier;

    const quickItem: CartItem = {
      id: 'cart-' + Date.now(),
      productId: product.id,
      productName: product.name,
      productCategory: product.category,
      selectedSize: defaultSize,
      selectedMaterial: defaultMaterial,
      selectedQuantity: defaultQty,
      designFile: {
        name: 'quick_buy_draft.pdf',
        size: 1024 * 1024 * 1.5,
        type: 'application/pdf',
        fileData: 'MOCK_PDF_BASE64'
      },
      itemTotal,
      advanceAmount: itemTotal, 
      balanceAmount: 0,
      productImage: product.image || CATEGORY_DEFAULT_IMAGES[product.category] || CATEGORY_DEFAULT_IMAGES['Business Cards']
    };

    setCartItems(prev => {
      const updated = [...prev, quickItem];
      setLocalStorageData('pb_cart', updated);
      return updated;
    });
    triggerToast(`✨ Quick Buy: ${product.name} default pack added directly to cart!`, 'success');
  };

  // Validate connection to Firestore on initial boot
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  // Firebase Authentication onAuthStateChanged Listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const isAdminEmail = firebaseUser.email === 'amaanmohd8186@gmail.com' || firebaseUser.email === 'amaanmohd81865@gmail.com' || firebaseUser.email === 'gazisiddiqui01@gmail.com';
        setSession({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Authenticated User',
          email: firebaseUser.email || 'no-email@printbazaar.com',
          role: isAdminEmail ? 'admin' : 'customer'
        });
        triggerToast(`Signed in as ${firebaseUser.displayName || firebaseUser.email}`, 'success');
      } else {
        setUser(null);
        setSession({
          id: 'cust-current',
          name: 'Amaan Mohd',
          email: 'amaanmohd8186@gmail.com',
          role: 'customer'
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Real-time Firestore synchronizer for Products catalog
  useEffect(() => {
    const productsRef = collection(db, 'products');
    const unsubscribe = onSnapshot(productsRef, async (snapshot) => {
      if (snapshot.empty) {
        // Fallback to memory defaults so any customer or guest sees catalog options right away
        setProducts(INITIAL_PRODUCTS);

        // Seeding database must only be attempted by the administrator
        const currentUser = auth.currentUser;
        if (currentUser && (currentUser.email === 'amaanmohd8186@gmail.com' || currentUser.email === 'amaanmohd81865@gmail.com' || currentUser.email === 'gazisiddiqui01@gmail.com')) {
          try {
            for (const prod of INITIAL_PRODUCTS) {
              await setDoc(doc(db, 'products', prod.id), removeUndefinedFields(prod));
            }
          } catch (e) {
            console.error("Failed to seed initial products collection", e);
          }
        }
      } else {
        const prodList: Product[] = [];
        snapshot.forEach((docSnap) => {
          prodList.push(docSnap.data() as Product);
        });
        setProducts(prodList);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'products');
    });

    return () => unsubscribe();
  }, []);

  // Real-time Firestore synchronizer for Orders
  useEffect(() => {
    if (!user) {
      // In guest mode, do not query authenticated database paths
      setOrders(INITIAL_ORDERS);
      return;
    }

    // Wait until session is in sync with user credentials to prevent race condition
    if (session.id !== user.uid) {
      return;
    }

    const ordersCol = collection(db, 'orders');
    let ordersQuery;

    const isAdminEmail = user.email === 'amaanmohd8186@gmail.com' || user.email === 'amaanmohd81865@gmail.com' || user.email === 'gazisiddiqui01@gmail.com';

    if (isAdminEmail) {
      ordersQuery = query(ordersCol);
    } else {
      ordersQuery = query(ordersCol, where('customerEmail', '==', user.email || ''));
    }

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const ordersList: Order[] = [];
      snapshot.forEach((docSnap) => {
        ordersList.push(docSnap.data() as Order);
      });
      ordersList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Compare status difference to see if we trigger Service Worker notifications
      if (prevOrdersRef.current && prevOrdersRef.current.length > 0) {
        ordersList.forEach((newOrder) => {
          const oldOrder = prevOrdersRef.current.find(o => o.id === newOrder.id);
          if (oldOrder && oldOrder.status !== newOrder.status) {
            if (newOrder.status === 'Printing In Progress' || newOrder.status === 'Ready for Dispatch') {
              triggerServiceWorkerNotification(
                `Order #${newOrder.id} - ${newOrder.status}`,
                `Your blueprint order status is marked as: "${newOrder.status}". Preparing final packaging items.`
              );
              triggerToast(`🔔 Order #${newOrder.id} is now in stage: ${newOrder.status}!`, 'success');
            }
          }
        });
      }
      prevOrdersRef.current = ordersList;
      setOrders(ordersList);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'orders');
    });

    return () => unsubscribe();
  }, [user, session.id, session.email, session.role]);

  // Seed INITIAL_ORDERS if list is empty and user is logged in as Admin
  useEffect(() => {
    if (user && session.role === 'admin' && orders.length === 0) {
      const seedOrders = async () => {
        try {
          const ordersSnap = await getDocs(collection(db, 'orders'));
          if (ordersSnap.empty) {
            for (const ord of INITIAL_ORDERS) {
              await setDoc(doc(db, 'orders', ord.id), removeUndefinedFields(ord));
            }
          }
        } catch (e) {
          console.error("Failed to seed initial orders", e);
        }
      };
      seedOrders();
    }
  }, [user, session.role]);

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error("Sign-in failed", e);
      triggerToast("Google Sign-In failed or cancelled.", "warn");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      triggerToast("Logged out successfully.", "success");
    } catch (e) {
      console.error("Sign-out failed", e);
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscriberEmail || !subscriberEmail.includes('@')) {
      triggerToast("Please enter a valid email address.", "warn");
      return;
    }
    
    setIsSubscribing(true);
    try {
      await addDoc(collection(db, 'subscribers'), {
        email: subscriberEmail,
        createdAt: new Date().toISOString()
      });
      triggerToast("Subscribed successfully! Welcome aboard.", "success");
      setSubscriberEmail('');
    } catch (error) {
      console.error("Error subscribing:", error);
      triggerToast("Failed to subscribe at this time. Please try again.", "warn");
      handleFirestoreError(error, OperationType.CREATE, 'subscribers');
    } finally {
      setIsSubscribing(false);
    }
  };

  // 5. State Mutators
  const handleAddToCart = (item: CartItem) => {
    setCartItems((prev) => [...prev, item]);
    setFocusConfigProduct(null);
    triggerToast(`Added ${item.productName} configuration to your printing cart!`);
    setCustomerActiveTab('cart');
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
    triggerToast('Item removed from cart.', 'warn');
  };

  const handleCheckoutSuccess = async (placedOrder: Order) => {
    try {
      if (user) {
        placedOrder.customerId = user.uid;
        placedOrder.customerEmail = user.email || placedOrder.customerEmail;
        
        // Sanitize and compress any large design files to protect against Firestore 1MB limits
        for (const item of placedOrder.items) {
          if (item.designFile && item.designFile.fileData && item.designFile.fileData.length > 150000) {
            console.log(`Checkout compression: sanitizing large file ${item.designFile.name}...`);
            try {
              const compressedStr = await new Promise<string>((resolve) => {
                const img = new Image();
                img.onload = () => {
                  try {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const maxDim = 300;
                    if (width > maxDim || height > maxDim) {
                      if (width > height) {
                        height = Math.round((height * maxDim) / width);
                        width = maxDim;
                      } else {
                        width = Math.round((width * maxDim) / height);
                        height = maxDim;
                      }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                      ctx.drawImage(img, 0, 0, width, height);
                      resolve(canvas.toDataURL('image/jpeg', 0.4));
                    } else {
                      resolve(item.designFile.fileData || '');
                    }
                  } catch {
                    resolve(item.designFile.fileData || '');
                  }
                };
                img.onerror = () => resolve(item.designFile.fileData || '');
                img.src = item.designFile.fileData || '';
              });
              item.designFile.fileData = compressedStr;
            } catch (err) {
              console.error('Failed to compress base64 during checkout:', err);
            }
          }
        }

        await setDoc(doc(db, 'orders', placedOrder.id), removeUndefinedFields(placedOrder));
      } else {
        setOrders((prev) => [placedOrder, ...prev]);
      }
      triggerToast(`🎉 Order ${placedOrder.id} successfully created! Admin is review design bleeds.`, 'success');
      setCustomerActiveTab('status');
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `orders/${placedOrder.id}`);
    }
  };

  const handleBalancePaymentSuccess = async (orderId: string, payment: PaymentDetails) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await getDoc(orderRef);
      if (orderSnap.exists()) {
        const orderData = orderSnap.data() as Order;
        const updatedPayments = [...(orderData.payments || []), payment];
        await updateDoc(orderRef, removeUndefinedFields({
          balancePaid: true,
          payments: updatedPayments,
          updatedAt: new Date().toISOString()
        }));
        triggerToast(`Outstanding balance for ${orderId} check completed! Order released for shipment.`, 'success');
      } else {
        setOrders((prev) => 
          prev.map((o) => {
            if (o.id === orderId) {
              return {
                ...o,
                balancePaid: true,
                payments: [...o.payments, payment],
                updatedAt: new Date().toISOString()
              };
            }
            return o;
          })
        );
        triggerToast(`Outstanding balance for ${orderId} check completed! Order released for shipment.`, 'success');
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const handleReorder = (order: Order) => {
    const clonedItems = order.items.map((item) => ({
      ...item,
      id: 'cart_' + Math.random().toString(36).substring(2, 11),
    }));
    setCartItems((prev) => [...prev, ...clonedItems]);
    triggerToast(`Cloned ${clonedItems.length} items to your cart for easy re-purchase!`, 'success');
    setCustomerActiveTab('cart');
  };

  // Admin Hooks
  const handleUpdateOrderStatus = async (
    orderId: string, 
    status: OrderStatus, 
    trackingNumber?: string, 
    courierName?: string
  ) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await getDoc(orderRef);
      if (orderSnap.exists()) {
        const updates: any = {
          status,
          updatedAt: new Date().toISOString()
        };
        if (trackingNumber) updates.trackingNumber = trackingNumber;
        if (courierName) updates.courierName = courierName;
        await updateDoc(orderRef, removeUndefinedFields(updates));
        triggerToast(`Order status updated to: ${status}`, 'success');
      } else {
        setOrders((prev) => 
          prev.map((o) => {
            if (o.id === orderId) {
              return {
                ...o,
                status,
                trackingNumber: trackingNumber || o.trackingNumber,
                courierName: courierName || o.courierName,
                updatedAt: new Date().toISOString()
              };
            }
            return o;
          })
        );
        triggerToast(`Order status updated to: ${status}`, 'success');
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const handleAddNewProduct = async (newProduct: Product) => {
    try {
      await setDoc(doc(db, 'products', newProduct.id), removeUndefinedFields(newProduct));
      triggerToast(`Successfully published ${newProduct.name} in standard catalogues!`);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `products/${newProduct.id}`);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      triggerToast('Product archived successfully from catalog views.', 'warn');
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `products/${id}`);
    }
  };

  // Current user's specific order filter (supports both logged in and local initial tracking)
  const currentCustomerOrders = orders.filter((o) => o.customerId === session.id || o.customerEmail === session.email || o.customerName === session.name);

  // Catalog filtered products with custom keyword matching algorithm
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'All' ? p.published : (() => {
      const cat1 = selectedCategory.toLowerCase().replace(/\s+/g, '').replace(/s$/, '');
      const cat2 = p.category.toLowerCase().replace(/\s+/g, '').replace(/s$/, '');
      const isVisitingOrBusiness = (c: string) => c === 'businesscard' || c === 'visitingcard';
      if (isVisitingOrBusiness(cat1) && isVisitingOrBusiness(cat2)) return p.published;
      return (cat1 === cat2) && p.published;
    })();
    if (!matchesCategory) return false;
    
    if (!catalogSearchQuery.trim()) return true;

    // Keyword matching: split the search query by whitespace and ensure that every keyword is matched
    const keywords = catalogSearchQuery.toLowerCase().split(/\s+/).filter(Boolean);
    const productNameLower = p.name.toLowerCase();
    const productDescLower = p.description.toLowerCase();

    return keywords.every(kw => productNameLower.includes(kw) || productDescLower.includes(kw));
  });

  return (
    <>
      <AnimatePresence mode="wait">
        {showSplash && (
          <SplashPreview key="splash" onFinish={() => setShowSplash(false)} />
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-zinc-50 flex flex-col font-sans">
      
      {/* 1. SECURE TOP NAVIGATION SLABS */}
      <nav className="bg-white border-b border-zinc-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-black text-[#FF4D00] flex items-center justify-center font-heavy border border-zinc-800">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-heavy tracking-tight text-[#0F172A] leading-none uppercase">
                  PRINT<span className="text-[#FF4D00]">BAZAAR</span>
                </h1>
                <p className="font-micro text-gray-400 mt-1">Premium Press Hub</p>
              </div>
            </div>

            {/* Sandbox Switching elements */}
            <div className="flex items-center gap-4">

              <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
                className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-600 flex items-center justify-center hover:bg-zinc-200 transition-colors cursor-pointer"
                title="Toggle Dark Mode"
              >
                 {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              
              {/* User Identity / Authentication widget */}
              <div className="flex items-center gap-2 md:gap-3">
                {user ? (
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                        className="flex items-center gap-2 cursor-pointer outline-none focus:outline-none"
                      >
                        <div className="hidden md:flex flex-col items-end text-right">
                          <p className="text-xs font-heavy uppercase tracking-wide text-zinc-800 leading-none">{session.name}</p>
                          <p className="text-[10px] font-mono text-zinc-400 font-bold mt-1 leading-normal">{session.email}</p>
                        </div>
                        {user.photoURL ? (
                          <img src={user.photoURL} alt={session.name} className="w-8 h-8 rounded-full border border-zinc-200 hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-zinc-200 text-zinc-600 flex items-center justify-center font-bold text-xs uppercase border border-zinc-300 hover:scale-105 transition-transform">
                            {session.name.substring(0, 1)}
                          </div>
                        )}
                      </button>

                      {/* Dropdown Menu */}
                      {profileDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-zinc-100 overflow-hidden z-50 flex flex-col pt-1 pb-1">
                          
                          <div className="px-4 py-2.5 border-b border-zinc-100 bg-zinc-50 flex flex-col gap-1 cursor-default">
                            <button onClick={() => requireUserAuthAction(() => { setProfileDropdownOpen(false); setProfilePortal('wallet'); setCustomerActiveTab('profile'); })} className="flex justify-between items-center hover:bg-zinc-100 p-1 -mx-1 rounded transition cursor-pointer">
                              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">PB Wallet</span>
                              <span className="text-xs font-black text-emerald-600 font-mono">₹{userStats.walletBalance}</span>
                            </button>
                            <button onClick={() => requireUserAuthAction(() => { setProfileDropdownOpen(false); setProfilePortal('credits'); setCustomerActiveTab('profile'); })} className="flex justify-between items-center hover:bg-zinc-100 p-1 -mx-1 rounded transition cursor-pointer">
                              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">AI Credits</span>
                              <span className="text-xs font-black text-[#FF4D00] font-mono">{userStats.aiCredits} 🎇</span>
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => requireUserAuthAction(() => {
                              setProfileDropdownOpen(false);
                              setProfilePortal('profile_addresses');
                              setCustomerActiveTab('profile');
                            })}
                            className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <User className="w-3.5 h-3.5 text-zinc-400" />
                            My Profile & Addresses
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => requireUserAuthAction(() => {
                              setProfileDropdownOpen(false);
                              setProfilePortal('rewards');
                              setCustomerActiveTab('profile');
                            })}
                            className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-[#FF4D00]" />
                            Loyalty & Rewards
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setProfileDropdownOpen(false);
                              setCustomerActiveTab('aistudio');
                            }}
                            className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-[#FF4D00] hover:bg-[#FF4D00]/5 flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <Wand2 className="w-3.5 h-3.5" />
                            AI Design Studio
                          </button>

                          <button
                            type="button"
                            onClick={() => requireUserAuthAction(() => {
                              setProfileDropdownOpen(false);
                              setProfilePortal('saved_designs');
                              setCustomerActiveTab('profile');
                            })}
                            className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <Grid className="w-3.5 h-3.5 text-blue-500" />
                            My Saved Designs
                          </button>

                          <button
                            type="button"
                            onClick={() => requireUserAuthAction(() => {
                              setProfileDropdownOpen(false);
                              setProfilePortal('premium');
                              setCustomerActiveTab('profile');
                            })}
                            className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-[#FF4D00] hover:bg-orange-50 flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <Sparkle className="w-3.5 h-3.5 text-[#FF4D00]" />
                            Upgrade to Premium
                          </button>

                          <div className="border-t border-zinc-100 my-1"></div>

                          {session?.role === 'admin' && (
                            <button
                              type="button"
                              onClick={() => {
                                setProfileDropdownOpen(false);
                                if (roleMode === 'admin') {
                                  setRoleMode('customer');
                                  setCustomerActiveTab('shop');
                                } else {
                                  setRoleMode('admin');
                                }
                              }}
                              className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-zinc-700 hover:bg-zinc-50 hover:text-[#FF4D00] flex items-center gap-2 transition-colors cursor-pointer"
                            >
                              <Settings className="w-3.5 h-3.5" />
                              {roleMode === 'admin' ? 'Exit Admin Mode' : 'Admin Workspace'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setProfileDropdownOpen(false);
                              handleSignOut();
                            }}
                            className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-rose-500 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            Sign Out
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="flex items-center gap-1.5 px-4 py-2 bg-zinc-950 text-white hover:bg-[#FF4D00] transition rounded-2xl text-[11px] font-heavy uppercase tracking-wide border border-transparent shadow-sm cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-[#FF4D00]" />
                    <span>Google Sign In</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      </nav>

      {/* 2. SUB HEADER / CUSTOMER TABS ROW (only shown in customer mode) */}
      {roleMode === 'customer' && (
        <div className="bg-white/75 backdrop-blur-md border-b border-zinc-200 py-4.5 sticky top-20 z-20 shrink-0 hidden md:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCustomerActiveTab('shop')}
                className={`py-2 px-4.5 rounded-2xl text-xs font-heavy uppercase tracking-wider transition flex items-center gap-1.5 border border-transparent cursor-pointer ${
                  customerActiveTab === 'shop'
                    ? 'bg-black text-white shadow-md'
                    : 'text-zinc-500 hover:text-neutral-900 bg-zinc-50 hover:bg-zinc-100 border-zinc-200'
                }`}
              >
                <Grid className="w-4 h-4" />
                <span>Browse Catalog</span>
              </button>

              <button
                type="button"
                onClick={() => setCustomerActiveTab('cart')}
                className={`py-2 px-4.5 rounded-2xl text-xs font-heavy uppercase tracking-wider transition flex items-center gap-1.5 relative border border-transparent cursor-pointer ${
                  customerActiveTab === 'cart'
                    ? 'bg-[#FF4D00] text-white shadow-md'
                    : 'text-zinc-500 hover:text-neutral-900 bg-zinc-50 hover:bg-zinc-100 border-zinc-200'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>My Cart</span>
                {cartItems.length > 0 && (
                  <span className="bg-black text-[#FF4D00] font-mono text-[10px] px-2 py-0.5 rounded-full absolute -top-2.5 -right-1 font-bold animate-pulse border border-[#FF4D00]/50">
                    {cartItems.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setCustomerActiveTab('wishlist')}
                className={`py-2 px-4.5 rounded-2xl text-xs font-heavy uppercase tracking-wider transition flex items-center gap-1.5 relative border border-transparent cursor-pointer ${
                  customerActiveTab === 'wishlist'
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'text-zinc-500 hover:text-neutral-900 bg-zinc-50 hover:bg-zinc-100 border-zinc-200'
                }`}
              >
                <Heart className={`w-4 h-4 ${customerActiveTab === 'wishlist' ? 'fill-white' : ''}`} />
                <span className="hidden sm:inline">Wishlist</span>
                {wishlistProducts.length > 0 && (
                  <span className="bg-rose-500 text-white font-mono text-[10px] px-1.5 py-0.5 rounded-full absolute -top-2.5 -right-1 font-bold shadow-sm">
                    {wishlistProducts.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setCustomerActiveTab('status')}
                className={`py-2 px-4.5 rounded-2xl text-xs font-heavy uppercase tracking-wider transition flex items-center gap-1.5 border border-transparent cursor-pointer ${
                  customerActiveTab === 'status'
                    ? 'bg-[#FF4D00] text-white shadow-md'
                    : 'text-zinc-500 hover:text-neutral-900 bg-zinc-50 hover:bg-zinc-100 border-zinc-200'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Track Orders</span>
                {currentCustomerOrders.length > 0 && (
                  <span className="bg-black text-white font-mono text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {currentCustomerOrders.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setCustomerActiveTab('aistudio')}
                className={`py-2 px-4.5 rounded-2xl text-xs font-heavy uppercase tracking-wider transition flex items-center gap-1.5 border border-transparent cursor-pointer ${
                  customerActiveTab === 'aistudio'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border-indigo-200'
                }`}
              >
                <Wand2 className="w-4 h-4" />
                <span>AI Studio</span>
              </button>
            </div>

            {/* Quick alert bar help */}
            <div className="flex items-center gap-2 text-xs text-zinc-900 bg-[#ffe4d6] py-2 px-4 border border-[#FF4D00]/20 rounded-2xl">
              <CheckCircle2 className="w-4 h-4 text-[#FF4D00] shrink-0" />
              <span className="font-bold uppercase text-[10px] tracking-wide font-sans text-neutral-800">⚠ STRICT PROTOCOL DEFINED: NO COD • NO SHIPPING RETURNS • 100% UPFRONT PAYMENT MANDATORY</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. MAIN WORKSPACE ELEMENT CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* TOAST SYSTEM ALERTER */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 p-4 rounded-2xl shadow-xl border animate-bounce bg-neutral-900 text-white border-zinc-800 max-w-sm">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            )}
            <p className="text-xs font-semibold leading-relaxed">{toastMessage.text}</p>
          </div>
        )}

        {/* CUSTOMER MODE LAYOUT */}
        {roleMode === 'customer' && (
          <div>
            {activePolicyView === 'terms' ? (
              <TermsOfService onBack={() => setActivePolicyView('none')} />
            ) : activePolicyView === 'privacy' ? (
              <PrivacyPolicy onBack={() => setActivePolicyView('none')} />
            ) : (
              <>
                {enterprisePortal !== 'none' && (
              <div className="space-y-6">
                <button
                  type="button"
                  onClick={() => setEnterprisePortal('none')}
                  className="py-2.5 px-5 bg-neutral-900 hover:bg-[#FF4D00] text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md transition"
                >
                  <span>← Back to My Profile</span>
                </button>

                {enterprisePortal === 'seller' && (
                  <SellerVerificationSystem isAdminMode={roleMode === 'admin'} />
                )}

                {enterprisePortal === 'banners' && (
                  <BannerManager />
                )}

                {enterprisePortal === 'quotes' && (
                  <BulkQuoteGenerator />
                )}

                {enterprisePortal === 'audit' && (
                  <VerificationAuditDashboard onBack={() => setEnterprisePortal('none')} />
                )}

                {enterprisePortal === 'franchise' && (
                  <FranchiseModule />
                )}
              </div>
            )}

            {enterprisePortal === 'none' && (
              <>
                {/* AI Design Cloud Workspace */}
                {customerActiveTab === 'aistudio' && (
                  <div className="w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] lg:w-[calc(100%+4rem)] -ml-4 sm:-ml-6 lg:-ml-8 bg-zinc-50 border-y border-zinc-200">
                     <DesignEditor 
                       userEmail={session.email} 
                       userId={session.id}
                       onSave={(d) => triggerToast('Design saved to cloud.')} 
                     />
                  </div>
                )}

                {/* SHOP AND WISHLIST TAB VIEW */}
            {(customerActiveTab === 'shop' || customerActiveTab === 'wishlist') && (
              <div className="space-y-6">
                {/* Promo Billboard Accent */}
                {customerActiveTab === 'shop' && (
                  <div className="bg-[#0F172A] text-white p-8 md:p-10 rounded-[36px] border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8">
                      <div className="w-16 h-16 border border-white/10 rounded-full flex items-center justify-center font-heavy text-[10px] text-[#FF4D00] rotate-12 uppercase">
                        PRINT<br/>CERT
                      </div>
                    </div>
                    <div className="space-y-3 max-w-xl text-center md:text-left relative z-10">
                      <span className="bg-[#FF4D00] text-white font-micro px-3 py-1 rounded-full text-[9px]">
                        Offset Pioneer
                      </span>
                      <h2 className="text-3xl md:text-5xl font-heavy leading-none tracking-tight uppercase">
                        PROFESSIONAL OFFSET <br/>
                        <span className="text-[#FF4D00]">PRINTING AT WHOLESALE</span>
                      </h2>
                      <p className="text-xs text-slate-300 max-w-lg leading-relaxed font-normal">
                        Configure high-volume corporate collateral with ease. Pay 100% upfront to trigger instant pre-press preflight audits, automated bleed alignments, and launch lightning fast offset production runs!
                      </p>
                    </div>
                    
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-3 text-xs text-center md:text-left max-w-[250px] shrink-0 relative z-10">
                      <p className="font-micro text-blue-400">STAGE: HIGH PRESS DUPLEX</p>
                      <p className="text-xs font-heavy uppercase leading-tight text-white">
                        GUARANTEED COURIER <br/>
                        RELEASE WITHIN 24-48H
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono leading-none">NO EXCHANGE POLICY</p>
                    </div>
                  </div>
                )}

                {/* Categories & Search Filter Block */}
                {customerActiveTab === 'shop' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end bg-white p-6 rounded-[32px] border border-zinc-200/60 shadow-xs">
                    <div className="md:col-span-2 space-y-3">
                      <span className="font-micro text-gray-500 block">Select Media Category</span>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedCategory('All')}
                          className={`py-2 px-5 rounded-2xl font-heavy text-xs uppercase tracking-tight transition cursor-pointer ${
                            selectedCategory === 'All'
                              ? 'bg-black text-white'
                              : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
                          }`}
                        >
                          All Catalogues
                        </button>
                        {CATEGORIES.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setSelectedCategory(cat)}
                            className={`py-2 px-5 rounded-2xl font-heavy text-xs uppercase tracking-tight transition cursor-pointer ${
                              selectedCategory === cat
                                ? 'bg-black text-white'
                                : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <span className="font-micro text-gray-500 block">Keyword Search Catalog</span>
                      <div className="relative">
                        <input
                          type="text"
                          value={catalogSearchQuery}
                          onChange={(e) => setCatalogSearchQuery(e.target.value)}
                          placeholder="Search custom specs, banners, cards..."
                          className="w-full pl-9 pr-8 py-2.5 bg-zinc-50 border border-zinc-200 rounded-[20px] text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#FF4D00]/25 text-zinc-800 transition shadow-inner font-sans"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <Search className="w-3.5 h-3.5" />
                        </div>
                        {catalogSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setCatalogSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-650 text-xs font-bold font-mono transition"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Wishlist Header */}
                {customerActiveTab === 'wishlist' && wishlistProducts.length > 0 && (
                  <div className="flex items-center gap-3 mb-2 border-b border-zinc-150 pb-4 text-left">
                    <div className="p-2.5 bg-rose-50 text-rose-500 rounded-2xl border border-rose-100">
                      <Heart className="w-5 h-5 fill-rose-500 text-rose-500 animate-pulse" />
                    </div>
                    <div>
                      <h2 className="text-xl font-heavy text-slate-950 uppercase tracking-tight">Your Wishlist ({wishlistProducts.length})</h2>
                      <p className="text-[10px] text-zinc-400 font-mono font-bold uppercase mt-0.5">Automated high-volume custom items saved for pipeline pre-press production</p>
                    </div>
                  </div>
                )}

                {/* Quality comparison tool */}
                {customerActiveTab === 'shop' && <PrintQualitySlider />}

                {/* Products Grid */}
                {customerActiveTab === 'wishlist' && wishlistProducts.length === 0 ? (
                  <div className="py-20 text-center flex flex-col items-center">
                    <Heart className="w-12 h-12 text-zinc-300 mb-4" />
                    <h3 className="text-xl font-heavy text-zinc-800 uppercase tracking-tight">Your Wishlist is Empty</h3>
                    <p className="text-sm text-zinc-500 mt-2">Save items you like and they will appear here.</p>
                  </div>
                ) : (
                  <motion.div 
                    initial="hidden"
                    animate="show"
                    variants={{
                      hidden: { opacity: 0 },
                      show: {
                        opacity: 1,
                        transition: {
                          staggerChildren: 0.1
                        }
                      }
                    }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
                  >
                    {(customerActiveTab === 'wishlist' ? products.filter(p => wishlistProducts.includes(p.id) && p.published) : filteredProducts).map((p) => {
                      const smallestSlab = [...p.quantitySlabs].sort((a, b) => a.quantity - b.quantity)[0];
                      const startingValPrice = smallestSlab ? smallestSlab.quantity * smallestSlab.unitPrice : 0;
                      
                      return (
                        <motion.div 
                          key={p.id}
                          variants={{
                            hidden: { opacity: 0, scale: 0.95, y: 15 },
                            show: { opacity: 1, scale: 1, y: 0 }
                          }}
                          transition={{ type: "spring", stiffness: 200, damping: 15 }}
                          className="bg-white rounded-[40px] border border-gray-200/60 p-6 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-transform duration-300 flex flex-col justify-between group"
                        >
                          <div className="space-y-5">
                            {/* Image container with ratio with zoom-on-hover effect */}
                            <div className="rounded-[30px] overflow-hidden bg-zinc-50 border border-zinc-200/50 aspect-4/3 relative">
                              {p.video ? (
                                <HoverVideoPlayer 
                                  src={p.video} 
                                  thumbnail={p.image}
                                  alt={p.name}
                                  category={p.category}
                                />
                              ) : (
                                <ZoomableImage
                                  src={p.image}
                                  alt={p.name}
                                  className="transition-all duration-500"
                                  category={p.category}
                                />
                              )}
                              <span className="absolute top-4 left-4 bg-black text-[#FF4D00] font-micro px-3 py-1.5 rounded-full shadow-sm z-10 pointer-events-none">
                                {p.category}
                              </span>
                              
                              {/* Premium top-right badges next to wishlist toggle */}
                              {(p.id === 'prod-1' || p.id === 'prod-5' || p.id === 'prod-7' || p.isNew) && (
                                <span className="absolute top-4 right-14 bg-emerald-600 text-white font-mono text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md z-15 pointer-events-none">
                                  ✨ NEW
                                </span>
                              )}
                              {(p.id === 'prod-2' || p.id === 'prod-3' || p.id === 'prod-6' || p.isBestseller) && (
                                <span className="absolute top-4 right-14 bg-amber-500 text-black font-mono text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md z-15 pointer-events-none">
                                  🔥 BEST
                                </span>
                              )}
                              
                              {p.inventory !== undefined && p.inventory > 0 && p.inventory <= 15 && (
                                <div className="absolute bottom-4 right-4 bg-rose-500 text-white font-mono text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg z-15 pointer-events-none flex items-center gap-1.5 animate-pulse">
                                  <AlertTriangle size={10} />
                                  {p.inventory <= 5 ? 'LIMITED RUN' : 'LOW STOCK'}
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={(e) => toggleWishlist(p.id, e)}
                                className="absolute top-4 right-4 bg-white/50 backdrop-blur-md p-2 rounded-full cursor-pointer hover:bg-white text-zinc-400 hover:text-rose-500 transition-all border border-white/40 shadow-sm z-10"
                              >
                                <Heart className={`w-4 h-4 ${wishlistProducts.includes(p.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                              </button>
                              {p.video && (
                                <span className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-md text-white font-micro px-3 py-1.5 rounded-full shadow-sm z-10 pointer-events-none flex items-center gap-1">
                                  ▶ CLIP
                                </span>
                              )}
                          </div>

                          <div className="space-y-2">
                            <h3 className="font-heavy text-xl uppercase text-slate-900 tracking-tight leading-none">
                              {p.name}
                            </h3>
                            <p className="text-xs text-gray-500 font-normal leading-relaxed line-clamp-2">
                              {p.description}
                            </p>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono font-semibold uppercase pt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-[#FF4D00] shrink-0" />
                              <span>{p.estimatedProductionTime || '3-5 Days'}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Truck className="w-3.5 h-3.5 text-[#FF4D00] shrink-0" />
                              <span>{p.dispatchLeadTime || 'Same Day'}</span>
                            </span>
                          </div>
                        </div>

                        <div className="border-t border-gray-100 pt-5 mt-5 flex items-center justify-between gap-1">
                          <div className="shrink-0">
                            <span className="font-micro text-gray-400 block font-normal text-[10px]">Starts from</span>
                            <p className="text-sm font-heavy text-slate-900 font-mono tracking-tighter">
                              ₹{startingValPrice.toLocaleString('en-IN')}{' '}
                              <span className="text-[9px] text-gray-400 font-heavy">({smallestSlab?.quantity} PCS)</span>
                            </p>
                          </div>

                          <div className="flex gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickBuy(p);
                              }}
                              className="py-2.5 px-3 bg-zinc-100 text-zinc-800 hover:bg-zinc-200 rounded-2xl text-[10px] font-bold uppercase tracking-tight transition shadow-xs cursor-pointer flex items-center gap-1 shrink-0"
                              title="Quick Add Default Quantity"
                            >
                              <span>Quick Buy</span>
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => setFocusConfigProduct(p)}
                              className="py-2.5 px-3.5 bg-black text-white hover:bg-[#FF4D00] rounded-2xl text-[10px] font-bold uppercase tracking-tight transition flex items-center gap-1 cursor-pointer shrink-0"
                            >
                              <span>Configure</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
                )}

                {/* AI Recommendations / Frequently Bought Together Block */}
                {filteredProducts.length > 0 && products.length > 0 && (
                  <div className="mt-16 border-t border-zinc-200/60 pt-10 pb-8">
                    <div className="flex items-center gap-2 mb-6">
                      <Sparkles className="w-5 h-5 text-[#FF4D00]" />
                      <h2 className="text-xl font-heavy uppercase tracking-tight text-slate-900">AI Recommendations <span className="text-zinc-400 font-medium text-sm capitalize tracking-normal ml-2">People also bought</span></h2>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {products.filter(p => p.published).sort(() => 0.5 - Math.random()).slice(0, 4).map(p => (
                        <div key={`rec-${p.id}`} className="bg-white rounded-2xl p-3 border border-zinc-100 hover:border-[#FF4D00]/50 transition cursor-pointer group" onClick={() => {
                          setFocusConfigProduct(p);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}>
                           <div className="aspect-square rounded-xl overflow-hidden mb-3 bg-zinc-50 relative">
                             {p.video ? (
                               <video src={p.video} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                             ) : (
                               <img src={p.image} referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                             )}
                           </div>
                           <h4 className="text-[11px] font-bold text-zinc-800 leading-tight line-clamp-1 uppercase">{p.name}</h4>
                           <p className="text-[10px] text-zinc-500 font-mono mt-1">Starts ₹{Math.min(...p.quantitySlabs.map(s => s.unitPrice * s.quantity)).toLocaleString('en-IN')}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* CART TAB VIEW */}
            {customerActiveTab === 'cart' && (
              <CartView
                cartItems={cartItems}
                customerName={session.name}
                customerEmail={session.email}
                onRemoveItem={handleRemoveFromCart}
                onCheckoutSuccess={handleCheckoutSuccess}
                onClearCart={() => setCartItems([])}
              />
            )}

            {/* ORDER STATUS HISTORY VIEW */}
            {customerActiveTab === 'status' && (
              <OrdersTracker
                orders={currentCustomerOrders}
                onPayBalanceSuccess={handleBalancePaymentSuccess}
                onReorder={handleReorder}
              />
            )}

            {/* INTEGRATED PROFILE SUMMARY TAB VIEW FOR PERSISTENCE & NATIVE NAV */}
            {customerActiveTab === 'profile' && (
              <div className="max-w-md mx-auto">
                {profilePortal === 'wallet' && <PBWallet stats={userStats} userId={user?.uid || 'guest'} onUpdateStats={setUserStats} onBack={() => setProfilePortal('none')} />}
                {profilePortal === 'credits' && <AICredits stats={userStats} userId={user?.uid || 'guest'} onUpdateStats={setUserStats} onBack={() => setProfilePortal('none')} />}
                {profilePortal === 'profile_addresses' && <ProfileAddresses stats={userStats} userName={session.name} userEmail={session.email} onUpdateSession={(n, e) => setSession({...session, name: n, email: e})} onUpdateStats={setUserStats} onBack={() => setProfilePortal('none')} />}
                {profilePortal === 'rewards' && <LoyaltyRewards stats={userStats} onUpdateStats={setUserStats} onBack={() => setProfilePortal('none')} />}
                {profilePortal === 'saved_designs' && <SavedDesigns stats={userStats} onUpdateStats={setUserStats} onBack={() => setProfilePortal('none')} />}
                {profilePortal === 'premium' && <PremiumUpgrade stats={userStats} userId={user?.uid || 'guest'} onUpdateStats={setUserStats} onBack={() => setProfilePortal('none')} />}
                {profilePortal === 'history' && <PaymentHistory userId={user?.uid || 'guest'} onBack={() => setProfilePortal('none')} />}
                
                {profilePortal === 'none' && (
                  <div className="bg-white rounded-[32px] p-6 border border-zinc-200/80 shadow-md space-y-6">
                    <div className="flex items-center gap-4 border-b border-zinc-150 pb-5 text-left">
                  <div className="w-14 h-14 rounded-[20px] bg-black text-[#FF4D00] flex items-center justify-center font-black text-xl uppercase border border-zinc-800 shrink-0">
                    {session.name.substring(0, 1)}
                  </div>
                  <div>
                    <h3 className="text-lg font-heavy text-slate-900 uppercase tracking-tight">{session.name}</h3>
                    <p className="text-[10px] font-mono text-zinc-400 font-bold uppercase mt-0.5">{session.email}</p>
                    <span className="inline-block bg-emerald-50 text-emerald-800 border border-emerald-150 text-[8px] font-black uppercase px-2.5 py-0.5 rounded-full mt-1.5 tracking-wider font-mono">
                      ✓ Account Verified
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => requireUserAuthAction(() => setProfilePortal('wallet'))} className="bg-zinc-50 hover:bg-zinc-100 p-4 rounded-2xl border border-zinc-150 flex flex-col gap-0.5 text-left transition cursor-pointer">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">PB Wallet</span>
                    <span className="text-base font-black text-emerald-600 font-mono">₹{userStats.walletBalance}</span>
                  </button>
                  <button onClick={() => requireUserAuthAction(() => setProfilePortal('credits'))} className="bg-zinc-50 hover:bg-zinc-100 p-4 rounded-2xl border border-zinc-150 flex flex-col gap-0.5 text-left transition cursor-pointer">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">AI Credits</span>
                    <span className="text-base font-black text-[#FF4D00] font-mono">{userStats.aiCredits} 🎇</span>
                  </button>
                </div>

                {/* ENTERPRISE SYSTEMS AND FRAUD VERIFICATIONS CONNECTORS */}
                <div className="border-t border-dashed border-zinc-200 pt-4 space-y-2">
                  <span className="text-[9px] font-black uppercase tracking-wider font-mono text-[#FF4D00] block text-left">Enterprise Services Pool</span>
                  
                  <button
                    type="button"
                    onClick={() => setEnterprisePortal('seller')}
                    className="w-full py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-900 bg-zinc-50 hover:bg-zinc-100 flex items-center justify-between rounded-xl transition border border-zinc-200 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-amber-500">🔐</span>
                      <span>Seller Onboarding & KYC</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setEnterprisePortal('quotes')}
                    className="w-full py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-900 bg-zinc-50 hover:bg-zinc-100 flex items-center justify-between rounded-xl transition border border-zinc-200 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-indigo-500">🧾</span>
                      <span>Offset Bulk Quote AI Desk</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setEnterprisePortal('franchise')}
                    className="w-full py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-900 bg-zinc-50 hover:bg-zinc-100 flex items-center justify-between rounded-xl transition border border-zinc-200 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-blue-500">🏢</span>
                      <span>Enlist Printing Franchise</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setEnterprisePortal('banners')}
                    className="w-full py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-900 bg-zinc-50 hover:bg-zinc-100 flex items-center justify-between rounded-xl transition border border-zinc-200 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-violet-500">🚀</span>
                      <span>Rotator Banners Portal (Admins)</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                  </button>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => requireUserAuthAction(() => setProfilePortal('history'))}
                    className="w-full py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-700 hover:bg-zinc-50 flex items-center justify-between rounded-xl transition border border-zinc-100 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-emerald-500" />
                      <span>Payment & Transaction Ledger</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => requireUserAuthAction(() => setProfilePortal('profile_addresses'))}
                    className="w-full py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-700 hover:bg-zinc-50 flex items-center justify-between rounded-xl transition border border-zinc-100 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-zinc-400" />
                      <span>My Profile & Addresses</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => requireUserAuthAction(() => setProfilePortal('rewards'))}
                    className="w-full py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-700 hover:bg-zinc-50 flex items-center justify-between rounded-xl transition border border-zinc-100 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#FF4D00]" />
                      <span>Loyalty & Rewards</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => requireUserAuthAction(() => setProfilePortal('saved_designs'))}
                    className="w-full py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-700 hover:bg-zinc-50 flex items-center justify-between rounded-xl transition border border-zinc-100 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Grid className="w-4 h-4 text-blue-500" />
                      <span>My Saved Design Assets</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => requireUserAuthAction(() => setProfilePortal('premium'))}
                    className="w-full py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-[#FF4D00] hover:bg-orange-50 flex items-center justify-between rounded-xl transition border border-orange-100 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkle className="w-4 h-4" />
                      <span>Upgrade to Premium</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#FF4D00]" />
                  </button>

                  {session?.role === 'admin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setRoleMode('admin');
                      }}
                      className="w-full py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-700 hover:bg-zinc-50 flex items-center justify-between rounded-xl transition border border-zinc-100 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4 text-[#FF4D00]" />
                        <span>Admin Workspace Controls</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-400" />
                    </button>
                  )}
                </div>

                <div className="pt-2">
                  {user ? (
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full py-3.5 bg-rose-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out from App</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      className="w-full py-3.5 bg-zinc-950 text-white hover:bg-[#FF4D00] rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <User className="w-4 h-4 text-[#FF4D00]" />
                      <span>Connect Google Account</span>
                    </button>
                  )}
                </div>
              </div>
            )}
              </div>
            )}
            </>
            )}
            </>
            )}

          </div>
        )}

        {/* ADMIN WORKSPACE LAYOUT */}
        {roleMode === 'admin' && (
          <AdminWorkspace
            orders={orders}
            products={products}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onAddNewProduct={handleAddNewProduct}
            onDeleteProduct={handleDeleteProduct}
            onShowAudit={() => setEnterprisePortal('audit')}
          />
        )}

        {roleMode === 'customer' && <WhatsAppFloatingButton product={focusConfigProduct || undefined} cartItems={cartItems} />}

      </main>

      {/* FAQ Guide Footer Section */}
      {roleMode === 'customer' && (
        <section className="bg-zinc-100 border-t border-zinc-200 py-12 px-4 sm:px-6 lg:px-8 mt-10 rounded-[40px] border">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div>
                <span className="font-micro text-[#FF4D00] block">Pre-press Guidelines & Help Desks</span>
                <h3 className="text-xl font-heavy uppercase tracking-tight text-neutral-900 mt-1">First-Time Printing FAQ & Terminology</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFaqModal(true)}
                className="px-5 py-2.5 bg-neutral-900 hover:bg-[#FF4D00] hover:text-white text-white rounded-xl text-xs font-heavy uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Info className="w-3.5 h-3.5 text-[#FF4D00]" />
                <span>Launch Interactive FAQ Modal</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Common printing terminology card */}
              <div className="bg-white p-6 rounded-[28px] border border-zinc-200/60 shadow-xs flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="text-[10px] font-black bg-zinc-100 text-zinc-800 px-3 py-1 rounded-full uppercase tracking-wider font-mono">Terminology Guide</span>
                  <h4 className="text-sm font-heavy text-slate-900 uppercase tracking-tight font-sans">Common Offset Dictionary</h4>
                  <div className="space-y-4 pt-1 text-left">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-zinc-850 font-mono">1. Artboards &amp; Bleed</p>
                      <p className="text-[11px] text-zinc-500 leading-relaxed">
                        Bleed is the extra 3mm area outside your layout dimensions. It acts as an error buffer to prevent white outer margins when cards are sheared by a high-velocity Guillotine cutter.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-zinc-850 font-mono">2. CMYK Colourways</p>
                      <p className="text-[11px] text-zinc-500 leading-relaxed">
                        CMYK uses additive ink levels (Cyan, Magenta, Yellow, Key Black) matching real-world offset presses. Screen graphics (RGB) must be correctly converted to prevent color-shifts.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Meaning of '50-50 payment terms' card */}
              <div className="bg-white p-6 rounded-[28px] border border-zinc-200/60 shadow-xs flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="text-[10px] font-black bg-blue-50 text-blue-800 px-3 py-1 rounded-full uppercase tracking-wider font-mono">Payment Terms</span>
                  <h4 className="text-sm font-heavy text-slate-900 uppercase tracking-tight font-sans">Meaning of '50-50 Terms'</h4>
                  <div className="space-y-4 pt-1 text-left">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-zinc-850 font-mono">Standard Guest Checkout</p>
                      <p className="text-[11px] text-zinc-500 leading-relaxed">
                        Guest checkouts enforce secured 100% upfront settlement to activate physical color alignment checks and instant press routing.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-zinc-850 font-mono">Trade Accounts (50-50 Cycle)</p>
                      <p className="text-[11px] text-zinc-500 leading-relaxed">
                        Established corporate clients can register a 50% advance pledge to initialize plate rendering with the remaining 50% balance cleared dynamically once status flags &quot;Ready for Dispatch&quot;.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* File upload requirements for first-time users card */}
              <div className="bg-white p-6 rounded-[28px] border border-zinc-200/60 shadow-xs flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="text-[10px] font-black bg-[#ffe4d6] text-[#FF4D00] px-3 py-1 rounded-full uppercase tracking-wider font-mono">Preparation Rules</span>
                  <h4 className="text-sm font-heavy text-slate-900 uppercase tracking-tight font-sans">First-Time Upload Specs</h4>
                  <div className="space-y-4 pt-1 text-left">
                    <div className="space-y-2">
                      <p className="text-[11px] text-[#FF4D00] leading-relaxed font-bold uppercase text-[9px] font-mono">★ CORE CHECKLIST FOR DESIGNERS:</p>
                      <ul className="text-[11px] text-zinc-550 space-y-1.5 list-disc pl-4 font-normal">
                        <li>Use High-Res PDF, EPS or vector SVG (300 DPI+ resolution).</li>
                        <li>Convert all custom layout body fonts to outlines / curves.</li>
                        <li>Map layout boundaries with precise Crop &amp; Bleed lines.</li>
                        <li>Double-check CMYK conversion presets preceding upload.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. MODALS/STAGE LIGHTBOXES OVERLAYS */}
      {focusConfigProduct && (
        <CustomizeModal
          product={focusConfigProduct}
          onClose={() => setFocusConfigProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* QR Code Scan Modal Overlay */}
      {showQrModal && (
        <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-sm overflow-hidden border border-zinc-100 flex flex-col p-8 text-center space-y-6 relative">
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="absolute top-6 right-6 w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 flex items-center justify-center font-bold text-xs cursor-pointer transition-all"
              title="Close QR Code"
            >
              ✕
            </button>

            <div className="flex flex-col items-center space-y-2 pt-2">
              <div className="w-12 h-12 bg-[#FF4D00]/10 rounded-full flex items-center justify-center text-[#FF4D00] mb-2">
                <QrCode className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="font-sans font-extrabold text-[#000] text-lg tracking-tight">Scan to View Mobile</h3>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider leading-relaxed">
                Open PrintBazaar on your device seamlessly
              </p>
            </div>

            <div className="flex justify-center p-4 bg-zinc-50 rounded-3xl border border-zinc-200/80 max-w-[240px] mx-auto">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.href)}`} 
                alt="PrintBazaar Mobile App QR Code" 
                className="w-[180px] h-[180px] object-contain rounded-xl select-none"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="space-y-2">
              <div className="text-[10px] font-mono text-zinc-400 font-bold break-all bg-zinc-50 p-2.5 rounded-xl border border-zinc-100 uppercase tracking-widest leading-normal select-text">
                {window.location.href}
              </div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(window.location.href);
                    triggerToast("App URL copied to clipboard!", "success");
                  } catch {
                    triggerToast("Clipboard copy failed", "warn");
                  }
                }}
                className="text-[11.5px] font-extrabold text-[#FF4D00] hover:underline cursor-pointer uppercase tracking-widest mt-1 block mx-auto"
              >
                Copy Link instead
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAQ Guidelines Interactive Modal Overlay */}
      {showFaqModal && (
        <div className="fixed inset-0 bg-neutral-950/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden border border-zinc-200 flex flex-col max-h-[85vh]">
            <div className="bg-neutral-900 text-white p-6 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-[#FF4D00]" />
                <span className="font-heavy text-sm uppercase tracking-wider">Interactive Press &amp; File Guidelines</span>
              </div>
              <button
                type="button"
                onClick={() => setShowFaqModal(false)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-xs cursor-pointer transition-colors"
                title="Dismiss Guidelines"
              >
                ✕
              </button>
            </div>

            <div className="p-8 overflow-y-auto space-y-6 flex-1">
              {/* Introduction bar */}
              <div className="bg-zinc-50 p-5 rounded-3xl border border-zinc-200 space-y-1 text-left">
                <span className="text-[9px] font-black bg-[#ffe4d6] text-[#FF4D00] px-2.5 py-0.5 rounded-full inline-block uppercase tracking-wider font-mono">PRE-PRESS SYSTEM</span>
                <p className="text-xs text-zinc-700 leading-relaxed font-bold uppercase tracking-wide mt-1">
                  Ensure vector assets are certified before committing offsets. Review parameters:
                </p>
              </div>

              {/* Terminology details list */}
              <div className="space-y-4 text-left">
                <h4 className="text-xs font-black uppercase text-neutral-800 tracking-wider">1. Printing Terminology Dictionary</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-150">
                    <p className="text-xs font-bold text-zinc-900 font-mono">What is Bleed margin?</p>
                    <p className="text-[11px] text-zinc-550 leading-relaxed mt-1">
                      A safety border (standard 3mm) that extends outside your final print dimension. The background artwork must fill this region so cutting micro-deviations leave no raw white slits on margins.
                    </p>
                  </div>
                  <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-150">
                    <p className="text-xs font-bold text-zinc-900 font-mono">What is CMYK standard?</p>
                    <p className="text-[11px] text-zinc-550 leading-relaxed mt-1">
                      Cyan, Magenta, Yellow, Key Black. This is a subtractive color system mimicking mechanical offset colors. Web screens use additive light (RGB), which can look dull when printed as ink if not converted properly.
                    </p>
                  </div>
                  <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-150">
                    <p className="text-xs font-bold text-zinc-900 font-mono">What is DPI (Resolution)?</p>
                    <p className="text-[11px] text-zinc-550 leading-relaxed mt-1">
                      Dots Per Inch. High-grade pressheads require designs exported at a minimal resolution of 300 DPI. Anything less produces digital blur or stair-stepped jagged pixelation on cardstocks.
                    </p>
                  </div>
                  <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-150">
                    <p className="text-xs font-bold text-zinc-900 font-mono">What is Lamination / Finish?</p>
                    <p className="text-[11px] text-zinc-550 leading-relaxed mt-1">
                      A thin protective plastic film thermal-fused onto printing paper sheets. Velvet Matte creates smooth anti-scuff non-reflective texture, while Glossy elevates vibrant ink saturation.
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment conditions */}
              <div className="space-y-3 text-left">
                <h4 className="text-xs font-black uppercase text-neutral-800 tracking-wider">2. Meaning of '50-50 Payment cycle'</h4>
                <div className="p-5 bg-blue-50/50 rounded-3xl border border-blue-100 space-y-2.5">
                  <p className="text-xs text-blue-900 font-bold leading-relaxed uppercase font-mono">
                    🔒 FLEXIBLE PRODUCTION LIQUIDITY FOR RECURRING REGISTERED MERCHANTS:
                  </p>
                  <p className="text-[11px] text-zinc-650 leading-relaxed">
                    Under B2B corporate guidelines, verified registered clients or credit-approved accounts on file can secure a 50% advance check to trigger preflight checks and mechanical offset runs.
                  </p>
                  <p className="text-[11px] text-zinc-650 leading-relaxed font-bold uppercase text-[9px] text-[#FF4D00] font-mono">
                    *PRACTICAL STAGED WORKFLOW PROCESS:
                  </p>
                  <ul className="text-[11px] text-zinc-550 pl-4 list-decimal space-y-1">
                    <li>Launch checkouts utilizing 50% upfront commitments to initiate platemaking.</li>
                    <li>Jobs advance through structural checks: 'Design Check' → 'Printing In Progress'.</li>
                    <li>Upon transitioning status to 'Ready for Dispatch', final 50% settle screens active.</li>
                    <li>Settle balance invoice sum instantly releases shipping courier waybill details.</li>
                  </ul>
                </div>
              </div>

              {/* File upload rules list */}
              <div className="space-y-3 text-left">
                <h4 className="text-xs font-black uppercase text-neutral-800 tracking-wider">3. First-Time File Upload Checklist</h4>
                <div className="p-5 bg-amber-50/50 rounded-3xl border border-amber-100 space-y-2">
                  <p className="text-xs text-amber-950 font-bold uppercase leading-relaxed font-mono">✓ AVOID PRE-PRESS CRITICAL REJECTIONS:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-[11px] text-zinc-650">
                    <p>• <strong>Vector layouts preferred:</strong> Export final works as PDF / EPS vectors to preserve sharp high-resolution plate rendering.</p>
                    <p>• <strong>Expand all fonts:</strong> Convert custom typography into outlines or paths so lettering never breaks.</p>
                    <p>• <strong>Colour Profiles:</strong> Set document space to <strong>U.S. Web Coated (SWOP) v2</strong> or Euroscale CMYK profiles.</p>
                    <p>• <strong>Monochrome Elements:</strong> Ensure thin black bars list strictly as 100K only, rather than compound four-layer rich blacks.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-zinc-50 p-5 border-t border-zinc-150 shrink-0 text-center">
              <button
                type="button"
                onClick={() => setShowFaqModal(false)}
                className="w-full py-3.5 bg-black hover:bg-[#FF4D00] text-white rounded-2xl text-xs font-heavy uppercase tracking-wider transition font-mono cursor-pointer"
              >
                Understood, Guidelines Verified
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. METICULOUS FOOTER ACCENTS */}
      <footer className="bg-white border-t border-zinc-200 py-12 mt-16 shrink-0">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center text-center space-y-8">
          
          <div className="w-full max-w-md bg-zinc-50 border border-zinc-200 rounded-2xl p-6 text-center">
             <h4 className="text-sm font-heavy uppercase tracking-widest text-[#FF4D00] mb-2">Subscribe to Updates</h4>
             <p className="text-xs text-zinc-500 mb-5 font-medium">Join our marketing list for exclusive printing discounts and updates.</p>
             <form onSubmit={handleSubscribe} className="flex gap-2">
               <input 
                 type="email" 
                 value={subscriberEmail}
                 onChange={(e) => setSubscriberEmail(e.target.value)}
                 className="flex-1 bg-white border border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#FF4D00]/50 transition-shadow"
                 placeholder="name@company.com"
                 required
               />
               <button 
                 type="submit" 
                 disabled={isSubscribing}
                 className="bg-black hover:bg-[#FF4D00] disabled:bg-zinc-400 text-white rounded-xl px-4 sm:px-6 py-3 text-xs font-heavy uppercase tracking-widest transition shadow-sm cursor-pointer"
               >
                 {isSubscribing ? 'Wait...' : 'Join'}
               </button>
             </form>
          </div>

          <div className="space-y-3">
            <p className="font-heavy text-sm uppercase text-slate-900 tracking-wide">
              © 2026 PRINT<span className="text-[#FF4D00]">BAZAAR</span> Press Ltd. Blueprints CMYK standard.
            </p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider max-w-lg mx-auto">
              PROUDLY DRIVEN BY HIGH-VOLUME INDUSTRIAL TYPOGRAPHY. HASSLE-FREE 100% UPFRONT SECURED CHECKOUTS.
            </p>
            <div className="flex justify-center items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-[#FF4D00] font-sans pt-1">
              <button 
                id="footer-privacy-link"
                type="button"
                onClick={() => setActivePolicyView('privacy')}
                className="hover:text-black hover:underline transition cursor-pointer"
              >
                Privacy Policy
              </button>
              <span className="text-zinc-300 select-none">•</span>
              <button 
                id="footer-qr-button"
                type="button"
                onClick={() => setShowQrModal(true)}
                className="hover:text-black hover:underline transition cursor-pointer flex items-center gap-0.5"
              >
                <QrCode className="w-3 h-3 text-[#FF4D00]" />
                Scan Mobile
              </button>
              <span className="text-zinc-300 select-none">•</span>
              <button 
                id="footer-terms-link"
                type="button"
                onClick={() => setActivePolicyView('terms')}
                className="hover:text-black hover:underline transition cursor-pointer"
              >
                Terms of Service
              </button>
              <span className="text-zinc-300 select-none">•</span>
              <button 
                id="footer-share-link"
                type="button"
                onClick={async () => {
                  const shareData = {
                    title: 'PrintBazaar',
                    text: 'Professional High-Volume Offset Printing at Wholesale Rates with AI-Powered Edit Studio.',
                    url: window.location.href
                  };
                  if (navigator.share) {
                    try {
                      await navigator.share(shareData);
                      triggerToast('App shared successfully!', 'success');
                    } catch (err: any) {
                      if (err.name !== 'AbortError') {
                        // fallback to copy if share failed or cancelled due to permissions
                        try {
                          await navigator.clipboard.writeText(window.location.href);
                          triggerToast('Copied App share link to clipboard!', 'success');
                        } catch {
                          triggerToast('Unable to launch share dialog: ' + err.message, 'warn');
                        }
                      }
                    }
                  } else {
                    try {
                      await navigator.clipboard.writeText(window.location.href);
                      triggerToast('App link copied to clipboard!', 'success');
                    } catch {
                      triggerToast('Sharing not supported on this platform.', 'warn');
                    }
                  }
                }}
                className="hover:text-black hover:underline transition cursor-pointer flex items-center gap-1"
              >
                Share App
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* 6. MOBILE FIXED BOTTOM NAVIGATION BAR */}
      {roleMode === 'customer' && !showSplash && (
        <>
          {/* Spacer to allow scrolling past the fixed nav bar on mobile */}
          <div className="h-20 md:hidden" />
          
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950 text-white border-t border-zinc-800/80 px-4 pt-2.5 pb-[calc(10px+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.15)] md:hidden flex justify-around items-center rounded-t-[24px]">
            <button
              type="button"
              onClick={() => setCustomerActiveTab('shop')}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition cursor-pointer ${
                customerActiveTab === 'shop' ? 'text-[#FF4D00]' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Grid className="w-5 h-5" />
              <span className="text-[9px] font-bold uppercase tracking-wider">Browse</span>
            </button>

            <button
              type="button"
              onClick={() => setCustomerActiveTab('wishlist')}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition relative cursor-pointer ${
                customerActiveTab === 'wishlist' ? 'text-[#FF4D00]' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Heart className={`w-5 h-5 ${customerActiveTab === 'wishlist' ? 'fill-[#FF4D00]' : ''}`} />
              {wishlistProducts.length > 0 && (
                <span className="absolute top-0 right-2 bg-rose-500 text-white rounded-full text-[8px] font-bold px-1 min-w-[14px] text-center border border-zinc-950">
                  {wishlistProducts.length}
                </span>
              )}
              <span className="text-[9px] font-bold uppercase tracking-wider">Wishlist</span>
            </button>

            <button
              type="button"
              onClick={() => setCustomerActiveTab('cart')}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition relative cursor-pointer ${
                customerActiveTab === 'cart' ? 'text-[#FF4D00]' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-5 h-5" />
              {cartItems.length > 0 && (
                <span className="absolute top-0 right-1 bg-[#FF4D00] text-black rounded-full text-[8px] font-black px-1 min-w-[14px] text-center border border-zinc-950">
                  {cartItems.length}
                </span>
              )}
              <span className="text-[9px] font-bold uppercase tracking-wider">Cart</span>
            </button>

            <button
              type="button"
              onClick={() => setCustomerActiveTab('status')}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition relative cursor-pointer ${
                customerActiveTab === 'status' ? 'text-[#FF4D00]' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Clock className="w-5 h-5" />
              {currentCustomerOrders.length > 0 && (
                <span className="absolute top-0 right-2 bg-[#FF4D00] text-black border border-zinc-950 text-[8px] font-black px-1.5 py-[1px] rounded-full">
                  {currentCustomerOrders.length}
                </span>
              )}
              <span className="text-[9px] font-bold uppercase tracking-wider">Orders</span>
            </button>

            <button
              type="button"
              onClick={() => setCustomerActiveTab('profile')}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition cursor-pointer ${
                customerActiveTab === 'profile' ? 'text-[#FF4D00]' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <User className="w-5 h-5" />
              <span className="text-[9px] font-bold uppercase tracking-wider">Profile</span>
            </button>

            <button
              type="button"
              onClick={() => setCustomerActiveTab('aistudio')}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition cursor-pointer ${
                customerActiveTab === 'aistudio' ? 'text-indigo-400' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Wand2 className="w-5 h-5" />
              <span className="text-[9px] font-bold uppercase tracking-wider">AI Edit</span>
            </button>
          </div>
        </>
      )}

      {/* Floating AI Customer Helpline */}
      <AiCustomerAssistant />

    </div>
    </>
  );
}
