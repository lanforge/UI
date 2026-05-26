import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faEye, faCartPlus, faUsers } from '@fortawesome/free-solid-svg-icons';
import api from '../utils/api';

const AdminAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await api.get('/analytics');
        setData(response.data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) return <div>No data available</div>;

  const { stats, events, sessions } = data;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-medium text-white">Analytics Dashboard</h1>
        <button 
          onClick={() => window.location.reload()}
          className="btn btn-outline"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#111111] p-4 rounded-xl border border-[#1f2233] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <FontAwesomeIcon icon={faEye} className="text-4xl text-emerald-500" />
          </div>
          <div className="relative z-10">
            <p className="text-slate-400 text-sm font-medium mb-1">Total Page Views</p>
            <p className="text-xl font-medium text-white">{stats.pageViews}</p>
          </div>
        </div>

        <div className="bg-[#111111] p-4 rounded-xl border border-[#1f2233] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <FontAwesomeIcon icon={faCartPlus} className="text-4xl text-blue-500" />
          </div>
          <div className="relative z-10">
            <p className="text-slate-400 text-sm font-medium mb-1">Add to Carts</p>
            <p className="text-xl font-medium text-white">{stats.addCarts}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Popular Pages Component */}
        <div className="bg-[#111111] p-5 rounded-xl border border-[#1f2233]">
          <h2 className="text-lg font-medium text-white mb-3">Most Popular Pages</h2>
          <div className="space-y-2">
            {stats.popularPages && stats.popularPages.length > 0 ? (
              stats.popularPages.map((page: any, index: number) => (
                <div key={index} className="flex justify-between items-center border-b border-[#1f2233] pb-2 text-sm">
                  <span className="text-slate-300 truncate max-w-[70%]">{page._id}</span>
                  <span className="text-white font-medium">{page.views} views</span>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm">No page view data yet.</p>
            )}
          </div>
        </div>

        {/* Sessions Component */}
        <div className="bg-[#111111] p-5 rounded-xl border border-[#1f2233]">
          <h2 className="text-lg font-medium text-white mb-3">Recent Sessions</h2>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {sessions && sessions.length > 0 ? (
              sessions.slice(0, 30).map((session: any, index: number) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between bg-black/30 hover:bg-black/50 p-3 rounded-lg border border-[#1f2233] hover:border-emerald-500/30 transition-colors cursor-pointer group"
                  onClick={() => window.location.href = `/admin/analytics/session/${session._id}`}
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white truncate">Session: {session._id.substring(0, 8)}...</span>
                      <span className="text-xs bg-[#11141d] text-slate-300 px-1.5 py-0.5 rounded flex-shrink-0">
                        {session.events.length} events
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 truncate">
                      {new Date(session.startTime).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      {' - '}
                      {new Date(session.endTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Tiny preview of actions taken in session */}
                    <div className="flex -space-x-1">
                      {session.events.slice(-3).map((evt: any, i: number) => (
                        <div key={i} className={`w-3 h-3 rounded-full border border-[#111111] ${
                          evt.eventType === 'page_view' ? 'bg-blue-500' :
                          evt.eventType === 'add_to_cart' ? 'bg-emerald-500' : 'bg-gray-500'
                        }`} title={evt.eventType} />
                      ))}
                    </div>
                    <FontAwesomeIcon icon={faEye} className="text-slate-600 group-hover:text-emerald-400 transition-colors" />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm">No sessions recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
