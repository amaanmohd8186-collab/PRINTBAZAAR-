/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PincodeInfo {
  pincode: string;
  city: string;
  district: string;
  state: string;
  officeName?: string;
}

export interface ShippingRate {
  carrier: string;
  cost: number;
  margin: number;
  total: number;
  estimatedDays: number;
  type: 'City' | 'District' | 'State' | 'Interstate';
}

/**
 * Robust PIN code lookup for India
 */
export async function lookupPincode(pincode: string): Promise<PincodeInfo | null> {
  if (!/^\d{6}$/.test(pincode)) return null;

  try {
    const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    const data = await response.json();

    if (data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
      const office = data[0].PostOffice[0];
      return {
        pincode,
        city: office.Block === 'NA' ? office.Division : office.Block,
        district: office.District,
        state: office.State,
        officeName: office.Name
      };
    }
  } catch (error) {
    console.error('Pincode lookup error:', error);
  }

  // Fallback lookup for major hubs if API fails (Static Mapping for Demo Stability)
  const fallbackMap: Record<string, PincodeInfo> = {
    '110001': { pincode: '110001', city: 'New Delhi', district: 'New Delhi', state: 'Delhi' },
    '400001': { pincode: '400001', city: 'Mumbai', district: 'Mumbai', state: 'Maharashtra' },
    '560001': { pincode: '560001', city: 'Bengaluru', district: 'Bengaluru', state: 'Karnataka' },
    '700001': { pincode: '700001', city: 'Kolkata', district: 'Kolkata', state: 'West Bengal' },
    '600001': { pincode: '600001', city: 'Chennai', district: 'Chennai', state: 'Tamil Nadu' },
    '500001': { pincode: '500001', city: 'Hyderabad', district: 'Hyderabad', state: 'Telangana' },
  };

  return fallbackMap[pincode] || null;
}

/**
 * PrintBazaar Smart Pricing Engine
 */
export function calculateShippingRates(
  dest: PincodeInfo,
  weightKg: number,
  origin: PincodeInfo = { pincode: '110001', city: 'New Delhi', district: 'New Delhi', state: 'Delhi' }
): ShippingRate[] {
  
  let type: 'City' | 'District' | 'State' | 'Interstate' = 'Interstate';
  
  if (dest.pincode === origin.pincode || dest.city === origin.city) {
    type = 'City';
  } else if (dest.district === origin.district) {
    type = 'District';
  } else if (dest.state === origin.state) {
    type = 'State';
  }

  const carriers = [
    { name: 'Delhivery', baseRate: 60, perKg: 40, margin: 20, speed: 2 },
    { name: 'XpressBees', baseRate: 55, perKg: 35, margin: 15, speed: 3 },
    { name: 'Ecom Express', baseRate: 65, perKg: 45, margin: 25, speed: 2 },
    { name: 'India Post', baseRate: 40, perKg: 20, margin: 10, speed: 4 },
  ];

  const typeMultipliers = {
    'City': 0.6,
    'District': 0.8,
    'State': 1.0,
    'Interstate': 1.5
  };

  const multiplier = typeMultipliers[type];

  return carriers.map(c => {
    const courierCost = Math.round((c.baseRate + (weightKg * c.perKg)) * multiplier);
    const merchantMargin = Math.round(c.margin * multiplier);
    
    return {
      carrier: c.name,
      cost: courierCost,
      margin: merchantMargin,
      total: courierCost + merchantMargin,
      estimatedDays: type === 'City' ? 1 : type === 'District' ? c.speed : c.speed + 2,
      type
    };
  });
}
