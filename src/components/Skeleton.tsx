import React from 'react';
import { motion } from 'motion/react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  width = '100%', 
  height = '1rem', 
  borderRadius = '0.5rem' 
}) => {
  return (
    <div 
      className={`relative overflow-hidden bg-zinc-100 ${className}`}
      style={{ width, height, borderRadius }}
    >
      <motion.div
        className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent"
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white border border-zinc-100 rounded-[32px] p-6 space-y-4">
      <Skeleton height="200px" borderRadius="24px" />
      <div className="space-y-2">
        <Skeleton width="60%" height="1.2rem" />
        <Skeleton width="40%" height="0.8rem" />
      </div>
      <div className="flex justify-between items-center pt-2">
        <Skeleton width="30%" height="1.5rem" />
        <Skeleton width="20%" height="1.5rem" borderRadius="12px" />
      </div>
    </div>
  );
};

export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center p-4 bg-white border border-zinc-50 rounded-2xl">
          <Skeleton width="48px" height="48px" borderRadius="12px" />
          <div className="flex-1 space-y-2">
            <Skeleton width="40%" height="1rem" />
            <Skeleton width="20%" height="0.7rem" />
          </div>
          <Skeleton width="60px" height="24px" borderRadius="8px" />
        </div>
      ))}
    </div>
  );
};
