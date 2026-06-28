import React from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle2, 
  Clock, 
  FileSearch, 
  ThumbsUp, 
  Printer, 
  Layers, 
  Scissors, 
  Package, 
  Truck, 
  MapPin, 
  CheckCircle 
} from 'lucide-react';
import { OrderStatus } from '../types';

interface TimelineStep {
  status: OrderStatus;
  label: string;
  icon: any;
  description: string;
}

const STEPS: TimelineStep[] = [
  { status: 'Order Received', label: 'Order Received', icon: Clock, description: 'Order logged in our system' },
  { status: 'Artwork Review', label: 'Artwork Review', icon: FileSearch, description: 'Pre-press quality audit' },
  { status: 'Customer Approval', label: 'Customer Approval', icon: ThumbsUp, description: 'Waiting for your sign-off' },
  { status: 'Printing', label: 'Printing', icon: Printer, description: 'Hi-res production' },
  { status: 'Lamination', label: 'Lamination', icon: Layers, description: 'Premium finish application' },
  { status: 'Cutting', label: 'Cutting', icon: Scissors, description: 'Precision die-cutting' },
  { status: 'Packing', label: 'Packing', icon: Package, description: 'Protective enterprise packaging' },
  { status: 'Courier Pickup', label: 'Courier Pickup', icon: Truck, description: 'Handed over to logistics' },
  { status: 'Shipped', label: 'Shipped', icon: Truck, description: 'In transit to your city' },
  { status: 'Out For Delivery', label: 'Out For Delivery', icon: MapPin, description: 'Arriving today' },
  { status: 'Delivered', label: 'Delivered', icon: CheckCircle, description: 'Successfully received' },
];

interface Props {
  currentStatus: OrderStatus;
  estimatedTime?: string;
}

const EnterpriseTimeline: React.FC<Props> = ({ currentStatus, estimatedTime }) => {
  const currentIndex = STEPS.findIndex(s => s.status === currentStatus);
  const progress = ((currentIndex + 1) / STEPS.length) * 100;

  return (
    <div className="w-full space-y-8 py-6">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter">Production Lifecycle</h3>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Enterprise Grade Tracking</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-[#FF4D00] font-mono leading-none">{Math.round(progress)}%</span>
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Completed</p>
        </div>
      </div>

      <div className="relative">
        {/* Progress Bar Background */}
        <div className="absolute top-5 left-0 w-full h-0.5 bg-zinc-100 rounded-full" />
        
        {/* Active Progress Bar */}
        <motion.div 
          className="absolute top-5 left-0 h-0.5 bg-[#FF4D00] rounded-full z-10"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />

        <div className="flex justify-between relative z-20">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentIndex;
            const isActive = idx === currentIndex;
            const Icon = step.icon;

            return (
              <div key={step.status} className="flex flex-col items-center group">
                <motion.div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-[#FF4D00] border-[#FF4D00] text-white' 
                      : isActive 
                        ? 'bg-white border-[#FF4D00] text-[#FF4D00] shadow-[0_0_15px_rgba(255,77,0,0.3)]' 
                        : 'bg-white border-zinc-200 text-zinc-300'
                  }`}
                  whileHover={{ scale: 1.1 }}
                >
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </motion.div>
                
                <div className="mt-4 text-center hidden md:block w-24">
                  <p className={`text-[9px] font-black uppercase tracking-tight ${
                    isActive ? 'text-slate-900' : isCompleted ? 'text-zinc-600' : 'text-zinc-400'
                  }`}>
                    {step.label}
                  </p>
                  {isActive && (
                    <motion.p 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[8px] text-[#FF4D00] font-bold uppercase mt-1 leading-tight"
                    >
                      {step.description}
                    </motion.p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {estimatedTime && (
        <div className="bg-zinc-50 rounded-xl p-4 flex items-center justify-between border border-zinc-200/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg border border-zinc-200 shadow-sm">
              <Clock className="w-4 h-4 text-slate-950" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Estimated Delivery</p>
              <p className="text-xs font-black text-slate-950 uppercase mt-0.5">{estimatedTime}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Next Phase</p>
            <p className="text-xs font-black text-[#FF4D00] uppercase mt-0.5">
              {currentIndex < STEPS.length - 1 ? STEPS[currentIndex + 1].label : 'Complete'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnterpriseTimeline;
