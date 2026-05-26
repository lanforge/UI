import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';

const AdminLayout: React.FC = () => {
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const quickActionsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (quickActionsRef.current && !quickActionsRef.current.contains(event.target as Node)) {
        setIsQuickActionsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const quickActions = [
    { label: 'Add Product', path: '/admin/products/add' },
    { label: 'Add Part', path: '/admin/parts/add' },
    { label: 'Create Order', path: '/admin/orders/add' },
  ];

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#07090e] text-slate-300 font-sans flex flex-col">
      {/* Admin Header */}
      <header className="bg-[#0a0c13]/80 backdrop-blur-xl border-b border-[#1f2233] px-6 py-3 shrink-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img 
              src="/logo-2.png" 
              alt="LANForge" 
              className="h-7 w-auto object-contain opacity-90"
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative" ref={quickActionsRef}>
              <button 
                onClick={() => setIsQuickActionsOpen(!isQuickActionsOpen)}
                className="px-3 py-1.5 text-xs font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-md transition-all flex items-center space-x-2 border border-emerald-500/20"
              >
                <span>Quick Actions</span>
                <svg className={`w-3.5 h-3.5 transition-transform ${isQuickActionsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isQuickActionsOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#11141d] rounded-xl shadow-xl shadow-black/50 border border-[#1f2233] py-1 z-50 animate-in fade-in slide-in-from-top-2">
                  {quickActions.map(action => (
                    <button
                      key={action.path}
                      onClick={() => {
                        navigate(action.path);
                        setIsQuickActionsOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-[#1f2233]/50 hover:text-white transition-colors"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="relative" ref={userMenuRef}>
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors text-sm"
              >
                <div className="w-7 h-7 bg-gradient-to-tr from-blue-500 to-emerald-400 text-white rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-[10px] font-medium">AD</span>
                </div>
                <span className="font-medium text-xs">Admin</span>
                <svg className={`w-3.5 h-3.5 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#11141d] rounded-xl shadow-xl shadow-black/50 border border-[#1f2233] py-1 z-50 animate-in fade-in slide-in-from-top-2">
                  <button
                    onClick={() => {
                      navigate('/admin/settings');
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-[#1f2233]/50 hover:text-white transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    </svg>
                    <span>Settings</span>
                  </button>
                  <div className="border-t border-[#1f2233] my-1"></div>
                  <button
                    onClick={() => {
                      localStorage.removeItem('token');
                      localStorage.removeItem('user');
                      navigate('/admin/login');
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 p-8 overflow-y-auto overflow-x-hidden scrollbar-hide bg-[#07090e]">
          <div className="max-w-[1600px] mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;