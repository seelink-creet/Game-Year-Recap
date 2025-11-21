import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const CustomCursor: React.FC = () => {
  // Use MotionValues to track position without triggering React re-renders
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  
  // Smooth physics for the movement
  const springConfig = { damping: 25, stiffness: 700, mass: 0.5 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  const [isPointer, setIsPointer] = useState(false);

  useEffect(() => {
    const mouseMove = (e: MouseEvent) => {
      // Update motion values directly
      // We offset by default size (8px) or pointer size (24px) later in the transform, 
      // but for raw tracking, we just want the client coordinates.
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      
      // Optimization: Avoid window.getComputedStyle() as it causes reflows on every move.
      // Check efficiently for interactive elements.
      const target = e.target as HTMLElement;
      
      // Check up the tree for specific interactive elements
      const isInteractive = 
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.tagName === 'INPUT' ||
        target.tagName === 'LABEL' ||
        target.closest('button') !== null ||
        target.closest('a') !== null ||
        target.closest('[role="button"]') !== null;

      setIsPointer(!!isInteractive);
    };

    window.addEventListener("mousemove", mouseMove);

    return () => {
      window.removeEventListener("mousemove", mouseMove);
    };
  }, [cursorX, cursorY]);

  return (
    <motion.div
      className="fixed top-0 left-0 z-[9999] pointer-events-none mix-blend-difference"
      style={{
        x: cursorXSpring,
        y: cursorYSpring,
      }}
    >
      {/* We apply the offset here via margins or transform to center the cursor */}
      <motion.div 
        className={`rounded-full bg-white opacity-90 transition-all duration-200 ease-out`}
        animate={{
          height: isPointer ? 48 : 16,
          width: isPointer ? 48 : 16,
          // Center the cursor: -24px for pointer (48/2), -8px for dot (16/2)
          x: isPointer ? -24 : -8,
          y: isPointer ? -24 : -8,
          backgroundColor: isPointer ? 'rgba(255, 255, 255, 0)' : 'rgba(255, 255, 255, 0.9)',
          border: isPointer ? '2px solid white' : '0px solid transparent',
        }}
      />
    </motion.div>
  );
};

export default CustomCursor;