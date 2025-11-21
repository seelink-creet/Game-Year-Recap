import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const CustomCursor: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isPointer, setIsPointer] = useState(false);

  useEffect(() => {
    const mouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY
      });
      
      // Check if hovering over clickable element
      const target = e.target as HTMLElement;
      const computed = window.getComputedStyle(target);
      if (target.tagName.toLowerCase() === 'button' || 
          target.tagName.toLowerCase() === 'a' || 
          target.tagName.toLowerCase() === 'input' ||
          target.closest('button') ||
          computed.cursor === 'pointer') {
        setIsPointer(true);
      } else {
        setIsPointer(false);
      }
    };

    window.addEventListener("mousemove", mouseMove);

    return () => {
      window.removeEventListener("mousemove", mouseMove);
    };
  }, []);

  return (
    <motion.div
      className="fixed top-0 left-0 z-[9999] pointer-events-none mix-blend-difference"
      animate={{
        x: mousePosition.x - (isPointer ? 24 : 8),
        y: mousePosition.y - (isPointer ? 24 : 8),
        scale: isPointer ? 1.5 : 1,
      }}
      transition={{
        type: "spring",
        damping: 25,
        stiffness: 400,
        mass: 0.5
      }}
    >
      <div 
        className={`rounded-full bg-white opacity-90 ${isPointer ? 'h-12 w-12 border-2 border-white bg-transparent' : 'h-4 w-4'}`}
      />
    </motion.div>
  );
};

export default CustomCursor;