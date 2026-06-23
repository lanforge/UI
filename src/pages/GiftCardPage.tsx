import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, animate } from 'framer-motion';
import SEO from '../components/SEO';

interface GiftCardData {
  code: string;
  balance: number;
  initialBalance: number;
  currency: string;
  recipientName?: string;
  message?: string;
  expiresAt?: string;
  createdAt?: string;
  isActive: boolean;
}

const formatCurrency = (n: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);

const AnimatedNumber: React.FC<{ value: number; currency?: string; className?: string }> = ({
  value,
  currency = 'USD',
  className,
}) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplay(latest),
    });
    return () => controls.stop();
  }, [value]);
  return <span className={className}>{formatCurrency(display, currency)}</span>;
};

const TiltGiftCard: React.FC<{ data: GiftCardData; copied: boolean; onCopy: () => void }> = ({
  data,
  copied,
  onCopy,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(mouseY, [0, 1], [10, -10]), { stiffness: 150, damping: 18 });
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-10, 10]), { stiffness: 150, damping: 18 });
  const glareBg = useTransform(
    [mouseX, mouseY] as any,
    ([x, y]: any) => `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(0,255,157,0.35) 0%, rgba(58,134,255,0.15) 30%, transparent 55%)`
  );
  const holoBg = useTransform(
    [mouseX, mouseY] as any,
    ([x, y]: any) =>
      `conic-gradient(from ${x * 360}deg at ${x * 100}% ${y * 100}%, rgba(0,255,157,0.0) 0deg, rgba(0,255,157,0.18) 90deg, rgba(58,134,255,0.18) 180deg, rgba(131,56,236,0.15) 270deg, rgba(0,255,157,0.0) 360deg)`
  );

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };

  const handleLeave = () => {
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  const percentRemaining = data.initialBalance > 0 ? (data.balance / data.initialBalance) * 100 : 0;

  return (
    <div className="[perspective:1200px]" style={{ perspective: '1200px' }}>
      {/* Neon glow halo behind card */}
      <div className="absolute inset-0 -z-10 blur-3xl opacity-60 bg-gradient-to-br from-[#00ff9d]/30 via-[#3a86ff]/20 to-transparent rounded-3xl scale-95" />

      <motion.div
        ref={cardRef}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="relative w-full aspect-[1.6/1] rounded-3xl overflow-hidden cursor-pointer select-none shadow-[0_25px_80px_-15px_rgba(0,255,157,0.35)]"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Obsidian base */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e1a] via-[#0f1626] to-[#050810]" />

        {/* Neon corner glows */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 0% 0%, rgba(0,255,157,0.35) 0%, transparent 45%), radial-gradient(circle at 100% 100%, rgba(58,134,255,0.30) 0%, transparent 50%), radial-gradient(circle at 100% 0%, rgba(131,56,236,0.18) 0%, transparent 60%)',
          }}
        />

        {/* Holographic conic gradient */}
        <motion.div
          className="absolute inset-0 mix-blend-screen opacity-70"
          style={{ background: holoBg as any }}
        />

        {/* Circuit-line pattern */}
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(0,255,157,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,157,0.5) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            transform: 'translateZ(15px)',
            maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
          }}
        />

        {/* Diagonal accent stripe (LANForge signature gradient) */}
        <div
          className="absolute -inset-1 opacity-40"
          style={{
            background:
              'linear-gradient(115deg, transparent 38%, rgba(0,255,157,0.25) 48%, rgba(58,134,255,0.25) 52%, transparent 62%)',
            transform: 'translateZ(5px)',
          }}
        />

        {/* Cursor-following glare */}
        <motion.div
          className="absolute inset-0 pointer-events-none mix-blend-screen"
          style={{ background: glareBg as any }}
        />

        {/* Sweep shine */}
        <motion.div
          className="absolute inset-y-0 -left-1/2 w-1/3 pointer-events-none"
          style={{
            background:
              'linear-gradient(115deg, transparent 30%, rgba(0,255,157,0.35) 50%, transparent 70%)',
            transform: 'translateZ(10px) skewX(-20deg)',
            mixBlendMode: 'screen',
          }}
          animate={{ x: ['0%', '450%'] }}
          transition={{ duration: 4.5, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut' }}
        />

        {/* Edge highlight */}
        <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/10 pointer-events-none" />
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(0,255,157,0.6), rgba(58,134,255,0.6), transparent)' }}
        />

        {/* Content */}
        <div className="relative h-full p-6 sm:p-8 flex flex-col justify-between text-white" style={{ transform: 'translateZ(40px)' }}>
          {/* Top row: Logo + Balance */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src="/logo-2.png"
                alt="LANForge"
                className="h-7 sm:h-9 w-auto drop-shadow-[0_0_12px_rgba(0,255,157,0.5)]"
                draggable={false}
              />
              <div className="h-7 sm:h-9 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-white/60 font-medium">
                Gift Card
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] sm:text-xs uppercase tracking-widest text-white/50">Balance</p>
              <AnimatedNumber
                value={data.balance}
                currency={data.currency}
                className="text-xl sm:text-3xl font-bold tabular-nums bg-gradient-to-r from-[#00ff9d] to-[#3a86ff] bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(0,255,157,0.3)]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Chip + progress */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative w-10 h-7 sm:w-12 sm:h-9 rounded-md overflow-hidden border border-white/20 shadow-inner">
                <div className="absolute inset-0 bg-gradient-to-br from-[#00ff9d] via-[#0a956b] to-[#3a86ff]" />
                <div className="absolute inset-0 opacity-50" style={{
                  backgroundImage:
                    'linear-gradient(90deg, rgba(0,0,0,0.3) 1px, transparent 1px), linear-gradient(rgba(0,0,0,0.3) 1px, transparent 1px)',
                  backgroundSize: '4px 4px',
                }} />
                <div className="absolute inset-y-0 left-1/2 w-px bg-black/40" />
                <div className="absolute inset-x-0 top-1/2 h-px bg-black/40" />
              </div>
              <div className="flex-1">
                <div className="h-[3px] bg-white/10 rounded-full mb-1.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentRemaining}%` }}
                    transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                    className="h-full bg-gradient-to-r from-[#00ff9d] to-[#3a86ff] shadow-[0_0_8px_rgba(0,255,157,0.6)]"
                  />
                </div>
                <p className="text-[10px] sm:text-xs text-white/60">
                  {percentRemaining.toFixed(0)}% remaining
                </p>
              </div>
            </div>

            {/* Code + Valid thru */}
            <div className="flex items-end justify-between gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCopy();
                }}
                className="group/code flex flex-col items-start text-left"
              >
                <p className="text-[10px] sm:text-xs uppercase tracking-widest text-white/50 mb-1">
                  Card Number
                </p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-base sm:text-2xl font-bold tracking-[0.15em] sm:tracking-[0.2em] text-white drop-shadow-[0_0_8px_rgba(0,255,157,0.4)]">
                    {data.code}
                  </p>
                  <span className="opacity-60 group-hover/code:opacity-100 transition-opacity text-[#00ff9d]">
                    {copied ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </span>
                </div>
              </button>
              <div className="text-right">
                <p className="text-[10px] sm:text-xs uppercase tracking-widest text-white/50">Valid Thru</p>
                <p className="font-mono text-xs sm:text-sm tabular-nums text-white/90">
                  {data.expiresAt
                    ? new Date(data.expiresAt).toLocaleDateString('en-US', { month: '2-digit', year: '2-digit' })
                    : '∞'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom neon line */}
        <div
          className="absolute inset-x-0 bottom-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(0,255,157,0.5), rgba(58,134,255,0.5), transparent)' }}
        />
      </motion.div>
    </div>
  );
};

