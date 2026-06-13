import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle } from 'lucide-react';
import { Product, CartItem } from '../types';

interface WhatsAppFloatingButtonProps {
  product?: Product;
  cartItems?: CartItem[];
}

export default function WhatsAppFloatingButton({ product, cartItems }: WhatsAppFloatingButtonProps) {
  const WHATSAPP_NUMBER = "917533939460";
  const [isVisible, setIsVisible] = useState(true);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number, startY: number, initialX: number, initialY: number }>({ startX: 0, startY: 0, initialX: 0, initialY: 0 });
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    let lastScrollY = window.scrollY;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false); // scrolling down
      } else {
        setIsVisible(true); // scrolling up
      }
      lastScrollY = currentScrollY;
      
      // Auto show after scrolling stops
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setIsVisible(true), 1500);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutRef.current);
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPosition({
      x: dragRef.current.initialX + dx,
      y: dragRef.current.initialY + dy
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };
  
  const handleWhatsAppClick = (e: React.MouseEvent) => {
    // Prevent click if we were dragging
    const dx = Math.abs(position.x - dragRef.current.initialX);
    const dy = Math.abs(position.y - dragRef.current.initialY);
    if (dx > 5 || dy > 5) return;

    let msg = `Hello PrintBazaar Team,\n\nI want a quotation.\n\n`;
    
    if (product) {
      msg += `Product: ${product.name}\n`;
      msg += `Category: ${product.category}\n`;
    } else if (cartItems && cartItems.length > 0) {
      msg += `I have ${cartItems.length} items in my cart.\n`;
      msg += `Total Amount Estimate: ₹${cartItems.reduce((acc, item) => acc + item.itemTotal, 0)}\n\n`;
      cartItems.forEach(item => {
        msg += `- ${item.productName} (${item.selectedQuantity} pcs, ${item.selectedSize.name})\n`;
      });
    } else {
      msg += `I would like to inquire about your custom print services.\n`;
    }
    
    msg += `\nPlease provide the best price.`;
    
    const encodedMessage = encodeURIComponent(msg);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`, '_blank');
  };

  return (
    <button 
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={handleWhatsAppClick}
      style={{ transform: `translate(${position.x}px, ${position.y}px)`, opacity: isVisible ? 1 : 0.4, touchAction: 'none' }}
      className={`fixed bottom-24 md:bottom-6 right-6 z-[100] bg-[#25D366] hover:bg-[#1ebd5b] text-white p-4 rounded-full shadow-2xl flex items-center justify-center gap-2 transition-all duration-300 group overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-pointer hover:scale-105'}`}
      title="Get Quote on WhatsApp"
    >
      <MessageCircle className="w-7 h-7" />
      <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-in-out whitespace-nowrap font-bold text-sm tracking-wide">
        <span className="pl-2 pr-1">Get Quote</span>
      </span>
    </button>
  );
}
