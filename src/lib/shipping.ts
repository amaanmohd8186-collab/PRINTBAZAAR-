/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShippingServiceability, ShippingRateRequest, ShippingOrderRequest, ShippingRate, PincodeInfo, LogisticsSettings } from '../types';

/**
 * SHIPPING SERVICE MODULE (ULTRA - PHASE 2 READY)
 * This module handles advanced logistics logic, PIN persistence, 
 * and provides full API skeletons for Shiprocket Phase 2 integration.
 */

export const DEFAULT_LOGISTICS_SETTINGS: LogisticsSettings = {
  pickupPincode: '110001',
  defaultWeight: 0.5,
  printingTimeDays: 1,
  packagingTimeDays: 1,
  dispatchCutoffTime: '18:00',
  freeShippingThreshold: 999,
  defaultCourier: 'Delhivery',
  shippingMarginPercent: 5,
  expressPrintingEnabled: true
};

/**
 * PIN CODE CACHING (Smart PIN Cache)
 */
const PIN_CACHE_KEY = 'printbazaar_pincode';

export const cachePincode = (pincode: string) => {
  if (isValidIndianPincode(pincode)) {
    localStorage.setItem(PIN_CACHE_KEY, pincode);
  }
};

export const getCachedPincode = (): string | null => {
  return localStorage.getItem(PIN_CACHE_KEY);
};

/**
 * UTILS
 */
export const isValidIndianPincode = (pincode: string): boolean => {
  return /^[1-9][0-9]{5}$/.test(pincode);
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
};

/**
 * PHASE 2: PIN CODE SERVICEABILITY & ESTIMATES
 */
export const checkServiceability = async (
  deliveryPincode: string,
  settings: LogisticsSettings = DEFAULT_LOGISTICS_SETTINGS
): Promise<ShippingServiceability> => {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 600));

  if (!isValidIndianPincode(deliveryPincode)) {
    return {
      isServiceable: false,
      estimatedDays: 'N/A',
      pincode: deliveryPincode
    };
  }

  // Cache it for the user
  cachePincode(deliveryPincode);

  // Phase 2 Mock Logic
  const isServiceable = !deliveryPincode.startsWith('000') && !deliveryPincode.startsWith('999');
  
  if (!isServiceable) {
    return { isServiceable: false, estimatedDays: 'N/A', pincode: deliveryPincode };
  }

  // Calculate timelines
  const printingDays = settings.printingTimeDays;
  const shippingDays = 2 + Math.floor(Math.random() * 2); // 2-3 days mock
  const totalDays = printingDays + shippingDays;

  const now = new Date();
  const deliveryDate = addDays(now, totalDays);

  const info = await lookupPincode(deliveryPincode);

  return {
    isServiceable: true,
    pincode: deliveryPincode,
    city: info?.city || 'New Delhi',
    state: info?.state || 'Delhi',
    printingTime: `${printingDays} Day${printingDays > 1 ? 's' : ''}`,
    shippingTime: `${shippingDays} Day${shippingDays > 1 ? 's' : ''}`,
    totalTime: `${totalDays} Day${totalDays > 1 ? 's' : ''}`,
    estimatedDays: `${totalDays} Days`,
    deliveryDate: formatDate(deliveryDate),
    expressAvailable: settings.expressPrintingEnabled,
    courierName: settings.defaultCourier
  };
};

/**
 * SHIPROCKET API STUBS (PHASE 2 READY)
 * These functions will handle actual API calls when credentials are provided.
 */

export const shiprocketAuth = async () => {
  // Log removed
  return { token: 'mock-token' };
};

export const getShippingRates = async (request: ShippingRateRequest) => {
  // Log removed
  // Prepare for real API: POST /external/courier/serviceability
  return {
    status: 200,
    rates: [
      { courier_name: 'Delhivery', rate: 45, etd: '3 days' },
      { courier_name: 'BlueDart', rate: 85, etd: '2 days' }
    ]
  };
};

export const createShiprocketOrder = async (order: ShippingOrderRequest) => {
  // Log removed
  // Prepare for real API: POST /external/orders/create/adhoc
  return { order_id: 'SR-' + Date.now(), shipment_id: 'SH-' + Date.now() };
};

export const generateAWB = async (shipmentId: string) => {
  // Log removed
  return { awb_code: 'AWB' + Math.floor(Math.random() * 100000000) };
};

export const getTrackingInfo = async (awb: string) => {
  // Log removed
  return {
    status: 'In Transit',
    history: [
      { date: '2026-06-27', activity: 'Shipment Picked Up' }
    ]
  };
};

/**
 * LEGACY COMPATIBILITY
 */
export const lookupPincode = async (pincode: string): Promise<PincodeInfo | null> => {
  if (!isValidIndianPincode(pincode)) return null;
  
  // Mock logic for city/state detection
  let city = 'New Delhi';
  let state = 'Delhi';
  let district = 'Central Delhi';

  if (pincode.startsWith('400')) { city = 'Mumbai'; state = 'Maharashtra'; district = 'Mumbai City'; }
  else if (pincode.startsWith('560')) { city = 'Bengaluru'; state = 'Karnataka'; district = 'Bangalore Urban'; }
  else if (pincode.startsWith('600')) { city = 'Chennai'; state = 'Tamil Nadu'; district = 'Chennai'; }
  else if (pincode.startsWith('700')) { city = 'Kolkata'; state = 'West Bengal'; district = 'Kolkata'; }
  else if (pincode.startsWith('500')) { city = 'Hyderabad'; state = 'Telangana'; district = 'Hyderabad'; }
  else if (pincode.startsWith('380')) { city = 'Ahmedabad'; state = 'Gujarat'; district = 'Ahmedabad'; }

  return { pincode, city, state, district };
};

export const calculateShippingRates = (
  info: PincodeInfo, 
  weightKg: number,
  settings: LogisticsSettings = DEFAULT_LOGISTICS_SETTINGS
): ShippingRate[] => {
  const baseRate = 80 + (weightKg * 40); // Base calculation
  const marginMultiplier = 1 + (settings.shippingMarginPercent / 100);
  const rateWithMargin = Math.round(baseRate * marginMultiplier);
  const tax = Math.round(rateWithMargin * 0.18); // 18% GST
  const total = rateWithMargin + tax;

  const isFree = settings.freeShippingThreshold > 0 && total >= settings.freeShippingThreshold;

  return [{
    id: 'delhivery-01',
    name: settings.defaultCourier + ' Standard',
    carrier: settings.defaultCourier,
    type: 'Surface',
    rate: rateWithMargin,
    tax: tax,
    total: isFree ? 0 : total,
    estimatedDays: `${settings.printingTimeDays + 2}–${settings.printingTimeDays + 4}`
  }];
};