const CodeEntry: React.FC<{ onSubmit: (code: string) => void; error?: string; loading: boolean }> = ({
  onSubmit,
  error,
  loading,
}) => {
  const [code, setCode] = useState('');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-lg mx-auto"
    >
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00ff9d] to-[#3a86ff] mb-6 shadow-[0_0_40px_rgba(0,255,157,0.45)]"
        >
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
          </svg>
        </motion.div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Check Gift Card Balance</h1>
        <p className="text-slate-400 mt-3 text-sm sm:text-base">
          Enter your gift card code to view balance, expiry, and details.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (code.trim()) onSubmit(code.trim());
        }}
        className="space-y-4"
      >
        <div className="relative">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="GC-XXXX-XXXX-XXXX"
            className="w-full bg-[#0f1218] border border-[#1f2233] focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all rounded-xl px-5 py-4 text-white font-mono text-lg tracking-wider placeholder:text-slate-600"
            autoFocus
            spellCheck={false}
            autoComplete="off"
          />
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="submit"
          disabled={!code.trim() || loading}
          className="w-full bg-gradient-to-r from-[#00ff9d] to-[#3a86ff] hover:brightness-110 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-black font-bold py-4 rounded-xl transition-all shadow-lg shadow-[#00ff9d]/25 hover:shadow-[#00ff9d]/40 disabled:shadow-none flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Checking...
            </>
          ) : (
            <>
              Check Balance
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </>
          )}
        </button>
      </form>

      <p className="text-center text-slate-500 text-xs mt-6">
        Don't have one yet? <a href="/contact" className="text-emerald-500 hover:text-emerald-400">Contact us</a> to purchase a gift card.
      </p>
    </motion.div>
  );
};

