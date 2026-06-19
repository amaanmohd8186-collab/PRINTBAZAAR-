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
  ChevronDown,
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
  Receipt,
  Share2,
  ArrowLeft,
  FileText,
  Trash2,
  Briefcase
} from 'lucide-react';
import { SmartShareSystem } from './components/SmartShareSystem';
import { 
  Product, 
  ProductCategory, 
  Order, 
  CartItem, 
  OrderStatus, 
  PaymentDetails, 
  UserSession, 
  UserStats, 
  Address,
  SocialPost
} from './types';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { 
  CATEGORIES, 
  CATEGORY_DEFAULT_IMAGES,
  INITIAL_PRODUCTS, 
  INITIAL_ORDERS, 
  INITIAL_SOCIAL_POSTS,
  getLocalStorageData, 
  setLocalStorageData 
} from './data';
import { db, auth, safeFetch } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc,
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import CustomizeModal from './components/CustomizeModal';
import CartView from './components/CartView';
import OrdersTracker from './components/OrdersTracker';
const AdminWorkspace = React.lazy(() => import('./components/AdminWorkspace'));
const DesignEditor = React.lazy(() => import('./components/DesignEditor').then(m => ({ default: m.DesignEditor })));
const CommunityFeed = React.lazy(() => import('./components/CommunityFeed'));
import PrintQualitySlider from './components/PrintQualitySlider';
import SplashPreview from './components/SplashPreview';
import MobileDebugPanel from './components/MobileDebugPanel';
import SellerVerificationSystem from './components/SellerVerificationSystem';
import SellerDashboard from './components/SellerDashboard';
import { FirebaseDiagnosticsPanel } from './components/FirebaseDiagnostics';
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
import { VerificationAuditDashboard } from './components/VerificationAuditDashboard';
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';
import { PrivacySecurity } from './components/PrivacySecurity';
import PushNotificationManager from './components/PushNotificationManager';
import CreatorProfileView from './components/CreatorProfileView';
import TrendingExplorer from './components/TrendingExplorer';
import DesignShowcaseModal from './components/DesignShowcaseModal';
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
      className="relative overflow-hidden w-full h-full cursor-zoom-in rounded-[30px] bg-zinc-50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
    >
      {/* 1. PROGRESSIVE BLUR-UP PLACEHOLDER LAYER */}
      {isLoading && (
        <img
          src={imgSrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover filter blur-[24px] scale-[1.1] opacity-80 select-none pointer-events-none transition-opacity duration-500"
          referrerPolicy="no-referrer"
        />
      )}

      {/* 2. CORE SHARP IMAGE LAYER WITH FADE + DISSOLVE TRANSITIONS */}
      <img
        src={imgSrc}
        alt={alt}
        referrerPolicy="no-referrer"
        className={`w-full h-full object-cover transition-all duration-700 ease-out ${
          isLoading ? 'opacity-0 scale-[1.03] filter blur-[8px]' : 'opacity-100 scale-100 filter blur-0'
        } ${className}`}
        style={{
          transform: isHovered ? 'scale(2.2)' : undefined,
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

      {/* Elegant glassmorphic active-loader status badge */}
      {isLoading && (
        <div className="absolute bottom-3 right-3 bg-white/70 backdrop-blur-md px-2.5 py-1 rounded-xl text-[8px] font-mono border border-white/50 text-zinc-500 flex items-center gap-1.5 shadow-2xs pointer-events-none uppercase tracking-wider select-none animate-pulse">
          <div className="w-1.5 h-1.5 rounded-full bg-[#FF4D00] animate-ping" />
          Pre-rendering...
        </div>
      )}
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

import { AuthModal } from './components/AuthModal';

export default function App() {
  const { theme, setTheme } = useTheme();
  const [showSplash, setShowSplash] = useState(true);
  const [isAppReady, setIsAppReady] = useState(false);
  const [startupLogs, setStartupLogs] = useState<string[]>(['INITIALIZING SECURE ENVIRONMENT...']);
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(() => {
    return !import.meta.env.VITE_FIREBASE_PROJECT_ID || !import.meta.env.VITE_FIREBASE_API_KEY;
  });
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
  const [customerActiveTab, setCustomerActiveTab] = useState<'home' | 'explore' | 'aistudio' | 'community' | 'status' | 'profile' | 'cart' | 'wishlist' | 'shop'>(() =>
    getLocalStorageData<'home' | 'explore' | 'aistudio' | 'community' | 'status' | 'profile' | 'cart' | 'wishlist' | 'shop'>('pb_active_tab', 'home')
  );
  const [viewingCreatorId, setViewingCreatorId] = useState<string | null>(null);
  const [viewingPost, setViewingPost] = useState<SocialPost | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'All'>('All');
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  const [catalogSortOrder, setCatalogSortOrder] = useState<'price-low' | 'price-high' | 'newest'>('newest');
  
  // Subscriber states
  const [subscriberEmail, setSubscriberEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  
  // Dynamic screen size type (mobile, tablet, laptop, desktop)
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'laptop' | 'desktop'>('desktop');
  const [isCartAnimating, setIsCartAnimating] = useState(false);

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
  const [enterprisePortal, setEnterprisePortal] = useState<'none' | 'seller' | 'seller-dashboard' | 'banners' | 'quotes' | 'franchise' | 'audit'>('none');
  const [dbUserRole, setDbUserRole] = useState<string>('customer');
  const [dbSellerStatus, setDbSellerStatus] = useState<string>('none');
  const [dbMerchantStatus, setDbMerchantStatus] = useState<string>('none');
  const [dbIsVerified, setDbIsVerified] = useState<boolean>(false);
  const [dbIsSeller, setDbIsSeller] = useState<boolean>(false);
  const [dbOnboardingCompleted, setDbOnboardingCompleted] = useState<boolean>(false);
  const [profilePortal, setProfilePortal] = useState<'none' | 'wallet' | 'credits' | 'profile_addresses' | 'rewards' | 'saved_designs' | 'premium' | 'editor' | 'history' | 'privacy_security'>('none');
  const [activePolicyView, setActivePolicyView] = useState<'none' | 'terms' | 'privacy' | 'refund' | 'shipping' | 'delete-account' | 'contact'>('none');
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [shareProduct, setShareProduct] = useState<Product | null>(null);
  const [showRecoveryModal, setShowRecoveryModal] = useState<boolean>(false);
  const [recoveryEmail, setRecoveryEmail] = useState<string>('');
  const [recoveryDaysLeft, setRecoveryDaysLeft] = useState<number>(30);

  useEffect(() => {
    if (activePolicyView !== 'none') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activePolicyView]);

  const prevOrdersRef = useRef<Order[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
    subscriptionTier: 'Free',
    followersCount: 0,
    followingCount: 0,
    totalDesignsCount: 0,
    likesReceived: 0,
    badges: [],
    achievements: []
  });

  const [showWelcomeBonus, setShowWelcomeBonus] = useState(false);

  // Fetch real-time stats from server (Firestore Realtime)
  useEffect(() => {
    if (user && db) {
      // 1. Setup real-time listener for user profile
      const userRef = doc(db, 'users', user.uid);
      
      const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const userEmail = user.email || '';
          const isWhitelisted = [
            'musagraphics75@gmail.com',
            'gazisiddiqui01@gmail.com'
          ].includes(userEmail);

          const actualRole = isWhitelisted ? (data.role || 'admin') : (data.role === 'admin' ? 'customer' : (data.role || 'customer'));

          setDbUserRole(data.role || 'customer');
          setDbSellerStatus(data.sellerStatus || 'none');
          setDbMerchantStatus(data.merchantStatus || 'none');
          setDbIsVerified(data.isVerified === true);
          setDbIsSeller(data.isSeller === true || data.role === 'seller');
          setDbOnboardingCompleted(data.onboardingCompleted === true);

          setUserStats({
            totalSpent: data.totalSpent || 0,
            ordersCount: data.ordersCount || 0,
            wishlistCount: data.wishlistCount || 0,
            walletBalance: data.walletBalance || 0,
            aiCredits: data.aiCredits || 0,
            referralEarnings: data.referralEarnings || 0,
            loyaltyPoints: data.loyaltyPoints || 0,
            subscriptionTier: actualRole === 'admin' ? 'Elite' : 'Free',
            followersCount: data.followersCount || 0,
            followingCount: data.followingCount || 0,
            totalDesignsCount: data.totalDesignsCount || 0,
            likesReceived: data.likesReceived || 0,
            badges: data.badges || [],
            achievements: data.achievements || []
          });

          // Sync session role to ground truth + whitelist
          setSession(prev => ({ ...prev, role: actualRole as any }));
          if (actualRole !== 'admin' && roleMode === 'admin') {
            setRoleMode('customer');
          }

          // Accurate Deactivation Reactivation on login via Firestore ground truth
          if (data.isDeactivated) {
            updateDoc(userRef, {
              isDeactivated: false,
              deactivatedAt: null
            }).then(() => {
              triggerToast(`🌟 Welcome back! Your account has been reactivated successfully. All live listings and alerts are restored!`, 'success');
            }).catch(err => {
              console.error("Reactivation failed:", err);
            });
            localStorage.removeItem(`pb_deactivated_state_${user.email}`);
          }

          // Accurate Deletion countdown via Firestore ground truth
          if (data.pendingDeletion) {
            const deletionDate = data.deletionScheduledAt?.toDate?.() || new Date(data.deletionScheduledAt);
            const now = new Date();
            const msDiff = deletionDate.getTime() - now.getTime();
            const remainingDays = Math.max(0, Math.ceil(msDiff / (1000 * 60 * 60 * 24)));
            
            setRecoveryEmail(user.email || '');
            setRecoveryDaysLeft(remainingDays);
            setShowRecoveryModal(true);
            
            // Sync local storage state to preserve parity
            localStorage.setItem(`pb_pending_deletion_${user.email}`, deletionDate.toISOString());
          } else {
            localStorage.removeItem(`pb_pending_deletion_${user.email}`);
          }
        } else {
          // Initialize profile if it doesn't exist
          setDoc(userRef, {
            email: user.email,
            name: user.displayName,
            role: 'customer',
            aiCredits: 100,
            creditType: 'WELCOME_BONUS',
            creditedAt: serverTimestamp(),
            walletBalance: 0,
            createdAt: serverTimestamp()
          }, { merge: true }).then(() => {
            setShowWelcomeBonus(true);
          });
        }
      }, (error) => {
        console.error("Profile listen failed:", error);
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
      if (viewingCreatorId) {
        setViewingCreatorId(null);
        window.history.pushState({ step: 'home_active' }, '');
        return true;
      }
      if (viewingPost) {
        setViewingPost(null);
        window.history.pushState({ step: 'home_active' }, '');
        return true;
      }
      if (customerActiveTab !== 'home') {
        setCustomerActiveTab('home');
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
    // Seed social data if collection is empty
    const seedSocial = async () => {
      if (!db) return;
      try {
        const postsSnap = await getDocs(query(collection(db, 'posts'), limit(1)));
        // Only attempt to seed if signed in as admin (to avoid random users seeding posts)
        if (postsSnap.empty && user && session.role === 'admin') {
          for (const post of INITIAL_SOCIAL_POSTS) {
            await addDoc(collection(db, 'posts'), {
              ...post,
              createdAt: serverTimestamp()
            });
          }
        }
      } catch (e) {
        console.warn("Failed to seed social posts:", e);
      }
    };
    if (user) {
      seedSocial();
    }

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

  // Validate connection to Firebase on initial boot
  useEffect(() => {
    async function testConnection() {
      try {
        setStartupLogs(prev => [...prev, 'ESTABLISHING FIREBASE CONNECTION...']);
        console.log("✓ Firebase instance active");
        setTimeout(() => {
          setStartupLogs(prev => [...prev, 'CLOUD BACKEND SYNCHRONIZATION COMPLETE.']);
        }, 300);
      } catch (error) {
        console.warn("Firebase connectivity notice:", error instanceof Error ? error.message : "Client not configured");
        setStartupLogs(prev => [...prev, 'WARNING: RUNNING IN LOCAL MODE']);
      }
    }
    testConnection();
  }, []);

  // Auth Authentication Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setShowDiagnostics(prev => !prev);
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'k') {
        // Prevent default browser search behavior
        e.preventDefault();
        setCustomerActiveTab('shop');
        setTimeout(() => {
          if (searchInputRef.current) {
            searchInputRef.current.focus();
            searchInputRef.current.select();
          }
        }, 80);
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setCustomerActiveTab('cart');
      }
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        setCustomerActiveTab('status');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCustomerActiveTab]);

  useEffect(() => {
    async function performStartupHealthCheck() {
      setStartupLogs(prev => [...prev, 'INITIATING SYSTEM HEALTH CHECK...']);
      let score = 100;
      
      // Check Firebase / Firestore (Wait briefly so onAuthStateChanged can trigger first if quick)
      try {
        if (!db) throw new Error("Firestore DB not initialized");
        await getDocs(query(collection(db, 'products'), limit(1)));
        setStartupLogs(prev => [...prev, '✓ FIREBASE / FIRESTORE: RESPONSIVE']);
      } catch (err) {
        setStartupLogs(prev => [...prev, '⚠️ FIREBASE / FIRESTORE: UNREACHABLE (Mock Mode)']);
        score -= 20;
        console.warn("Health Check: Firestore unreachable", err);
      }

      // Check Payments
      try {
        const res = await fetch('/api/cashfree/config');
        const text = await res.text();
        if (text && text.includes('"hasKeys":true')) {
          setStartupLogs(prev => [...prev, '✓ CASHFREE PAYMENTS: SECURE']);
        } else {
          setStartupLogs(prev => [...prev, '⚠️ CASHFREE PAYMENTS: MISSING KEYS (Simulation Active)']);
          score -= 15;
        }
      } catch (err) {
        setStartupLogs(prev => [...prev, '⚠️ CASHFREE PAYMENTS: UNREACHABLE']);
        score -= 15;
      }

      // Compute Community
      setStartupLogs(prev => [...prev, '✓ COMMUNITY SERVICES: ONLINE']);

      // AI Services Check
      try {
        const aiRes = await safeFetch('/api/admin/diagnostics');
        if (aiRes && aiRes.geminiDetails?.status === 'OK') {
          setStartupLogs(prev => [...prev, '✓ AI STUDIO SERVICES: ONLINE']);
        } else {
          setStartupLogs(prev => [...prev, '⚠️ AI STUDIO SERVICES: DEGRADED (Fallback Active)']);
          score -= 15;
        }
      } catch (err) {
        setStartupLogs(prev => [...prev, '⚠️ AI STUDIO SERVICES: UNREACHABLE']);
        score -= 15;
      }
      
      setStartupLogs(prev => [...prev, `[DIAGNOSTIC] SYSTEM HEALTH SCORE: ${Math.max(0, score)}/100`]);
    }
    
    performStartupHealthCheck();
  }, []);

  // Handle Firebase Google Redirect Authentication Result for Mobile and WebViews
  useEffect(() => {
    if (!auth) return;

    const handleRedirectResultCompletion = async () => {
      const redirectInProgress = localStorage.getItem('firebase_auth_redirect_in_progress') === 'true';

      try {
        let result: any = null;

        if (redirectInProgress) {
          setStartupLogs(prev => [...prev, 'CHECKING SECURE GOOGLE REDIRECT AUTH COMPLETION...']);

          // Timeout check to guarantee no hangs during loading
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Google identity handshake timed out (15s limit).")), 15000)
          );

          result = await Promise.race([
            getRedirectResult(auth),
            timeoutPromise
          ]);

          localStorage.removeItem('firebase_auth_redirect_in_progress');
        } else {
          result = await getRedirectResult(auth).catch(() => null);
        }

        if (result && result.user) {
          const firebaseUser = result.user;
          const userEmail = firebaseUser.email || '';
          setStartupLogs(prev => [...prev, `✓ REDIRECT AUTH COMPLETED SUCCESSFULLY FOR: ${userEmail}`]);
          triggerToast(`Google Sign-In successful! Welcome back, ${firebaseUser.displayName || 'User'}`, 'success');

          // SYNC USER DATA TO FIRESTORE AND REDIRECT TO DASHBOARD
          if (db) {
            const { doc, getDoc, setDoc, serverTimestamp } = await import('firebase/firestore');
            const userRef = doc(db, 'users', firebaseUser.uid);
            
            // Look up existing role or seller status before replacing
            const docSnap = await getDoc(userRef);
            let isSeller = false;
            let onboardingCompleted = false;
            let finalRole = 'user';

            if (docSnap.exists()) {
              const data = docSnap.data();
              isSeller = data.isSeller === true || data.role === 'seller';
              onboardingCompleted = data.onboardingCompleted === true;
              finalRole = data.role || 'user';
            }

            const isAdminEmail = [
              'musagraphics75@gmail.com',
              'gazisiddiqui01@gmail.com',
              'amaanmohd8186@gmail.com'
            ].includes(userEmail);
            
            if (isAdminEmail) {
              finalRole = 'admin';
            } else if (isSeller) {
              finalRole = 'seller';
            }

            await setDoc(userRef, {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || userEmail.split('@')[0] || 'User',
              email: userEmail,
              photoURL: firebaseUser.photoURL || '',
              role: finalRole,
              createdAt: docSnap.exists() ? (docSnap.data().createdAt || serverTimestamp()) : serverTimestamp(),
              lastLoginAt: serverTimestamp()
            }, { merge: true });

            // Automatically route of redirect user to appropriate portal
            if (isSeller || onboardingCompleted) {
              setEnterprisePortal('seller-dashboard');
              setCustomerActiveTab('profile'); // Align main frame
              triggerToast('Automatically redirected to Seller Dashboard', 'success');
            } else {
              setCustomerActiveTab('profile');
              setEnterprisePortal('none');
              triggerToast('Automatically redirected to Customer Profile', 'success');
            }
          } else {
            setCustomerActiveTab('profile');
          }
        }
      } catch (err: any) {
        if (redirectInProgress) {
          localStorage.removeItem('firebase_auth_redirect_in_progress');
          console.error("🔥 [GOOGLE REDIRECT AUTH COMPLETION SYSTEM EXCEPTION]", err);
          setStartupLogs(prev => [...prev, `⚠️ REDIRECT HANDSHAKE ENCOUNTERED ISSUES: ${err.message || err}`]);
          
          const isInIframe = window.self !== window.top;
          if (isInIframe) {
            triggerToast("Google Sign-In redirects are restricted inside preview frames. Please use 'Open in New Tab' at the top-right of your screen to complete sign-in.", "warn");
          } else {
            triggerToast(`Google Sign-In: ${err.message || err}`, 'warn');
          }
        }
      }
    };

    handleRedirectResultCompletion();
  }, [auth]);

  useEffect(() => {
    // Auth State Listener
    if (!auth) {
      console.warn("Auth not initialized. Bypassing state listener.");
      setIsAppReady(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const userEmail = firebaseUser.email || '';
        const isAdminEmail = [
          'musagraphics75@gmail.com',
          'gazisiddiqui01@gmail.com'
        ].includes(userEmail);
        
        const userRole = isAdminEmail ? 'admin' : 'customer';

        // SYNC USER DATA TO FIRESTORE
        try {
          if (db) {
            const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
            const userRef = doc(db, 'users', firebaseUser.uid);
            await setDoc(userRef, {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || userEmail.split('@')[0] || 'User',
              email: userEmail,
              photoURL: firebaseUser.photoURL || '',
              role: userRole === 'customer' ? 'user' : userRole, // Firestore schema needs 'user' per user instruction
              createdAt: serverTimestamp(),
              lastLoginAt: serverTimestamp()
            }, { merge: true });
          }
        } catch (e) {
          console.warn("Could not sync user profile to Firestore:", e);
        }

        setSession({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || userEmail.split('@')[0] || 'Authenticated User',
          email: userEmail,
          role: userRole
        });

        // Intercept Deactivation
        if (localStorage.getItem(`pb_deactivated_state_${userEmail}`) === 'true') {
          localStorage.removeItem(`pb_deactivated_state_${userEmail}`);
          setTimeout(() => {
            triggerToast(`🌟 Welcome back! Your account has been reactivated successfully. All live listings and alerts are restored!`, 'success');
          }, 400);
        }

        // Intercept Pending Deletion Scheduling
        const deletionDateStr = localStorage.getItem(`pb_pending_deletion_${userEmail}`);
        if (deletionDateStr) {
          const deletionDate = new Date(deletionDateStr);
          const now = new Date();
          const msPassed = now.getTime() - deletionDate.getTime();
          const daysPassed = Math.floor(msPassed / (1000 * 60 * 60 * 24));
          const remainingDays = Math.max(0, 30 - daysPassed);

          setRecoveryEmail(userEmail);
          setRecoveryDaysLeft(remainingDays);
          setShowRecoveryModal(true);
        } else {
          // triggerToast(`Signed in as ${userEmail}`, 'success'); // disable noisy toast on boot
        }
        
        setStartupLogs(prev => [...prev, 'AUTHENTICATING USER IDENTITY...']);
        setTimeout(() => {
          setStartupLogs(prev => [...prev, 'USER IDENTITY VERIFIED.', 'PREPARING PREMIER INTERFACE...']);
          setIsAppReady(true);
        }, 800);
      } else {
        setUser(null);
        setSession({
          id: 'cust-current',
          name: 'Amaan Mohd',
          email: 'amaanmohd8186@gmail.com',
          role: 'customer'
        });
        
        setStartupLogs(prev => [...prev, 'ESTABLISHING GUEST SESSION...']);
        setTimeout(() => {
          setStartupLogs(prev => [...prev, 'PREPARING PREMIER INTERFACE...']);
          setIsAppReady(true);
        }, 800);
      }
    });

    return () => unsubscribe();
  }, []);

  // Guarantee that app becomes ready even if Auth State Listener hangs due to slow connection
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isAppReady) {
        console.warn("Failsafe: Setting isAppReady to true due to slow/missing connection");
        setStartupLogs(prev => [...prev, 'ESTABLISHING OFFLINE FALLBACK...', 'PREPARING PREMIER INTERFACE...']);
        setIsAppReady(true);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [isAppReady]);

  // Monitor Window Pathnames and Hash Hooks for Public Compliance URLs
  useEffect(() => {
    const handleNavigationRouting = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();

      let matchedView: 'none' | 'terms' | 'privacy' | 'refund' | 'shipping' | 'delete-account' | 'contact' = 'none';

      if (path.includes('/delete-account') || hash === '#delete-account') {
        matchedView = 'delete-account';
      } else if (path.includes('/privacy-policy') || hash === '#privacy-policy' || hash === '#privacy') {
        matchedView = 'privacy';
      } else if (path.includes('/terms-and-conditions') || path.includes('/terms') || hash === '#terms-and-conditions' || hash === '#terms') {
        matchedView = 'terms';
      } else if (path.includes('/refund-policy') || hash === '#refund-policy' || hash === '#refund') {
        matchedView = 'refund';
      } else if (path.includes('/shipping-policy') || hash === '#shipping-policy' || hash === '#shipping') {
        matchedView = 'shipping';
      } else if (path.includes('/contact') || hash === '#contact') {
        matchedView = 'contact';
      }

      setActivePolicyView(matchedView);
      if (matchedView !== 'none') {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    };

    handleNavigationRouting();
    window.addEventListener('hashchange', handleNavigationRouting);
    return () => window.removeEventListener('hashchange', handleNavigationRouting);
  }, []);

  // Real-time Firestore synchronizer for Products catalog
  useEffect(() => {
    if (!db) {
      console.warn("Firestore not initialized. Using initial products mock.");
      setProducts(INITIAL_PRODUCTS);
      return;
    }
    const q = query(collection(db, 'products'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setProducts(INITIAL_PRODUCTS);
      } else {
        const productsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as unknown as Product[];
        setProducts(productsList);
      }
    }, (error) => {
      console.error("Products fetch failed:", error);
      setProducts(INITIAL_PRODUCTS);
    });

    return () => unsubscribe();
  }, []);

  // Real-time Firestore synchronizer for Orders
  useEffect(() => {
    if (!user) {
      setOrders(INITIAL_ORDERS);
      return;
    }
    if (!db) {
       console.warn("Firestore not initialized. Using initial orders mock.");
       setOrders(INITIAL_ORDERS);
       return;
    }

    const isAdmin = session.role === 'admin';
    let q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    
    if (!isAdmin) {
      q = query(collection(db, 'orders'), where('customerEmail', '==', user.email), orderBy('createdAt', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as unknown as Order[];
        
      // Compare status difference for notifications
      if (prevOrdersRef.current && prevOrdersRef.current.length > 0) {
        ordersList.forEach((newOrder) => {
          const oldOrder = prevOrdersRef.current.find(o => o.id === newOrder.id);
          if (oldOrder && oldOrder.status !== newOrder.status) {
            if (['Printing', 'Packing'].includes(newOrder.status)) {
              triggerServiceWorkerNotification(
                `Order #${newOrder.id} - ${newOrder.status}`,
                `Your blueprint order status is marked as: "${newOrder.status}".`
              );
              triggerToast(`🔔 Order #${newOrder.id} is now: ${newOrder.status}!`, 'success');
            }
          }
        });
      }
      prevOrdersRef.current = ordersList;
      setOrders(ordersList);
    }, (error) => {
      console.error("Orders fetch failed:", error);
    });

    return () => unsubscribe();
  }, [user, session.role]);

  // Seed INITIAL_ORDERS if list is empty and user is logged in as Admin
  useEffect(() => {
    if (user && session.role === 'admin' && orders.length === 0) {
      const seedOrders = async () => {
        if (!db) return;
        try {
          const snapshot = await getDocs(query(collection(db, 'orders'), limit(1)));
          if (snapshot.empty) {
            for (const ord of INITIAL_ORDERS) {
              await setDoc(doc(db, 'orders', ord.id), {
                ...removeUndefinedFields(ord),
                createdAt: serverTimestamp()
              });
            }
          }
        } catch (e) {
          console.error("Failed to seed initial orders", e);
        }
      };
      seedOrders();
    }
  }, [user, session.role, orders.length]);

  // handleGoogleSignIn shifted to AuthModal module

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
      if (!db) throw new Error("Firestore not initialized");
      await addDoc(collection(db, 'audit_logs'), {
        action: 'NEWSLETTER_SUBSCRIBE',
        details: { email: subscriberEmail },
        createdAt: serverTimestamp()
      });
      triggerToast("Subscribed successfully! Welcome aboard.", "success");
      setSubscriberEmail('');
    } catch (error) {
      console.error("Error subscribing:", error);
      triggerToast("Failed to subscribe at this time. Please try again.", "warn");
    } finally {
      setIsSubscribing(false);
    }
  };

  // 5. State Mutators
  const handleAddToCart = (item: CartItem) => {
    setCartItems((prev) => [...prev, item]);
    setFocusConfigProduct(null);
    triggerToast(`Added ${item.productName} configuration to your printing cart!`);
    setIsCartAnimating(true);
    setTimeout(() => setIsCartAnimating(false), 600);
    setCustomerActiveTab('cart');
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
    triggerToast('Item removed from cart.', 'warn');
  };

  const handleCheckoutSuccess = async (placedOrder: Order) => {
    try {
      if (user && db) {
        placedOrder.customerId = user.uid;
        placedOrder.customerEmail = user.email || placedOrder.customerEmail;
        
        await setDoc(doc(db, 'orders', placedOrder.id), {
          ...removeUndefinedFields(placedOrder),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else {
        setOrders((prev) => [placedOrder, ...prev]);
      }

      // Trigger automated SMTP email confirmation in the background
      safeFetch('/api/orders/send-confirmation', {
        method: 'POST',
        body: JSON.stringify({ order: placedOrder })
      })
      .then(data => {
        if (data.success) {
          console.log("Order confirmation email action response:", data.message);
        } else {
          console.warn("Order confirmation email logic message:", data.error);
        }
      })
      .catch(err => {
        console.error("Failed to trigger automated order confirmation email:", err);
      });

      triggerToast(`🎉 Order ${placedOrder.id} successfully created! Admin is review design bleeds.`, 'success');
      setCustomerActiveTab('status');
    } catch (e: any) {
      console.error("Checkout failed:", e);
      // Fallback local persistence state
      setOrders((prev) => [placedOrder, ...prev]);
      triggerToast(`🎉 Order ${placedOrder.id} successfully created locally! (Database offline)`, 'success');
      setCustomerActiveTab('status');
    }
  };

  const handleBalancePaymentSuccess = async (orderId: string, payment: PaymentDetails) => {
    try {
      if (db) {
        const orderRef = doc(db, 'orders', orderId);
        const snap = await getDoc(orderRef);
        
        if (snap.exists()) {
          const orderData = snap.data();
          const updatedPayments = [...(orderData.payments || []), payment];
          await updateDoc(orderRef, {
            balancePaid: true,
            payments: updatedPayments,
            updatedAt: serverTimestamp()
          });
          
          triggerToast(`Outstanding balance for ${orderId} check completed! Order released for shipment.`, 'success');
          return;
        }
      }

      setOrders((prev) => 
        prev.map((o) => {
          if (o.id === orderId) {
            return {
              ...o,
              balancePaid: true,
              payments: [...(o.payments || []), payment],
              updatedAt: new Date().toISOString()
            };
          }
          return o;
        })
      );
      triggerToast(`Outstanding balance for ${orderId} check completed locally!`, 'success');
    } catch (e: any) {
      console.error("Balance payment update failed:", e);
      setOrders((prev) => 
        prev.map((o) => {
          if (o.id === orderId) {
            return {
              ...o,
              balancePaid: true,
              payments: [...(o.payments || []), payment],
              updatedAt: new Date().toISOString()
            };
          }
          return o;
        })
      );
      triggerToast(`Outstanding balance for ${orderId} check completed locally!`, 'success');
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
      let customerEmail = '';

      if (db) {
        const orderRef = doc(db, 'orders', orderId);
        const snap = await getDoc(orderRef);
        
        if (snap.exists()) {
          const orderData = snap.data();
          customerEmail = orderData.customerEmail || orderData.userEmail || '';
          const updates: any = {
            status,
            updatedAt: serverTimestamp()
          };
          if (trackingNumber) updates.trackingNumber = trackingNumber;
          if (courierName) updates.courierName = courierName;
          
          await updateDoc(orderRef, updates);
          
          // Keep local state in sync instantly
          setOrders((prev) => 
            prev.map((o) => o.id === orderId ? { ...o, status, trackingNumber: trackingNumber || o.trackingNumber, courierName: courierName || o.courierName, updatedAt: new Date().toISOString() } : o)
          );
          triggerToast(`Order status updated to: ${status}`, 'success');
        } else {
          setOrders((prev) => 
            prev.map((o) => {
              if (o.id === orderId) {
                customerEmail = o.customerEmail || '';
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
      } else {
        setOrders((prev) => 
          prev.map((o) => {
            if (o.id === orderId) {
              customerEmail = o.customerEmail || '';
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
        triggerToast(`Order status updated locally to: ${status}`, 'success');
      }

      // Trigger Automated Status Email
      if (customerEmail && (status === 'Printing' || status === 'Packing')) {
        safeFetch('/api/emails/order-status', {
          method: 'POST',
          body: JSON.stringify({ email: customerEmail, orderId, status })
        }).catch(err => {
          console.error("Failed to trigger automated order status email:", err);
        });
      }
    } catch (e) {
      console.error("Order update failed:", e);
      // Local sync fallback
      setOrders((prev) => 
        prev.map((o) => o.id === orderId ? { ...o, status, trackingNumber: trackingNumber || o.trackingNumber, courierName: courierName || o.courierName, updatedAt: new Date().toISOString() } : o)
      );
      triggerToast(`Order status updated locally to: ${status}`, 'success');
    }
  };

  const handleAddNewProduct = async (newProduct: Product) => {
    try {
      if (db) {
        await setDoc(doc(db, 'products', newProduct.id), removeUndefinedFields(newProduct));
      } else {
        setProducts((prev) => [...prev, newProduct]);
      }
      triggerToast(`Successfully published ${newProduct.name} in standard catalogues!`);
    } catch (e: any) {
      console.error("Product addition failed:", e);
      // Fallback local products state
      setProducts((prev) => {
        if (prev.some(p => p.id === newProduct.id)) {
          return prev.map(p => p.id === newProduct.id ? newProduct : p);
        }
        return [...prev, newProduct];
      });
      triggerToast(`Published ${newProduct.name} to local view catalog.`, 'success');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      if (db) {
        await deleteDoc(doc(db, 'products', id));
      } else {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      }
      triggerToast('Product archived successfully from catalog views.', 'warn');
    } catch (e: any) {
      console.error("Product deletion failed:", e);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      triggerToast('Product archived from local view catalog.', 'warn');
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
  }).sort((a, b) => {
    if (catalogSortOrder === 'price-low' || catalogSortOrder === 'price-high') {
      const aMin = Math.min(...a.slabs.map(s => s.unitPrice));
      const bMin = Math.min(...b.slabs.map(s => s.unitPrice));
      return catalogSortOrder === 'price-low' ? aMin - bMin : bMin - aMin;
    } else if (catalogSortOrder === 'newest') {
      return b.id.localeCompare(a.id);
    }
    return 0;
  });

  return (
    <>
      <AnimatePresence mode="wait">
        {showSplash && (
          <SplashPreview 
            key="splash" 
            onFinish={() => setShowSplash(false)} 
            isAppReady={isAppReady}
            startupLogs={startupLogs}
          />
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ scale: 0.96, opacity: 0, filter: 'blur(15px)' }}
        animate={!showSplash ? { scale: 1, opacity: 1, filter: 'blur(0px)' } : { scale: 0.96, opacity: 0, filter: 'blur(15px)' }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} 
        className={`min-h-screen-dynamic ${theme === 'dark' ? 'bg-[#0B1120]' : 'bg-zinc-50'} flex flex-col font-sans w-full max-w-full overflow-x-hidden`}
      >
      
      {/* 1. SECURE TOP NAVIGATION SLABS */}
      <nav className="bg-white border-b border-zinc-200 sticky top-0 z-30 shadow-xs w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            
            {/* Logo */}
            <div className="flex items-center gap-3">
              <motion.div layoutId="app-logo-icon-morph" transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} className="w-10 h-10 rounded-2xl bg-[#0a0a0a] text-[#FF4D00] flex items-center justify-center font-heavy border border-[#FF4D00]/20 shadow-[0_0_10px_rgba(255,77,0,0.1)] relative overflow-hidden z-50">
                <Printer className="w-5 h-5 relative z-10 drop-shadow-[0_0_8px_#FF4D00]" />
              </motion.div>
              <motion.div layoutId="app-logo-text-morph" transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} className="hidden sm:block origin-left z-50">
                <h1 className="text-2xl font-heavy tracking-tight text-[#0F172A] leading-none uppercase">
                  PRINT<span className="text-[#FF4D00]">BAZAAR</span>
                </h1>
                <p className="font-micro text-gray-400 mt-1">Premium Press Hub</p>
              </motion.div>
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
                    onClick={() => setShowAuthModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-zinc-950 text-white hover:bg-[#FF4D00] transition rounded-2xl text-[11px] font-heavy uppercase tracking-wide border border-transparent shadow-sm cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-[#FF4D00]" />
                    <span>Sign In</span>
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
                onClick={() => setCustomerActiveTab('home')}
                className={`py-2 px-4.5 rounded-2xl text-xs font-heavy uppercase tracking-wider transition flex items-center gap-1.5 border border-transparent cursor-pointer ${
                  customerActiveTab === 'home'
                    ? 'bg-black text-white shadow-md'
                    : 'text-zinc-500 hover:text-neutral-900 bg-zinc-50 hover:bg-zinc-100 border-zinc-200'
                }`}
              >
                <Grid className="w-4 h-4" />
                <span>Home</span>
              </button>

              <button
                type="button"
                onClick={() => setCustomerActiveTab('explore')}
                className={`py-2 px-4.5 rounded-2xl text-xs font-heavy uppercase tracking-wider transition flex items-center gap-1.5 border border-transparent cursor-pointer ${
                  customerActiveTab === 'explore'
                    ? 'bg-black text-white shadow-md'
                    : 'text-zinc-500 hover:text-neutral-900 bg-zinc-50 hover:bg-zinc-100 border-zinc-200'
                }`}
              >
                <Search className="w-4 h-4" />
                <span>Explore</span>
              </button>

              <button
                type="button"
                onClick={() => setCustomerActiveTab('community')}
                className={`py-2 px-4.5 rounded-2xl text-xs font-heavy uppercase tracking-wider transition flex items-center gap-1.5 border border-transparent cursor-pointer ${
                  customerActiveTab === 'community'
                    ? 'bg-[#FF4D00] text-white shadow-md'
                    : 'text-zinc-500 hover:text-neutral-900 bg-zinc-50 hover:bg-zinc-100 border-zinc-200'
                }`}
              >
                <Share2 className="w-4 h-4" />
                <span>Community</span>
              </button>

              <button
                type="button"
                onClick={() => setCustomerActiveTab('aistudio')}
                className={`py-2 px-4.5 rounded-2xl text-xs font-heavy uppercase tracking-wider transition flex items-center gap-1.5 border border-transparent cursor-pointer ${
                  customerActiveTab === 'aistudio'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-zinc-500 hover:text-neutral-900 bg-zinc-50 hover:bg-zinc-100 border-zinc-200'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>AI Editor</span>
              </button>

              <button
                type="button"
                onClick={() => setCustomerActiveTab('status')}
                className={`py-2 px-4.5 rounded-2xl text-xs font-heavy uppercase tracking-wider transition flex items-center gap-1.5 border border-transparent cursor-pointer relative ${
                  customerActiveTab === 'status'
                    ? 'bg-black text-white shadow-md'
                    : 'text-zinc-500 hover:text-neutral-900 bg-zinc-50 hover:bg-zinc-100 border-zinc-200'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Orders</span>
                {currentCustomerOrders.length > 0 && (
                  <span className="bg-[#FF4D00] text-black font-mono text-[9px] px-1.5 py-0.5 rounded-full absolute -top-1.5 -right-1 font-black">
                    {currentCustomerOrders.length}
                  </span>
                )}
              </button>

              <motion.button
                type="button"
                onClick={() => setCustomerActiveTab('cart')}
                animate={isCartAnimating ? { 
                  scale: [1, 1.15, 1],
                  rotate: [0, -5, 5, -5, 5, 0]
                } : { scale: 1, rotate: 0 }}
                transition={{ duration: 0.5 }}
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
              </motion.button>

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

              {(dbIsSeller || dbOnboardingCompleted) && (
                <button
                  type="button"
                  onClick={() => setEnterprisePortal('seller-dashboard')}
                  className={`py-2 px-4.5 rounded-2xl text-xs font-heavy uppercase tracking-wider transition flex items-center gap-1.5 border border-transparent cursor-pointer ${
                    enterprisePortal === 'seller-dashboard'
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border-amber-200'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Seller Studio</span>
                </button>
              )}

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
          <div className="flex-1 w-full bg-zinc-50 flex flex-col">
            {activePolicyView === 'terms' && (
              <TermsOfService onBack={() => { window.location.hash = ''; setActivePolicyView('none'); }} />
            )}
            {activePolicyView === 'privacy' && (
              <PrivacyPolicy onBack={() => { window.location.hash = ''; setActivePolicyView('none'); }} />
            )}
            {activePolicyView === 'refund' && (
              <div className="space-y-6 text-left max-w-4xl mx-auto py-4">
                <button 
                  onClick={() => { window.location.hash = ''; setActivePolicyView('none'); }} 
                  className="py-2.5 px-5 bg-neutral-900 hover:bg-[#FF4D00] text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Shop</span>
                </button>
                <div className="bg-white rounded-[32px] border border-zinc-200/80 p-6 md:p-8 shadow-sm space-y-6">
                  <div className="flex items-center gap-4 border-b border-zinc-150 pb-5">
                    <div className="p-3 bg-[#FF4D00]/10 text-[#FF4D00] rounded-2xl">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-heavy text-slate-900 uppercase tracking-tight">Refund Policy</h3>
                      <p className="text-[10px] font-mono text-[#FF4D00] font-bold uppercase mt-0.5">https://printbazaar.in/refund-policy</p>
                    </div>
                  </div>
                  <div className="space-y-4 text-xs md:text-sm text-zinc-650 leading-relaxed font-sans">
                    <p className="font-bold text-slate-800 uppercase text-xs">1. Strict No-Cancellation on Custom Machinery Runs</p>
                    <p>Because every item is fully custom-made with precise CMYK screen channels and high-intensity raw substrate configurations, PrintBazaar operates under a strict **Zero refund & no-returns** policy on active machinery runs.</p>
                    <p className="font-bold text-slate-800 uppercase text-xs">2. Defective Batch Replacements</p>
                    <p>If print errors or color calibration shifts exceed standard margins (error margin matching 5%), our support line will initiate a high-volume plate rebuild and dispatch direct free replacements to your verified address directory.</p>
                    <p className="font-bold text-slate-800 uppercase text-xs">3. Wallet and Balances Refund Policy</p>
                    <p>Funds stored directly in PrintBazaar Wallets are not erasable and remain preserved securely. Refund claims with genuine proofs will be credited securely into your PB Wallet Balance or issued directly by the developer.</p>
                  </div>
                  <div className="bg-zinc-50 p-4 border border-zinc-150 rounded-xl text-center text-xs">
                    Questions? Contact Amaan Siddiqui: <strong className="text-[#FF4D00]">amaanmohd8681@gmail.com</strong>
                  </div>
                </div>
              </div>
            )}
            {activePolicyView === 'shipping' && (
              <div className="space-y-6 text-left max-w-4xl mx-auto py-4">
                <button 
                  onClick={() => { window.location.hash = ''; setActivePolicyView('none'); }} 
                  className="py-2.5 px-5 bg-neutral-900 hover:bg-[#FF4D00] text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Shop</span>
                </button>
                <div className="bg-white rounded-[32px] border border-zinc-200/80 p-6 md:p-8 shadow-sm space-y-6">
                  <div className="flex items-center gap-4 border-b border-zinc-150 pb-5">
                    <div className="p-3 bg-indigo-50 text-indigo-650 rounded-2xl">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-heavy text-slate-900 uppercase tracking-tight">Shipping Policy</h3>
                      <p className="text-[10px] font-mono text-indigo-650 font-bold uppercase mt-0.5">https://printbazaar.in/shipping-policy</p>
                    </div>
                  </div>
                  <div className="space-y-4 text-xs md:text-sm text-zinc-650 leading-relaxed font-sans">
                    <p className="font-bold text-slate-800 uppercase text-xs">1. Industry Fast Freight Dispatch</p>
                    <p>We partner with high-velocity transport carriers to deliver physical shipments safely with real-time tracking IDs. Normal dispatch lead time matches **1-2 business days** once draft designs are approved by administrators.</p>
                    <p className="font-bold text-slate-800 uppercase text-xs">2. Estimations of Delivery Timeline</p>
                    <p>Our standard production duration matches 3-5 days. Custom offset print catalog shipments reach your door in Noida/Delhi regions within 2 days, and other states across India within 5-7 days under normal carrier limits.</p>
                    <p className="font-bold text-slate-800 uppercase text-xs">3. Transit Disruption Safeties</p>
                    <p>In accordance with high-volume offset agreements, PrintBazaar handles transit disputes securely. If shipments are damaged in transit, file a claim on the client-facing tracking log for quick offset corrections.</p>
                  </div>
                </div>
              </div>
            )}
            {activePolicyView === 'contact' && (
              <div className="space-y-6 text-left max-w-4xl mx-auto py-4">
                <button 
                  onClick={() => { window.location.hash = ''; setActivePolicyView('none'); }} 
                  className="py-2.5 px-5 bg-neutral-900 hover:bg-[#FF4D00] text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Shop</span>
                </button>
                <div className="bg-white rounded-[32px] border border-zinc-200/80 p-6 md:p-8 shadow-sm space-y-6">
                  <div className="flex items-center gap-4 border-b border-zinc-150 pb-5">
                    <div className="p-3 bg-[#FF4D00]/10 text-[#FF4D00] rounded-2xl">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-heavy text-slate-900 uppercase tracking-tight">Contact Informational Directory</h3>
                      <p className="text-[10px] font-mono text-zinc-500 font-bold uppercase mt-0.5">https://printbazaar.in/contact</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 leading-relaxed font-sans text-xs">
                    <div className="space-y-4">
                      <h4 className="text-sm font-heavy text-slate-900 uppercase tracking-tight">Support Channels</h4>
                      <div className="p-4 bg-zinc-50 border border-zinc-150 rounded-2xl space-y-2">
                        <p className="font-bold text-slate-800 text-xs">📧 Standard Helpline Mail</p>
                        <a href="mailto:amaanmohd8681@gmail.com" className="text-[#FF4D00] hover:underline font-bold text-sm block">amaanmohd8681@gmail.com</a>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-sm font-heavy text-slate-900 uppercase tracking-tight">Developer Particulars</h4>
                      <div className="p-4 bg-zinc-50 border border-zinc-150 rounded-2xl space-y-1">
                        <p className="font-bold text-slate-400">Developer Architect</p>
                        <p className="font-neutral text-base font-black text-slate-950 uppercase tracking-tighter">Amaan Siddiqui</p>
                        <p className="text-[10px] text-zinc-500 uppercase mt-1">Lead Engineering & Compliance Officer</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activePolicyView === 'delete-account' && (
              <div className="space-y-6 text-left max-w-4xl mx-auto py-4">
                <button 
                  onClick={() => { window.location.hash = ''; setActivePolicyView('none'); }}
                  className="py-2.5 px-5 bg-neutral-900 hover:bg-[#FF4D00] text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Shop</span>
                </button>
                
                <div className="bg-white rounded-[32px] border border-zinc-200/80 p-6 md:p-8 shadow-sm space-y-6">
                  <div className="flex items-center gap-4 border-b border-zinc-150 pb-5">
                    <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100">
                      <Trash2 className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-heavy text-slate-900 uppercase tracking-tight">Public Deletion & Data Protection Room</h3>
                      <p className="text-[10px] font-mono text-rose-600 font-bold uppercase mt-0.5">https://printbazaar.in/delete-account</p>
                    </div>
                  </div>

                  <div className="space-y-4 text-xs md:text-sm text-zinc-650 leading-relaxed">
                    <div className="bg-rose-50 p-4 border border-rose-100 rounded-2xl text-rose-900 text-xs space-y-2">
                      <p className="font-black uppercase tracking-wide">Play Store & Privacy Policy Compliance Guard</p>
                      <p>This public interface explains play store safety rules. Users can self-service initiate account deactivation or permanent deletion directly inside the application.</p>
                    </div>

                    <p><strong>1. Categories of Stored Data Cleared Permanently:</strong></p>
                    <ul className="list-disc pl-5 text-xs text-zinc-650 space-y-1.5">
                      <li>Full user profile identity parameters matching your login directory</li>
                      <li>Contact listings, phone numbers, pincodes, and coordinate addresses</li>
                      <li>Active Cart products queue, wishlisted matches, and alert logs</li>
                      <li>Historical vector designs saved inside our offset pre-press studios</li>
                      <li>AI projects, background parameters, and remaining AI engine usage credits</li>
                    </ul>

                    <p><strong>2. The 30-Day Recovery Period:</strong></p>
                    <p>To prevent malicious and accidental erasures, your target profile transitions for **30 days into Pending Deletion state**. You can return and restore your account dynamically simply by logging back in inside this period grid. If inactive for more than 30 days, all data is permanently pruned from database caches.</p>

                    <p><strong>3. Initiating Self-Service Deletion In-App:</strong></p>
                    <p>To erase your account, navigate to:</p>
                    <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl font-mono text-[11px] text-indigo-600">
                      Profile Tab ➜ Privacy & Security Settings ➜ Delete Permanently
                    </div>

                    <div className="pt-2 text-left">
                      {user ? (
                        <button 
                          onClick={() => {
                            setProfilePortal('privacy_security');
                            setCustomerActiveTab('profile');
                            setActivePolicyView('none');
                          }}
                          className="px-5 py-3 bg-[#FF4D00] hover:bg-black text-white text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer shadow-md"
                        >
                          Go directly to my Privacy & Security Dashboard
                        </button>
                      ) : (
                        <button 
                          onClick={() => setShowAuthModal(true)}
                          className="px-5 py-3 bg-zinc-950 text-white hover:bg-[#FF4D00] text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer shadow-md"
                        >
                          Please Sign In to Access Deletion Panel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activePolicyView === 'none' && (
              <div className="flex-1 w-full flex flex-col overflow-x-hidden pt-4">
                {enterprisePortal !== 'none' && (
              <div className="w-full flex-1 p-0">
                <div className="px-4 sm:px-6 lg:px-8">
                  <button
                    type="button"
                    onClick={() => setEnterprisePortal('none')}
                    className="py-2.5 px-5 bg-neutral-900 hover:bg-[#FF4D00] text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md transition mb-6"
                  >
                    <span>← Back to My Profile</span>
                  </button>
                </div>

                {(enterprisePortal === 'seller' || enterprisePortal === 'seller-dashboard') && (
                  <div className="w-full">
                    {(dbIsSeller || dbOnboardingCompleted || enterprisePortal === 'seller-dashboard') ? (
                      <SellerDashboard
                        userId={user?.uid || 'cust-current'}
                        userEmail={session.email}
                        triggerToast={triggerToast}
                        onExit={() => setEnterprisePortal('none')}
                      />
                    ) : (
                      <SellerVerificationSystem 
                        isAdminMode={(roleMode as string) === 'admin'} 
                        triggerToast={triggerToast}
                        onVerificationComplete={(profile) => {
                          setEnterprisePortal('seller-dashboard');
                        }}
                      />
                    )}
                  </div>
                )}

                {enterprisePortal === 'banners' && session?.role === 'admin' && (
                  <BannerManager />
                )}

                {enterprisePortal === 'quotes' && (
                  <BulkQuoteGenerator />
                )}

                {enterprisePortal === 'audit' && session?.role === 'admin' && (
                  <VerificationAuditDashboard onBack={() => setEnterprisePortal('none')} />
                )}

                {enterprisePortal === 'franchise' && (
                  <FranchiseModule />
                )}
              </div>
            )}

            {enterprisePortal === 'none' && (
              <div className="flex-1 w-full flex flex-col">
                {customerActiveTab === 'aistudio' && (
                  <div className="fixed inset-0 z-[60] bg-zinc-50 flex flex-col pt-0 pb-0">
                     <React.Suspense fallback={
                       <div className="flex-1 w-full h-full flex flex-col items-center justify-center p-12 bg-white">
                         <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
                         <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest font-mono">Loading Design Engine...</p>
                       </div>
                     }>
                       <DesignEditor 
                         userEmail={session.email} 
                         userId={session.id}
                         onSave={(d) => triggerToast('Design saved to cloud.')} 
                         userStats={userStats}
                         onClose={() => setCustomerActiveTab('home')}
                       />
                     </React.Suspense>
                  </div>
                )}

                {/* SOCIAL COMMUNITY FEED */}
                {customerActiveTab === 'community' && (
                  <React.Suspense fallback={
                    <div className="flex-1 w-full min-h-[400px] flex flex-col items-center justify-center p-12 bg-white">
                      <div className="w-10 h-10 border-4 border-[#FF4D00] border-t-transparent rounded-full animate-spin mb-3" />
                      <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest font-mono">Loading Community Feed...</p>
                    </div>
                  }>
                    <CommunityFeed 
                      session={session} 
                      isAdmin={session.role === 'admin'} 
                      onCreatorClick={setViewingCreatorId}
                      onBuyClick={(id) => {
                        const p = products.find(prod => prod.id === id);
                        if (p) {
                          setFocusConfigProduct(p);
                        }
                      }}
                      triggerToast={triggerToast}
                    />
                  </React.Suspense>
                )}

                {/* TRENDING EXPLORE VIEW */}
                {customerActiveTab === 'explore' && (
                  <TrendingExplorer 
                    onPostClick={setViewingPost}
                    onHashtagClick={(tag) => triggerToast(`Browsing trend: #${tag}`)}
                    onCategoryClick={(cat) => {
                      setCustomerActiveTab('home');
                    }}
                  />
                )}

                {/* CREATOR PROFILE VIEW OVERLAY */}
                {viewingCreatorId && (
                  <div className="fixed inset-0 z-[70] bg-white overflow-y-auto">
                    <CreatorProfileView 
                      stats={{ ...userStats, userName: viewingCreatorId }} 
                      session={session}
                      isOwnProfile={viewingCreatorId === session.id}
                      onBack={() => setViewingCreatorId(null)}
                      onFollow={() => triggerToast(`Following ${viewingCreatorId}!`)}
                      onMessage={() => triggerToast(`Direct Messaging is being initialized...`)}
                      triggerToast={triggerToast}
                    />
                    <button 
                      onClick={() => setViewingCreatorId(null)}
                      className="fixed top-6 left-6 z-80 p-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-zinc-100 hover:scale-110 active:scale-90 transition-all"
                    >
                      <ArrowLeft className="w-5 h-5 text-zinc-900" />
                    </button>
                  </div>
                )}

                {/* SHOP AND WISHLIST TAB VIEW */}
                {(customerActiveTab === 'home' || customerActiveTab === 'wishlist') && (
                  <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 py-8 space-y-12">
                {/* Promo Billboard Accent */}
                {customerActiveTab === 'home' && (
                  <div className="relative bg-[#090b11] text-white p-8 md:p-12 rounded-[32px] border-[3px] border-black shadow-[12px_12px_0px_#000] flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden group">
                    {/* 3D dynamic gradient fluid orbs */}
                    <div className="absolute -top-[120px] -left-[120px] w-[350px] h-[350px] bg-[#FF4D00]/10 rounded-full blur-[140px] pointer-events-none" />
                    <div className="absolute -bottom-[120px] right-[10%] w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[130px] pointer-events-none" />
                    
                    {/* Mechanical press crosshair simulation graphic */}
                    <div className="absolute top-6 right-6 opacity-25 select-none hidden md:block pointer-events-none">
                      <div className="w-16 h-16 border-2 border-dashed border-zinc-700 rounded-full flex items-center justify-center relative animate-[spin_45s_linear_infinite]">
                        <div className="absolute inset-0 border-t-2 border-zinc-400 rounded-full" />
                        <div className="w-8 h-8 border border-zinc-600 rounded-full" />
                        <div className="w-0.5 h-16 bg-zinc-600 absolute" />
                        <div className="h-0.5 w-16 bg-zinc-600 absolute" />
                      </div>
                    </div>

                    <div className="space-y-4 max-w-2xl text-center md:text-left relative z-10">
                      <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                        <span className="bg-[#FF4D00] text-black font-mono text-[9px] font-black uppercase tracking-[0.16em] px-3.5 py-1 rounded-full shadow-lg shadow-[#FF4D00]/20">
                          DIRECT-TO-PLATE PLATFORM
                        </span>
                        <span className="bg-white/5 text-zinc-300 font-mono text-[8.5px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-white/5">
                          ⭐ Heidelberg Speedmaster S1
                        </span>
                      </div>
                      
                      <h2 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight tracking-tight uppercase font-sans">
                        PROFESSIONAL 3D <br className="hidden md:block" />
                        <span className="text-[#FF4D00] inline-block relative font-black">
                          OFFSET PRINT MATRIX
                          <span className="absolute bottom-1 left-0 w-full h-[3px] bg-[#FF4D00]/45 rounded-xl" />
                        </span>
                      </h2>
                      <p className="text-[11px] sm:text-xs text-zinc-350 max-w-lg leading-relaxed font-semibold mt-1">
                        Configure high-volume corporate stationery or banners. Post upfront payment, trigger instant cloud-hosted preflight checks, vector bleed calibrations, and launch live heavy-duty press runs today.
                      </p>
                    </div>
                    
                    {/* Physical glass deck readout */}
                    <div className="bg-black/40 backdrop-blur-md p-6 rounded-[28px] border border-white/10 space-y-3 text-xs text-center md:text-left max-w-[260px] shrink-0 relative z-10 shadow-3xl">
                      <div className="flex items-center gap-2 justify-center md:justify-start">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        <span className="font-mono text-[9px] font-black tracking-widest text-[#FF4D00] uppercase">AUTOMATION: CALIBRATED</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-zinc-500 font-bold uppercase tracking-wider text-[8.5px]">DELIVERABILITY TIME</p>
                        <p className="text-[11.5px] font-heavy uppercase leading-tight text-white">
                          GUARANTEED RELEASE <br />
                          IN 24-48 HOURS MAX
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[9px] font-mono text-zinc-400 font-bold uppercase">
                        <span>• DIRECT FACTORY VALUE</span>
                        <span className="text-[#FF4D00] font-black">100%</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Categories & Search Filter Block */}
                {customerActiveTab === 'home' && (
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
                    
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                      <div className="w-full md:w-auto space-y-3">
                        <span className="font-micro text-gray-500 block">Sort Catalog</span>
                        <div className="relative">
                          <select
                            value={catalogSortOrder}
                            onChange={(e) => setCatalogSortOrder(e.target.value as any)}
                            className="w-full md:w-48 pl-3 pr-8 py-2.5 bg-zinc-50 border border-zinc-200 rounded-[20px] text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#FF4D00]/25 text-zinc-800 transition appearance-none cursor-pointer"
                          >
                            <option value="newest">Newest First</option>
                            <option value="price-low">Price: Low to High</option>
                            <option value="price-high">Price: High to Low</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                        </div>
                      </div>

                      <div className="flex-1 space-y-3 w-full">
                        <div className="flex items-center">
                          <span className="font-micro text-gray-500 block">Keyword Search Catalog</span>
                          <span className="text-[9px] text-zinc-400 bg-zinc-150 px-1.5 py-0.5 rounded-md font-mono ml-2 uppercase font-black">Ctrl + K</span>
                        </div>
                        <div className="relative">
                          <input
                            ref={searchInputRef}
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
                {customerActiveTab === 'home' && <PrintQualitySlider />}

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
                            hidden: { opacity: 0, scale: 0.93, y: 20 },
                            show: { opacity: 1, scale: 1, y: 0 }
                          }}
                          whileHover={{ y: -8, x: -2 }}
                          transition={{ type: "spring", stiffness: 260, damping: 18 }}
                          className="bg-white rounded-[32px] border-[3px] border-black p-6 flex flex-col justify-between relative overflow-hidden shadow-[8px_8px_0px_#000] hover:shadow-[12px_12px_0px_#FF4D00] hover:border-black active:translate-y-0 active:translate-x-0 active:shadow-[4px_4px_0px_#000] transition-all duration-300 group cursor-default"
                        >
                          <div className="space-y-5">
                            {/* Image container with ratio with zoom-on-hover effect */}
                            <div className="rounded-[30px] overflow-hidden bg-zinc-100 border border-zinc-200/50 aspect-4/3 relative shadow-[inset_0_4px_12px_rgba(0,0,0,0.02)] group-hover:shadow-[inset_0_4px_16px_rgba(255,77,0,0.03)] transition-all">
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
                              <span className="absolute top-4 left-4 bg-black/85 backdrop-blur-md text-white font-mono text-[8px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-full shadow-sm z-10 pointer-events-none border border-white/10">
                                {p.category}
                              </span>
                              
                              {/* Premium top-right badges next to wishlist toggle */}
                              {(p.id === 'prod-1' || p.id === 'prod-5' || p.id === 'prod-7' || p.isNew) && (
                                <span className="absolute top-4 right-14 bg-emerald-600/90 backdrop-blur-xs text-white font-mono text-[8px] font-black uppercase tracking-[0.15em] px-2.5 py-1.5 rounded-full shadow-md z-15 pointer-events-none border border-emerald-500/20">
                                  ✨ NEW
                                </span>
                              )}
                              {(p.id === 'prod-2' || p.id === 'prod-3' || p.id === 'prod-6' || p.isBestseller) && (
                                <span className="absolute top-4 right-14 bg-amber-500/95 backdrop-blur-xs text-black font-mono text-[8px] font-black uppercase tracking-[0.12em] px-2.5 py-1.5 rounded-full shadow-md z-15 pointer-events-none border border-amber-400/20">
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

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShareProduct(p);
                                }}
                                className="absolute top-14 right-4 bg-white/50 backdrop-blur-md p-2 rounded-full cursor-pointer hover:bg-white text-zinc-400 hover:text-indigo-600 transition-all border border-white/40 shadow-sm z-10"
                                title="Smart Share options"
                              >
                                <Share2 className="w-4 h-4" />
                              </button>
                              {p.video && (
                                <span className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-md text-white font-micro px-3 py-1.5 rounded-full shadow-sm z-10 pointer-events-none flex items-center gap-1">
                                  ▶ CLIP
                                </span>
                              )}
                          </div>

                          <div className="space-y-2">
                            <h3 className="font-heavy text-lg uppercase text-slate-900 tracking-tight leading-none group-hover:text-[#FF4D00] transition-colors">
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

                        <div className="border-t border-gray-150 pt-5 mt-5 flex items-center justify-between gap-1">
                          <div className="shrink-0 group relative">
                            <span className="font-micro text-gray-400 block font-normal text-[10px] cursor-help">Starts from</span>
                            <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-zinc-900 text-white rounded-lg text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 border border-zinc-800 shadow-xl leading-relaxed">
                              This price is based on the default slab quantity ({smallestSlab?.quantity} pcs). Select customizations for exact pricing.
                              <div className="absolute top-full left-4 border-8 border-transparent border-t-zinc-900" />
                            </div>
                            <p className="text-sm font-heavy text-slate-900 font-mono tracking-tighter cursor-help">
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
                              className="py-2.5 px-3.5 bg-zinc-100 text-zinc-800 hover:bg-zinc-200 active:scale-95 rounded-2xl text-[10px] font-bold uppercase tracking-tight transition duration-150 cursor-pointer flex items-center gap-1 shrink-0 shadow-2xs"
                              title="Quick Add Default Quantity"
                            >
                              <span>Quick Buy</span>
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => setFocusConfigProduct(p)}
                              className="py-2.5 px-4 bg-black text-white hover:bg-[#FF4D00] active:scale-95 rounded-2xl text-[10px] font-bold uppercase tracking-tight transition duration-150 flex items-center gap-1 cursor-pointer shrink-0 shadow-sm"
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
                onBulkAddItems={(items) => setCartItems(prev => [...prev, ...items])}
              />
            )}

            {/* ORDER STATUS HISTORY VIEW */}
            {customerActiveTab === 'status' && (
              <OrdersTracker
                orders={currentCustomerOrders}
                onPayBalanceSuccess={handleBalancePaymentSuccess}
                onUpdateOrder={async (orderId, updates) => {
                  const orderRef = doc(db, 'orders', orderId);
                  const orderSnap = await getDoc(orderRef);
                  
                  if (orderSnap.exists()) {
                    await updateDoc(orderRef, {
                      ...updates,
                      updatedAt: serverTimestamp()
                    });
                  } else {
                    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updates, updatedAt: new Date().toISOString() } : o));
                  }
                  
                  if (updates.notifyOnDispatch !== undefined) {
                    triggerToast(
                      updates.notifyOnDispatch 
                        ? "SMS alerts enabled for this order dispatch!" 
                        : "Dispatch notifications disabled.",
                      'success'
                    );
                  }
                }}
                onReorder={handleReorder}
                userRole={session.role}
                userEmail={session.email}
              />
            )}

            {/* INTEGRATED PROFILE SUMMARY TAB VIEW FOR PERSISTENCE & NATIVE NAV */}
            {customerActiveTab === 'profile' && (
              <div className={`${profilePortal === 'privacy_security' ? 'max-w-5xl' : 'max-w-md'} mx-auto transition-all`}>
                {profilePortal === 'wallet' && <PBWallet stats={userStats} userId={user?.uid || 'guest'} onUpdateStats={setUserStats} onBack={() => setProfilePortal('none')} />}
                {profilePortal === 'credits' && <AICredits stats={userStats} userId={user?.uid || 'guest'} onUpdateStats={setUserStats} onBack={() => setProfilePortal('none')} />}
                {profilePortal === 'profile_addresses' && <ProfileAddresses stats={userStats} userName={session.name} userEmail={session.email} onUpdateSession={(n, e) => setSession({...session, name: n, email: e})} onUpdateStats={setUserStats} onBack={() => setProfilePortal('none')} />}
                {profilePortal === 'rewards' && <LoyaltyRewards stats={userStats} onUpdateStats={setUserStats} onBack={() => setProfilePortal('none')} />}
                {profilePortal === 'saved_designs' && <SavedDesigns stats={userStats} onUpdateStats={setUserStats} onBack={() => setProfilePortal('none')} />}
                {profilePortal === 'premium' && <PremiumUpgrade stats={userStats} userId={user?.uid || 'guest'} onUpdateStats={setUserStats} onBack={() => setProfilePortal('none')} />}
                {profilePortal === 'history' && <PaymentHistory userId={user?.uid || 'guest'} onBack={() => setProfilePortal('none')} />}
                {profilePortal === 'privacy_security' && (
                  <PrivacySecurity
                    stats={userStats}
                    session={session}
                    onUpdateStats={setUserStats}
                    onBack={() => setProfilePortal('none')}
                    onSignOut={handleSignOut}
                    triggerToast={triggerToast}
                  />
                )}
                
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

                <PushNotificationManager 
                  userId={user?.uid || null} 
                  userEmail={session.email} 
                  triggerToast={(title, t) => triggerToast(title, t === 'success' ? 'success' : 'warn')}
                />

                {/* ENTERPRISE SYSTEMS AND FRAUD VERIFICATIONS CONNECTORS */}
                <div className="border-t border-dashed border-zinc-200 pt-4 space-y-2">
                  <span className="text-[9px] font-black uppercase tracking-wider font-mono text-[#FF4D00] block text-left">Enterprise Services Pool</span>
                  
                  <button
                    type="button"
                    onClick={() => setEnterprisePortal(dbIsSeller || dbOnboardingCompleted ? 'seller-dashboard' : 'seller')}
                    className="w-full py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-950 bg-zinc-50 hover:bg-zinc-100 flex items-center justify-between rounded-xl transition border border-zinc-200 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-amber-500">{dbIsSeller || dbOnboardingCompleted ? '💼' : '🔐'}</span>
                      <span>{dbIsSeller || dbOnboardingCompleted ? 'Seller Studio & Dashboard' : 'Seller Onboarding'}</span>
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
                    onClick={() => requireUserAuthAction(() => setProfilePortal('privacy_security'))}
                    className="w-full py-3.5 px-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-700 hover:bg-zinc-50 flex items-center justify-between rounded-xl transition border border-zinc-100 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-indigo-500" />
                      <span>Privacy & Security Settings</span>
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
                      onClick={() => setShowAuthModal(true)}
                      className="w-full py-3.5 bg-zinc-950 text-white hover:bg-[#FF4D00] rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <User className="w-4 h-4 text-[#FF4D00]" />
                      <span>Sign In / Connect Account</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )}
  </div>
)}
</div>
)}

        {/* ADMIN WORKSPACE LAYOUT */}
        {roleMode === 'admin' && session?.role === 'admin' && (
          <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-zinc-50 font-micro text-[10px] uppercase tracking-widest text-[#FF4D00]">Loading Secure Admin Bundle...</div>}>
            <AdminWorkspace
              orders={orders}
              products={products}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onAddNewProduct={handleAddNewProduct}
              onDeleteProduct={handleDeleteProduct}
              onShowAudit={() => setEnterprisePortal('audit')}
            />
          </React.Suspense>
        )}

        {roleMode === 'customer' && <WhatsAppFloatingButton product={focusConfigProduct || undefined} cartItems={cartItems} />}

      </main>

      {/* FAQ Guide Footer Section - ONLY ON HOME (SHOP) TAB */}
      {roleMode === 'customer' && customerActiveTab === 'home' && activePolicyView === 'none' && enterprisePortal === 'none' && (
        <section className="bg-zinc-100 border-t border-zinc-200 py-12 px-4 sm:px-6 lg:px-8 mt-10 rounded-t-[40px] border w-full">
          <div className="w-full max-w-7xl mx-auto">
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
                        Established corporate clients can register a 50% advance pledge to initialize plate rendering with the remaining 50% balance cleared dynamically once status flags &quot;Packing&quot;.
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

      {shareProduct && (
        <SmartShareSystem
          product={shareProduct}
          isOpen={!!shareProduct}
          onClose={() => setShareProduct(null)}
        />
      )}

      {/* 30-Day Deletion Grace Period Interceptor Warning Room */}
      {showRecoveryModal && (
        <div className="fixed inset-0 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 select-none">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden border border-zinc-100 flex flex-col p-8 text-center space-y-6 relative">
            <div className="flex flex-col items-center space-y-3 pt-2">
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center border border-rose-100 animate-pulse">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="font-sans font-black text-rose-600 text-xl tracking-tight uppercase">Account Scheduled For Deletion</h3>
              <p className="text-zinc-500 text-[10px] font-mono font-bold uppercase tracking-widest bg-zinc-50 py-1.5 px-3 rounded-full border border-zinc-150">
                {recoveryEmail}
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-rose-50 border border-rose-100 p-5 rounded-3xl text-left space-y-2.5">
                <div className="flex justify-between items-center text-xs font-black text-rose-900 uppercase">
                  <span>Grace Period Tracker</span>
                  <span className="text-sm text-rose-600 font-mono tracking-tighter">{recoveryDaysLeft} Days Left</span>
                </div>
                <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-rose-500 h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${Math.max(5, (recoveryDaysLeft / 30) * 100)}%` }} 
                  />
                </div>
                <p className="text-[11px] leading-relaxed text-zinc-650 pt-1">
                  Your profile and associated pre-press designs, AI studio configurations, and loyalty points are safely preserved in a **30-day pending grace period**. To cancel deletion, click below.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={async () => {
                  try {
                    if (user) {
                      const d = await safeFetch('/api/user/delete-cancel', {
                        method: 'POST',
                        body: JSON.stringify({ userId: user.uid })
                      });
                      if (d.success) {
                        setShowRecoveryModal(false);
                        triggerToast('🎉 Account successfully restored!', 'success');
                      }
                    }
                  } catch (err: any) {
                    triggerToast('Service error: ' + err.message, 'warn');
                  }
                  localStorage.removeItem(`pb_pending_deletion_${recoveryEmail}`);
                }}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-heavy uppercase tracking-widest text-[11px] rounded-2xl cursor-pointer shadow-md transition active:scale-98"
              >
                Restore Account Permanently
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowRecoveryModal(false);
                  handleSignOut();
                }}
                className="w-full py-3.5 bg-neutral-900 hover:bg-[#FF4D00] text-white font-heavy uppercase tracking-widest text-[10px] rounded-2xl cursor-pointer transition"
              >
                Continue Deletion & Sign Out
              </button>
            </div>
          </div>
        </div>
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
                    <li>Jobs advance through structural checks: 'Design Review' → 'Printing'.</li>
                    <li>Upon transitioning status to 'Packing', final 50% settle screens active.</li>
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

      {/* 5. METICULOUS FOOTER ACCENTS - ONLY ON HOME (SHOP) TAB */}
      {roleMode === 'customer' && customerActiveTab === 'home' && (
        <footer className="bg-white border-t border-zinc-200 py-12 shrink-0 w-full">
          <div className="w-full px-4 flex flex-col items-center text-center space-y-8">
          
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

          <div className="space-y-4">
            <p className="font-heavy text-sm uppercase text-slate-900 tracking-wide">
              © 2026 PRINT<span className="text-[#FF4D00]">BAZAAR</span> Press Ltd. Blueprints CMYK standard.
            </p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider max-w-lg mx-auto">
              PROUDLY DRIVEN BY HIGH-VOLUME INDUSTRIAL TYPOGRAPHY. HASSLE-FREE 100% UPFRONT SECURED CHECKOUTS.
            </p>
            
            <div className="flex flex-col gap-3 items-center justify-center pt-1">
              {/* PRIMARY COMPLIANCE LINKS ROW */}
              <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 text-[10px] font-bold uppercase tracking-widest text-[#FF4D00] font-sans">
                <button 
                  id="footer-privacy-link"
                  type="button"
                  onClick={() => { window.location.hash = '#privacy'; }}
                  className="hover:text-black hover:underline transition cursor-pointer"
                >
                  Privacy Policy
                </button>
                <span className="text-zinc-300 select-none hidden sm:inline">•</span>
                <button 
                  id="footer-terms-link"
                  type="button"
                  onClick={() => { window.location.hash = '#terms'; }}
                  className="hover:text-black hover:underline transition cursor-pointer"
                >
                  Terms of Service
                </button>
                <span className="text-zinc-300 select-none hidden sm:inline">•</span>
                <button 
                  id="footer-qr-button"
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="hover:text-black hover:underline transition cursor-pointer flex items-center gap-0.5"
                >
                  <QrCode className="w-3 h-3 text-[#FF4D00]" />
                  <span>Scan Mobile</span>
                </button>
                <span className="text-zinc-300 select-none hidden sm:inline">•</span>
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
                  className="hover:text-black hover:underline transition cursor-pointer"
                >
                  Share App
                </button>
              </div>

              {/* SECOND COMPLIANCE FOOTER ROW */}
              <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 font-sans border-t border-zinc-100 pt-2.5 w-full max-w-lg">
                <button 
                  type="button"
                  onClick={() => { window.location.hash = '#refund'; }}
                  className="hover:text-[#FF4D00] hover:underline transition cursor-pointer"
                >
                  Refund Policy
                </button>
                <span className="text-zinc-300 select-none font-normal">•</span>
                <button 
                  type="button"
                  onClick={() => { window.location.hash = '#shipping'; }}
                  className="hover:text-[#FF4D00] hover:underline transition cursor-pointer"
                >
                  Shipping Policy
                </button>
                <span className="text-zinc-300 select-none font-normal">•</span>
                <button 
                  type="button"
                  onClick={() => { window.location.hash = '#contact'; }}
                  className="hover:text-[#FF4D00] hover:underline transition cursor-pointer"
                >
                  Contact Page
                </button>
                <span className="text-zinc-300 select-none font-normal">•</span>
                <button 
                  type="button"
                  onClick={() => { window.location.hash = '#delete-account'; }}
                  className="hover:text-rose-600 hover:underline transition cursor-pointer font-black text-[#FF4D00]"
                >
                  Delete Account URL
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    )}

      {/* 6. MOBILE FIXED BOTTOM NAVIGATION BAR */}
      {roleMode === 'customer' && !showSplash && customerActiveTab !== 'aistudio' && (
        <>
          {/* Spacer to allow scrolling past the fixed nav bar on mobile */}
          <div className="h-20 md:hidden" />
          
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950 text-white border-t border-zinc-800/80 px-2 pt-2.5 pb-[calc(10px+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.15)] md:hidden flex justify-around items-center rounded-t-[24px]">
            <button
              type="button"
              onClick={() => setCustomerActiveTab('home')}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition cursor-pointer ${
                customerActiveTab === 'home' ? 'text-[#FF4D00]' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Grid className="w-5 h-5" />
              <span className="text-[9px] font-bold uppercase tracking-wider">Home</span>
            </button>

            <button
              type="button"
              onClick={() => setCustomerActiveTab('explore')}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition relative cursor-pointer ${
                customerActiveTab === 'explore' ? 'text-[#FF4D00]' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Search className="w-5 h-5" />
              <span className="text-[9px] font-bold uppercase tracking-wider">Explore</span>
            </button>

            <button
              type="button"
              onClick={() => setCustomerActiveTab('aistudio')}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition cursor-pointer ${
                (customerActiveTab as string) === 'aistudio' ? 'text-indigo-400' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-5 h-5" />
              <span className="text-[9px] font-bold uppercase tracking-wider">AI Studio</span>
            </button>

            <button
              type="button"
              onClick={() => setCustomerActiveTab('community')}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition relative cursor-pointer ${
                customerActiveTab === 'community' ? 'text-[#FF4D00]' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Share2 className="w-5 h-5" />
              <span className="text-[9px] font-bold uppercase tracking-wider">Community</span>
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
          </div>
        </>
      )}

      {/* Floating AI Customer Helpline */}
      <AiCustomerAssistant />

      {/* Mobile Audit Debug Panel */}
      <MobileDebugPanel />

      {/* Global OTP & Firebase Diagnostics Panel */}
      {showDiagnostics && (
        <FirebaseDiagnosticsPanel onClose={() => setShowDiagnostics(false)} />
      )}
      
      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)} 
          triggerToast={triggerToast} 
        />
      )}

      {/* Welcome Bonus Modal */}
      <AnimatePresence>
        {showWelcomeBonus && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[32px] p-8 shadow-2xl overflow-hidden text-center"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#FF4D00] to-orange-400" />
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner">
                🎉
              </div>
              
              <h2 className="text-2xl font-black uppercase text-zinc-900 tracking-tight mb-2">Welcome to PrintBazaar</h2>
              <p className="text-sm font-medium text-zinc-500 mb-6 font-mono">You received a special gift!</p>
              
              <div className="bg-zinc-50 rounded-2xl p-6 mb-8 border border-zinc-100">
                <div className="text-4xl font-black text-[#FF4D00] mb-2 tracking-tighter">100</div>
                <div className="text-xs font-black uppercase tracking-widest text-zinc-800">FREE AI Credits</div>
              </div>
              
              <div className="space-y-3 mb-8 text-left max-w-[260px] mx-auto">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4 pb-2 border-b border-zinc-100">Use them for:</p>
                <div className="flex items-center gap-3"><span className="text-[#FF4D00]">✓</span> <span className="text-sm font-medium text-zinc-700">AI Background Removal</span></div>
                <div className="flex items-center gap-3"><span className="text-[#FF4D00]">✓</span> <span className="text-sm font-medium text-zinc-700">AI Upscaling</span></div>
                <div className="flex items-center gap-3"><span className="text-[#FF4D00]">✓</span> <span className="text-sm font-medium text-zinc-700">AI Poster Generator</span></div>
                <div className="flex items-center gap-3"><span className="text-[#FF4D00]">✓</span> <span className="text-sm font-medium text-zinc-700">AI Logo Generator</span></div>
                <div className="flex items-center gap-3"><span className="text-[#FF4D00]">✓</span> <span className="text-sm font-medium text-zinc-700">AI Wedding Card Generator</span></div>
              </div>
              
              <button
                type="button"
                onClick={() => setShowWelcomeBonus(false)}
                className="w-full py-4 bg-zinc-950 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#FF4D00] transition-colors cursor-pointer"
              >
                Start Creating
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Design Showcase Modal / Buying from Post */}
      <AnimatePresence>
        {viewingPost && (
          <DesignShowcaseModal 
            post={viewingPost}
            product={products.find(p => p.id === viewingPost.linkedProductId)}
            onClose={() => setViewingPost(null)}
            onBuy={(id) => {
              const p = products.find(prod => prod.id === id);
              if (p) {
                setViewingPost(null);
                setFocusConfigProduct(p);
              }
            }}
            triggerToast={triggerToast}
          />
        )}
      </AnimatePresence>

    </motion.div>
    </>
  );
}
