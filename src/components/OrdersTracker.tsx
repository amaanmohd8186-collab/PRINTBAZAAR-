/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Package, Truck, Calendar, Wallet, CheckCircle, Clock, AlertTriangle, ChevronDown, ChevronUp, FileSpreadsheet, ShieldAlert, Loader2, Download, FileText, RefreshCcw, Bell, BellRing, Info, Phone, MessageCircle, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { jsPDF } from 'jspdf';
import { Order, OrderStatus, PaymentDetails } from '../types';
import CashfreeGateway from './CashfreeGateway';
import CustomerSpendingChart from './CustomerSpendingChart';
import { DesignApprovalWorkflow } from './DesignApprovalWorkflow';

function PostCompletionFeedback({ orderId, onFeedbackSubmit }: { orderId: string, onFeedbackSubmit: (data: any) => void }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="bg-emerald-50 border border-emerald-250 rounded-[24px] p-6 text-center shadow-2xs">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckCircle className="w-6 h-6" />
        </div>
        <h4 className="text-emerald-950 font-black uppercase text-sm tracking-tight">Feedback Received!</h4>
        <p className="text-emerald-800 text-xs mt-1.5 leading-relaxed max-w-sm mx-auto">
          Thank you for helping us improve our print quality and delivery experience.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[24px] p-6 border border-zinc-200 shadow-sm mt-4">
      <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-2">Rate Your Experience</h4>
      <p className="text-xs text-zinc-500 mb-4">How was the print quality and delivery service for this order?</p>
      
      <div className="flex items-center gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="focus:outline-none transition-transform hover:scale-110"
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(star)}
          >
            <Star 
              className={`w-8 h-8 ${(hoverRating || rating) >= star ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-300'}`} 
            />
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Any suggestions or comments about the print material, colors, or finishing?"
        className="w-full h-24 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00]/50 focus:border-[#FF4D00] resize-none mb-4"
      />

      <button
        onClick={() => {
          if (rating > 0) {
            onFeedbackSubmit({ rating, comment });
            setSubmitted(true);
          }
        }}
        disabled={rating === 0}
        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors ${
          rating > 0 ? 'bg-[#FF4D00] text-white hover:bg-[#d93d00]' : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
        }`}
      >
        Submit Feedback
      </button>
    </div>
  );
}

function SlaCountdownTimer({ createdAt, status }: { createdAt: string; status: OrderStatus }) {
  const [timeLeftStr, setTimeLeftStr] = useState('');
  const [percentLeft, setPercentLeft] = useState(100);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (status === 'Delivered') {
      setTimeLeftStr('SLA MET: DELIVERED');
      setPercentLeft(0);
      return;
    }

    const calculateTime = () => {
      const createdDate = new Date(createdAt).getTime();
      const slaEndDate = createdDate + (48 * 60 * 60 * 1000); // 48 hours SLA
      const now = Date.now();
      const difference = slaEndDate - now;

      if (difference <= 0) {
        setTimeLeftStr('SLA EXPIRED: EMERGENCY DISPATCH PROTOCOL ON');
        setPercentLeft(0);
        setIsExpired(true);
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeftStr(`${hours}h ${minutes}m ${seconds}s remaining`);
      const pct = (difference / (48 * 60 * 60 * 1000)) * 100;
      setPercentLeft(pct);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [createdAt, status]);

  if (status === 'Delivered') {
    return (
      <div className="bg-emerald-50 border border-emerald-250 rounded-[24px] p-5 flex items-center justify-between text-left shadow-2xs">
        <div className="space-y-0.5">
          <p className="text-[10px] text-emerald-800 font-extrabold uppercase tracking-widest font-mono">48HR DELIVERY SLA RECORD</p>
          <p className="text-xs text-emerald-950 font-bold uppercase leading-relaxed">✓ Order delivered safely within SLA timeline</p>
        </div>
        <span className="text-[10px] bg-emerald-600 text-white font-black px-3 py-1.5 rounded-full uppercase tracking-wider font-mono">SLA MET</span>
      </div>
    );
  }

  return (
    <div className={`rounded-[24px] p-5 border text-left flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-2xs ${
      isExpired 
        ? 'bg-rose-50 border-rose-250 text-rose-950' 
        : 'bg-zinc-900 border-neutral-800 text-white'
    }`}>
      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-[#FF4D00] rounded-full animate-ping shrink-0" />
          <p className={`text-[10px] font-extrabold uppercase tracking-widest font-mono ${
            isExpired ? 'text-rose-800' : 'text-[#FF4D00]'
          }`}>
            48-Hour Delivery SLA Window Countdown
          </p>
        </div>
        <p className="text-xs leading-none font-heavy uppercase inline-block pr-2">
          Time Remaining: <span className="font-mono text-[#FF4D00] text-sm font-black tracking-normal ml-1">{timeLeftStr}</span>
        </p>
      </div>

      <div className="w-full md:w-56 space-y-1.5 self-start md:self-center shrink-0">
        <div className="flex justify-between text-[9px] font-black uppercase tracking-wider font-mono">
          <span className={isExpired ? "text-rose-750" : "text-zinc-400"}>PROGRESS</span>
          <span className={isExpired ? "text-rose-750" : "text-zinc-405"}>{Math.round(percentLeft)}% WINDOW LEFT</span>
        </div>
        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${
              isExpired ? 'bg-rose-500' : 'bg-[#FF4D00]'
            }`} 
            style={{ width: `${percentLeft}%` }} 
          />
        </div>
      </div>
    </div>
  );
}

interface OrdersTrackerProps {
  orders: Order[];
  onPayBalanceSuccess: (orderId: string, payment: PaymentDetails) => void;
  onUpdateOrder?: (orderId: string, updates: Partial<Order>) => void;
  onReorder?: (order: Order) => void;
  userRole?: 'customer' | 'seller' | 'admin';
  userEmail?: string;
}

