"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function LoadingBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Start progress bar on route change
    setIsVisible(true);
    setProgress(0);
    
    // Initial jump
    const startTimer = setTimeout(() => {
        setProgress(30);
    }, 100);

    // Gradual progress simulation
    const progressTimer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress >= 90) {
          clearInterval(progressTimer);
          return 90;
        }
        const diff = Math.random() * 10;
        return Math.min(oldProgress + diff, 90);
      });
    }, 400);

    // Finish progress bar
    const finishTimer = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
      }, 400); // Fade out duration
    }, 800); // Simulate network delay

    return () => {
      clearTimeout(startTimer);
      clearInterval(progressTimer);
      clearTimeout(finishTimer);
    };
  }, [pathname, searchParams]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none">
      <div 
        className="h-[3px] bg-gradient-to-r from-blue-600 via-blue-400 to-indigo-600 shadow-[0_0_15px_rgba(59,130,246,0.8)] transition-all duration-500 ease-out"
        style={{ width: `${progress}%` }}
      />
      
      {/* Glow effect at the tip */}
      <div 
        className="absolute top-0 h-[3px] w-20 bg-white blur-sm opacity-50 transition-all duration-500 ease-out"
        style={{ left: `calc(${progress}% - 80px)` }}
      />
    </div>
  );
}
