import React from 'react';
import { motion } from 'motion/react';
import { PackageSearch, BellOff, MessageSquareOff, HeartOff, FileSearch } from 'lucide-react';

interface EmptyStateProps {
  type: 'orders' | 'notifications' | 'community' | 'saved' | 'wishlist' | 'search';
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const config = {
  orders: {
    icon: PackageSearch,
    title: 'No Orders Yet',
    description: 'When you place an order, it will appear here for tracking.',
  },
  notifications: {
    icon: BellOff,
    title: 'All Caught Up',
    description: "You don't have any new notifications right now.",
  },
  community: {
    icon: MessageSquareOff,
    title: 'No Community Posts',
    description: 'Be the first to share your designs with the community.',
  },
  saved: {
    icon: FileSearch,
    title: 'No Saved Designs',
    description: 'Save your custom artwork to access them later for quick reordering.',
  },
  wishlist: {
    icon: HeartOff,
    title: 'Wishlist is Empty',
    description: 'Save products you love and they will appear here.',
  },
  search: {
    icon: PackageSearch,
    title: 'No Results Found',
    description: "We couldn't find anything matching your search criteria.",
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({ type, title, description, action }) => {
  const { icon: Icon, title: defaultTitle, description: defaultDescription } = config[type];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-6"
    >
      <div className="relative">
        <div className="w-24 h-24 bg-zinc-50 rounded-full flex items-center justify-center border border-zinc-100">
          <Icon className="w-10 h-10 text-zinc-300" />
        </div>
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ repeat: Infinity, duration: 3 }}
          className="absolute inset-0 bg-zinc-100/50 rounded-full blur-2xl -z-10"
        />
      </div>
      
      <div className="max-w-xs space-y-2">
        <h3 className="text-lg font-black uppercase tracking-tight text-zinc-900">
          {title || defaultTitle}
        </h3>
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest leading-relaxed">
          {description || defaultDescription}
        </p>
      </div>

      {action && (
        <button
          onClick={action.onClick}
          className="px-8 py-3 bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200 cursor-pointer"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
};