const GiftCardPage: React.FC = () => {
  const navigate = useNavigate();

  const [data, setData] = useState<GiftCardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Strip any accidental ?code= from the URL on mount so codes never get logged.
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const lookup = async (code: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/giftcards/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const json = await res.json();
      if (!res.ok || !json.valid) {
        setError(json.message || 'Gift card not found. Please check the code and try again.');
        setData(null);
        return;
      }
      setData(json);
    } catch (e: any) {
      setError('Unable to look up gift card. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  const reset = () => {
    setData(null);
    setError('');
  };

  const used = data ? Math.max(0, data.initialBalance - data.balance) : 0;
  const percentRemaining = data && data.initialBalance > 0 ? (data.balance / data.initialBalance) * 100 : 0;
  const isExpired = data?.expiresAt ? new Date() > new Date(data.expiresAt) : false;
  const isDepleted = data ? data.balance <= 0 : false;
  const daysUntilExpiry = data?.expiresAt
    ? Math.ceil((new Date(data.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="min-h-screen bg-gray-950">
      <SEO
        title="Gift Card Balance | LANForge"
        description="Check your LANForge gift card balance and details."
        url="https://lanforge.co/giftcard"
      />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <AnimatePresence mode="wait">
          {!data ? (
            <motion.div
              key="entry"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CodeEntry onSubmit={lookup} error={error} loading={loading} />
            </motion.div>
          ) : (
            <motion.div
              key="card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              {/* Top bar */}
              <div className="flex items-center justify-between">
                <button
                  onClick={reset}
                  className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Check another card
                </button>
                {data.recipientName && (
                  <p className="text-slate-500 text-sm hidden sm:block">
                    For <span className="text-white font-medium">{data.recipientName}</span>
                  </p>
                )}
              </div>

              <div className="grid lg:grid-cols-5 gap-8 items-start">
                {/* Left: Card */}
                <div className="lg:col-span-3">
                  <TiltGiftCard data={data} copied={copied} onCopy={copyCode} />

                  {/* Status badges below card */}
                  <div className="flex flex-wrap gap-2 mt-6 justify-center">
                    {isExpired && (
                      <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium"
                      >
                        Expired
                      </motion.span>
                    )}
                    {isDepleted && !isExpired && (
                      <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="px-3 py-1.5 rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-400 text-xs font-medium"
                      >
                        Fully redeemed
                      </motion.span>
                    )}
                    {!isExpired && !isDepleted && data.isActive && (
                      <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-1.5"
                      >
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        Active
                      </motion.span>
                    )}
                    {daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 30 && (
                      <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium"
                      >
                        Expires in {daysUntilExpiry} day{daysUntilExpiry === 1 ? '' : 's'}
                      </motion.span>
                    )}
                  </div>
                </div>

                {/* Right: Stats panel */}
                <div className="lg:col-span-2 space-y-4">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-[#0f1218] border border-[#1f2233] rounded-2xl p-6"
                  >
                    <p className="text-slate-500 text-xs uppercase tracking-widest mb-2">Available Balance</p>
                    <AnimatedNumber
                      value={data.balance}
                      currency={data.currency}
                      className="text-4xl font-bold text-white tabular-nums block"
                    />

                    {/* Linear progress */}
                    <div className="mt-6 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Used: {formatCurrency(used, data.currency)}</span>
                        <span className="text-slate-500">Total: {formatCurrency(data.initialBalance, data.currency)}</span>
                      </div>
                      <div className="h-2 bg-[#1f2233] rounded-full overflow-hidden relative">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentRemaining}%` }}
                          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 relative"
                        >
                          <div className="absolute inset-0 bg-white/20 animate-pulse" />
                        </motion.div>
                      </div>
                      <p className="text-emerald-400 text-xs font-medium">
                        {percentRemaining.toFixed(0)}% remaining
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="grid grid-cols-2 gap-3"
                  >
                    <div className="bg-[#0f1218] border border-[#1f2233] rounded-2xl p-4">
                      <p className="text-slate-500 text-[10px] uppercase tracking-widest">Issued</p>
                      <p className="text-white text-sm font-medium mt-1">
                        {data.createdAt ? new Date(data.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </p>
                    </div>
                    <div className="bg-[#0f1218] border border-[#1f2233] rounded-2xl p-4">
                      <p className="text-slate-500 text-[10px] uppercase tracking-widest">Expires</p>
                      <p className="text-white text-sm font-medium mt-1">
                        {data.expiresAt ? new Date(data.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never'}
                      </p>
                    </div>
                  </motion.div>

                  {data.message && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className="bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-2xl p-5 relative overflow-hidden"
                    >
                      <svg className="absolute top-3 right-3 w-5 h-5 text-emerald-500/30" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9.983 3v7.391c0 5.704-3.731 9.57-8.983 10.609l-.995-2.151c2.432-.917 3.995-3.638 3.995-5.849h-4v-10h9.983zm14.017 0v7.391c0 5.704-3.748 9.571-9 10.609l-.996-2.151c2.433-.917 3.996-3.638 3.996-5.849h-3.983v-10h9.983z" />
                      </svg>
                      <p className="text-emerald-400 text-[10px] uppercase tracking-widest mb-2">Personal Message</p>
                      <p className="text-white text-sm leading-relaxed italic">"{data.message}"</p>
                      {data.recipientName && (
                        <p className="text-slate-400 text-xs mt-3">— For {data.recipientName}</p>
                      )}
                    </motion.div>
                  )}

                  <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    onClick={() => navigate('/cart')}
                    disabled={isExpired || isDepleted || !data.isActive}
                    className="w-full bg-gradient-to-r from-[#00ff9d] to-[#3a86ff] hover:brightness-110 disabled:from-slate-800 disabled:to-slate-800 disabled:cursor-not-allowed disabled:text-slate-600 text-black font-bold py-4 rounded-xl transition-all shadow-lg shadow-[#00ff9d]/25 hover:shadow-[#00ff9d]/40 disabled:shadow-none flex items-center justify-center gap-2"
                  >
                    {isExpired ? 'Card Expired' : isDepleted ? 'No Balance Remaining' : (
                      <>
                        Shop & Apply Card
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </>
                    )}
                  </motion.button>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-center text-slate-500 text-xs"
                  >
                    Apply your gift card code at checkout to redeem.
                  </motion.p>
                </div>
              </div>

              {/* How to use */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mt-12 grid sm:grid-cols-3 gap-4"
              >
                {[
                  { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', title: 'Shop', desc: 'Add anything from our store to your cart.' },
                  { icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z', title: 'Checkout', desc: 'Enter your gift card code at checkout.' },
                  { icon: 'M5 13l4 4L19 7', title: 'Enjoy', desc: 'Your balance is applied automatically.' },
                ].map((step, i) => (
                  <div key={i} className="bg-[#0f1218]/60 border border-[#1f2233] rounded-xl p-5">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={step.icon} />
                      </svg>
                    </div>
                    <p className="text-white text-sm font-semibold">{step.title}</p>
                    <p className="text-slate-500 text-xs mt-1">{step.desc}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GiftCardPage;
