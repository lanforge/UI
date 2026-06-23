import React, { useEffect, useState } from 'react';
import api from '../utils/api';

const STORAGE_KEY = 'promoPopupLastDismissed';

const PromoPopup: React.FC = () => {
  const [config, setConfig] = useState<{
    isEnabled: boolean;
    delaySeconds: number;
    htmlContent: string;
    frequencyHours: number;
  } | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.get('/promo-popup/public')
      .then((res) => {
        if (!cancelled && res.data?.promoPopup) {
          setConfig(res.data.promoPopup);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!config || !config.isEnabled || !config.htmlContent) return;

    const lastDismissedStr = localStorage.getItem(STORAGE_KEY);
    if (lastDismissedStr && config.frequencyHours > 0) {
      const lastDismissed = parseInt(lastDismissedStr, 10);
      if (!Number.isNaN(lastDismissed)) {
        const elapsedMs = Date.now() - lastDismissed;
        const frequencyMs = config.frequencyHours * 60 * 60 * 1000;
        if (elapsedMs < frequencyMs) return;
      }
    }

    const delayMs = Math.max(0, (config.delaySeconds || 0) * 1000);
    const timer = window.setTimeout(() => setIsVisible(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [config]);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    setIsVisible(false);
  };

  if (!isVisible || !config?.htmlContent) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={dismiss}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative max-w-lg w-full bg-gradient-to-br from-[#11141d] to-[#0a0c13] border border-emerald-500/30 rounded-2xl shadow-[0_20px_60px_rgba(16,185,129,0.25)] p-8 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close promo"
          className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div
          className="promo-popup-content"
          dangerouslySetInnerHTML={{ __html: config.htmlContent }}
        />
      </div>
    </div>
  );
};

export default PromoPopup;
