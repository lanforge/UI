import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';

interface TradeInData {
  _id: string;
  tradeCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  components: {
    cpu?: string;
    gpu?: string;
    ram?: string;
    storage?: string;
    motherboard?: string;
    psu?: string;
    case?: string;
    cooler?: string;
    other?: string;
  };
  tradeInValue?: number;
  status: 'pending' | 'evaluated' | 'accepted' | 'declined' | 'completed';
  notes?: string;
  scannerReport?: {
    reportMetadata?: {
      reportId?: string;
      generatedAt?: string;
      customerInputCode?: string;
      version?: string;
    };
    system?: {
      manufacturer?: string;
      model?: string;
      computerName?: string;
      systemType?: string;
    };
    windows?: {
      caption?: string;
      version?: string;
      buildNumber?: string;
      architecture?: string;
    };
    motherboard?: { manufacturer?: string; product?: string };
    bios?: { manufacturer?: string; version?: string; releaseDate?: string };
    cpu?: Array<{
      name?: string;
      cores?: number;
      logicalProcessors?: number;
      maxClockMHz?: number;
    }>;
    gpu?: Array<{
      name?: string;
      vramGuessGB?: string | number;
      driverVersion?: string;
    }>;
    ram?: {
      totalGB?: number;
      dimmCount?: number;
      memoryTypes?: string[];
      primaryMemoryType?: string;
      moduleLayout?: string;
      ratedSpeedMHz?: number | string;
      configuredSpeedMHz?: number | string;
      modules?: Array<{
        manufacturer?: string;
        partNumber?: string;
        serialNumber?: string;
        capacityGB?: number;
        speedMHz?: number;
        configuredMHz?: number;
        memoryType?: string;
        smbiosMemoryType?: number;
        formFactor?: number;
        slot?: string;
        bank?: string;
      }>;
    };
    storage?: {
      internalStorageTotalGB?: number;
      diskCount?: number;
      internalDiskCount?: number;
      physicalDisks?: Array<{
        model?: string;
        manufacturer?: string;
        serialNumber?: string;
        interfaceType?: string;
        mediaType?: string;
        sizeGB?: number;
        sizeTB?: number;
        status?: string;
        firmware?: string;
        isUSB?: boolean;
        isRemovable?: boolean;
        pnpDeviceId?: string;
      }>;
    };
    warnings?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

const SESSION_KEY = 'lf_tradein';
const SESSION_TTL = 48 * 60 * 60 * 1000; // 48 hours

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (Date.now() > s.expiresAt) { localStorage.removeItem(SESSION_KEY); return null; }
    return s;
  } catch { return null; }
}

function saveSession(data: object) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify({ ...data, expiresAt: Date.now() + SESSION_TTL })); } catch {}
}

function clearSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch {}
}

const TradeInPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialCode = searchParams.get('code') || '';

  const [step, setStep] = useState<'contact' | 'code' | 'result'>(() => {
    if (initialCode) return 'code';
    return loadSession()?.step || 'contact';
  });
  const [tradeCode, setTradeCode] = useState(() => initialCode || loadSession()?.tradeCode || '');
  const [tradeInData, setTradeInData] = useState<TradeInData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [sessionRestored, setSessionRestored] = useState(() => !initialCode && !!(loadSession()?.tradeCode));

  // Contact form
  const [name, setName] = useState(() => loadSession()?.name || '');
  const [email, setEmail] = useState(() => loadSession()?.email || '');
  const [phone, setPhone] = useState(() => loadSession()?.phone || '');
  const [existingFound, setExistingFound] = useState<{ tradeCode: string; status: string; customerName: string; createdAt: string } | null>(null);

  const refreshInterval = useRef<NodeJS.Timeout | null>(null);

  // Generate a new trade code
  const generateTradeCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'TRADE-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Create a brand-new trade-in
  const createNewTradeIn = async () => {
    const code = generateTradeCode();
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    const endpoint = `${apiUrl}/trade-ins`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tradeCode: code,
        customerName: name.trim(),
        customerEmail: email.trim(),
        customerPhone: phone.trim() || undefined,
      }),
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to create trade-in');
    }
    setTradeCode(code);
    setStep('code');
  };

  // Handle contact form submission
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Name and email are required.');
      return;
    }
    setError(null);
    setExistingFound(null);
    setLoading(true);
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const lookupRes = await fetch(`${apiUrl}/trade-ins/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (lookupRes.ok) {
        const lookupData = await lookupRes.json();
        if (lookupData.found) {
          setExistingFound(lookupData.tradeIn);
          setLoading(false);
          return;
        }
      }
      await createNewTradeIn();
    } catch (err: any) {
      setError(err.message || 'Failed to create trade-in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Continue an existing trade-in
  const handleContinueExisting = () => {
    if (!existingFound) return;
    setTradeCode(existingFound.tradeCode);
    setExistingFound(null);
    setStep(existingFound.status === 'pending' ? 'code' : 'result');
    setSessionRestored(false);
  };

  // Dismiss prompt and start a new trade-in
  const handleStartNew = async () => {
    setExistingFound(null);
    setError(null);
    setLoading(true);
    try {
      await createNewTradeIn();
    } catch (err: any) {
      setError(err.message || 'Failed to create trade-in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch trade-in data
  const fetchTradeIn = async (code: string, isRefresh = false) => {
    if (!code) return;
    if (!isRefresh) setLoading(true);

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const endpoint = apiUrl.endsWith('/trade-ins') || apiUrl.endsWith('/trade-ins/')
        ? `${apiUrl}/${code}`
        : `${apiUrl}/trade-ins/${code}`;
      const response = await fetch(endpoint);

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched trade-in data:', data);
          setTradeInData(data);
          // Pre-fill extra components from existing data
          if (data.components) {
            setExtraComponents(prev => ({
              psu: data.components.psu || prev.psu,
              case: data.components.case || prev.case,
              cooler: data.components.cooler || prev.cooler,
              other: data.components.other || prev.other,
            }));
          }
          if (data.components && Object.values(data.components).some(v => v)) {
            setStep('result');
          }
          return data;
      } else if (response.status === 404 && !isRefresh) {
        setError('Trade-in not found. Please check your code.');
      }
    } catch (err) {
      if (!isRefresh) setError('An error occurred while fetching trade-in data.');
    } finally {
      if (!isRefresh) setLoading(false);
    }
  };

  // Copy code to clipboard
  const copyCode = () => {
    if (tradeCode) {
      navigator.clipboard.writeText(tradeCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Auto-refresh when waiting for scanner data
  useEffect(() => {
    if (step === 'code' && tradeCode) {
      if (refreshInterval.current) clearInterval(refreshInterval.current);

      refreshInterval.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            fetchTradeIn(tradeCode, true);
            return 10;
          }
          return prev - 1;
        });
      }, 1000);

      // Also do an immediate fetch
      fetchTradeIn(tradeCode, true);
    }

    if (step === 'result' && tradeCode) {
      if (refreshInterval.current) clearInterval(refreshInterval.current);

      // Fetch immediately on restore (tradeInData is null after a page refresh)
      if (!tradeInData) {
        fetchTradeIn(tradeCode, false);
      }

      refreshInterval.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            fetchTradeIn(tradeCode, true);
            return 10;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
        refreshInterval.current = null;
      }
    };
  }, [step, tradeCode]);

  // Manual component editing state
  const [extraComponents, setExtraComponents] = useState(() => {
    const s = loadSession();
    return { psu: s?.extraComponents?.psu || '', case: s?.extraComponents?.case || '', cooler: s?.extraComponents?.cooler || '', other: s?.extraComponents?.other || '' };
  });
  const [componentSaveLoading, setComponentSaveLoading] = useState(false);
  const [componentSaveSuccess, setComponentSaveSuccess] = useState(false);

  // Persist session to localStorage whenever key state changes
  useEffect(() => {
    if (tradeCode) {
      saveSession({ step, tradeCode, name, email, phone, extraComponents });
    }
  }, [step, tradeCode, name, email, phone, extraComponents]);

  // Safely extract a display string from deeply nested WMI data
  const safeString = (val: any): string => {
    if (val === null || val === undefined) return '';
    // Already a primitive
    if (typeof val !== 'object') return String(val);
    
    // Array: dig into first element that has useful data
    if (Array.isArray(val)) {
      for (const item of val) {
        const result = safeString(item);
        if (result) return result;
      }
      return '';
    }
    
    // Object: try common keys in priority order
    const keys = ['name', 'product', 'manufacturer', 'caption', 'description', 'model'];
    for (const key of keys) {
      if (val[key]) {
        const result = safeString(val[key]);
        if (result) return result;
      }
    }
    
    // Last resort: join all primitive values
    const parts = Object.values(val).filter(v => typeof v !== 'object' && v !== null && v !== undefined);
    return parts.join(' ').trim() || '';
  };

  // Handle saving manual component fields
  const handleSaveComponents = async () => {
    setComponentSaveLoading(true);
    setComponentSaveSuccess(false);
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const endpoint = apiUrl.endsWith('/trade-ins') || apiUrl.endsWith('/trade-ins/')
        ? apiUrl
        : `${apiUrl}/trade-ins`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tradeCode,
          components: {
            psu: extraComponents.psu.trim(),
            case: extraComponents.case.trim(),
            cooler: extraComponents.cooler.trim(),
            other: extraComponents.other.trim(),
          },
        }),
      });
      if (!response.ok) throw new Error('Failed to save');
      const data = await response.json();
      setTradeInData(prev => ({ ...prev, ...(data.tradeIn || {}), scannerReport: data.tradeIn?.scannerReport ?? prev?.scannerReport }));
      setComponentSaveSuccess(true);
      setTimeout(() => setComponentSaveSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save components. Please try again.');
    } finally {
      setComponentSaveLoading(false);
    }
  };

  // Status badge colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'evaluated': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'accepted': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'declined': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'completed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-cyan-500/30">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10" />
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-cyan-600/10 blur-[150px]" />
      </div>

      <div className="relative z-10 pt-24 pb-16 px-6">
        <div className="container-narrow max-w-3xl mx-auto">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                Trade-In
              </span>
              {' '}Your PC
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Trade in your PC for credit toward your next build. Start by entering your contact info, then run our scanner to auto-detect your components.
            </p>
          </motion.div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className={`flex items-center gap-2 ${step === 'contact' ? 'text-cyan-400' : 'text-green-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${step === 'contact' ? 'border-cyan-400 bg-cyan-400/10' : 'border-green-400 bg-green-400/10'}`}>
                {step === 'contact' ? '1' : '✓'}
              </div>
              <span className="text-sm font-medium uppercase tracking-wider">Info</span>
            </div>
            <div className={`w-12 h-[1px] ${step === 'code' ? 'bg-cyan-500' : step === 'result' ? 'bg-green-500' : 'bg-gray-700'}`} />
            <div className={`flex items-center gap-2 ${step === 'code' ? 'text-cyan-400' : step === 'result' ? 'text-green-400' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${step === 'code' ? 'border-cyan-400 bg-cyan-400/10' : step === 'result' ? 'border-green-400 bg-green-400/10' : 'border-gray-700'}`}>
                {step === 'result' ? '✓' : '2'}
              </div>
              <span className="text-sm font-medium uppercase tracking-wider">Scan</span>
            </div>
            <div className={`w-12 h-[1px] ${step === 'result' ? 'bg-cyan-500' : 'bg-gray-700'}`} />
            <div className={`flex items-center gap-2 ${step === 'result' ? 'text-cyan-400' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${step === 'result' ? 'border-cyan-400 bg-cyan-400/10' : 'border-gray-700'}`}>
                3
              </div>
              <span className="text-sm font-medium uppercase tracking-wider">Value</span>
            </div>
          </div>

          {/* Main Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-[#0a0a0a] border border-gray-800 rounded-none p-8 mb-8"
          >
            {/* Session restored banner */}
            {sessionRestored && (
              <div className="flex items-center justify-between bg-cyan-500/5 border border-cyan-500/20 px-3 py-2 mb-6 text-xs">
                <span className="text-cyan-400">Session restored &mdash; expires in 48h</span>
                <button
                  onClick={() => {
                    clearSession();
                    setStep('contact');
                    setTradeInData(null);
                    setName('');
                    setEmail('');
                    setPhone('');
                    setTradeCode('');
                    setSessionRestored(false);
                    setExtraComponents({ psu: '', case: '', cooler: '', other: '' });
                  }}
                  className="text-gray-500 hover:text-white transition-colors ml-4 uppercase tracking-wider"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Step 1: Contact Info */}
            {step === 'contact' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-2 text-center">Enter Your Information</h2>
                <p className="text-gray-400 text-sm text-center mb-8">We'll need this before generating your trade-in code</p>

                <form onSubmit={handleContactSubmit} className="max-w-md mx-auto space-y-5">
                  <div>
                    <label className="block text-sm text-gray-400 uppercase tracking-wider mb-2">Full Name *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#111] border border-gray-700 px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 uppercase tracking-wider mb-2">Email Address *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#111] border border-gray-700 px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 uppercase tracking-wider mb-2">Phone Number (optional)</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-[#111] border border-gray-700 px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 p-3 text-center">
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  )}

                  {/* Existing trade-in found prompt */}
                  {existingFound && (
                    <div className="bg-cyan-500/5 border border-cyan-500/30 p-4">
                      <p className="text-cyan-400 text-sm font-bold uppercase tracking-wider mb-1">Existing Trade-In Found</p>
                      <p className="text-gray-300 text-sm mb-1">
                        <span className="font-mono text-cyan-400">{existingFound.tradeCode}</span>
                        <span className="text-gray-500"> · {existingFound.status} · {new Date(existingFound.createdAt).toLocaleDateString()}</span>
                      </p>
                      <p className="text-gray-400 text-xs mb-4">Would you like to continue this trade-in or start a new one?</p>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={handleContinueExisting}
                          className="flex-1 py-2.5 bg-cyan-500 text-black font-bold uppercase tracking-widest text-sm hover:bg-white transition-colors"
                        >
                          Continue
                        </button>
                        <button
                          type="button"
                          onClick={handleStartNew}
                          disabled={loading}
                          className="flex-1 py-2.5 border border-gray-600 text-gray-300 font-bold uppercase tracking-widest text-sm hover:border-white hover:text-white transition-colors disabled:opacity-50"
                        >
                          Start New
                        </button>
                      </div>
                    </div>
                  )}

                  {!existingFound && (
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 bg-cyan-500 text-black font-bold uppercase tracking-widest hover:bg-white transition-colors duration-300 text-lg disabled:opacity-50"
                    >
                      {loading ? 'Checking...' : 'Generate My Code'}
                    </button>
                  )}
                </form>
              </div>
            )}

            {/* Step 2: Code + Download */}
            {step === 'code' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-2 text-center">Your Trade-In Code</h2>
                <p className="text-gray-400 text-sm text-center mb-8">
                  Download the scanner and enter this code to auto-detect your components
                </p>

                {/* Code Display */}
                <div className="bg-[#111] border border-gray-800 p-6 mb-8">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 text-center">
                      <p className="text-sm text-gray-500 uppercase tracking-wider mb-2">Trade Code</p>
                      <p className="text-4xl font-mono font-bold text-cyan-400 tracking-wider">{tradeCode}</p>
                    </div>
                    <button
                      onClick={copyCode}
                      className="ml-4 px-4 py-2 border border-gray-700 text-gray-400 hover:text-white hover:border-white transition-colors duration-300"
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* Download + Waiting */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                  <a
                    href="/LANForge-Trade-In.ps1"
                    download
                    className="px-8 py-4 bg-cyan-500 text-black font-bold uppercase tracking-widest hover:bg-white transition-all duration-300 text-center text-lg"
                  >
                    Download Scanner
                  </a>
                </div>

                {/* Waiting indicator */}
                <div className="bg-[#111] border border-gray-800 p-6 text-center">
                  <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-300 font-medium mb-1">Waiting for Scanner Data...</p>
                  <p className="text-gray-500 text-sm mb-3">
                    Run the scanner, enter code <span className="text-cyan-400 font-mono font-bold">{tradeCode}</span>, and click submit. Auto-refreshes every 10 seconds.
                  </p>
                  <p className="text-gray-500 text-xs">Checking again in {countdown}s</p>
                  <button
                    onClick={() => {
                      setCountdown(10);
                      fetchTradeIn(tradeCode, true);
                    }}
                    className="mt-3 px-4 py-2 border border-gray-700 text-xs text-gray-400 hover:text-white hover:border-white transition-colors"
                  >
                    Refresh Now
                  </button>
                </div>

                {/* Info */}
                <div className="mt-6 bg-cyan-500/5 border border-cyan-500/20 p-4">
                  <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-2">How to use the scanner:</h4>
                  <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
                    <li>Download and run the PowerShell scanner (right-click → Run with PowerShell)</li>
                    <li>Enter trade code <span className="text-cyan-400 font-mono">{tradeCode}</span> in the "Trade / Order Code" field</li>
                    <li>Fill in the same name (<span className="text-cyan-400">{name}</span>) and email (<span className="text-cyan-400">{email}</span>)</li>
                    <li>Click "Scan + Create Reports" then "Submit to API"</li>
                    <li>This page will auto-detect your submission!</li>
                  </ol>
                </div>
              </div>
            )}

            {/* Step 3: Results */}
            {step === 'result' && tradeInData && (
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Your Trade-In</h2>
                    <p className="text-gray-400 text-sm">
                      {tradeInData.customerName} &middot; Submitted {new Date(tradeInData.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-gray-400">{countdown}s</span>
                    <button
                      onClick={() => {
                        setCountdown(10);
                        fetchTradeIn(tradeCode, true);
                      }}
                      className="ml-2 px-3 py-1 border border-gray-700 text-xs text-gray-400 hover:text-white hover:border-white transition-colors"
                    >
                      Refresh
                    </button>
                  </div>
                </div>

                {/* Trade Code */}
                <div className="bg-[#111] border border-gray-800 p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Trade Code</p>
                      <p className="text-2xl font-mono font-bold text-cyan-400">{tradeInData.tradeCode}</p>
                    </div>
                    <button
                      onClick={copyCode}
                      className="px-3 py-1.5 border border-gray-700 text-xs text-gray-400 hover:text-white hover:border-white transition-colors"
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mb-6 text-center">
                  <span className={`inline-block px-5 py-2 border font-bold uppercase tracking-wider ${getStatusColor(tradeInData.status)}`}>
                    {tradeInData.status}
                  </span>
                </div>

                {/* Value */}
                {tradeInData.tradeInValue !== undefined && (
                  <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-500/30 p-6 mb-6 text-center">
                    <p className="text-sm text-cyan-400 uppercase tracking-wider mb-1">Estimated Value</p>
                    <p className="text-5xl font-black text-white">${tradeInData.tradeInValue.toFixed(2)}</p>
                  </div>
                )}

                {/* System Report */}
                {(tradeInData.scannerReport) && (
                  <div className="border-t border-gray-800 pt-6 mt-2">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">System Report</h3>

                    {/* Warnings — shown first */}
                    {(() => {
                      const warnings = tradeInData.scannerReport!.warnings;
                      if (!warnings || warnings.length === 0) return null;
                      return (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 px-3 py-2.5 mb-3">
                          <p className="text-xs font-bold text-yellow-400 uppercase tracking-wider mb-1">Scanner Warnings</p>
                          {warnings.map((w, i) => (
                            <p key={i} className="text-xs text-yellow-300/80 leading-snug">⚠ {safeString(w)}</p>
                          ))}
                        </div>
                      );
                    })()}

                    <div className="bg-[#111] border border-gray-800 divide-y divide-gray-800/60">

                      {/* Overview row */}
                      {(tradeInData.scannerReport.system?.computerName || tradeInData.scannerReport.system?.manufacturer || tradeInData.scannerReport.windows?.caption) && (
                        <div className="flex items-baseline gap-2 px-3 py-2">
                          <span className="text-xs text-gray-500 uppercase tracking-wider w-20 shrink-0">System</span>
                          <span className="text-xs text-gray-300 leading-snug">
                            {[
                              tradeInData.scannerReport.system?.computerName,
                              tradeInData.scannerReport.system?.manufacturer && `${tradeInData.scannerReport.system.manufacturer}${tradeInData.scannerReport.system.model ? ` ${tradeInData.scannerReport.system.model}` : ''}`,
                              tradeInData.scannerReport.windows?.caption,
                            ].filter(Boolean).join(' · ')}
                          </span>
                        </div>
                      )}

                      {/* CPU row */}
                      {(() => {
                        const cpu = tradeInData.scannerReport!.cpu;
                        if (!cpu) return null;
                        const c0 = Array.isArray(cpu) ? cpu[0] : (cpu as any);
                        if (!c0) return null;
                        const name = safeString(c0.name || c0);
                        if (!name) return null;
                        const details = [
                          c0.cores !== undefined && `${Number(c0.cores)}C/${c0.logicalProcessors ?? '?'}T`,
                          c0.maxClockMHz !== undefined && `${Number(c0.maxClockMHz)} MHz`,
                        ].filter(Boolean).join(' · ');
                        return (
                          <div className="flex items-baseline gap-2 px-3 py-2">
                            <span className="text-xs text-gray-500 uppercase tracking-wider w-20 shrink-0">CPU</span>
                            <span className="text-xs text-gray-300 leading-snug">{name}{details ? <span className="text-gray-500"> · {details}</span> : ''}</span>
                          </div>
                        );
                      })()}

                      {/* GPU rows */}
                      {(() => {
                        const gpuList = tradeInData.scannerReport!.gpu;
                        if (!gpuList || gpuList.length === 0) return null;
                        return gpuList.map((g, i) => {
                          const name = g.name ? safeString(g.name) : '';
                          if (!name) return null;
                          const details = g.vramGuessGB !== undefined ? `${safeString(g.vramGuessGB)} GB VRAM` : '';
                          return (
                            <div key={i} className="flex items-baseline gap-2 px-3 py-2">
                              <span className="text-xs text-gray-500 uppercase tracking-wider w-20 shrink-0">{i === 0 ? 'GPU' : ''}</span>
                              <span className="text-xs text-gray-300 leading-snug">{name}{details ? <span className="text-gray-500"> · {details}</span> : ''}</span>
                            </div>
                          );
                        });
                      })()}

                      {/* RAM row */}
                      {(() => {
                        const ramData = tradeInData.scannerReport!.ram;
                        const rawRamText = tradeInData.components?.ram;
                        if (!ramData && !rawRamText) return null;
                        const summary = [
                          ramData?.totalGB && `${safeString(ramData.totalGB)} GB`,
                          ramData?.primaryMemoryType || (ramData?.memoryTypes?.[0]),
                          ramData?.configuredSpeedMHz && `${safeString(ramData.configuredSpeedMHz)} MHz`,
                          ramData?.dimmCount && `${ramData.dimmCount}x DIMM`,
                        ].filter(Boolean).join(' · ') || rawRamText || '';
                        const modules = ramData?.modules?.filter(m => m.partNumber || m.manufacturer) || [];
                        return (
                          <div className="px-3 py-2">
                            <div className="flex items-baseline gap-2">
                              <span className="text-xs text-gray-500 uppercase tracking-wider w-20 shrink-0">RAM</span>
                              <span className="text-xs text-gray-300 leading-snug">{summary}</span>
                            </div>
                            {modules.length > 0 && (
                              <div className="mt-1 ml-[5.5rem] space-y-0.5">
                                {modules.map((m, i) => (
                                  <p key={i} className="text-xs text-gray-500 leading-snug font-mono">
                                    {[m.manufacturer, m.partNumber, m.capacityGB && `${m.capacityGB} GB`, m.slot && `[${m.slot}]`].filter(Boolean).join(' ')}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Storage rows */}
                      {(() => {
                        const storageData = tradeInData.scannerReport!.storage;
                        const rawStorageText = tradeInData.components?.storage;
                        if (!storageData && !rawStorageText) return null;
                        const disks = storageData?.physicalDisks?.filter(d => !d.isUSB && !d.isRemovable) || [];
                        if (disks.length === 0 && rawStorageText) {
                          return (
                            <div className="flex items-baseline gap-2 px-3 py-2">
                              <span className="text-xs text-gray-500 uppercase tracking-wider w-20 shrink-0">Storage</span>
                              <span className="text-xs text-gray-300 leading-snug">{rawStorageText}</span>
                            </div>
                          );
                        }
                        return disks.map((d, i) => {
                          const size = d.sizeGB !== undefined ? (d.sizeGB >= 1000 ? `${(d.sizeGB / 1000).toFixed(1)} TB` : `${Math.round(d.sizeGB)} GB`) : '';
                          const detail = [size, d.mediaType, d.interfaceType].filter(Boolean).join(' · ');
                          return (
                            <div key={i} className="flex items-baseline gap-2 px-3 py-2">
                              <span className="text-xs text-gray-500 uppercase tracking-wider w-20 shrink-0">{i === 0 ? 'Storage' : ''}</span>
                              <span className="text-xs text-gray-300 leading-snug">
                                {d.model ? safeString(d.model) : ''}
                                {detail ? <span className="text-gray-500"> · {detail}</span> : ''}
                              </span>
                            </div>
                          );
                        });
                      })()}

                      {/* Motherboard row */}
                      {(() => {
                        const mb = tradeInData.scannerReport!.motherboard;
                        if (!mb) return null;
                        const mbText = [safeString(mb.manufacturer || ''), safeString(mb.product || '')].filter(Boolean).join(' ');
                        if (!mbText.trim()) return null;
                        return (
                          <div className="flex items-baseline gap-2 px-3 py-2">
                            <span className="text-xs text-gray-500 uppercase tracking-wider w-20 shrink-0">Mobo</span>
                            <span className="text-xs text-gray-300 leading-snug">{mbText}</span>
                          </div>
                        );
                      })()}

                      {/* BIOS row */}
                      {tradeInData.scannerReport.bios?.version && (
                        <div className="flex items-baseline gap-2 px-3 py-2">
                          <span className="text-xs text-gray-500 uppercase tracking-wider w-20 shrink-0">BIOS</span>
                          <span className="text-xs text-gray-500 leading-snug font-mono">
                            {tradeInData.scannerReport.bios.manufacturer ? `${String(tradeInData.scannerReport.bios.manufacturer)} ` : ''}v{String(tradeInData.scannerReport.bios.version)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {tradeInData.notes && (
                  <div className="bg-[#111] border border-gray-800 p-4 mt-6">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Notes from LANForge</h4>
                    <p className="text-sm text-gray-300">{tradeInData.notes}</p>
                  </div>
                )}

                {/* Missing Parts - Manual Input */}
                <div className="border-t border-gray-800 pt-6 mt-6">
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider text-center mb-1">Missing Parts</h3>
                  <p className="text-gray-500 text-xs text-center mb-6">Add components the scanner couldn't detect</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Power Supply</label>
                      <input
                        type="text"
                        value={extraComponents.psu}
                        onChange={(e) => setExtraComponents(prev => ({ ...prev, psu: e.target.value }))}
                        placeholder="e.g. Corsair RM850x"
                        className="w-full bg-[#111] border border-gray-700 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Case</label>
                      <input
                        type="text"
                        value={extraComponents.case}
                        onChange={(e) => setExtraComponents(prev => ({ ...prev, case: e.target.value }))}
                        placeholder="e.g. NZXT H7 Flow"
                        className="w-full bg-[#111] border border-gray-700 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">CPU Cooler</label>
                      <input
                        type="text"
                        value={extraComponents.cooler}
                        onChange={(e) => setExtraComponents(prev => ({ ...prev, cooler: e.target.value }))}
                        placeholder="e.g. Noctua NH-D15"
                        className="w-full bg-[#111] border border-gray-700 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Other / Notes</label>
                      <input
                        type="text"
                        value={extraComponents.other}
                        onChange={(e) => setExtraComponents(prev => ({ ...prev, other: e.target.value }))}
                        placeholder="e.g. Custom cables, fans..."
                        className="w-full bg-[#111] border border-gray-700 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-center mt-4">
                    <button
                      onClick={handleSaveComponents}
                      disabled={componentSaveLoading}
                      className="px-6 py-3 bg-cyan-500 text-black font-bold uppercase tracking-widest text-sm hover:bg-white transition-colors disabled:opacity-50"
                    >
                      {componentSaveLoading ? 'Saving...' : componentSaveSuccess ? '✓ Saved' : 'Save Parts'}
                    </button>
                  </div>
                </div>

                {/* Reset */}
                <div className="text-center mt-6">
                  <button
                    onClick={() => {
                      clearSession();
                      setStep('contact');
                      setTradeInData(null);
                      setName('');
                      setEmail('');
                      setPhone('');
                      setTradeCode('');
                      setSessionRestored(false);
                      setExtraComponents({ psu: '', case: '', cooler: '', other: '' });
                    }}
                    className="text-gray-500 hover:text-white text-sm uppercase tracking-wider transition-colors"
                  >
                    Start a New Trade-In
                  </button>
                </div>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default TradeInPage;