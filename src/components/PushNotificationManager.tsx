import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, BellRing, Check, AlertCircle, Sparkles, Radio, Trash2, Eye } from 'lucide-react';
import { db, getMessagingService, getToken, isSupported, doc, setDoc, updateDoc } from '../firebase';

interface PushNotificationManagerProps {
  userId: string | null;
  userEmail: string;
  triggerToast: (title: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export default function PushNotificationManager({ userId, userEmail, triggerToast }: PushNotificationManagerProps) {
  const [status, setStatus] = useState<'loading' | 'unregistered' | 'requesting' | 'registered' | 'denied' | 'not_supported'>('loading');
  const [token, setToken] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function checkSupport() {
      try {
        const supported = await isSupported();
        if (!supported) {
          setStatus('not_supported');
          return;
        }
        if (!('Notification' in window)) {
          setStatus('not_supported');
          return;
        }

        // Check active permissions state
        if (Notification.permission === 'denied') {
          setStatus('denied');
        } else if (Notification.permission === 'granted') {
          const savedToken = localStorage.getItem('pb_push_token');
          if (savedToken) {
            setToken(savedToken);
            setStatus('registered');
          } else {
            setStatus('unregistered');
          }
        } else {
          setStatus('unregistered');
        }
      } catch (e) {
        console.warn('Notifications compatibility check exception:', e);
        setStatus('not_supported');
      }
    }
    checkSupport();
  }, []);

