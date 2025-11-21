
import React, { useEffect, useState, useMemo } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { PlatformType } from '../types';
import { Gamepad2, Gamepad, Joystick, MousePointer2, Keyboard, Laptop, Swords } from 'lucide-react';

interface CustomCursorProps {
  platform?: PlatformType | null;
}

const CustomCursor: React.FC<CustomCursorProps> = ({ platform }) => {
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
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      
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

  // Determine icon based on platform
  const icon = useMemo(() => {
    switch(platform) {
      case PlatformType.PS5: return <Gamepad2 size={28} strokeWidth={1.5} />;
      case PlatformType.SWITCH: return <Gamepad size={28} strokeWidth={1.5} />;
      case PlatformType.XBOX: return <Joystick size={28} strokeWidth={1.5} />;
      case PlatformType.STEAM: return <MousePointer2 size={28} strokeWidth={1.5} />;
      case PlatformType.BATTLENET: return <Swords size={28} strokeWidth={1.5} />;
      case PlatformType.PC: return <Keyboard size={28} strokeWidth={1.5} />;
      default: return null;
    }
  }, [platform]);

  return (
    <motion.div
      className="fixed top-0 left-0 z-[9999] pointer-events-none mix-blend-difference flex items-center justify-center"
      style={{
        x: cursorXSpring,
        y: cursorYSpring,
      }}
    >
      <motion.div 
        className={`flex items-center justify-center transition-all duration-200 ease-out`}
        animate={{
          // If icon is present, we center it differently than the dot
          height: isPointer ? 48 : (icon ? 40 : 16),
          width: isPointer ? 48 : (icon ? 40 : 16),
          x: isPointer ? -24 : (icon ? -20 : -8),
          y: isPointer ? -24 : (icon ? -20 : -8),
          // If icon is active, background is transparent to show icon stroke only
          backgroundColor: icon ? 'rgba(255,255,255,0)' : (isPointer ? 'rgba(255, 255, 255, 0)' : 'rgba(255, 255, 255, 0.9)'),
          border: isPointer ? '2px solid white' : '0px solid transparent',
          borderRadius: '50%', // Circle for default/pointer
        }}
      >
        {icon ? (
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: isPointer ? 1.2 : 1, rotate: 0 }}
            className="text-white"
          >
            {icon}
          </motion.div>
        ) : (
          // Default Dot is handled by background color of parent
          null
        )}
      </motion.div>
    </motion.div>
  );
};

export default CustomCursor;
