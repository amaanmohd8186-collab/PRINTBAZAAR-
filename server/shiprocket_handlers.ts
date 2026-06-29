let shiprocketToken: string | null = null;
let tokenExpiresAt: number = 0;

// Internal function to authenticate and get token
async function getShiprocketToken(): Promise<string> {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    throw new Error('Shiprocket credentials missing. Set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD.');
  }

  // Reuse token if valid (expires in 10 days, refresh if < 1 hour left)
  if (shiprocketToken && Date.now() < tokenExpiresAt - 3600000) {
    return shiprocketToken;
  }

  const res = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  const data: any = await res.json();
  
  if (!res.ok) {
    throw new Error(data.message || 'Failed to authenticate with Shiprocket');
  }

  shiprocketToken = data.token;
  // Usually expires in 10 days (240 hours)
  tokenExpiresAt = Date.now() + (240 * 60 * 60 * 1000); 

  return shiprocketToken;
}

export async function fetchPincodeDetails(pincode: string) {
  const token = await getShiprocketToken();
  const res = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/serviceability/?pickup_postcode=207401&delivery_postcode=${pincode}&weight=0.5&cod=0`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data: any = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch pincode details from Shiprocket');
  }
  return data;
}

export async function createShiprocketOrder(orderData: any) {
  const token = await getShiprocketToken();
  
  // Format for shiprocket
  const payload = {
    order_id: orderData.id,
    order_date: new Date().toISOString(),
    pickup_location: "Marehra", // assuming the pickup location is named Marehra in Shiprocket panel
    channel_id: "",
    comment: orderData.notes || "",
    billing_customer_name: orderData.customerName,
    billing_last_name: "",
    billing_address: orderData.shippingAddress.line1,
    billing_address_2: orderData.shippingAddress.line2 || "",
    billing_city: orderData.shippingAddress.city,
    billing_pincode: orderData.shippingAddress.pincode,
    billing_state: orderData.shippingAddress.state,
    billing_country: "India",
    billing_email: orderData.customerEmail,
    billing_phone: orderData.customerPhone,
    shipping_is_billing: true,
    order_items: orderData.items.map((item: any) => ({
      name: item.productName,
      sku: item.productId,
      units: item.selectedQuantity,
      selling_price: item.priceTotal / item.selectedQuantity,
      discount: "",
      tax: "",
      hsn: 4820
    })),
    payment_method: "Prepaid",
    shipping_charges: orderData.shippingTotal || 0,
    giftwrap_charges: 0,
    transaction_charges: 0,
    total_discount: 0,
    sub_total: orderData.subtotal,
    length: 10,
    breadth: 15,
    height: 20,
    weight: 0.5
  };

  const res = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  const data: any = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to create Shiprocket order');
  }
  return data;
}

export async function generateAWB(shipmentId: string) {
  const token = await getShiprocketToken();
  const res = await fetch('https://apiv2.shiprocket.in/v1/external/courier/assign/awb', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      shipment_id: shipmentId
    })
  });

  const data: any = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to generate AWB');
  }
  return data;
}

export async function trackShipment(awbCode: string) {
  const token = await getShiprocketToken();
  const res = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/track/awb/${awbCode}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data: any = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to track shipment');
  }
  return data;
}
