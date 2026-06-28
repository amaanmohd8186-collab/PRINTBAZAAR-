/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Printer, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  ArrowRight, 
  AlertCircle, 
  FileText, 
  Layout, 
  Truck, 
  Package, 
  Scissors, 
  Layers, 
  ChevronRight,
  Eye,
  Download,
  Zap,
  Calendar
} from 'lucide-react';
import { db, collection, onSnapshot, query, where, doc, updateDoc, increment } from '../firebase';
import { Order, OrderStatus, ProductionLog } from '../types';
import { format } from 'date-fns';

export default function PrintProductionDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('status', 'not-in', ['Delivered', 'Cancelled', 'Refunded']));
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const ordersData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(ordersData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateOrderStatus = async (orderId: string, nextStatus: OrderStatus, notes?: string) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const log: ProductionLog = {
        stage: nextStatus,
        timestamp: new Date().toISOString(),
        operator: 'Production Lead',
        notes
      };

      await updateDoc(orderRef, {
        status: nextStatus,
        updatedAt: new Date().toISOString(),
        productionTimeline: [
          ...(selectedOrder?.productionTimeline || []),
          log
        ]
      });

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          status: nextStatus,
          productionTimeline: [...(selectedOrder.productionTimeline || []), log]
        });
      }
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesStatus = filterStatus === 'All' || o.status === filterStatus;
    const matchesSearch = o.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         o.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'Order Received': return 'bg-zinc-100 text-zinc-600';
      case 'Artwork Review': return 'bg-blue-100 text-blue-700';
      case 'Printing': return 'bg-amber-100 text-amber-700';
      case 'Packing': return 'bg-indigo-100 text-indigo-700';
      case 'Shipped': return 'bg-emerald-100 text-emerald-700';
      case 'Waiting for Customer': return 'bg-rose-100 text-rose-700';
      default: return 'bg-zinc-100 text-zinc-600';
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'Artwork Review': return <FileText className="w-4 h-4" />;
      case 'Printing': return <Printer className="w-4 h-4" />;
      case 'Lamination': return <Layers className="w-4 h-4" />;
      case 'Cutting': return <Scissors className="w-4 h-4" />;
      case 'Packing': return <Package className="w-4 h-4" />;
      case 'Shipped': return <Truck className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const exportProductionCSV = () => {
    const headers = ['Order ID', 'Customer', 'Status', 'Jobs', 'Value', 'Placed At'];
    const rows = filteredOrders.map(o => [
      o.id,
      o.customerName || 'Anonymous',
      o.status,
      o.items.length,
      o.totalAmount,
      format(new Date(o.createdAt), 'yyyy-MM-dd HH:mm')
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `production_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const getDailyStats = () => {
    const today = new Date().toDateString();
    const todaysOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);
    return {
      count: todaysOrders.length,
      revenue: todaysOrders.reduce((sum, o) => sum + o.totalAmount, 0),
      printing: orders.filter(o => o.status === 'Printing').length,
      pendingApproval: orders.filter(o => o.status === 'Artwork Review').length
    };
  };

  const stats = getDailyStats();

  return (
    <div className="flex h-full bg-[#F8F9FA] overflow-hidden">
      {/* Sidebar List */}
      <div className="w-full md:w-1/3 border-r border-zinc-200 flex flex-col bg-white">
        <div className="p-6 border-b border-zinc-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-black rounded-2xl flex items-center justify-center shadow-lg shadow-black/10">
                 <Printer className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-black uppercase tracking-widest text-zinc-900">Order Management</h1>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Job Queue</p>
              </div>
            </div>
            <button 
              onClick={exportProductionCSV}
              className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-black transition"
              title="Export Production Report"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

          {/* Daily Pulse Mini-Stats */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100">
              <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest block">Daily Run</span>
              <span className="text-sm font-black text-zinc-900">{stats.count} Jobs</span>
            </div>
            <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100">
              <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest block">Revenue</span>
              <span className="text-sm font-black text-zinc-900">₹{stats.revenue.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search Orders or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold focus:ring-2 ring-black/5 outline-none transition"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-10 text-center space-y-3">
              <Printer className="w-8 h-8 text-zinc-200 animate-pulse mx-auto" />
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Loading...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto">
                <Layout className="w-6 h-6 text-zinc-200" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">No active jobs</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-50">
              {filteredOrders.map(order => (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`w-full p-6 text-left hover:bg-zinc-50 transition-all flex items-center justify-between group ${selectedOrder?.id === order.id ? 'bg-zinc-50 border-r-4 border-black' : ''}`}
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-mono font-black text-zinc-400">#{order.id.slice(0, 8).toUpperCase()}</span>
                       <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${getStatusColor(order.status)}`}>
                         {order.status}
                       </span>
                    </div>
                    <h3 className="text-xs font-black text-zinc-900 truncate uppercase">{order.customerName || 'Anonymous'}</h3>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-400">
                      <span>{order.items.length} Job{order.items.length > 1 ? 's' : ''}</span>
                      <span>•</span>
                      <span>₹{order.totalAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-zinc-300 transition-transform ${selectedOrder?.id === order.id ? 'translate-x-1 text-black' : ''}`} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail Panel */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {selectedOrder ? (
            <motion.div
              key={selectedOrder.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8 space-y-8"
            >
              {/* Header Info */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-8 border-b border-zinc-200">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-2xl ${getStatusColor(selectedOrder.status)}`}>
                      {getStatusIcon(selectedOrder.status)}
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight">Order #{selectedOrder.id.toUpperCase()}</h2>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Received {format(new Date(selectedOrder.createdAt), 'PPpp')}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button className="px-5 py-2.5 bg-white border border-zinc-200 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-zinc-50 transition flex items-center gap-2">
                    <Download className="w-3.5 h-3.5" />
                    Export Artwork
                  </button>
                  <button className="px-5 py-2.5 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-zinc-800 transition shadow-lg shadow-black/10 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" />
                    Invoice
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Job Queue */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white border border-zinc-200 rounded-[32px] overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                       <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900 flex items-center gap-2">
                         <Layout className="w-4 h-4 text-[#FF4D00]" />
                         Design Review
                       </h3>
                       <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{selectedOrder.items.length} Job Items</span>
                    </div>
                    <div className="divide-y divide-zinc-50">
                      {selectedOrder.items.map((item, idx) => (
                        <div key={idx} className="p-6 flex gap-6 group hover:bg-zinc-50/50 transition-colors">
                          <div className="w-24 h-24 bg-zinc-100 rounded-2xl overflow-hidden border border-zinc-200 shrink-0 relative">
                             {item.designFile?.fileData ? (
                               <img src={item.designFile.fileData} className="w-full h-full object-cover" />
                             ) : (
                               <div className="w-full h-full flex items-center justify-center">
                                 <Printer className="w-8 h-8 text-zinc-200" />
                               </div>
                             )}
                             <button className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white">
                                <Eye className="w-4 h-4" />
                                <span className="text-[9px] font-black uppercase">Inspect</span>
                             </button>
                          </div>
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-black text-zinc-900 uppercase">{item.productName}</h4>
                              <span className="text-[10px] font-mono font-black text-zinc-400 tracking-wider">₹{item.itemTotal}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest block">Specifications</span>
                                <p className="text-[10px] font-bold text-zinc-600">{item.selectedSize.name} • {item.selectedMaterial.name}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest block">Volume</span>
                                <p className="text-[10px] font-bold text-zinc-600">{item.selectedQuantity} Pcs</p>
                              </div>
                            </div>
                            
                            {/* Artwork Audit Snippet */}
                            {/* @ts-ignore */}
                            {item.artworkAudit && (
                              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                                    // @ts-ignore
                                    item.artworkAudit.qualityScore > 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                  }`}>
                                    {/* @ts-ignore */}
                                    {item.artworkAudit.qualityScore}
                                  </div>
                                  <div className="space-y-0.5">
                                    <p className="text-[9px] font-black uppercase text-zinc-900 tracking-wider">Quality Check Passed</p>
                                    <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">
                                      {/* @ts-ignore */}
                                      {item.artworkAudit.dpi} DPI • {item.artworkAudit.colorSpace} Detected
                                    </p>
                                  </div>
                                </div>
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="bg-white border border-zinc-200 rounded-[32px] p-6 space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900">Customer Information</h3>
                    <div className="grid grid-cols-2 gap-8">
                       <div className="space-y-1.5">
                         <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">Delivery Destination</span>
                         <p className="text-[11px] font-bold text-zinc-800 leading-relaxed">
                           {selectedOrder.shippingAddress?.name}<br/>
                           {selectedOrder.shippingAddress?.addressLine1}, {selectedOrder.shippingAddress?.city}<br/>
                           {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.pincode}
                         </p>
                       </div>
                       <div className="space-y-1.5">
                         <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">Contact Information</span>
                         <p className="text-[11px] font-bold text-zinc-800 uppercase tracking-widest">{selectedOrder.customerEmail}</p>
                         <p className="text-[11px] font-bold text-zinc-800">{selectedOrder.shippingAddress?.phone}</p>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Workflow Control */}
                <div className="space-y-6">
                   <div className="bg-zinc-900 rounded-[32px] p-6 text-white space-y-6 shadow-xl shadow-zinc-200">
                      <div className="flex items-center gap-2 pb-4 border-b border-white/10">
                         <Zap className="w-4 h-4 text-[#FF4D00]" />
                         <h3 className="text-xs font-black uppercase tracking-widest">Job Workflow</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Update Phase</label>
                           <div className="grid grid-cols-1 gap-2">
                              {[
                                { status: 'Artwork Review' as OrderStatus, label: 'Confirm Design' },
                                { status: 'Printing' as OrderStatus, label: 'Push to Printer' },
                                { status: 'Lamination' as OrderStatus, label: 'Start Lamination' },
                                { status: 'Cutting' as OrderStatus, label: 'Precision Cutting' },
                                { status: 'Packing' as OrderStatus, label: 'Move to Packing' },
                                { status: 'Shipped' as OrderStatus, label: 'Mark as Shipped' },
                              ].map((step) => (
                                <button
                                  key={step.status}
                                  onClick={() => updateOrderStatus(selectedOrder.id, step.status)}
                                  disabled={selectedOrder.status === step.status}
                                  className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border flex items-center justify-between px-4 ${
                                    selectedOrder.status === step.status
                                      ? 'bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed'
                                      : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                                  }`}
                                >
                                  {step.label}
                                  {selectedOrder.status === step.status && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                                </button>
                              ))}
                           </div>
                        </div>

                        <div className="pt-4 border-t border-white/10 space-y-3">
                           <button 
                             onClick={() => updateOrderStatus(selectedOrder.id, 'Waiting for Customer', 'Action required on artwork')}
                             className="w-full py-3 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-rose-600 transition shadow-lg shadow-rose-500/20"
                           >
                             Return for Action
                           </button>
                        </div>
                      </div>
                   </div>

                   {/* Production Timeline Sidebar */}
                   <div className="bg-white border border-zinc-200 rounded-[32px] p-6 space-y-6 shadow-sm">
                      <div className="flex items-center gap-2">
                         <Calendar className="w-4 h-4 text-zinc-400" />
                         <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900">Order History</h3>
                      </div>
                      
                      <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-100">
                        {(selectedOrder.productionTimeline || []).map((log, i) => (
                          <div key={i} className="relative pl-8 space-y-1">
                             <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                               i === 0 ? 'bg-black scale-125' : 'bg-zinc-200'
                             }`} />
                             <p className="text-[10px] font-black text-zinc-900 uppercase tracking-tight">{log.stage}</p>
                             <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">{format(new Date(log.timestamp), 'PPpp')}</p>
                             {log.notes && <p className="text-[9px] font-medium text-zinc-500 italic">"{log.notes}"</p>}
                          </div>
                        ))}
                        {(selectedOrder.productionTimeline || []).length === 0 && (
                          <div className="text-center py-4 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">No logs recorded yet</div>
                        )}
                      </div>
                   </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center space-y-4 text-center p-12">
               <div className="w-20 h-20 bg-white rounded-[32px] shadow-2xl flex items-center justify-center border border-zinc-100">
                  <Printer className="w-10 h-10 text-zinc-100" />
               </div>
               <div className="max-w-xs space-y-1.5">
                 <h2 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Select an Order</h2>
                 <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-relaxed">
                   Choose a job from the queue to start the production workflow, review artwork assets, and manage shipping labels.
                 </p>
               </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
