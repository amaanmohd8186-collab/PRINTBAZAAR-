/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Order, CartItem, Address } from '../types';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';

interface GSTInvoiceProps {
  order: Order;
  companyDetails: {
    name: string;
    address: string;
    gstin: string;
    pan: string;
    email: string;
    phone: string;
    logo?: string;
  };
}

export default function GSTInvoice({ order, companyDetails }: GSTInvoiceProps) {
  const taxableValue = Math.round(order.totalAmount / 1.18);
  const gstAmount = order.totalAmount - taxableValue;
  const cgst = gstAmount / 2;
  const sgst = gstAmount / 2;

  return (
    <div className="bg-white p-8 max-w-[800px] mx-auto font-sans text-zinc-900 border border-zinc-200 shadow-xl print:shadow-none print:border-none">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-zinc-900 pb-6 mb-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-white font-black text-xl">PB</div>
             <h1 className="text-3xl font-black uppercase tracking-tighter">PrintBazaar™</h1>
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 leading-relaxed">
            <p>{companyDetails.address}</p>
            <p>GSTIN: {companyDetails.gstin} | PAN: {companyDetails.pan}</p>
            <p>Email: {companyDetails.email} | Phone: {companyDetails.phone}</p>
          </div>
        </div>
        <div className="text-right space-y-2">
           <h2 className="text-xl font-black uppercase tracking-widest bg-zinc-900 text-white px-4 py-1 inline-block">Tax Invoice</h2>
           <div className="text-[10px] font-black uppercase tracking-widest space-y-0.5">
             <p>Invoice No: PBZ/2026/{order.id.toUpperCase().slice(0, 8)}</p>
             <p>Date: {format(new Date(order.createdAt), 'dd MMM yyyy')}</p>
             <p>Place of Supply: {order.shippingAddress?.state.toUpperCase()}</p>
           </div>
        </div>
      </div>

      {/* Bill To & Ship To */}
      <div className="grid grid-cols-2 gap-12 mb-8">
        <div className="space-y-3">
           <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-100 pb-1">Bill To</h3>
           <div className="text-[11px] font-bold uppercase leading-relaxed">
             <p className="text-sm font-black">{order.customerName}</p>
             <p>{order.shippingAddress?.addressLine1}</p>
             <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</p>
             <p className="mt-2">Email: {order.customerEmail}</p>
             <p>Phone: {order.shippingAddress?.phone}</p>
           </div>
        </div>
        <div className="space-y-3">
           <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-100 pb-1">Ship To</h3>
           <div className="text-[11px] font-bold uppercase leading-relaxed">
             <p className="text-sm font-black">{order.shippingAddress?.name || order.customerName}</p>
             <p>{order.shippingAddress?.addressLine1}</p>
             <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</p>
           </div>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full mb-8 border-collapse">
        <thead>
          <tr className="bg-zinc-50 text-[9px] font-black uppercase tracking-widest text-zinc-500 border-y border-zinc-200">
            <th className="py-3 px-4 text-left">#</th>
            <th className="py-3 px-4 text-left">Product Description</th>
            <th className="py-3 px-4 text-center">HSN</th>
            <th className="py-3 px-4 text-center">Qty</th>
            <th className="py-3 px-4 text-right">Unit Price</th>
            <th className="py-3 px-4 text-right">Taxable Value</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {order.items.map((item, idx) => (
            <tr key={idx} className="text-[10px] font-bold uppercase">
              <td className="py-4 px-4 text-zinc-400">{idx + 1}</td>
              <td className="py-4 px-4">
                <p className="font-black text-zinc-900">{item.productName}</p>
                <p className="text-[9px] text-zinc-400">{item.selectedSize.name} | {item.selectedMaterial.name}</p>
              </td>
              <td className="py-4 px-4 text-center">4911</td>
              <td className="py-4 px-4 text-center">{item.selectedQuantity}</td>
              <td className="py-4 px-4 text-right">₹{Math.round((item.itemTotal / 1.18) / item.selectedQuantity).toLocaleString('en-IN')}</td>
              <td className="py-4 px-4 text-right">₹{Math.round(item.itemTotal / 1.18).toLocaleString('en-IN')}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary */}
      <div className="flex justify-between items-start gap-12">
        <div className="flex-1 space-y-6">
           <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-2">
             <h4 className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Bank Details</h4>
             <div className="text-[9px] font-bold uppercase">
               <p>Bank: HDFC BANK LTD</p>
               <p>A/C Name: PRINTBAZAAR PVT LTD</p>
               <p>A/C No: 50200012345678</p>
               <p>IFSC: HDFC0001234</p>
             </div>
           </div>
           <div className="text-[9px] font-bold text-zinc-400 uppercase italic">
             Note: This is a computer generated invoice and does not require a physical signature.
           </div>
        </div>

        <div className="w-72 space-y-3">
           <div className="flex justify-between text-[10px] font-bold uppercase">
              <span>Total Taxable Value</span>
              <span>₹{taxableValue.toLocaleString('en-IN')}</span>
           </div>
           <div className="flex justify-between text-[10px] font-bold uppercase">
              <span>CGST (9%)</span>
              <span>₹{Math.round(cgst).toLocaleString('en-IN')}</span>
           </div>
           <div className="flex justify-between text-[10px] font-bold uppercase">
              <span>SGST (9%)</span>
              <span>₹{Math.round(sgst).toLocaleString('en-IN')}</span>
           </div>
           {order.shippingCharge && order.shippingCharge > 0 && (
             <div className="flex justify-between text-[10px] font-bold uppercase">
               <span>Shipping & Handling</span>
               <span>₹{order.shippingCharge.toLocaleString('en-IN')}</span>
             </div>
           )}
           <div className="pt-3 border-t-2 border-zinc-900 flex justify-between text-lg font-black uppercase tracking-tighter">
              <span>Total Amount</span>
              <span>₹{order.totalAmount.toLocaleString('en-IN')}</span>
           </div>
           <div className="text-[8px] font-black uppercase tracking-widest text-right text-zinc-400 mt-1">
             Amount in words: {numberToWords(order.totalAmount)} Rupees Only
           </div>
        </div>
      </div>

      {/* QR & Footer */}
      <div className="mt-12 flex justify-between items-end">
        <div className="space-y-2">
           <QRCodeSVG value={`PBZ_INV_${order.id}`} size={64} level="H" />
           <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Scan for Verification</p>
        </div>
        <div className="text-right space-y-8">
           <div className="space-y-1">
              <p className="text-[9px] font-black uppercase tracking-widest">For PRINTBAZAAR PVT LTD</p>
              <div className="h-12 w-32 border-b border-zinc-200"></div>
              <p className="text-[8px] font-bold uppercase text-zinc-400">Authorized Signatory</p>
           </div>
        </div>
      </div>
    </div>
  );
}

// Helper for number to words (Simplified)
function numberToWords(num: number): string {
  return "Rupees " + num.toLocaleString('en-IN');
}
