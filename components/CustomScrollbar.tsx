'use client';

import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function CustomScrollbar() {
  const { scrollYProgress } = useScroll();
  const [isVisible, setIsVisible] = useState(false);

  // Smooth out the progress for the thumb position
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Calculate thumb position accurately
  // The thumb will be 80px tall. We map 0-1 progress to 0 to (100% - 80px)
  const y = useTransform(smoothProgress, [0, 1], ["0px", "calc(100vh - 112px)"]); 
  // 112px = 80px (thumb) + 32px (margins top/bottom 16px each)

  useEffect(() => {
    setIsVisible(true);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed right-3 top-4 bottom-4 w-2 z-[10000] hidden sm:block pointer-events-none">
      {/* Background Track - Ultra subtle */}
      <div className="absolute inset-0 bg-slate-800/20 backdrop-blur-sm rounded-full border border-white/5"></div>
      
      {/* Moving Thumb - Glowing Pill */}
      <motion.div
        style={{ y }}
        className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-indigo-400 via-indigo-500 to-purple-600 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.4)] border border-white/20 group pointer-events-auto cursor-pointer"
      >
        {/* Inner shine effect */}
        <div className="absolute inset-0 bg-white/10 rounded-full blur-[1px]"></div>
        
        {/* Center line decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-6 bg-white/20 rounded-full"></div>
      </motion.div>
    </div>
  );
}