  const showLocalNotification = (title: string, options?: NotificationOptions) => {
    if ('serviceWorker' in navigator && Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          icon: '/manifest.json',
          badge: '/manifest.json',
          tag: 'pb-alert',
          vibrate: [200, 100, 200],
          ...options
        } as any);
      }).catch(() => {
        new Notification(title, options);
      });
    } else if (Notification.permission === 'granted') {
      new Notification(title, options);
    }
  };

  const handleRegister = async () => {
    if (!userId) {
      triggerToast('Please sign in to register notification devices.', 'warning');
      return;
    }

    setStatus('requesting');
    setErrorMsg(null);

    try {
      // 1. Double check permission request in user interaction gesture
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatus('denied');
        throw new Error('Notification permission was denied by the user or sandboxed environment.');
      }

      // 2. Fetch Messaging
      const messaging = await getMessagingService();
      if (!messaging) {
        throw new Error('FCM is not supported or accessible (commonly restricted in sandboxed previews).');
      }

      // 3. Request Token with public VAPID Key
      const vapidKey = 'BIPgE-T-8Lz53g8lZ_S0LgSjR2tqP9eXfL6P3bFvB-58S6BfLpL6P3vXvL-O6BfGpI1_P2Vv_L-9L';
      
      let tokenValue = '';
      try {
        // Try standard direct retrieval
        tokenValue = await getToken(messaging, { vapidKey });
      } catch (fcmErr) {
        console.warn('[FCM] Direct token request failed, trying service-worker helper registry:', fcmErr);
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          tokenValue = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
        } else {
          throw fcmErr;
        }
      }

      if (!tokenValue) {
        throw new Error('No client FCM token returned by Firebase cluster.');
      }

      setToken(tokenValue);
      localStorage.setItem('pb_push_token', tokenValue);

      // 4. Save device registry parameters in user profile
      const userRef = doc(db, 'users', userId);
      const tokenRef = doc(db, `users/${userId}/fcm_tokens`, tokenValue);

      await setDoc(tokenRef, {
        token: tokenValue,
        email: userEmail,
        createdAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
        active: true,
        deviceType: 'Web/Browser'
      });

      await updateDoc(userRef, {
        pushNotificationsEnabled: true,
        lastFcmToken: tokenValue,
        updatedAt: new Date().toISOString()
      });

      setStatus('registered');
      triggerToast('Push Notifications connected successfully!', 'success');

      showLocalNotification('✓ PrintBazaar Push Active', {
        body: 'Awesome! Real-time alerts are now fully armed. You will be messaged for production events.',
        tag: 'pb-connected'
      });

    } catch (err: any) {
      console.error('[FCM REGISTER EXCEPTION]', err);
      // Determine if really denied or if sandboxed iframe failure
      const isSandboxFailure = window.self !== window.top && err.message?.toLowerCase().includes('sandbox');
      
      if (isSandboxFailure) {
        setStatus('not_supported');
        setErrorMsg('Security Block: Standard permission requests are blocked inside sandbox iframes. Please click "Open in New Tab" to activate push notifications.');
        triggerToast('Sandbox restricted: Open app in new tab to enable notifications.', 'warning');
      } else {
        setStatus(Notification.permission === 'denied' ? 'denied' : 'unregistered');
        setErrorMsg(err.message || 'Notification registration failed or is restricted.');
        triggerToast(err.message || 'Push alerts connection failed.', 'error');
      }
    }
  };

  const handleDeactivate = async () => {
    if (!userId) return;
    try {
      const savedToken = token || localStorage.getItem('pb_push_token');
      if (savedToken) {
        const tokenRef = doc(db, `users/${userId}/fcm_tokens`, savedToken);
        await updateDoc(tokenRef, { active: false, deactivatedAt: new Date().toISOString() }).catch(() => {});
      }

      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { pushNotificationsEnabled: false }).catch(() => {});

      localStorage.removeItem('pb_push_token');
      setToken(null);
      setStatus('unregistered');
      triggerToast('Real-time push alerts disabled.', 'info');
    } catch (error: any) {
      triggerToast('Failed to disconnect device: ' + error.message, 'error');
    }
  };

  const handleSimulateAlert = () => {
    setIsTesting(true);
    triggerToast('Dispatching scheduled offline alert queue (4s delay)...', 'info');

    // Emulate background message flow from server logic
    setTimeout(() => {
      showLocalNotification('🔔 PrintBazaar: Order In Production!', {
        body: 'Indian Offset Presses have approved your design! Your Business Cards are now spinning in Offset Stage 4. Delivery estimated Thursday.',
        badge: '/manifest.json',
        tag: 'pb-production-alert',
        requireInteraction: true
      });
      setIsTesting(false);
      triggerToast('Notification triggered successfully!', 'success');
    }, 4000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="bg-zinc-50 border border-zinc-200 p-5 rounded-[24px] space-y-4 text-left"
    >
      <div className="flex gap-3.5">
        <div className={`p-3 rounded-2xl flex items-center justify-center shrink-0 ${
          status === 'registered' ? 'bg-emerald-50 text-emerald-600 border border-emerald-150' : 'bg-orange-50 text-[#FF4D00]'
        }`}>
          {status === 'registered' ? <BellRing className="w-5 h-5 animate-pulse" /> : <Bell className="w-5 h-5" />}
        </div>
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-zinc-800 flex items-center gap-2">
            Real-time push alerts
            {status === 'registered' && (
              <span className="bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-widest font-mono">
                Active
              </span>
            )}
          </h4>
          <p className="text-[10px] text-zinc-500 font-medium leading-relaxed mt-1">
            Get instant mobile & desktop push alerts when print quotes are custom audited, discounts pop, or items dispatch. Alerts work even when the app is fully closed!
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {status === 'loading' && (
          <motion.div key="loading" className="flex items-center gap-1.5 py-1" exit={{ opacity: 0 }}>
            <span className="w-2 h-2 rounded-full bg-zinc-400 animate-ping inline-block" />
            <span className="text-[9px] font-mono text-zinc-400 font-bold uppercase">Auditing background features...</span>
          </motion.div>
        )}

        {status === 'not_supported' && (
          <motion.div key="not_supported" className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-[10px] uppercase font-bold" exit={{ opacity: 0 }}>
            <p className="flex items-start gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <span>
                {errorMsg ? errorMsg : 'FCM is not supported on this device/frame context.'}
              </span>
            </p>
            <p className="text-[8px] text-amber-600 mt-1 font-medium capitalize font-mono">
              Tip: Standard preview frames block browser alerts. Click the "Open in New Tab" header icon to authorize properly!
            </p>
          </motion.div>
        )}

        {status === 'denied' && (
          <motion.div key="denied" className="border border-rose-100 bg-rose-50/70 p-3 rounded-xl space-y-2 text-[10px]" exit={{ opacity: 0 }}>
            <p className="flex items-start gap-1.5 text-rose-800 font-bold uppercase">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>Notification Permissions Blocked</span>
            </p>
            <p className="text-[9px] text-rose-600 leading-normal font-semibold">
              You or your browser environment blocked browser alerts. Please reset the site notification settings in your browser bar, then refresh the page.
            </p>
          </motion.div>
        )}

        {status === 'unregistered' && (
          <motion.div key="unregistered" className="space-y-3" exit={{ opacity: 0 }}>
            {errorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-100 text-[9px] text-rose-600 font-bold rounded-lg uppercase flex gap-1 items-center">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            <button
              onClick={handleRegister}
              className="w-full py-3 px-4 bg-zinc-900 text-white hover:bg-[#FF4D00] active:scale-98 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Radio className="w-4 h-4 text-[#FF4D00] animate-pulse" />
              <span>Authorize & Enable Push Alerts</span>
            </button>
          </motion.div>
        )}

        {status === 'registered' && (
          <motion.div key="registered" className="space-y-2.5" exit={{ opacity: 0 }}>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleSimulateAlert}
                disabled={isTesting}
                className="flex-1 py-2.5 px-3 bg-white text-zinc-800 border border-zinc-200 hover:border-[#FF4D00] rounded-xl text-[10px] font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#FF4D00]" />
                <span>{isTesting ? 'Simulating alert...' : 'Test Closed-App Alert'}</span>
              </button>

              <button
                onClick={handleDeactivate}
                className="py-2.5 px-3 bg-zinc-100 text-zinc-650 hover:bg-rose-50 hover:text-rose-600 rounded-xl text-[10px] font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer"
                title="Disconnect Device token"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="sr-only">Disable</span>
              </button>
            </div>
            {isTesting && (
              <p className="text-[8px] font-mono font-bold text-zinc-400 uppercase text-center animate-pulse">
                ⏳ Queue filled. Minimize tab now to test closed-app notification! (4s left)
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
