import React, { useEffect, useRef, useCallback } from 'react';

const ScrollProgress: React.FC = () => {
  const progressRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number | null>(null);
  const lastScrollY = useRef(0);

  const updateProgress = useCallback(() => {
    if (!progressRef.current) return;

    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;

    // Use CSS transform for hardware acceleration
    progressRef.current.style.transform = `scaleX(${scrollPercent})`;
    lastScrollY.current = scrollTop;
    rafId.current = null;
  }, []);

  const handleScroll = useCallback(() => {
    if (rafId.current === null) {
      rafId.current = requestAnimationFrame(updateProgress);
    }
  }, [updateProgress]);

  useEffect(() => {
    // Initial update
    updateProgress();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateProgress, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateProgress);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [handleScroll, updateProgress]);

  return (
    <div 
      ref={progressRef}
      className="scroll-progress"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '4px',
        background: 'linear-gradient(90deg, #004aad, #dbffac)',
        transformOrigin: 'left',
        transform: 'scaleX(0)',
        transition: 'transform 0.1s cubic-bezier(0.1, 0.8, 0.2, 1)',
        zIndex: 1001,
      }}
    />
  );
};

export default ScrollProgress;
