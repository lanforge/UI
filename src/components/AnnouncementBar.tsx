import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const AnnouncementBar: React.FC = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [rotationSpeed, setRotationSpeed] = useState<number>(5);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await api.get('/announcement-bar/public');
        if (res.data.announcementBar) {
          const bar = res.data.announcementBar;
          if (bar.isVisible) {
            setIsVisible(true);
            setRotationSpeed(bar.rotationSpeed || 5);
            const activeAnnouncements = (bar.announcements || []).filter((a: any) => a.isActive);
            setAnnouncements(activeAnnouncements);
          }
        }
      } catch (error) {
        console.error('Failed to fetch announcement bar', error);
      }
    };
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    if (announcements.length > 1 && isVisible) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % announcements.length);
      }, rotationSpeed * 1000);
      return () => clearInterval(interval);
    }
  }, [announcements.length, isVisible, rotationSpeed]);

  if (!isVisible || announcements.length === 0) return null;

  const currentAnnouncement = announcements[currentIndex];

  const content = (
    <div className="w-full relative overflow-hidden bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 border-b-2 border-emerald-500 shadow-[0_4px_20px_rgba(16,185,129,0.3)]">
      {/* Smooth gradient overlay without squares */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
      
      {/* Scanning laser line effect */}
      <div className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent -translate-x-full animate-[shimmer_4s_infinite_linear]"></div>
      
      <div className="relative z-10 w-full text-white text-sm md:text-base font-extrabold py-3 px-4 text-center tracking-wide flex items-center justify-center space-x-3 uppercase">
        <svg className="w-5 h-5 text-emerald-300 animate-pulse hidden sm:block drop-shadow-[0_0_10px_rgba(110,231,183,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
        
        <span 
          key={currentIndex} // forces re-render/animation on index change
          className="animate-[fadeIn_0.5s_ease-out]"
          style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5), 0 0 15px rgba(16,185,129,0.5)' }}
        >
          {currentAnnouncement.text}
        </span>
        
        {currentAnnouncement.link && (
          <span className="inline-flex items-center ml-2 text-emerald-100 hover:text-white transition-colors group">
            <span className="hidden sm:inline-flex items-center justify-center bg-white/10 backdrop-blur-md border border-emerald-300/30 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-widest group-hover:bg-emerald-500/40 group-hover:border-emerald-300/60 shadow-[0_0_10px_rgba(16,185,129,0.2)] transition-all duration-300">
              Explore
            </span>
            <svg className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </span>
        )}
      </div>
    </div>
  );

  if (currentAnnouncement.link) {
    // If it's an external link
    if (currentAnnouncement.link.startsWith('http')) {
      return (
        <a href={currentAnnouncement.link} target="_blank" rel="noopener noreferrer" className="block w-full">
          {content}
        </a>
      );
    }
    // If it's an internal link
    return (
      <Link to={currentAnnouncement.link} className="block w-full">
        {content}
      </Link>
    );
  }

  return <div className="block w-full">{content}</div>;
};

export default AnnouncementBar;