export default function OrdersTracker({
  orders,
  onPayBalanceSuccess,
  onUpdateOrder,
  onReorder,
  userRole = 'customer',
  userEmail = 'amaanmohd8681@gmail.com'
}: OrdersTrackerProps) {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [expandedSpecs, setExpandedSpecs] = useState<Set<string>>(new Set());
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const [balanceAmountToPay, setBalanceAmountToPay] = useState<number>(0);

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const toggleSpecs = (orderId: string) => {
    const next = new Set(expandedSpecs);
    if (next.has(orderId)) {
      next.delete(orderId);
    } else {
      next.add(orderId);
    }
    setExpandedSpecs(next);
  };

  const handleToggleNotification = (order: Order) => {
    if (onUpdateOrder) {
      onUpdateOrder(order.id, { notifyOnDispatch: !order.notifyOnDispatch });
    }
  };

  const handleDownloadReceipt = (order: Order) => {
    const dateFormatted = new Date(order.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    
    const separator = "==================================================";
    const itemsText = order.items.map((item, idx) => {
      return `${idx + 1}. ${item.productName.toUpperCase()}\n` +
             `   Size: ${item.selectedSize.name}\n` +
             `   Material/Finish: ${item.selectedMaterial.name}\n` +
             `   Quantity: ${item.selectedQuantity} Pcs\n` +
             `   Subtotal: INR ${item.itemTotal.toLocaleString('en-IN')}\n` +
             `   Design File: ${item.designFile.name} (${(item.designFile.size / (1024 * 1024)).toFixed(2)} MB)`;
    }).join("\n\n");

    const paymentsText = order.payments.map((p, idx) => {
      const stageLabel = idx === 0 ? '100% Upfront Secure Payment' : 'Balance Clearance';
      return `Payment ${idx + 1} (${stageLabel}):\n` +
             `   Amount: INR ${p.amount.toLocaleString('en-IN')}\n` +
             `   Method: ${p.method}\n` +
             `   Tx ID: ${p.txId || 'N/A'}\n` +
             `   Timestamp: ${new Date(p.timestamp).toLocaleString('en-IN')}`;
    }).join("\n\n");

    const receiptContent = `
${separator}
            PRINTBAZAAR - SECURE PRINTING SLIP
${separator}
Order ID : ${order.id}
Status   : ${order.status.toUpperCase()}
Date     : ${dateFormatted}

Customer Info:
  Name   : ${order.customerName}
  Email  : ${order.customerEmail}

${separator}
PRINT ITEM SPECIFICATIONS & DESIGN FILES
${separator}
${itemsText}

${separator}
BILLING & TRANSACT PAYMENTS LOG
${separator}
Items Subtotal      : INR ${(order.totalAmount - (order.shippingCharge || 0)).toLocaleString('en-IN')}
Shipping Charges    : ${order.shippingCharge && order.shippingCharge > 0 ? `INR ${order.shippingCharge.toLocaleString('en-IN')}` : 'FREE SHIPPING'}
Total Order Value   : INR ${order.totalAmount.toLocaleString('en-IN')}
Upfront Deposit (100%): INR ${order.totalAmount.toLocaleString('en-IN')} (PAID IN FULL)
Outstanding Balance : INR 0 (FULLY SETTLED)

Payment Details Log:
${paymentsText}

${order.trackingNumber ? `
${separator}
SHIPPING & DOCKET WAYBILL SUMMARY
${separator}
Courier Carrier  : ${order.courierName}
Docket/Waybill ID: ${order.trackingNumber}
Status           : TRANSITING
` : ''}

${separator}
Thank you for printing with PrintBazaar.
This receipt is an official transaction invoice.
${separator}
    `.trim();

    const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PrintBazaar_Receipt_${order.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDFInvoice = (order: Order) => {
    const doc = new jsPDF();
    
    // Header Slate Banner
    doc.setFillColor(15, 23, 42); 
    doc.rect(0, 0, 210, 42, 'F');

    // Corporate Title Branding
    doc.setTextColor(255, 77, 0); 
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text("PRINTBAZAAR", 20, 24);

    doc.setTextColor(148, 163, 184); 
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text("HIGH-VOLUME COMMERCIAL OFFSET PRINT PRESS", 20, 31);

    // Label Indicator
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text("OFFICIAL INVOICE", 146, 24);

    // Order Reference Details Card Box
    doc.setFillColor(248, 250, 252); 
    doc.rect(20, 52, 170, 42, 'F');
    doc.setDrawColor(226, 232, 240); 
    doc.setLineWidth(0.5);
    doc.rect(20, 52, 170, 42, 'D');

    // Content inside reference box
    doc.setTextColor(15, 23, 42); 
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text("ORDER ID:", 25, 62);
    doc.setFont('helvetica', 'normal');
    doc.text(order.id, 50, 62);

    doc.setFont('helvetica', 'bold');
    doc.text("PAY STATUS:", 25, 70);
    doc.setFont('helvetica', 'normal');
    doc.text(order.balancePaid ? "FULLY SETTLED" : "100% PAID UPFRONT", 52, 70);

    doc.setFont('helvetica', 'bold');
    doc.text("DATE PLACED:", 25, 78);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), 55, 78);

    // Bill To Customer Details inside Box
    doc.setFont('helvetica', 'bold');
    doc.text("BILL TO CUSTOMER:", 110, 62);
    doc.setFont('helvetica', 'normal');
    doc.text(order.customerName, 110, 70);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(order.customerEmail, 110, 78);

    // Items Section Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 77, 0);
    doc.text("COMMERCIAL PRINT RUN SPECIFICATIONS", 20, 110);
    
    doc.setDrawColor(255, 77, 0);
    doc.setLineWidth(1);
    doc.line(20, 113, 190, 113);

    let y = 122;
    order.items.forEach((item, idx) => {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`${idx + 1}. ${item.productName.toUpperCase()}`, 20, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Size Layout: ${item.selectedSize.name}  |  Media Stock: ${item.selectedMaterial.name}  |  Count: ${item.selectedQuantity} Pcs`, 20, y + 6);
      doc.text(`Uploaded Asset Vector: ${item.designFile.name} (${(item.designFile.size / (1024 * 1024)).toFixed(2)} MB)`, 20, y + 12);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`INR ${item.itemTotal.toLocaleString('en-IN')}`, 162, y);

      y += 24;
    });

    // Payment History Log
    if (y > 230) {
      doc.addPage();
      y = 20;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 77, 0);
    doc.text("PAYMENT TRANSACTION GATEWAY LOG", 20, y);
    
    doc.setDrawColor(255, 77, 0);
    doc.setLineWidth(1);
    doc.line(20, y + 3, 190, y + 3);
    y += 12;

    order.payments.forEach((payment, idx) => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      const paymentTag = idx === 0 ? "100% Secure Upfront Deposit" : "Final Settled Balance Payment";
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(paymentTag, 20, y);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`Tx Gateway: ${payment.method}  |  Docket TXID: ${payment.txId || 'TXN_SYSTEM_AUTO'}`, 20, y + 5);
      doc.text(`Processed Timestamp: ${new Date(payment.timestamp).toLocaleString('en-IN')}`, 20, y + 10);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`INR ${payment.amount.toLocaleString('en-IN')}`, 162, y);

      y += 17;
    });

    // Ledger Summary Box
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
    y += 5;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(20, y, 190, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("ITEMS SUBTOTAL PRICE:", 95, y);
    doc.text(`INR ${(order.totalAmount - (order.shippingCharge || 0)).toLocaleString('en-IN')}`, 162, y);

    y += 6;
    doc.text("COURIER SHIPPING CHARGES:", 95, y);
    doc.text(order.shippingCharge && order.shippingCharge > 0 ? `INR ${order.shippingCharge.toLocaleString('en-IN')}` : 'FREE SHIPPING', 162, y);

    y += 8;
    doc.setDrawColor(241, 245, 249);
    doc.line(95, y, 190, y);
    y += 5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text("TOTAL ORDER CONTRACT VALUE:", 95, y);
    doc.text(`INR ${order.totalAmount.toLocaleString('en-IN')}`, 162, y);

    y += 6;
    doc.text("TOTAL CASHFLOWS DISBURSED:", 95, y);
    const cumulativeDisbursed = order.payments.reduce((sum, p) => sum + p.amount, 0);
    doc.text(`INR ${cumulativeDisbursed.toLocaleString('en-IN')}`, 162, y);

    y += 6;
    doc.setTextColor(16, 185, 129); 
    doc.text("OUTSTANDING ACCOUNT DUES:", 95, y);
    const outstandingLeft = Math.max(0, order.totalAmount - cumulativeDisbursed);
    doc.text(`INR ${outstandingLeft.toLocaleString('en-IN')}`, 162, y);

    // Courier Logistics Waybill details if available
    if (order.trackingNumber) {
      y += 12;
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      doc.setFillColor(255, 245, 240); 
      doc.rect(20, y, 170, 20, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 77, 0);
      doc.text("COURIER WAYBILL SYSTEM REGISTERED", 25, y + 7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(`Shipper Courier Carrier Partner: ${order.courierName}  |  Docket Air Waybill No: ${order.trackingNumber}`, 25, y + 14);
    }

    // Footnote
    y = 282;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Thank you for choosing PrintBazaar commercial offset division. For invoice queries, support@printbazaar.com.", 20, y);

    doc.save(`PrintBazaar_Invoice_${order.id}.pdf`);
  };

  const handleDownloadCSV = () => {
    if (orders.length === 0) {
      alert('No orders found to export.');
      return;
    }

    const headers = [
      'Order ID',
      'Date',
      'Status',
      'Items',
      'Total Amount (INR)',
      'Upfront Paid (INR)',
      'Balance Status',
      'Tracking Number',
      'Courier'
    ];

    const rows = orders.map(order => {
      const itemsStr = order.items.map(i => `${i.productName} (${i.selectedQuantity} Pcs)`).join('; ');
      const paidAmount = order.payments.reduce((sum, p) => sum + p.amount, 0);
      return [
        order.id,
        new Date(order.createdAt).toLocaleDateString('en-IN'),
        order.status,
        itemsStr,
        order.totalAmount,
        paidAmount,
        order.balancePaid ? 'FULLY SETTLED' : 'PENDING',
        order.trackingNumber || 'N/A',
        order.courierName || 'N/A'
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PrintBazaar_Orders_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const initBalancePayment = (order: Order) => {
    const outstanding = order.totalAmount - order.payments.reduce((sum, p) => sum + p.amount, 0);
    setBalanceAmountToPay(outstanding > 0 ? outstanding : Math.round(order.totalAmount / 2));
    setPayingOrderId(order.id);
  };

  const handleBalancePaymentSuccess = (payment: PaymentDetails) => {
    if (payingOrderId) {
      onPayBalanceSuccess(payingOrderId, payment);
      setPayingOrderId(null);
    }
  };

  // Helper defining production stages
  const STAGES: { status: OrderStatus; label: string; desc: string }[] = [
    {
      status: 'Order Received',
      label: 'Order Received',
      desc: '100% Upfront payment verified. Handshake completed with print press node.'
    },
    {
      status: 'Design Review',
      label: 'Design & Pre-fight',
      desc: 'Print press admin is auditing dimension safety, resolution, and bleed margins.'
    },
    {
      status: 'Customer Approval',
      label: 'Customer Approval',
      desc: 'Final design proof awaiting client seal. Production starts only after approval.'
    },
    {
      status: 'Printing',
      label: 'Heavy Printing',
      desc: 'Commercial press run initiated. Substrate is undergoing high-speed offset ink application.'
    },
    {
      status: 'Packing',
      label: 'Quality & Packing',
      desc: 'Post-press finishing, cutting, and industrial logistics bubble wrapping.'
    },
    {
      status: 'Shipped',
      label: 'Shipped (In Transit)',
      desc: 'Goods handed over to courier. Waybill telemetry active.'
    },
    {
      status: 'Delivered',
      label: 'Consignment Delivered',
      desc: 'Package successfully delivered and verified at destination.'
    }
  ];

  const getStageIndex = (status: OrderStatus): number => {
    return STAGES.findIndex((st) => st.status === status);
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'Order Received':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Design Review':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Customer Approval':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Printing':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Packing':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Shipped':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Delivered':
        return 'bg-zinc-100 text-zinc-800 border-zinc-200';
      default:
        return 'bg-zinc-100 text-zinc-800 border-zinc-200';
    }
  };

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-[40px] border border-gray-200/60 max-w-lg mx-auto my-10 shadow-sm">
        <div className="w-20 h-20 rounded-[28px] bg-zinc-100 flex items-center justify-center mb-6 border border-zinc-200">
          <Calendar className="w-8 h-8 text-zinc-400" />
        </div>
        <h3 className="font-heavy text-2xl uppercase tracking-tight text-[#0F172A]">No Past Print Runs</h3>
        <p className="text-gray-500 text-xs mt-3 leading-relaxed max-w-xs font-normal">
          YOU HAVE NOT PLACED ANY PRINTING ORDERS YET. BROWSE OUR SELECTION TO EXPERIENCE THE 50:50 COURIER SERVICE FLOW!
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-2 px-1">
      <div className="flex items-center gap-4 mb-8 text-zinc-900 bg-white p-6 rounded-[28px] border border-gray-150">
        <div className="w-14 h-14 rounded-[18px] bg-[#0F172A] text-[#FF4D00] flex items-center justify-center font-heavy text-lg tracking-tighter shrink-0">
          PB
        </div>
        <div>
          <h2 className="font-heavy text-xl uppercase leading-none tracking-tight">MY PRINTING ACCOUNTS</h2>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-1.5 font-mono">Track production stages, verify file clearances, and finalize balance dues.</p>
        </div>
        
        <button
          type="button"
          onClick={handleDownloadCSV}
          className="ml-auto flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-zinc-800 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition shadow-xs cursor-pointer font-mono"
        >
          <FileSpreadsheet className="w-4 h-4 text-[#FF4D00]" />
          <span>Export History (CSV)</span>
        </button>
      </div>

      {/* Spending Trend Analytics Section */}
      <div className="mb-8">
        <CustomerSpendingChart orders={orders} />
      </div>

      <div className="space-y-4">
        {orders.map((order) => {
          const isExpanded = expandedOrderId === order.id;
          const currentStageIdx = getStageIndex(order.status);
          const completionPercentage = (currentStageIdx / (STAGES.length - 1)) * 100;
          const needsPayment = order.status === 'Packing' && !order.balancePaid;
          const paymentsPaid = order.payments.reduce((sum, p) => sum + p.amount, 0);

          return (
            <div
              key={order.id}
              className="bg-white rounded-[32px] border border-gray-150 hover:border-black overflow-hidden transition duration-200"
            >
              {/* Header block preview summary */}
              <div
                onClick={() => toggleExpand(order.id)}
                className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 cursor-pointer hover:bg-neutral-50/50 transition select-none"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono font-heavy text-xs text-white px-3.5 py-1 rounded-xl bg-black">
                      {order.id}
                    </span>
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    {(() => {
                      try {
                        const updated = new Date(order.updatedAt).getTime();
                        const now = Date.now();
                        const isRecent = (now - updated) < (24 * 60 * 60 * 1000);
                        if (isRecent) {
                          return (
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-600 rounded-full text-[9px] font-bold uppercase tracking-wider animate-pulse shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping shrink-0" />
                              <span>UPDATED RECENTLY</span>
                            </span>
                          );
                        }
                      } catch (e) {
                        return null;
                      }
                    })()}
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-1.5 font-bold uppercase tracking-widest font-mono">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6">
                  <div className="text-left sm:text-right">
                    <p className="font-micro text-gray-400 block">Invoice Valuation</p>
                    <p className="text-xl font-heavy text-slate-900">₹{order.totalAmount.toLocaleString('en-IN')}</p>
                  </div>

                  <div className="text-zinc-500 p-2 bg-zinc-50 border border-gray-200 rounded-xl">
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-900" /> : <ChevronDown className="w-4 h-4 text-zinc-900" />}
                  </div>
                </div>
              </div>

              {/* Collapsed view expansion info */}
              {isExpanded && (
                <div className="border-t border-zinc-100 p-6 md:p-8 bg-zinc-50/40 space-y-8">

                  {/* QUICK SUMMARY CARD OF ITEMS */}
                  <div className="bg-slate-900 border border-slate-800 rounded-[28px] p-6 text-white shadow-md relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="absolute top-0 right-0 transform translate-x-12 -translate-y-12 w-48 h-48 bg-slate-800/40 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="space-y-3 relative z-10 w-full md:w-auto">
                      <span className="text-[9px] bg-[#FF4D00]/10 text-[#FF4D00] font-mono font-black tracking-widest uppercase px-2.5 py-1 rounded-md border border-[#FF4D00]/25">
                        ORDER ITEM SUMMARY
                      </span>
                      <h4 className="text-lg font-heavy uppercase tracking-tight leading-none mt-1">
                        {order.items.length === 1 ? '1 Specialized Print Item' : `${order.items.length} Specialized Print Items`}
                      </h4>
                      <p className="text-xs text-slate-400 font-normal leading-relaxed max-w-md">
                        This order contains premium {order.items.map(item => item.productCategory).filter((val, i, arr) => arr.indexOf(val) === i).join(', ')} batches prepared on custom material substrates.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto shrink-0 relative z-10">
                      {order.items.map((item, idx) => {
                        const activeImg = item.productImage || 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=300&q=80';
                        return (
                          <div key={item.id || idx} className="flex items-center gap-3 bg-slate-800/80 p-3 rounded-[20px] border border-slate-700/60 w-full sm:w-auto">
                            <img 
                              src={activeImg} 
                              alt={item.productName} 
                              className="w-10 h-10 object-cover rounded-lg border border-slate-600/50" 
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                e.currentTarget.src = 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=300&q=80';
                              }}
                            />
                            <div>
                              <p className="text-xs font-bold uppercase tracking-tight text-white line-clamp-1">{item.productName}</p>
                              <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">{item.selectedQuantity} PCS • {item.selectedSize.name}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Action Rail & Quick Options */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4.5 rounded-[24px] border border-gray-150 shadow-2xs">
                    <div className="flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mt-0.5 shrink-0" />
                       <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">
                         SECURE PRINT ORDER PORTAL • INTENT SUMMARY ACTIVE
                       </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {(() => {
                        let waMsg = `Hi PrintBazaar, I have a query regarding my Order ID: ${order.id}\n\n`;
                        waMsg += `*Order Status*: ${order.status}\n`;
                        waMsg += `*Items ordered*:\n`;
                        order.items.forEach((item, idx) => {
                          const itemImg = item.productImage.startsWith('http') ? item.productImage : `${window.location.origin}${item.productImage}`;
                          waMsg += `• ${idx + 1}. ${item.productName} (${item.selectedQuantity} PCS, ${item.selectedSize.name})\n  Substrate: ${item.selectedMaterial.name}\n  Image: ${itemImg}\n`;
                          if (item.designFile && item.designFile.name) {
                            waMsg += `  Design Asset Attached: ${item.designFile.name}\n`;
                          }
                        });
                        waMsg += `\nPlease guide me regarding this order. Thank you!`;
                        const waUrl = `https://wa.me/917533939460?text=${encodeURIComponent(waMsg)}`;
                        return (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#128C7E] text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition duration-155 shadow-xs cursor-pointer select-none no-underline"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-white" />
                            <span>WhatsApp Support</span>
                          </a>
                        );
                      })()}
                      <a
                        href="tel:+917533939460"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition duration-155 shadow-xs cursor-pointer select-none no-underline"
                      >
                        <Phone className="w-3.5 h-3.5 text-white" />
                        <span>Quick Call</span>
                      </a>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onReorder) {
                            onReorder(order);
                          }
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-black text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition duration-155 shadow-xs cursor-pointer select-none"
                      >
                        <RefreshCcw className="w-3.5 h-3.5" />
                        <span>Reorder</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadPDFInvoice(order)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#FF4D00] hover:bg-[#d93d00] text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition duration-155 shadow-xs cursor-pointer select-none"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Download PDF Invoice</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadReceipt(order)}
                        className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-bold uppercase tracking-wider rounded-xl transition duration-155 border border-zinc-200/60 cursor-pointer select-none"
                      >
                        <Download className="w-3.5 h-3.5 text-zinc-500" />
                        <span>TXT Receipt</span>
                      </button>
                    </div>
                  </div>

                  {/* 48hr SLA Countdown Timer Widget */}
                  <SlaCountdownTimer createdAt={order.createdAt} status={order.status} />

                  {/* Visual Progress Timeline representing order stage */}
                  <motion.div
                    key={`timeline-${order.id}-${order.status}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 220, damping: 25 }}
                    className="bg-white rounded-[32px] border-[3px] border-black p-6 md:p-8 space-y-6 shadow-[8px_8px_0px_#000]"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                      <div className="space-y-1">
                        <h4 className="text-sm font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#FF4D00] animate-ping shrink-0" />
                          Live Production Status Pipeline
                        </h4>
                        
                        {/* Dynamic progression transition banner reflecting actual step moves */}
                        <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1 mt-1.5 w-fit shadow-3xs">
                          <span>{currentStageIdx > 0 ? STAGES[currentStageIdx - 1].status : 'Order Placed'}</span>
                          <span className="text-[#FF4D00] animate-pulse">➔</span>
                          <span className="text-[#FF4D00] underline decoration-wavy decoration-emerald-500 font-extrabold">{order.status}</span>
                          {currentStageIdx < STAGES.length - 1 && (
                            <>
                              <span className="text-zinc-350">➔</span>
                              <span className="text-zinc-400 font-normal">{STAGES[currentStageIdx + 1].status}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <div className="hidden sm:flex flex-col items-end text-right font-mono text-[9px] font-black tracking-widest text-zinc-400 leading-tight">
                          <span>PIPELINE GAUGE</span>
                          <span className="text-[#FF4D00] font-black text-xs">{Math.ceil(completionPercentage)}%</span>
                        </div>
                        <span className={`text-[10px] font-mono font-black px-4 py-2 rounded-xl uppercase tracking-widest border shadow-3xs ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>

                    {/* Progress Line Tracks */}
                    <div className="relative pt-6 pb-4">
                      {/* Background Gray Line with inset shadow */}
                      <div className="absolute top-11 left-6 right-6 h-2 w-[calc(100%-48px)] bg-zinc-100 border border-zinc-200/50 -translate-y-1/2 rounded-full hidden md:block shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)]" />
                      
                      {/* Active High-contrast Progress Line with glowing gradient and running animation */}
                      <div className="absolute top-11 left-6 right-6 h-2 w-[calc(100%-48px)] -translate-y-1/2 overflow-hidden rounded-full hidden md:block">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${completionPercentage}%` }}
                          transition={{ type: "spring", stiffness: 80, damping: 15 }}
                          className="h-full bg-gradient-to-r from-indigo-500 via-purple-600 to-[#FF4D00] rounded-full relative shadow-[0_0_8px_rgba(255,77,0,0.4)]"
                        >
                          <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:16px_16px] animate-[pulse_1.5s_infinite]" />
                        </motion.div>
                      </div>

                      {/* Six Milestones Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-6 md:gap-4 relative select-none">
                        {STAGES.map((step, idx) => {
                          const isCompleted = idx <= currentStageIdx;
                          const isCurrent = idx === currentStageIdx;
                          
                          // Match specific icons for phases
                          let StepIcon = Clock;
                          if (idx === 0) StepIcon = Package;
                          if (idx === 1) StepIcon = FileSpreadsheet;
                          if (idx === 2) StepIcon = Loader2; // Running loader representing Printing
                          if (idx === 3) StepIcon = CheckCircle;
                          if (idx === 4) StepIcon = Truck;
                          if (idx === 5) StepIcon = CheckCircle;

                          return (
                            <motion.div
                              key={`${step.status}-${isCurrent}`}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3, delay: idx * 0.04 }}
                              className="flex md:flex-col items-center md:items-center gap-4 md:gap-3 text-left md:text-center relative"
                            >
                              {/* Connector for mobile vertical mode (hidden on md) */}
                              {idx > 0 && (
                                <motion.div 
                                  animate={{ 
                                    backgroundColor: idx <= currentStageIdx ? '#FF4D00' : '#E4E4E5'
                                  }}
                                  transition={{ duration: 0.4 }}
                                  className="absolute left-5 top-[-24px] h-[24px] w-[2px] md:hidden"
                                />
                              )}

                              {/* Circle Node with Icon */}
                              <motion.div 
                                animate={{
                                  scale: isCurrent ? 1.15 : 1,
                                  backgroundColor: isCurrent ? '#FF4D00' : isCompleted ? '#0F172A' : '#FFFFFF',
                                  borderColor: isCurrent ? '#FF4D00' : isCompleted ? '#0F172A' : '#E4E4E7',
                                }}
                                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center border-2 z-10 transition-shadow ${
                                  isCurrent ? 'ring-4 ring-[#fff5f0] shadow-lg shadow-[#FF4D00]/20' : ''
                                }`}
                              >
                                {isCompleted && !isCurrent ? (
                                  <motion.span 
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                                    className="text-xs font-black text-white"
                                  >
                                    ✓
                                  </motion.span>
                                ) : idx === 2 && isCurrent ? (
                                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                                ) : (
                                  <motion.div
                                    animate={{ 
                                      color: isCurrent ? '#FFFFFF' : isCompleted ? '#FFFFFF' : '#A1A1AA' 
                                    }}
                                    transition={{ duration: 0.3 }}
                                  >
                                    <StepIcon className="w-4 h-4" />
                                  </motion.div>
                                )}
                              </motion.div>

                              {/* Labels */}
                              <div className="space-y-0.5">
                                <motion.p 
                                  animate={{
                                    color: isCurrent ? '#FF4D00' : isCompleted ? '#0F172A' : '#A1A1AA'
                                  }}
                                  className="text-xs font-black uppercase tracking-tight leading-tight"
                                >
                                  {step.status}
                                </motion.p>
                                <p className={`text-[9px] leading-tight font-bold uppercase tracking-wider font-mono ${
                                  isCurrent ? 'text-zinc-500' : 'text-zinc-400'
                                }`}>
                                  {idx === 0 && 'Precheck Done'}
                                  {idx === 1 && 'Audit Check'}
                                  {idx === 2 && 'Stock Running'}
                                  {idx === 3 && 'Press Complete'}
                                  {idx === 4 && 'Waybill Active'}
                                  {idx === 5 && 'Delivered Safely'}
                                </p>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>

                  {/* Laminated Transparency Status Logs representing precise milestone timings */}
                  {(() => {
                    const currentStageIdx = getStageIndex(order.status);
                    
                    let transitionLogs: { label: string; desc: string; timestamp: Date; isCritical?: boolean }[] = [];
                    
                    if (order.status === 'Cancelled') {
                      transitionLogs = [
                        {
                          label: "Order Placed & Logged",
                          desc: "Order record submitted and registered within the local Firestore backend.",
                          timestamp: new Date(order.createdAt)
                        },
                        {
                          label: "Order Cancelled & Halted",
                          desc: "Production sequence aborted. Refund processing has been queued with our accounts division.",
                          timestamp: new Date(order.updatedAt || order.createdAt),
                          isCritical: true
                        }
                      ];
                    } else if (order.status === 'Pending Payment') {
                      transitionLogs = [
                        {
                          label: "Draft Checkout Created",
                          desc: "Order invoice prepared. 100% upfront digital gateway credentials initialized.",
                          timestamp: new Date(order.createdAt)
                        }
                      ];
                    } else if (currentStageIdx >= 0) {
                      const tStart = new Date(order.createdAt).getTime();
                      const tEnd = new Date(order.updatedAt || order.createdAt).getTime();
                      
                      transitionLogs = STAGES.slice(0, currentStageIdx + 1).map((stage, idx, arr) => {
                        let logTime: Date;
                        if (idx === 0) {
                          logTime = new Date(order.createdAt);
                        } else if (idx === arr.length - 1) {
                          logTime = new Date(order.updatedAt || order.createdAt);
                        } else {
                          // Linearly space the timing steps between start and end
                          const fraction = idx / currentStageIdx;
                          logTime = new Date(tStart + fraction * (tEnd - tStart));
                        }
                        return {
                          label: stage.label,
                          desc: stage.desc,
                          timestamp: logTime
                        };
                      });
                    }

                    if (transitionLogs.length === 0) return null;

                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.3 }}
                        className="bg-white rounded-[28px] border border-gray-150 p-6 md:p-8 space-y-5 shadow-2xs text-left"
                      >
                        <div className="border-b border-gray-100 pb-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-tight text-slate-850">Laminated Transparency Status Timeline</h4>
                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono mt-1">Chronological audit trail of production-floor transition timestamps</p>
                          </div>
                          <span className="self-start sm:self-center text-[9px] font-mono font-black uppercase text-[#FF4D00] bg-[#fff5f0] border border-[#FF4D00]/15 px-3 py-1 rounded-xl">
                            Verified via Firestore Metadata
                          </span>
                        </div>

                        <div className="relative pl-4 border-l-2 border-dashed border-zinc-200 py-1 space-y-5">
                          {transitionLogs.map((log, logIdx) => {
                            const isLatest = logIdx === transitionLogs.length - 1;
                            return (
                              <div key={log.label + '-' + logIdx} className="relative group text-left">
                                {/* Bullet Node Indicator */}
                                <div 
                                  className={`absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full border transition-all ${
                                    log.isCritical
                                      ? 'bg-rose-500 border-rose-500 scale-125 ring-4 ring-rose-50'
                                      : isLatest 
                                      ? 'bg-[#FF4D00] scale-125 border-[#FF4D00] ring-4 ring-[#fff5f0]' 
                                      : 'bg-zinc-850 border-zinc-900 bg-zinc-900'
                                  }`}
                                />
                                
                                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1.5">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`text-[11px] font-bold uppercase tracking-tight ${
                                      log.isCritical 
                                        ? 'text-rose-600 font-black'
                                        : isLatest 
                                        ? 'text-[#FF4D00] font-black' 
                                        : 'text-slate-850'
                                    }`}>
                                      {log.label}
                                    </span>
                                    {isLatest && (
                                      <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded-md font-black tracking-widest ${
                                        log.isCritical 
                                          ? 'bg-rose-105 text-rose-600 border border-rose-200/40'
                                          : 'bg-[#FF4D00]/10 text-[#FF4D00]'
                                      }`}>
                                        {order.status === 'Cancelled' ? 'HALTED' : order.status === 'Pending Payment' ? 'AWAITING PAY' : 'LATEST'}
                                      </span>
                                    )}
                                  </div>
                                  
                                  <span className="text-[10px] font-mono font-black text-zinc-550 uppercase">
                                    {log.timestamp.toLocaleDateString('en-IN', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      hour12: true
                                    })}
                                  </span>
                                </div>
                                <p className="text-[10.5px] text-zinc-450 font-medium leading-relaxed mt-1">
                                  {log.desc}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    );
                  })()}

                  {/* Smart Client-Seller Design Annotation & Consultation Arena */}
                  <DesignApprovalWorkflow
                    order={order}
                    userRole={userRole}
                    userEmail={userEmail}
                    onStatusUpdate={(orderId, newStatus) => {
                      // Status sync hook
                      order.status = newStatus;
                    }}
                  />

                  {/* Item customization specifications accordion */}
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => toggleSpecs(order.id)}
                      className="flex items-center justify-between w-full group hover:text-black transition"
                    >
                      <h4 className="font-micro text-gray-450 block uppercase tracking-widest text-[9px] font-black group-hover:text-zinc-600 flex items-center gap-2">
                        <Info className="w-3 h-3" />
                        <span>Itemized Technical Specifications</span>
                      </h4>
                      <div className="flex items-center gap-2 text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">
                        <span>{expandedSpecs.has(order.id) ? 'Collapse Details' : 'View Full Breakdown'}</span>
                        {expandedSpecs.has(order.id) ? (
                          <ChevronUp className="w-3 h-3 group-hover:text-black" />
                        ) : (
                          <ChevronDown className="w-3 h-3 group-hover:text-black" />
                        )}
                      </div>
                    </button>
                    
                    {expandedSpecs.has(order.id) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-2 overflow-hidden"
                      >
                        {order.items.map((item) => (
                          <div key={item.id} className="bg-white rounded-[24px] p-5 border border-zinc-200/60 shadow-xs flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4">
                              {/* Product photograph thumbnail */}
                              <div className="w-14 h-14 rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0 relative shadow-2xs">
                                {item.productImage ? (
                                  <img
                                    src={item.productImage}
                                    alt={item.productName}
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <span className="text-[9px] font-bold text-zinc-400 font-mono flex items-center justify-center h-full">N/A</span>
                                )}
                              </div>
                              
                              <div className="space-y-1">
                                <p className="text-sm font-heavy text-slate-950 uppercase tracking-tight">{item.productName}</p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-1 text-[10px] text-zinc-500 font-bold uppercase tracking-wide leading-tight">
                                  <span><strong className="text-zinc-800">Size:</strong> {item.selectedSize.name}</span>
                                  <span><strong className="text-zinc-800">Material:</strong> {item.selectedMaterial.name}</span>
                                  <span><strong className="text-zinc-800">Quantity:</strong> {item.selectedQuantity} Pcs</span>
                                </div>
                                <div className="inline-flex items-center gap-1.5 bg-[#fff5f0] text-[#FF4D00] text-[9px] font-bold uppercase px-3 py-1 rounded-md border border-[#FF4D00]/10 mt-1.5 font-mono">
                                  <span>Asset Vector: {item.designFile.name} ({(item.designFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                                </div>
                              </div>
                            </div>
                            <span className="text-sm font-bold text-slate-900 font-mono whitespace-nowrap">₹{item.itemTotal.toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </div>

                  {/* SMS Dispatch Notification Toggle */}
                  {['Order Received', 'Design Review', 'Customer Approval', 'Printing'].includes(order.status) && (
                    <div className="bg-zinc-900 rounded-[28px] p-6 border border-zinc-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
                      <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-[#FF4D00] to-transparent" />
                      
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 ${
                          order.notifyOnDispatch ? 'bg-[#FF4D00] text-white shadow-lg shadow-[#FF4D00]/30' : 'bg-zinc-800 text-zinc-500'
                        }`}>
                          {order.notifyOnDispatch ? <BellRing className="w-6 h-6 animate-bounce" /> : <Bell className="w-6 h-6" />}
                        </div>
                        <div>
                          <h4 className="text-xs font-black uppercase text-white tracking-tight">Dispatch Telemetry Notifications</h4>
                          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono mt-1 leading-relaxed max-w-[280px]">
                            {order.notifyOnDispatch 
                              ? 'SMS alerts enabled! You will be notified the instant your items are ready for courier logistics.'
                              : 'Enable Twilio SMS alerts to get real-time status transitions when your print run is finished.'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleNotification(order)}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 font-mono shadow-xs border cursor-pointer ${
                          order.notifyOnDispatch 
                            ? 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-700' 
                            : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:text-white hover:bg-zinc-750'
                        }`}
                      >
                        {order.notifyOnDispatch ? 'Alerts Optimized (Active)' : 'Enable SMS Alert'}
                      </button>
                    </div>
                  )}

                  {/* 100% payment clearance widget */}
                  <div className="bg-white rounded-[32px] p-6 border border-zinc-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="space-y-2.5 w-full sm:w-auto">
                      <p className="font-micro text-gray-400 block">PAYMENT SETTLEMENT BREAKDOWN</p>
                      
                      <div className="space-y-1.5 text-zinc-800 text-[11px] font-bold uppercase tracking-wider font-mono">
                        <div className="flex justify-between gap-12 text-zinc-550">
                          <span>Items Subtotal:</span>
                          <span className="text-zinc-900 font-semibold">₹{(order.totalAmount - (order.shippingCharge || 0)).toLocaleString('en-IN')}</span>
                        </div>
                        {order.shippingCharge && order.shippingCharge > 0 ? (
                          <div className="flex justify-between gap-12 text-zinc-550">
                            <span>Delivery Charges:</span>
                            <span className="text-zinc-900 font-semibold">₹{order.shippingCharge.toLocaleString('en-IN')}</span>
                          </div>
                        ) : (
                          <div className="flex justify-between gap-12 text-emerald-600 font-black">
                            <span>Delivery Charges:</span>
                            <span>FREE SHIPPING</span>
                          </div>
                        )}
                        <div className="flex justify-between gap-12 text-slate-900 border-t border-zinc-200 pt-2 font-sans font-heavy text-xs mt-1.5">
                          <span className="flex items-center gap-1 text-emerald-600">
                            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                            Total Amount Paid:
                          </span>
                          <span className="text-emerald-600 font-extrabold text-sm">₹{order.totalAmount.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                      
                      <p className="text-[9.5px] text-zinc-400 font-mono font-bold uppercase mt-1">
                        Transaction ID: {order.payments[0]?.txId || 'TXN_SYSTEM_AUTO'} • Stamp: {order.payments[0] ? new Date(order.payments[0].timestamp).toLocaleString('en-IN') : 'AUTO'}
                      </p>
                    </div>
                    
                    <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-250 text-xs font-black uppercase px-4 py-2.5 rounded-2xl select-none">
                      <span>✓ Invoice fully settled</span>
                    </div>
                  </div>

                  {/* Courier Tracking Section */}
                  {order.trackingNumber && (
                    <div className="bg-[#fff5f0] text-zinc-800 p-6 rounded-[24px] border border-[#FF4D00]/20 flex items-start gap-4">
                      <Truck className="w-6 h-6 mt-0.5 shrink-0 text-[#FF4D00]" />
                      <div className="space-y-1">
                        <h5 className="text-xs font-black uppercase tracking-wider text-[#FF4D00]">DISPATCHED - COURIER INITIATED</h5>
                        <p className="text-xs text-[#0F172A] font-bold uppercase mt-1">
                          Consignment dispatched via <strong className="font-extrabold text-[#0F172A]">{order.courierName}</strong>. 
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                          <span className="text-xs bg-white text-zinc-900 px-3.5 py-1 rounded-xl border border-[#FF4D00]/20 font-mono font-bold uppercase">
                            Waybill No: {order.trackingNumber}
                          </span>
                          <span className="text-[9px] bg-[#FF4D00] text-white font-black px-2.5 py-1 rounded-full uppercase">
                            IN TRANSIT
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rating / Feedback Section for Delivered Orders */}
                  {order.status === 'Delivered' && (
                    <PostCompletionFeedback 
                      orderId={order.id} 
                      onFeedbackSubmit={(feedbackData) => {
                        if (onUpdateOrder) {
                          onUpdateOrder(order.id, { feedback: feedbackData });
                        }
                      }}
                    />
                  )}

                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pay balance modal */}
      {payingOrderId && (
        <CashfreeGateway
          amount={balanceAmountToPay}
          paymentTypeLabel="50% Outstanding Balance payment"
          onSuccess={handleBalancePaymentSuccess}
          onCancel={() => setPayingOrderId(null)}
        />
      )}

    </div>
  );
}
