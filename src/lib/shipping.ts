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
  pickupPincode: '207401',
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
  if (!isValidIndianPincode(deliveryPincode)) {
    return {
      isServiceable: false,
      estimatedDays: 'N/A',
      pincode: deliveryPincode
    };
  }

  cachePincode(deliveryPincode);

  try {
    const res = await fetch(`/api/shipping/estimate?destination=${deliveryPincode}`);
    if (!res.ok) throw new Error("API Error");
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.message || "Failed");
    }
    
    return {
      isServiceable: true,
      pincode: deliveryPincode,
      city: data.city || 'Unknown',
      state: data.state || 'Unknown',
      printingTime: `${settings.printingTimeDays} Day${settings.printingTimeDays > 1 ? 's' : ''}`,
      shippingTime: data.shippingTime || 'Unknown',
      totalTime: data.totalTime || 'Unknown',
      estimatedDays: data.totalTime || 'Unknown',
      deliveryDate: data.deliveryDate || 'Unknown',
      expressAvailable: settings.expressPrintingEnabled,
      courierName: data.courierName || 'Shiprocket Partner'
    };
  } catch (err) {
    // If Shiprocket API is not connected or fails
    return {
      isServiceable: false,
      estimatedDays: 'Delivery estimate unavailable.',
      pincode: deliveryPincode,
      city: 'Unknown',
      state: 'Unknown',
      printingTime: 'N/A',
      shippingTime: 'Delivery estimate unavailable.',
      totalTime: 'Delivery estimate unavailable.',
      deliveryDate: 'Delivery estimate unavailable.',
      expressAvailable: false,
      courierName: 'N/A',
      error: 'Delivery estimate unavailable.'
    };
  }
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
  
  try {
    const res = await fetch(`/api/shipping/estimate?destination=${pincode}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.success) {
        return {
          pincode,
          city: data.city,
          state: data.state,
          district: data.region || data.city
        };
      }
    }
  } catch (err) {
    console.warn("Failed to query shipping estimate API:", err);
  }

  // No mock logic fallbacks to maintain absolute zero-fake guidelines
  return null;
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
