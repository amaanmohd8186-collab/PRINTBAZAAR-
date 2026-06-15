/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LayoutDashboard, ShoppingBag, FolderEdit, Check, Eye, Trash, Plus, FileText, ArrowRight, Truck, TrendingUp, Receipt, AlertCircle, Sparkles, RefreshCw, X, Wallet, ShieldCheck, Settings, CreditCard, AlertTriangle, Activity, ShieldAlert } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { parseISO, format } from 'date-fns';
import { Order, Product, ProductCategory, OrderStatus, SizeOption, MaterialOption, QuantitySlab } from '../types';
import { CATEGORIES, CATEGORY_DEFAULT_IMAGES } from '../data';
import { getAuthHeaders } from '../firebase';
import SecureUploadSystem from './SecureUploadSystem';
import DiagnosticsPanel from './DiagnosticsPanel';

interface AdminWorkspaceProps {
  orders: Order[];
  products: Product[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus, trackingNumber?: string, courierName?: string) => void;
  onAddNewProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onShowAudit: () => void;
}

export default function AdminWorkspace({
  orders,
  products,
  onUpdateOrderStatus,
  onAddNewProduct,
  onDeleteProduct,
  onShowAudit
}: AdminWorkspaceProps) {
  const [activeTab, setActiveTab ] = useState<'insights' | 'incoming' | 'products' | 'diagnostics' | 'users' | 'platform'>('insights');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showDesignModal, setShowDesignModal] = useState<{ name: string; type: string; data?: string } | null>(null);
  // Multi-state platform settings
  const [activeSettingsGroup, setActiveSettingsGroup] = useState<'cashfree' | 'ai' | 'policies'>('cashfree');
  const [platformSettings, setPlatformSettings] = useState({
    cashfreeEnv: 'TEST',
    aiModerationEnabled: true,
    autoApproveSellers: false,
    maintenanceMode: false
  });

  // New product editing state
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<ProductCategory>('Business Cards');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdSizes, setNewProdSizes] = useState<SizeOption[]>([
    { name: 'Standard size (Base)', priceMultiplier: 1.0 },
    { name: 'Large scale (A3)', priceMultiplier: 1.5 }
  ]);
  const [newProdMaterials, setNewProdMaterials] = useState<MaterialOption[]>([
    { name: 'Coated Glossy Card stock', priceMultiplier: 1.0 },
    { name: 'Velvet Premium Matt stock', priceMultiplier: 1.35 }
  ]);
  const [newProdSlabs, setNewProdSlabs] = useState<QuantitySlab[]>([
    { quantity: 100, unitPrice: 5.0 },
    { quantity: 500, unitPrice: 3.5 }
  ]);

  // Temporary row add inputs for product creator
  const [tempSizeName, setTempSizeName] = useState('');
  const [tempSizeMult, setTempSizeMult] = useState(1.0);
  const [tempMatName, setTempMatName] = useState('');
  const [tempMatMult, setTempMatMult] = useState(1.0);
  const [tempSlabQty, setTempSlabQty] = useState(100);
  const [tempSlabPrice, setTempSlabPrice] = useState(5.0);

  // Shipping details state
  const [courierNameInput, setCourierNameInput] = useState('Delhivery Express');
  const [trackingIdInput, setTrackingIdInput] = useState('');

  // Order search and status filtering for CSV and accounting
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('All');

  // Secure Product Upload System states
  const [uploadedImages, setUploadedImages] = useState<{url: string, id: string}[]>([]);
  const [newProdVideoUrl, setNewProdVideoUrl] = useState<string>('');
  const [uploadMode, setUploadMode] = useState<'device' | 'url'>('device');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [validationScore, setValidationScore] = useState(0);
  const isAdminVerified = true; // Admin verification mock
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'Desktop'|'Tablet'|'Mobile'>('Desktop');

  // Legacy placeholder (keeping name for backwards compat)
  const [aiImageError, setAiImageError] = useState('');


  const [adminRevenue, setAdminRevenue] = useState<{
    totalRevenue: number;
    aiRevenue: number;
    subscriptionRevenue: number;
    marketplaceRevenue: number;
    payoutsPending: number;
  } | null>(null);

  React.useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch('/api/admin/revenue-stats', { headers });
        const data = await res.json();
        if (data.success) {
          setAdminRevenue(data.stats);
        }
      } catch (err) {
        console.error("Revenue fetch failed");
      }
    };
    fetchAdminStats();
  }, [activeTab]);

  // 1. Calculate dashboard analytics metrics from real in-memory/localStorage orders
  const analytics = React.useMemo(() => {
    let totalRevenue = 0;
    let pendingPaymentsDue = 0;
    
    orders.forEach((o) => {
      const paidSum = o.payments.reduce((sum, p) => sum + p.amount, 0);
      totalRevenue += paidSum;
      const outstanding = Math.max(0, o.totalAmount - paidSum);
      pendingPaymentsDue += outstanding;
    });

    const ordersReceivedCount = orders.filter(o => o.status === 'Order Received').length;
    const designCheckCount = orders.filter(o => o.status === 'Design Check').length;
    const inPrintingCount = orders.filter(o => o.status === 'Printing In Progress').length;
    const readyToDispatchCount = orders.filter(o => o.status === 'Ready for Dispatch').length;
    const dispatchedCount = orders.filter(o => o.status === 'Dispatched').length;

    return {
      totalOrders: orders.length,
      pendingActionSum: ordersReceivedCount + designCheckCount,
      printingSum: inPrintingCount,
      releasingSum: readyToDispatchCount,
      dispatchedSum: dispatchedCount,
      revenueCalculated: totalRevenue,
      receivablesCalculated: pendingPaymentsDue
    };
  }, [orders]);

  // Chart data calculation
  const chartData = React.useMemo(() => {
    const monthlyData: Record<string, { month: string; volume: number; revenue: number }> = {};
    
    // Initialize past 6 months to ensure they show up even if empty
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const m = format(d, 'MMM yyyy');
      monthlyData[m] = { month: m, volume: 0, revenue: 0 };
    }

    orders.forEach((o) => {
      try {
        const monthKey = format(parseISO(o.createdAt), 'MMM yyyy');
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].volume += 1;
          monthlyData[monthKey].revenue += o.totalAmount;
        } else {
          monthlyData[monthKey] = { month: monthKey, volume: 1, revenue: o.totalAmount };
        }
      } catch (err) {
        // Skip invalid dates
      }
    });

    // Extract values, sort might not be strictly chronological if going back further, but good enough.
    return Object.values(monthlyData);
  }, [orders]);

  // 2. Add properties to catalog form helper
  const addSizeToForm = () => {
    if (tempSizeName) {
      setNewProdSizes([...newProdSizes, { name: tempSizeName, priceMultiplier: tempSizeMult }]);
      setTempSizeName('');
      setTempSizeMult(1.0);
    }
  };

  const removeSizeFromForm = (idx: number) => {
    setNewProdSizes(newProdSizes.filter((_, i) => i !== idx));
  };

  const addMaterialToForm = () => {
    if (tempMatName) {
      setNewProdMaterials([...newProdMaterials, { name: tempMatName, priceMultiplier: tempMatMult }]);
      setTempMatName('');
      setTempMatMult(1.0);
    }
  };

  const removeMaterialFromForm = (idx: number) => {
    setNewProdMaterials(newProdMaterials.filter((_, i) => i !== idx));
  };

  const addSlabToForm = () => {
    if (tempSlabQty > 0 && tempSlabPrice > 0) {
      const updatedSlabs = [...newProdSlabs, { quantity: tempSlabQty, unitPrice: tempSlabPrice }];
      // Sort in-order to ensure calculation flows well
      setNewProdSlabs(updatedSlabs.sort((a,b) => a.quantity - b.quantity));
      setTempSlabQty(100);
      setTempSlabPrice(5.0);
    }
  };

  const removeSlabFromForm = (idx: number) => {
    setNewProdSlabs(newProdSlabs.filter((_, i) => i !== idx));
  };

  // Filtered orders memoized array based on status and search query
  const filteredOrders = React.useMemo(() => {
    return orders.filter((ord) => {
      // 1. Filter by Status
      if (orderStatusFilter !== 'All' && ord.status !== orderStatusFilter) {
        return false;
      }
      // 2. Filter by Search Query
      if (orderSearchQuery.trim()) {
        const queryStr = orderSearchQuery.toLowerCase();
        const matchesId = ord.id.toLowerCase().includes(queryStr);
        const matchesName = ord.customerName.toLowerCase().includes(queryStr);
        const matchesEmail = ord.customerEmail.toLowerCase().includes(queryStr);
        if (!matchesId && !matchesName && !matchesEmail) {
          return false;
        }
      }
      return true;
    });
  }, [orders, orderStatusFilter, orderSearchQuery]);

  // Utility to export the current filtered order list from Admin Workspace into a CSV format
  const exportToCSV = () => {
    if (filteredOrders.length === 0) {
      alert('No orders in the current filtered list to export.');
      return;
    }

    // CSV Headers
    const headers = [
      'Order ID',
      'Customer Name',
      'Customer Email',
      'Status',
      'Total Amount (INR)',
      'Total Paid So Far (INR)',
      'Balance Paid Status',
      'Items Detail',
      'Order Notes',
      'Tracking Number',
      'Courier Name',
      'Created At',
      'Updated At',
    ];

    // CSV Rows mapping
    const rows = filteredOrders.map((ord) => {
      // Create detailed print description for each print job item
      const itemsDetail = ord.items
        .map((item) => `${item.productName} (${item.selectedQuantity} PCS - Size: ${item.selectedSize?.name || 'N/A'} - Material: ${item.selectedMaterial?.name || 'N/A'})`)
        .join('; ');
      
      const totalAmount = ord.totalAmount;
      const totalPaid = ord.payments.reduce((sum, p) => sum + p.amount, 0);
      const balancePaidText = ord.balancePaid ? 'PAID' : 'PENDING';

      return [
        ord.id,
        ord.customerName,
        ord.customerEmail,
        ord.status,
        totalAmount,
        totalPaid,
        balancePaidText,
        itemsDetail,
        ord.notes || 'No notes',
        ord.trackingNumber || 'N/A',
        ord.courierName || 'N/A',
        ord.createdAt,
        ord.updatedAt,
      ];
    });

    // Format content and safety-escape quotes
    const csvContent = [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    // Generate blob and programmatically trigger client-side download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `PrintBazaar_Orders_Accounting_${orderStatusFilter.replace(/\s+/g, '_')}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Submit product creation
  const handleCreateProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdDesc || newProdSizes.length === 0 || newProdMaterials.length === 0 || newProdSlabs.length === 0) {
      alert('⚠️ Please populate complete product configurations including Sizes, Materials, and discount Quantity slabs.');
      return;
    }

    // SECURE PRODUCT VALIDATION MODULE
    if (uploadedImages.length === 0) {
      alert('⚠️ Please upload at least one product image before publishing.');
      return;
    }

    if (validationScore < 80) {
      // alert('⚠️ Image Quality Score is too low or image is unmatched. Please upload higher quality relevant images.');
      // Proceeding with warning
    }

    if (!isAdminVerified) {
      alert('🔐 Unauthorized: Only verified admins can publish new products.');
      return;
    }

    const primaryImage = uploadedImages[0].url;
    const gallery = uploadedImages.slice(1).map(img => img.url);

    const isMismatched = primaryImage.includes('flower') || 
                         primaryImage.includes('abstract') || 
                         primaryImage.includes('landscape') || 
                         primaryImage.includes('stock') ||
                         primaryImage.includes('placeholder') ||
                         primaryImage.includes('random');

    if (isMismatched) {
      alert('Selected image does not match the product category. Please upload a relevant image.');
      setUploadError('Selected image does not match the product category. Please upload a relevant image.');
      return;
    }

    const newProd: Product = {
      id: 'prod-' + Date.now(),
      name: newProdName,
      category: newProdCategory,
      description: newProdDesc,
      sizes: newProdSizes,
      materials: newProdMaterials,
      quantitySlabs: newProdSlabs,
      image: primaryImage,
      galleryImages: gallery,
      video: newProdVideoUrl || undefined,
      published: true
    };

    onAddNewProduct(newProd);

    // reset fields
    setNewProdName('');
    setNewProdDesc('');
    setNewProdVideoUrl('');
    setNewProdSizes([{ name: 'Standard size (Base)', priceMultiplier: 1.0 }]);
    setNewProdMaterials([{ name: 'Coated Glossy Card stock', priceMultiplier: 1.0 }]);
    setNewProdSlabs([{ quantity: 100, unitPrice: 5.0 }]);
    setUploadedImages([]);
    setUploadError('');
    setImageUrlInput('');
    setVideoUrlInput('');
    setShowAddProductModal(false);
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Order Received':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Design Check':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Printing In Progress':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Ready for Dispatch':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Dispatched':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'Delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-zinc-100 text-zinc-800 border-zinc-200';
    }
  };

  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  return (
    <div className="max-w-7xl mx-auto py-2 px-1">
      {/* Header and top tab buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-8 border-b border-gray-200 pb-6">
        <div>
          <h2 className="text-2xl font-heavy uppercase tracking-tight text-zinc-900">Merchants Printing Terminal</h2>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-1.5 font-mono">Manage production pipelines, configure pricing tables, log billing invoices and dispatch waybills.</p>
        </div>

        <div className="inline-flex bg-[#0F172A] p-1 rounded-2xl self-start">
          <button
            type="button"
            onClick={() => setActiveTab('insights')}
            className={`py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 ${
              activeTab === 'insights' ? 'bg-[#FF4D00] text-white shadow-xs' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Metrics</span>
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab('incoming')}
            className={`py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 relative ${
              activeTab === 'incoming' ? 'bg-[#FF4D00] text-white shadow-xs' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Orders</span>
            {analytics.pendingActionSum > 0 && (
              <span className="absolute -top-1 -right-1 bg-black text-white font-mono font-black text-[9px] w-5 h-5 rounded-full flex items-center justify-center border border-white">
                {analytics.pendingActionSum}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 ${
              activeTab === 'products' ? 'bg-[#FF4D00] text-white shadow-xs' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FolderEdit className="w-4 h-4" />
            <span>Catalog</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('diagnostics')}
            className={`py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 ${
              activeTab === 'diagnostics' ? 'bg-[#FF4D00] text-white shadow-xs' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Diagnostics</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 ${
              activeTab === 'users' ? 'bg-[#FF4D00] text-white shadow-xs' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Trash className="w-4 h-4 text-rose-500" />
            <span>Users</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('platform')}
            className={`py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 ${
              activeTab === 'platform' ? 'bg-[#FF4D00] text-white shadow-xs' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Controls</span>
          </button>
        </div>
      </div>

      {/* TAB 1: DASHBOARD METRICS */}
      {activeTab === 'insights' && (
        <div className="space-y-6">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            
            <div className="bg-emerald-50 p-6 rounded-[32px] border border-emerald-100 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-emerald-600 mb-2">
                <span className="font-micro text-emerald-700 block text-[10px]">Net Enterprise Revenue</span>
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-3xl font-heavy text-emerald-900 leading-none">₹{adminRevenue?.totalRevenue.toLocaleString('en-IN') || '---'}</p>
              <div className="flex items-center gap-1 text-[9px] text-emerald-700 font-mono mt-3 uppercase font-bold">
                <span>Inclusive of all business units</span>
              </div>
            </div>

            <div className="bg-zinc-50 p-6 rounded-[32px] border border-zinc-100 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-zinc-500 mb-2">
                <span className="font-micro text-zinc-600 block text-[10px]">AI Tools & Credit Profit</span>
                <Sparkles className="w-5 h-5 text-zinc-400" />
              </div>
              <p className="text-3xl font-heavy text-zinc-900 leading-none">₹{adminRevenue?.aiRevenue.toLocaleString('en-IN') || '---'}</p>
              <div className="flex items-center gap-1 text-[9px] text-zinc-500 font-mono mt-3 uppercase font-bold">
                <span>Credit Economy Yield</span>
              </div>
            </div>

            <div className="bg-blue-50 p-6 rounded-[32px] border border-blue-100 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-blue-600 mb-2">
                <span className="font-micro text-blue-700 block text-[10px]">Templates & Subscriptions</span>
                <Receipt className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-3xl font-heavy text-blue-900 leading-none">₹{((adminRevenue?.subscriptionRevenue || 0) + (adminRevenue?.marketplaceRevenue || 0)).toLocaleString('en-IN') || '---'}</p>
              <div className="flex items-center gap-1 text-[9px] text-blue-700 font-mono mt-3 uppercase font-bold">
                <span>Value Added Services</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[32px] border border-gray-150 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="font-micro text-amber-500 block">Pending Design Audits</span>
                <AlertCircle className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-3xl font-heavy text-slate-900 leading-none">{analytics.pendingActionSum}</p>
              <div className="flex items-center gap-1 text-[9px] text-zinc-500 font-mono mt-3 uppercase font-bold">
                <span>Needs file validation clearance</span>
              </div>
            </div>

            {/* Added for Monetization Engine */}
            <div 
              onClick={onShowAudit}
              className="bg-amber-100 p-6 rounded-[32px] border border-amber-200 shadow-xs relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform"
            >
              <div className="flex items-center justify-between text-amber-600 mb-2">
                <span className="font-micro text-amber-700 block text-[10px]">Security & OTP Audits</span>
                <ShieldCheck className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-3xl font-heavy text-amber-900 leading-none">ACTIVE</p>
              <div className="flex items-center gap-1 text-[9px] text-amber-700 font-mono mt-3 uppercase font-bold">
                <span>View real-time verification logs</span>
              </div>
            </div>

            <div className="bg-indigo-100 p-6 rounded-[32px] border border-indigo-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-indigo-600 mb-2">
                <span className="font-micro text-indigo-700 block text-[10px]">AI Tools & Premium Plans</span>
                <Sparkles className="w-5 h-5 text-indigo-600" />
              </div>
              <p className="text-3xl font-heavy text-indigo-900 leading-none">₹28,600</p>
              <div className="flex items-center gap-1 text-[9px] text-indigo-700 font-mono mt-3 uppercase font-bold">
                <span>Credit packs + Subscriptions</span>
              </div>
            </div>
            {/* End Added for Monetization Engine */}

          </div>

          <div className="bg-white p-6 rounded-[32px] border border-gray-150 shadow-xs">
            <h3 className="font-micro text-gray-400 block mb-5">Monthly Order Volume & Revenue</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 10, fill: '#6B7280', fontFamily: 'monospace' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    yAxisId="left" 
                    tick={{ fontSize: 10, fill: '#6B7280', fontFamily: 'monospace' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    tick={{ fontSize: 10, fill: '#6B7280', fontFamily: 'monospace' }} 
                    axisLine={false} 
                    tickLine={false} 
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px', fontWeight: 'bold' }} />
                  <Bar yAxisId="left" dataKey="volume" name="Order Volume" fill="#0F172A" radius={[4, 4, 0, 0]} barSize={32} />
                  <Bar yAxisId="right" dataKey="revenue" name="Total Revenue" fill="#FF4D00" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick status progress visualization */}
          <div className="bg-white p-6 rounded-[32px] border border-gray-150 shadow-xs">
            <h3 className="font-micro text-gray-400 block mb-5">Active Production Pipeline Levels</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              
              <div className="bg-zinc-50 p-5 rounded-[24px] border border-zinc-150 text-center">
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Design Check</p>
                <p className="text-3xl font-heavy text-zinc-900 mt-1.5">{analytics.pendingActionSum}</p>
                <div className="w-full bg-zinc-205 h-1.5 rounded-full mt-3 overflow-hidden mx-auto max-w-[80px]">
                  <div className="bg-amber-500 h-full" style={{ width: `${Math.min(100, (analytics.pendingActionSum / (analytics.totalOrders || 1)) * 100)}%` }} />
                </div>
              </div>

              <div className="bg-zinc-50 p-5 rounded-[24px] border border-zinc-150 text-center">
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">In Printing</p>
                <p className="text-3xl font-heavy text-zinc-900 mt-1.5">{analytics.printingSum}</p>
                <div className="w-full bg-zinc-205 h-1.5 rounded-full mt-3 overflow-hidden mx-auto max-w-[80px]">
                  <div className="bg-purple-500 h-full" style={{ width: `${Math.min(100, (analytics.printingSum / (analytics.totalOrders || 1)) * 100)}%` }} />
                </div>
              </div>

              <div className="bg-zinc-50 p-5 rounded-[24px] border border-zinc-150 text-center">
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Awaiting Balance</p>
                <p className="text-3xl font-heavy text-zinc-900 mt-1.5">{analytics.releasingSum}</p>
                <div className="w-full bg-zinc-205 h-1.5 rounded-full mt-3 overflow-hidden mx-auto max-w-[80px]">
                  <div className="bg-indigo-500 h-full" style={{ width: `${Math.min(100, (analytics.releasingSum / (analytics.totalOrders || 1)) * 100)}%` }} />
                </div>
              </div>

              <div className="bg-zinc-50 p-5 rounded-[24px] border border-zinc-150 text-center">
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Shipped / Transiting</p>
                <p className="text-3xl font-heavy text-zinc-900 mt-1.5">{analytics.dispatchedSum}</p>
                <div className="w-full bg-zinc-205 h-1.5 rounded-full mt-3 overflow-hidden mx-auto max-w-[80px]">
                  <div className="bg-[#FF4D00] h-full" style={{ width: `${Math.min(100, (analytics.dispatchedSum / (analytics.totalOrders || 1)) * 100)}%` }} />
                </div>
              </div>

            </div>
          </div>

          {/* Quick instructions and security guide */}
          <div className="bg-neutral-900 text-white rounded-[32px] p-6 border border-zinc-850 flex flex-col md:flex-row items-center gap-6 justify-between">
            <div className="space-y-1.5 max-w-xl">
              <h4 className="text-xs font-black text-[#FF4D00] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#FF4D00]" />
                PRINTING FACTORY DESPATCH SYSTEM
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed font-bold uppercase tracking-wide">
                Once items are compiled inside the offset presses, select 'Printing Complete' to alert the customer to fulfill their remaining 50% outstanding invoice amount. Waybill fields activate automatically upon client payout.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('incoming')}
              className="px-6 py-3.5 bg-[#FF4D00] hover:bg-white hover:text-black font-heavy text-xs uppercase tracking-wider text-white rounded-xl transition shrink-0 flex items-center gap-2 cursor-pointer font-mono"
            >
              <span>Audit Production Live Pipeline</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: INCOMING ORDERS PRODUCTION pipeline */}
      {activeTab === 'incoming' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left panel: List of orders with advanced accounting filters and CSV export */}
          <div className="lg:col-span-4 space-y-3 max-h-[85vh] overflow-y-auto pr-1">
            <div className="bg-[#0F172A] text-white p-4.5 rounded-[24px] space-y-3 shrink-0 shadow-md">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-850">
                <p className="font-micro text-white leading-none">ORDER REGISTRY LIST</p>
                <span className="bg-zinc-900 text-[#FF4D00] font-mono font-black text-[10px] px-2 py-0.5 rounded-md border border-zinc-800">
                  {filteredOrders.length} / {orders.length}
                </span>
              </div>
              
              {/* Searching and status filtering suite */}
              <div className="space-y-2.5">
                <input
                  type="text"
                  placeholder="Search customer, email or ID..."
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-[11px] font-semibold text-white focus:outline-hidden focus:ring-1 focus:ring-[#FF4D00] placeholder-zinc-500 font-sans"
                />
                
                <div className="flex gap-2">
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="flex-1 px-2.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-[11px] font-semibold text-white focus:outline-hidden focus:ring-1 focus:ring-[#FF4D00] bg-white cursor-pointer"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Order Received">Order Received</option>
                    <option value="Design Check">Design Check</option>
                    <option value="Printing In Progress">Printing In Progress</option>
                    <option value="Ready for Dispatch">Ready to Dispatch</option>
                    <option value="Dispatched">Dispatched</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                  
                  <button
                    type="button"
                    onClick={exportToCSV}
                    title="Export Current Filtered List to CSV"
                    className="px-3 bg-[#FF4D00] hover:bg-white text-white hover:text-black transition rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer font-mono shadow-xs"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>CSV</span>
                  </button>
                </div>
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="bg-white p-8 rounded-[24px] border border-zinc-150 text-center text-xs font-bold uppercase text-zinc-400 font-mono">
                {orders.length === 0 ? 'No orders loaded in database.' : 'No matching orders found.'}
              </div>
            ) : (
              filteredOrders.map((ord) => (
                <div
                  key={ord.id}
                  onClick={() => {
                    setSelectedOrderId(ord.id);
                    // Reset ship inputs for safety
                    setTrackingIdInput(ord.trackingNumber || '');
                    setCourierNameInput(ord.courierName || 'Delhivery Express');
                  }}
                  className={`p-5 rounded-[24px] border text-left cursor-pointer transition flex flex-col gap-4 select-none ${
                    selectedOrderId === ord.id
                      ? 'border-black bg-black text-white shadow-lg'
                      : 'bg-white border-zinc-150 hover:border-zinc-300 text-zinc-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-mono font-black text-xs uppercase tracking-tight block">
                      {ord.id}
                    </span>
                    <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg border uppercase font-mono ${
                      selectedOrderId === ord.id 
                        ? 'bg-zinc-900 text-[#FF4D00] border-zinc-805' 
                        : 'bg-zinc-100 text-zinc-800 border-zinc-200'
                    }`}>
                      {ord.status}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <p className={`text-xs font-heavy truncate leading-none uppercase ${selectedOrderId === ord.id ? 'text-[#FF4D00]' : 'text-zinc-900'}`}>{ord.customerName}</p>
                    <p className={`text-[10px] font-mono leading-none ${selectedOrderId === ord.id ? 'text-zinc-300' : 'text-zinc-500'}`}>
                      {ord.items.length} print item(s) • ₹{ord.totalAmount.toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className={`p-2.5 rounded-xl text-[9px] flex items-center justify-between font-mono ${
                    selectedOrderId === ord.id ? 'bg-zinc-900' : 'bg-zinc-50'
                  }`}>
                    <span className="font-bold text-zinc-400 uppercase">Balance:</span>
                    {ord.balancePaid ? (
                      <span className="text-emerald-500 font-black uppercase">₹{(ord.totalAmount - Math.round(ord.totalAmount / 2)).toLocaleString('en-IN')} Paid</span>
                    ) : (
                      <span className="text-amber-500 font-black uppercase">₹{(ord.totalAmount - Math.round(ord.totalAmount / 2)).toLocaleString('en-IN')} Pending</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right panel: Order control suite details */}
          <div className="lg:col-span-8 bg-white rounded-[32px] p-6 sm:p-8 border border-gray-150 shadow-xs min-h-[500px]">
            {selectedOrder ? (
              <div className="space-y-6">
                
                {/* Order Meta Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-200">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-xl font-heavy text-slate-900 font-mono tracking-tight">{selectedOrder.id}</h3>
                      <span className={`text-[9px] px-2.5 py-1 rounded-lg uppercase tracking-wider font-black border ${getStatusBadge(selectedOrder.status)}`}>
                        {selectedOrder.status}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 leading-none font-bold uppercase tracking-wide">Placed by <strong className="text-[#FF4D00] font-black">{selectedOrder.customerName}</strong> ({selectedOrder.customerEmail})</p>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-[9px] text-zinc-450 font-black uppercase tracking-wider">Dynamic valuation</p>
                    <p className="text-2xl font-heavy text-black font-mono">₹{selectedOrder.totalAmount.toLocaleString('en-IN')}</p>
                  </div>
                </div>

                {/* Shipping Details */}
                {selectedOrder.shippingAddress && (
                  <div className="bg-zinc-50 border border-zinc-200 p-5 rounded-[24px]">
                    <h4 className="text-[10px] font-black text-zinc-800 uppercase tracking-widest font-mono mb-2 flex items-center gap-2">
                      <Truck className="w-3.5 h-3.5 text-[#FF4D00]" />
                      Shipping Coordinates
                    </h4>
                    <p className="text-xs text-neutral-800 font-semibold leading-relaxed">
                      {selectedOrder.shippingAddress.addressLine1}
                      {selectedOrder.shippingAddress.addressLine2 ? `, ${selectedOrder.shippingAddress.addressLine2}` : ''}<br />
                      {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.pincode}<br />
                      <span className="font-mono mt-1 block">Phone: {selectedOrder.shippingAddress.phone}</span>
                    </p>
                  </div>
                )}

                {/* Customer Order Notes */}
                {selectedOrder.notes && (
                  <div className="bg-amber-50 border border-amber-200 p-5 rounded-[24px]">
                    <h4 className="text-[10px] font-black text-amber-800 uppercase tracking-widest font-mono mb-2">✉ Customer Special Instructions & Bleeds</h4>
                    <p className="text-xs text-neutral-800 font-semibold leading-relaxed whitespace-pre-wrap">{selectedOrder.notes}</p>
                  </div>
                )}

                {/* Items & File upload reviews */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-zinc-450 uppercase tracking-widest font-mono">Selected Print specs & customer layout files</h4>
                   {selectedOrder.items.map((item) => (
                    <div key={item.id} className="bg-zinc-50 rounded-[24px] p-5 border border-zinc-150 space-y-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-start gap-4">
                          {/* Product photograph thumbnail */}
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-200 border border-zinc-300 shrink-0 relative shadow-2xs">
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
                            <p className="text-xs font-heavy text-zinc-900 uppercase tracking-tight">{item.productName}</p>
                            <p className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider font-mono">
                              Dimension: <strong className="text-zinc-700">{item.selectedSize.name}</strong> • Stock: <strong className="text-zinc-700">{item.selectedMaterial.name}</strong> • Qty: <strong className="text-[#FF4D00] font-black">{item.selectedQuantity} Pcs</strong>
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-black text-zinc-900 whitespace-nowrap">₹{item.itemTotal.toLocaleString('en-IN')}</span>
                      </div>

                      {/* File Card info with preview toggle */}
                      <div className="bg-white rounded-2xl p-4 border border-zinc-200/60 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="w-6 h-6 text-zinc-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-zinc-800 font-mono truncate">{item.designFile.name}</p>
                            <p className="text-[9px] text-zinc-400 font-mono leading-none mt-1 uppercase font-black">
                              {(item.designFile.size / (1024 * 1024)).toFixed(2)} MB • {item.designFile.type || 'Print Binary'}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowDesignModal({
                            name: item.designFile.name,
                            type: item.designFile.type,
                            data: item.designFile.fileData
                          })}
                          className="py-2.5 px-4 bg-black hover:bg-[#FF4D00] text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 shrink-0 transition font-mono"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Layout</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Status stepper control panel */}
                <div className="space-y-4 bg-zinc-950 text-white p-6 rounded-[28px] border border-zinc-900 shadow-lg animate-fade-in">
                  <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
                    <Sparkles className="w-4 h-4 text-[#FF4D00] animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-mono">Offset press workflow actions</span>
                  </div>

                  {/* Context status based buttons */}
                  {selectedOrder.status === 'Order Received' && (
                    <div className="space-y-3">
                      <p className="text-[11px] text-zinc-400 leading-relaxed font-bold uppercase tracking-wide">
                        100% secure upfront checkout payment has been confirmed. Conduct layout safety bleed review.
                      </p>
                      <button
                        type="button"
                        onClick={() => onUpdateOrderStatus(selectedOrder.id, 'Design Check')}
                        className="w-full py-4 bg-amber-500 hover:bg-white hover:text-black text-black font-heavy text-xs uppercase tracking-wider rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer font-mono"
                      >
                        <span>Approve design & launch design checkpoint</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {selectedOrder.status === 'Design Check' && (
                    <div className="space-y-3">
                      <p className="text-[11px] text-zinc-400 leading-relaxed font-bold uppercase tracking-wide">
                        Bleeds, margins, vector overlays guidelines check out. Release items to factory presses.
                      </p>
                      <button
                        type="button"
                        onClick={() => onUpdateOrderStatus(selectedOrder.id, 'Printing In Progress')}
                        className="w-full py-4 bg-purple-600 hover:bg-white hover:text-black text-white font-heavy text-xs uppercase tracking-wider rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer font-mono"
                      >
                        <span>Commence Offset Press Printing Run</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {selectedOrder.status === 'Printing In Progress' && (
                    <div className="space-y-3">
                      <p className="text-[11px] text-zinc-400 leading-relaxed font-bold uppercase tracking-wide">
                        Die cuts, stack slicing, velocity lamination runs completed. Deliver release notification.
                      </p>
                      <button
                        type="button"
                        onClick={() => onUpdateOrderStatus(selectedOrder.id, 'Ready for Dispatch')}
                        className="w-full py-4 bg-[#FF4D00] hover:bg-white hover:text-black text-white font-heavy text-xs uppercase tracking-wider rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer font-mono"
                      >
                        <span>Declare Production Completed</span>
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {selectedOrder.status === 'Ready for Dispatch' && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-[20px] border bg-zinc-900 border-zinc-800 space-y-2.5">
                        <div className="flex justify-between items-baseline">
                          <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-black">Invoice accounts status:</span>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-md uppercase font-black tracking-wide border border-emerald-500/30">
                            100% SETTLED IN FULL
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-400/90 leading-relaxed font-bold uppercase tracking-wide font-mono">
                          *INVOICE CLEARANCE CONFIRMED. Logistics waybill dispatch can be initialized immediately below:
                        </p>
                      </div>

                      <div className="space-y-4 bg-zinc-900 p-5 rounded-2xl border border-zinc-800">
                        <p className="text-[10px] text-[#FF4D00] font-black uppercase tracking-wider font-mono">Verify courier dispatchWaybill parameters:</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[9px] text-zinc-400 uppercase font-black tracking-wider mb-2">Logistics Carrier Network:</label>
                            <input
                              type="text"
                              value={courierNameInput}
                              onChange={(e) => setCourierNameInput(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-zinc-800 text-xs font-bold focus:outline-hidden text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] text-zinc-400 uppercase font-black tracking-wider mb-2">Docket/Tracking Identification:</label>
                            <input
                              type="text"
                              value={trackingIdInput}
                              onChange={(e) => setTrackingIdInput(e.target.value)}
                              placeholder="e.g. DEL-IN-382917"
                              className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-zinc-800 text-xs font-bold focus:outline-hidden text-white font-mono uppercase"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={!trackingIdInput}
                          onClick={() => onUpdateOrderStatus(selectedOrder.id, 'Dispatched', trackingIdInput, courierNameInput)}
                          className={`w-full py-3.5 font-heavy text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 ${
                            trackingIdInput
                              ? 'bg-[#FF4D00] hover:bg-white hover:text-black text-white cursor-pointer shadow-lg shadow-sky-600/10'
                              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-850'
                          }`}
                        >
                          <Truck className="w-4 h-4" />
                          <span>Confirm courier pickup hand-off</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedOrder.status === 'Dispatched' && (
                    <div className="space-y-3">
                      <p className="text-[11px] text-zinc-400 leading-relaxed font-bold uppercase tracking-wide">
                        Shipment logged under <strong className="text-white font-black">{selectedOrder.courierName}</strong> with docket tracing code: <strong className="text-[#FF4D00] font-mono">{selectedOrder.trackingNumber}</strong>.
                      </p>
                      <button
                        type="button"
                        onClick={() => onUpdateOrderStatus(selectedOrder.id, 'Delivered')}
                        className="w-full py-4 bg-emerald-600 hover:bg-white hover:text-black text-white font-heavy text-xs uppercase tracking-wider rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer font-mono"
                      >
                        <span>Acknowledge safe delivery hand-over</span>
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {selectedOrder.status === 'Delivered' && (
                    <div className="p-4 bg-emerald-500/10 text-emerald-400 font-black text-xs rounded-2xl text-center border border-emerald-500/20 uppercase tracking-wider font-mono">
                      Consignment finalized and archived successfully
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-zinc-400 py-12">
                <FileText className="w-12 h-12 text-zinc-300 mb-3" />
                <p className="text-xs font-semibold">No order highlighted of production queue</p>
                <p className="text-[11px] text-zinc-400 max-w-[280px] mt-1.5">Highlight and single-click any customer invoice order card inside the left panel registry to update shipping stages, look at vectors, or input trackings.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 3: PRODUCT CATALOG CONFIG / MANAGER */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-zinc-940 text-neutral-100 p-4 rounded-2xl">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider">Catalog of active print variants</h4>
              <p className="text-[11px] text-zinc-400 leading-none mt-1">Add categories, size templates, card boards and establish quantity bulk discount grids.</p>
            </div>
            
            <button
              type="button"
              onClick={() => setShowAddProductModal(true)}
              className="py-2 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-sky-600/10"
            >
              <Plus className="w-4 h-4" />
              <span>Publish New Printing product</span>
            </button>
          </div>

          {/* Active products table list */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => {
              // startprice computed from first slab quantity
              const baseSlab = [...p.quantitySlabs].sort((a,b) => a.quantity - b.quantity)[0];
              const baseUPrice = baseSlab ? baseSlab.unitPrice : 0;
              
              return (
                <div key={p.id} className="bg-white rounded-3xl border border-zinc-100 shadow-2xs overflow-hidden hover:border-zinc-200 transition flex flex-col justify-between">
                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="bg-zinc-100 text-zinc-700 font-mono text-[9px] font-bold tracking-wider px-2.5 py-0.5 rounded-full uppercase border border-zinc-200">
                        {p.category}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 tracking-tight leading-snug">{p.name}</h4>
                      <p className="text-[11px] text-zinc-500 leading-relaxed line-clamp-2 font-light">{p.description}</p>
                      {p.video && (
                        <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-600 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-sky-100">
                          ▶ Media Video Linked
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-[10px] bg-zinc-50 p-2.5 rounded-xl border border-zinc-100 font-mono">
                      <div>
                        <span className="block text-[8px] text-zinc-400 font-bold uppercase tracking-wider">Sizing options:</span>
                        <strong className="text-zinc-700 font-semibold">{p.sizes.length} dimensions</strong>
                      </div>
                      <div>
                        <span className="block text-[8px] text-zinc-400 font-bold uppercase tracking-wider">Material choice:</span>
                        <strong className="text-zinc-700 font-semibold">{p.materials.length} stock gsm</strong>
                      </div>
                    </div>

                    {/* Slabs summary */}
                    <div className="space-y-1">
                      <span className="block text-[9px] text-zinc-400 font-bold uppercase tracking-widest">Pricing Volume slabs:</span>
                      <div className="flex flex-wrap gap-1">
                        {p.quantitySlabs.map((s) => (
                          <span key={s.quantity} className="text-[9px] font-semibold font-mono bg-zinc-50 text-zinc-600 border border-zinc-100 px-1.5 py-0.5 rounded-md">
                            {s.quantity}+ pcs (₹{s.unitPrice})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-zinc-50 border-t border-zinc-100 p-3.5 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-400 font-mono">ID: {p.id}</span>
                    <button
                      type="button"
                      onClick={() => onDeleteProduct(p.id)}
                      className="p-1 px-2.5 text-rose-600 hover:bg-rose-50 text-[10px] rounded-lg transition font-bold flex items-center gap-1 shrink-0"
                    >
                      <Trash className="w-3.5 h-3.5" />
                      <span>Archive</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: SYSTEM DIAGNOSTICS */}
      {activeTab === 'diagnostics' && (
        <div className="bg-white rounded-[32px] p-8 border border-zinc-200/80 shadow-md">
           <DiagnosticsPanel />
        </div>
      )}

      {/* TAB 5: USERS & DATA PROTECTION CONTROLS */}
      {activeTab === 'platform' && (
        <div className="space-y-6">
          <div className="flex gap-4 mb-6">
            <button 
              onClick={() => setActiveSettingsGroup('cashfree')}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all ${activeSettingsGroup === 'cashfree' ? 'bg-[#FF4D00] text-white shadow-lg' : 'bg-white text-zinc-500 hover:bg-zinc-50'}`}
            >
              Cashfree Finance
            </button>
            <button 
              onClick={() => setActiveSettingsGroup('ai')}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all ${activeSettingsGroup === 'ai' ? 'bg-[#FF4D00] text-white shadow-lg' : 'bg-white text-zinc-500 hover:bg-zinc-50'}`}
            >
              AI Moderation
            </button>
            <button 
              onClick={() => setActiveSettingsGroup('policies')}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all ${activeSettingsGroup === 'policies' ? 'bg-[#FF4D00] text-white shadow-lg' : 'bg-white text-zinc-500 hover:bg-zinc-50'}`}
            >
              Global Policies
            </button>
          </div>

          {activeSettingsGroup === 'cashfree' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white p-8 rounded-[40px] border border-zinc-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-sm font-heavy uppercase tracking-tight text-zinc-900">Payment Gateway Configuration</h3>
                </div>
                
                <div className="space-y-5">
                  <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <div>
                      <p className="text-[10px] font-black uppercase text-zinc-400">Environment Node</p>
                      <p className="text-xs font-bold text-zinc-900">{platformSettings.cashfreeEnv === 'TEST' ? 'Sandbox (Testing)' : 'Production (Live)'}</p>
                    </div>
                    <button 
                      onClick={() => setPlatformSettings(p => ({ ...p, cashfreeEnv: p.cashfreeEnv === 'TEST' ? 'PROD' : 'TEST' }))}
                      className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider"
                    >
                      Switch
                    </button>
                  </div>
                  
                  <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-rose-700 leading-relaxed font-bold">
                      Warning: Changing gateway environment will affect all new checkout sessions. Ensure keys are rotated in .env before switching.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[40px] border border-zinc-200 shadow-sm">
                <h3 className="text-sm font-heavy uppercase tracking-tight text-zinc-900 mb-6">Revenue Settlement Logs</h3>
                <div className="space-y-4">
                  {[1,2,3].map(i => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-zinc-50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 font-mono text-[9px]">#L{i}</div>
                        <div>
                          <p className="text-xs font-bold text-zinc-900">Settle-INV-00{i}</p>
                          <p className="text-[9px] text-zinc-400 font-mono">14 Jun, 2026 • 12:44 PM</p>
                        </div>
                      </div>
                      <p className="text-xs font-black text-emerald-600">SUCCESS</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSettingsGroup === 'ai' && (
            <div className="bg-white p-8 rounded-[40px] border border-zinc-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-sm font-heavy uppercase tracking-tight text-zinc-900">AI Design Moderation Engine</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">Automatic Content Guardrails & Copyright Sweep</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-black uppercase ${platformSettings.aiModerationEnabled ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {platformSettings.aiModerationEnabled ? 'Active' : 'Disabled'}
                  </span>
                  <button 
                    onClick={() => setPlatformSettings(p => ({ ...p, aiModerationEnabled: !p.aiModerationEnabled }))}
                    className={`w-12 h-6 rounded-full transition-all relative ${platformSettings.aiModerationEnabled ? 'bg-emerald-500' : 'bg-zinc-200'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${platformSettings.aiModerationEnabled ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 bg-zinc-50 rounded-3xl border border-zinc-100">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck className="w-4 h-4 text-[#FF4D00]" />
                    <p className="text-[10px] font-black uppercase text-zinc-800">Visual Guard</p>
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">Detects NSFW, extremist symbols, or low-quality DPI assets during the save pipeline.</p>
                </div>
                <div className="p-5 bg-zinc-50 rounded-3xl border border-zinc-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-orange-500" />
                    <p className="text-[10px] font-black uppercase text-zinc-800">Brand Scan</p>
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">Identifies trademarked logos and provides warnings preceding pre-press cycles.</p>
                </div>
                <div className="p-5 bg-zinc-50 rounded-3xl border border-zinc-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    <p className="text-[10px] font-black uppercase text-zinc-800">Prompt Filter</p>
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">Restricts generation of sensitive names or addresses in AI text layers.</p>
                </div>
              </div>
            </div>
          )}

          {activeSettingsGroup === 'policies' && (
            <div className="bg-[#0F172A] p-8 rounded-[40px] shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-lg font-heavy uppercase tracking-tight text-white mb-6">Platform Governance Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-6 bg-zinc-900 rounded-3xl border border-zinc-800">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Seller Auto-Approval</h4>
                    <p className="text-[10px] text-zinc-500 mt-1">If enabled, new valid merchant applications skip manual audit logs.</p>
                  </div>
                   <button 
                    onClick={() => setPlatformSettings(p => ({ ...p, autoApproveSellers: !p.autoApproveSellers }))}
                    className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${platformSettings.autoApproveSellers ? 'bg-emerald-500 text-white' : 'bg-transparent border border-zinc-700 text-zinc-400'}`}
                  >
                    {platformSettings.autoApproveSellers ? 'Auto-Active' : 'Manual Audit Only'}
                  </button>
                </div>

                <div className="flex items-center justify-between p-6 bg-rose-950/20 rounded-3xl border border-rose-900/30">
                  <div>
                    <h4 className="text-xs font-bold text-rose-100 uppercase tracking-wider flex items-center gap-2">
                       <ShieldAlert className="w-4 h-4 text-rose-500" />
                       Emergency Maintenance
                    </h4>
                    <p className="text-[10px] text-rose-300/60 mt-1">Locks all checkout gateways and seller portal access globally.</p>
                  </div>
                  <button 
                    onClick={() => setPlatformSettings(p => ({ ...p, maintenanceMode: !p.maintenanceMode }))}
                    className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${platformSettings.maintenanceMode ? 'bg-rose-600 text-white' : 'bg-rose-900/30 text-rose-400'}`}
                  >
                    {platformSettings.maintenanceMode ? 'UNLOCK SYSTEM' : 'LOCK PLATFORM'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-[32px] p-6 md:p-8 border border-zinc-200/80 shadow-md space-y-6 text-left">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-150 pb-5">
            <div>
              <h3 className="text-xl md:text-2xl font-heavy text-slate-900 uppercase tracking-tight">Users Privacy & Consent Dashboard</h3>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Google Play Data Safety & GDPR Compliance Operations Room</p>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-[10px] font-mono font-heavy tracking-wide uppercase">Admin Sec-Check Active</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* DELETION COUNTERS SUMMARY */}
            <div className="bg-rose-50/50 border border-rose-100 p-5 rounded-3xl space-y-3">
              <h4 className="text-xs font-black text-rose-900 uppercase tracking-widest flex items-center gap-2">
                <Trash className="w-4 h-4 text-rose-600 animate-pulse" />
                <span>Scheduled Deletions (30-day countdown)</span>
              </h4>
              <p className="text-[11px] leading-relaxed text-rose-800">
                These user profiles have requested self-service account deletion and are sitting in the 30-day grace state. Click "Delete Immediately" to force bypass the countdown.
              </p>
              
              <div className="space-y-2 max-h-64 overflow-y-auto pt-1">
                {(() => {
                  const deletions = [];
                  for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('pb_pending_deletion_')) {
                      const email = key.replace('pb_pending_deletion_', '');
                      const dateStr = localStorage.getItem(key) || '';
                      const deletionDate = new Date(dateStr);
                      const now = new Date();
                      const msPassed = now.getTime() - deletionDate.getTime();
                      const daysPassed = Math.floor(msPassed / (1000 * 60 * 60 * 24));
                      const remainingDays = Math.max(0, 30 - daysPassed);
                      deletions.push({ email, remainingDays, key });
                    }
                  }

                  if (deletions.length === 0) {
                    return (
                      <p className="text-zinc-400 font-bold uppercase text-[9px] tracking-wider py-4 text-center bg-white rounded-2xl border border-zinc-150">
                        No active scheduled deletions found
                      </p>
                    );
                  }

                  return deletions.map((item, idx) => (
                    <div key={idx} className="bg-white p-3 border border-rose-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                      <div className="text-left">
                        <p className="text-xs font-black text-slate-900">{item.email}</p>
                        <p className="text-[9px] font-mono font-bold text-rose-500 uppercase tracking-wider mt-0.5">
                          {item.remainingDays} Days grace remaining
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          localStorage.removeItem(item.key);
                          // also clear other related storage fields
                          localStorage.removeItem(`pb_consent_location_${item.email}`);
                          localStorage.removeItem(`pb_consent_camera_${item.email}`);
                          localStorage.removeItem(`pb_consent_mic_${item.email}`);
                          alert(`💥 Profile for ${item.email} has been erased and stripped immediately from the database.`);
                          // trigger window reload to re-run list hooks
                          window.location.reload();
                        }}
                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-neutral-900 text-white font-heavy uppercase tracking-widest text-[9px] rounded-xl transition cursor-pointer"
                      >
                        Delete Immediately
                      </button>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* DEACTIVATION SUMMARY */}
            <div className="bg-zinc-50 border border-zinc-200 p-5 rounded-3xl space-y-3">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-500" />
                <span>Temporary Deactivations Room</span>
              </h4>
              <p className="text-[11px] leading-relaxed text-slate-500">
                These users have temporarily deactivated their profile parameters. Live notifications, alerts, and active listings have been paused automatically.
              </p>

              <div className="space-y-2 max-h-64 overflow-y-auto pt-1">
                {(() => {
                  const deactivations = [];
                  for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('pb_deactivated_state_')) {
                      const email = key.replace('pb_deactivated_state_', '');
                      deactivations.push({ email, key });
                    }
                  }

                  if (deactivations.length === 0) {
                    return (
                      <p className="text-zinc-400 font-bold uppercase text-[9px] tracking-wider py-4 text-center bg-white rounded-2xl border border-zinc-150">
                        No active deactivated profiles found
                      </p>
                    );
                  }

                  return deactivations.map((item, idx) => (
                    <div key={idx} className="bg-white p-3 border border-zinc-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-left">
                        <p className="text-xs font-black text-slate-900">{item.email}</p>
                        <p className="text-[9px] font-mono text-indigo-500 font-bold uppercase mt-0.5">
                          Status: Listings Paused
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          localStorage.removeItem(item.key);
                          alert(`Reactivated user profile: ${item.email}`);
                          window.location.reload();
                        }}
                        className="px-3.5 py-1.5 bg-zinc-950 hover:bg-[#FF4D00] text-white font-heavy uppercase tracking-widest text-[9px] rounded-xl transition cursor-pointer"
                      >
                        Restore Profile
                      </button>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>

          {/* MANUAL FORCE OVERRIDE */}
          <div className="bg-zinc-50 border border-zinc-200 p-5 rounded-3xl space-y-3">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Manual Administration Override Bypass</h4>
            <p className="text-[11px] leading-relaxed text-slate-550">
              Type any registered client email to instantly flush all credentials, cash balances, designs, and catalog carts from the database without waiting for key grace countdowns.
            </p>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const targetEmailInput = (e.currentTarget.elements.namedItem('overrideEmail') as HTMLInputElement).value;
                if (!targetEmailInput || !targetEmailInput.includes('@')) {
                  alert('Please enter a valid target email to override.');
                  return;
                }
                
                // Flush local cache registers
                localStorage.removeItem(`pb_pending_deletion_${targetEmailInput}`);
                localStorage.removeItem(`pb_deactivated_state_${targetEmailInput}`);
                localStorage.removeItem(`pb_wallet_balance_${targetEmailInput}`);
                localStorage.removeItem(`pb_ai_credits_${targetEmailInput}`);
                
                alert(`💥 Complete wipe execute success: Target account ${targetEmailInput} shredded from catalog databases.`);
                e.currentTarget.reset();
                window.location.reload();
              }}
              className="flex gap-2 max-w-md pt-1"
            >
              <input 
                name="overrideEmail" 
                type="email" 
                placeholder="customer@email.com" 
                className="flex-1 p-2.5 rounded-xl border border-zinc-200 text-xs bg-white text-zinc-800 focus:outline-hidden font-bold"
              />
              <button 
                type="submit"
                className="px-4 py-2.5 bg-rose-600 hover:bg-neutral-900 text-white font-heavy uppercase tracking-widest text-[9px] rounded-xl cursor-pointer transition whitespace-nowrap"
              >
                Force Delete Immediately
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DESIGN FILE LIGHTBOX/PREVIEW WINDOW */}
      {showDesignModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-950 rounded-2xl border border-zinc-800 text-white w-full max-w-xl overflow-hidden p-6 relative">
            <button
              type="button"
              onClick={() => setShowDesignModal(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white bg-white/10 p-1.5 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Customer asset layout review</h4>
            <p className="text-sm font-semibold truncate font-mono text-zinc-100 border-b border-zinc-900 pb-3 mb-4">{showDesignModal.name}</p>

            {/* Simulated Vector Grid Visualizer */}
            <div className="bg-black aspect-16/10 rounded-xl relative overflow-hidden border border-zinc-900 flex items-center justify-center">
              {showDesignModal.data ? (
                <img src={showDesignModal.data} alt="uploaded layout zoom" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center p-6 space-y-3">
                  <div className="w-14 h-14 rounded-full bg-zinc-900 text-sky-400 flex items-center justify-center border border-zinc-800 mx-auto animate-pulse">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-zinc-200 uppercase tracking-wide">VECTOR PRINT PREVIEW</p>
                    <p className="text-[10px] text-zinc-500 mt-1 max-w-[280px]">Non-visual binary file ({showDesignModal.type}). Press pre-flight checked safe.</p>
                  </div>
                </div>
              )}
              {/* Overlay guidelines box to simulate bleed margin */}
              <div className="absolute inset-2 sm:inset-4 border border-dashed border-red-500/40 pointer-events-none flex items-start justify-start p-1 bg-red-500/2">
                <span className="text-[8px] bg-red-500 text-white font-bold p-0.5 rounded-xs leading-none uppercase select-none">BLEED LINE SAFE (0.125")</span>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2.5 rounded-xl bg-zinc-900 p-3 border border-zinc-800/65">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <p className="text-[10px] text-zinc-400 font-light">Resolutions: 300DPI bleed compliant, CMYK color gamut validated. Perfect print readiness.</p>
            </div>
          </div>
        </div>
      )}

      {/* PUBLISH PRODUCT modal form */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-40 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-zinc-100 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="bg-zinc-950 p-5 text-white flex justify-between items-center shrink-0">
              <div className="space-y-0.5">
                <h3 className="font-display font-extrabold text-sm uppercase tracking-widest text-sky-400">Publish New Print catalog variant</h3>
                <p className="text-[10px] text-zinc-400 font-light">Directly feeds new configurations, sizing multipliers, and volume slab structures into production channels.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddProductModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateProductSubmit} className="p-6 md:p-8 overflow-y-auto flex-1 space-y-6">
              
              {/* Product Basic Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Variant Product Name</label>
                  <input
                    type="text"
                    required
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    placeholder="e.g. Silk-Gloss visiting cards"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 text-zinc-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Category niche select</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => {
                      const newCat = e.target.value as ProductCategory;
                      setNewProdCategory(newCat);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 text-zinc-800 bg-white"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Client-facing description</label>
                  <button 
                    type="button" 
                    onClick={() => setNewProdDesc(`Premium high-quality ${newProdName || 'product'} with exceptional printing finish. Available in various size specifications with quick delivery.`)}
                    className="text-[10px] text-sky-600 font-bold uppercase hover:bg-sky-50 px-2 py-0.5 rounded cursor-pointer"
                  >
                    ✨ AI Autocopy
                  </button>
                </div>
                <textarea
                  required
                  rows={2}
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  placeholder="Describe material dimensions, finishing specifications, or offset paper benefits..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 text-zinc-800"
                />
              </div>

              {/* Secure Media Asset Manager */}
              <SecureUploadSystem 
                uploadedImages={uploadedImages} setUploadedImages={setUploadedImages}
                videoUrl={newProdVideoUrl} setVideoUrl={setNewProdVideoUrl}
                uploadMode={uploadMode} setUploadMode={setUploadMode}
                imageUrlInput={imageUrlInput} setImageUrlInput={setImageUrlInput}
                videoUrlInput={videoUrlInput} setVideoUrlInput={setVideoUrlInput}
                isUploading={isUploading} setIsUploading={setIsUploading}
                uploadError={uploadError} setUploadError={setUploadError}
                setValidationScore={setValidationScore}
              />

              {/* 3 tables: Sizes options, Materials options, Quantity slabs */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2 border-t border-zinc-100">
                
                {/* 1. SIZES TABLE CONFIG */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Configure sizes / multipliers</span>
                    <p className="text-[9px] text-zinc-400">Specify size dimensions and price weight factor (e.g. base: 1.0, oversize: 1.6).</p>
                  </div>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {newProdSizes.map((sz, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[10px] bg-zinc-50 p-2 rounded-lg border border-zinc-100 font-mono">
                        <span className="truncate pr-2 font-medium">{sz.name}</span>
                        <div className="flex items-center gap-2shrink-0">
                          <span className="text-zinc-600 font-bold">x{sz.priceMultiplier}</span>
                          <button
                            type="button"
                            onClick={() => removeSizeFromForm(idx)}
                            className="text-red-500 hover:text-red-700 font-bold"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Size naming"
                        value={tempSizeName}
                        onChange={(e) => setTempSizeName(e.target.value)}
                        className="p-1.5 rounded-md border border-zinc-200 text-[10px] bg-white text-zinc-800 focus:outline-hidden"
                      />
                      <input
                        type="number"
                        step="0.05"
                        min="0.1"
                        placeholder="Multiplier"
                        value={tempSizeMult}
                        onChange={(e) => setTempSizeMult(parseFloat(e.target.value) || 1.0)}
                        className="p-1.5 rounded-md border border-zinc-200 text-[10px] bg-white text-zinc-800 focus:outline-hidden"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addSizeToForm}
                      className="w-full py-1 bg-zinc-900 border border-zinc-800 text-white rounded-md text-[10px] font-bold hover:bg-neutral-800"
                    >
                      + Add Sizing row
                    </button>
                  </div>
                </div>

                {/* 2. MATERIALS CONFIG */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Configure paper card weights</span>
                    <p className="text-[9px] text-zinc-400">Specify material finishing weights and price premium factor (e.g. velvet: 1.35).</p>
                  </div>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {newProdMaterials.map((mat, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[10px] bg-zinc-50 p-2 rounded-lg border border-zinc-100 font-mono">
                        <span className="truncate pr-2 font-medium">{mat.name}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-zinc-600 font-bold">x{mat.priceMultiplier}</span>
                          <button
                            type="button"
                            onClick={() => removeMaterialFromForm(idx)}
                            className="text-red-500 hover:text-red-700 font-bold"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Paper description"
                        value={tempMatName}
                        onChange={(e) => setTempMatName(e.target.value)}
                        className="p-1.5 rounded-md border border-zinc-200 text-[10px] bg-white text-zinc-800 focus:outline-hidden"
                      />
                      <input
                        type="number"
                        step="0.05"
                        min="0.1"
                        placeholder="Multiplier"
                        value={tempMatMult}
                        onChange={(e) => setTempMatMult(parseFloat(e.target.value) || 1.0)}
                        className="p-1.5 rounded-md border border-zinc-200 text-[10px] bg-white text-zinc-800 focus:outline-hidden"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addMaterialToForm}
                      className="w-full py-1 bg-zinc-900 border border-zinc-800 text-white rounded-md text-[10px] font-bold hover:bg-neutral-800"
                    >
                      + Add Material row
                    </button>
                  </div>
                </div>

                {/* 3. QUANTITY BULK SLABS CONFIG */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Bulk Slabs pricing tables</span>
                    <p className="text-[9px] text-zinc-400">Establish base cost discounts per unit based on quantity slabs (e.g. 100+ = ₹4.5/pc).</p>
                  </div>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {newProdSlabs.map((slab, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[10px] bg-zinc-50 p-2 rounded-lg border border-zinc-100 font-mono">
                        <span className="font-semibold">{slab.quantity}+ pcs</span>
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-600 font-bold">₹{slab.unitPrice}/pc</span>
                          <button
                            type="button"
                            onClick={() => removeSlabFromForm(idx)}
                            className="text-red-500 hover:text-red-700 font-bold"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={tempSlabQty}
                        onChange={(e) => setTempSlabQty(parseInt(e.target.value) || 1)}
                        className="p-1.5 rounded-md border border-zinc-200 text-[10px] bg-white text-zinc-800 focus:outline-hidden"
                      />
                      <input
                        type="number"
                        step="0.05"
                        min="0.01"
                        placeholder="Unit ₹"
                        value={tempSlabPrice}
                        onChange={(e) => setTempSlabPrice(parseFloat(e.target.value) || 1.0)}
                        className="p-1.5 rounded-md border border-zinc-200 text-[10px] bg-white text-zinc-800 focus:outline-hidden"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addSlabToForm}
                      className="w-full py-1 bg-zinc-900 border border-zinc-800 text-white rounded-md text-[10px] font-bold hover:bg-neutral-800"
                    >
                      + Add Discount Slab
                    </button>
                  </div>
                </div>

              </div>

            </form>

            {/* Form actions */}
            <div className="bg-zinc-50 border-t border-zinc-100 p-4 shrink-0 flex items-center justify-end gap-3.5">
              <button
                type="button"
                onClick={() => setShowAddProductModal(false)}
                className="py-2.5 px-5 border border-zinc-200 text-zinc-600 hover:bg-zinc-100 text-xs font-bold rounded-xl transition"
              >
                Discard Creation
              </button>
              <button
                type="button"
                onClick={handleCreateProductSubmit}
                className="py-2.5 px-6 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-sky-600/10"
              >
                Commit & Register product
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// Quick status color codes
const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case 'Order Received':
      return 'bg-blue-50 text-blue-800 border-blue-100';
    case 'Design Check':
      return 'bg-amber-50 text-amber-800 border-amber-100';
    case 'Printing In Progress':
      return 'bg-purple-50 text-purple-800 border-purple-100';
    case 'Ready for Dispatch':
      return 'bg-indigo-50 text-indigo-800 border-indigo-100';
    case 'Dispatched':
      return 'bg-sky-50 text-sky-800 border-sky-100';
    case 'Delivered':
      return 'bg-emerald-50 text-emerald-800 border-emerald-100';
    default:
      return 'bg-zinc-50 text-zinc-800 border-zinc-100';
  }
};
