import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Download, 
  Calendar, 
  PieChart, 
  BarChart2, 
  FileText, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  RefreshCw,
  Clock
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  Cell,
  PieChart as RePie,
  Pie
} from 'recharts';
import { BusinessReportType, Order } from '../types';
import { format, subDays } from 'date-fns';

interface Props {
  orders: Order[];
}

const ReportGenerator: React.FC<Props> = ({ orders }) => {
  const [reportType, setReportType] = useState<BusinessReportType>('Daily');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 1500);
  };

  const chartData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayName = format(date, 'EEE');
      
      const dayOrders = orders.filter(o => o.createdAt?.startsWith(dateStr) || false);
      const sales = dayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const profit = sales * 0.25; // Estimate 25% profit
      
      data.push({
        name: dayName,
        sales,
        profit,
        orders: dayOrders.length
      });
    }
    return data;
  }, [orders]);

  const categoryData = useMemo(() => {
    const cats: Record<string, number> = {};
    orders.forEach(o => {
      o.items.forEach(item => {
        cats[item.productCategory] = (cats[item.productCategory] || 0) + item.itemTotal;
      });
    });
    
    const colors = ['#FF4D00', '#0F172A', '#6366f1', '#10b981', '#f59e0b', '#3b82f6'];
    return Object.entries(cats).map(([name, value], i) => ({
      name,
      value,
      color: colors[i % colors.length]
    }));
  }, [orders]);

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[24px] border border-zinc-200/50 shadow-sm">
        <div>
          <h2 className="text-xl font-heavy text-slate-950 uppercase tracking-tight">Business Intelligence Suite</h2>
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">Enterprise Performance Analytics</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-48">
             <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
             <select 
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2.5 pl-9 pr-4 text-[10px] font-black uppercase tracking-wider outline-none appearance-none cursor-pointer"
             >
               <option>Daily</option>
               <option>Weekly</option>
               <option>Monthly</option>
               <option>Yearly</option>
               <option>GST</option>
               <option>Profit</option>
             </select>
          </div>
          <button 
            onClick={generateReport}
            disabled={isGenerating}
            className="bg-slate-950 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-[#FF4D00] transition-all flex items-center gap-2"
          >
            {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <TrendingUp className="w-3.5 h-3.5" />}
            Generate Analytics
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Revenue', value: '₹4,52,000', change: '+12.5%', icon: TrendingUp, positive: true },
          { label: 'Net Profit', value: '₹1,12,500', change: '+8.2%', icon: BarChart2, positive: true },
          { label: 'GST Collected', value: '₹81,360', change: '+12.5%', icon: FileText, positive: true },
          { label: 'Order Volume', value: '1,248', change: '-2.4%', icon: Clock, positive: false },
        ].map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-[28px] border border-zinc-200/60 shadow-sm"
          >
             <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
                   <stat.icon className="w-5 h-5 text-slate-950" />
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-black uppercase ${stat.positive ? 'text-emerald-500' : 'text-rose-500'}`}>
                   {stat.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                   {stat.change}
                </div>
             </div>
             <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{stat.label}</p>
             <h3 className="text-2xl font-heavy text-slate-950 mt-1">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Trend */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-zinc-200/80 shadow-md">
           <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter">Revenue & Profit Trend</h3>
                <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">Last 7 Days Performance</p>
              </div>
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#FF4D00]" />
                    <span className="text-[8px] font-black text-zinc-500 uppercase">Revenue</span>
                 </div>
                 <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-slate-950" />
                    <span className="text-[8px] font-black text-zinc-500 uppercase">Profit</span>
                 </div>
              </div>
           </div>
           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF4D00" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#FF4D00" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                      fontSize: '10px',
                      fontWeight: '900',
                      textTransform: 'uppercase'
                    }} 
                  />
                  <Area type="monotone" dataKey="sales" stroke="#FF4D00" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                  <Area type="monotone" dataKey="profit" stroke="#0F172A" strokeWidth={3} fill="transparent" />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Category Share */}
        <div className="bg-white p-8 rounded-[32px] border border-zinc-200/80 shadow-md">
           <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter mb-1">Product Mix</h3>
           <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mb-8">Sales by Category</p>
           <div className="h-[200px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                 <RePie>
                    <Pie
                      data={categoryData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                 </RePie>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="text-xs font-black text-slate-950 uppercase">Top 4</span>
                 <span className="text-[8px] text-zinc-400 font-bold uppercase">Products</span>
              </div>
           </div>
           <div className="mt-8 space-y-3">
              {categoryData.map(item => {
                const totalCats = categoryData.reduce((sum, c) => sum + c.value, 0) || 1;
                return (
                <div key={item.name} className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[10px] font-bold text-zinc-600 uppercase">{item.name}</span>
                   </div>
                   <span className="text-[10px] font-black text-slate-950">{((item.value / totalCats) * 100).toFixed(0)}%</span>
                </div>
              )})}
           </div>
        </div>
      </div>

      {/* Export Section */}
      <div className="bg-slate-950 rounded-[32px] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
               <Download className="w-8 h-8 text-[#FF4D00]" />
            </div>
            <div>
               <h3 className="text-lg font-heavy uppercase tracking-tighter">Ready for Compliance?</h3>
               <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Export full financial data for audit and taxes</p>
            </div>
         </div>
         <div className="flex gap-3">
            <button className="px-6 py-3 bg-white text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-[#FF4D00] hover:text-white transition-all flex items-center gap-2">
               <FileText className="w-4 h-4" /> PDF Report
            </button>
            <button className="px-6 py-3 bg-white/10 text-white border border-white/20 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-white hover:text-slate-950 transition-all">
               Excel / CSV
            </button>
         </div>
      </div>
    </div>
  );
};

export default ReportGenerator;
