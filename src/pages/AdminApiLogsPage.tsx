import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';

interface ApiLog {
  _id: string;
  method: string;
  path: string;
  fullUrl: string;
  statusCode: number;
  ipAddress: string;
  origin: string;
  referer: string;
  userAgent: string;
  source: 'internal' | 'external';
  responseTime: number;
  createdAt: string;
}

interface Stats {
  totalLast24h: number;
  totalLast7d: number;
  statusBreakdown: { _id: number; count: number }[];
  sourceBreakdown: { _id: string; count: number }[];
  topIps: { _id: string; count: number }[];
  topPaths: { _id: { path: string; method: string }; count: number }[];
  avgResponseTime: number;
  errorCount: number;
}

const AdminApiLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterSource, setFilterSource] = useState('all');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [filterPath, setFilterPath] = useState('');
  const [filterIp, setFilterIp] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '50');
      if (filterSource !== 'all') params.set('source', filterSource);
      if (filterStatus) params.set('statusCode', filterStatus);
      if (filterMethod) params.set('method', filterMethod);
      if (filterPath) params.set('path', filterPath);
      if (filterIp) params.set('ip', filterIp);

      const response = await api.get(`/admin/api-logs?${params.toString()}`);
      setLogs(response.data.logs);
      setTotal(response.data.total);
      setTotalPages(response.data.pages);
    } catch (error) {
      console.error('Error fetching API logs:', error);
    }
  }, [page, filterSource, filterStatus, filterMethod, filterPath, filterIp]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/admin/api-logs/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching API log stats:', error);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchLogs(), fetchStats()]);
      setLoading(false);
    };
    load();
  }, [fetchLogs, fetchStats]);

  const getStatusColor = (code: number) => {
    if (code >= 200 && code < 300) return 'text-emerald-400 bg-emerald-500/10';
    if (code >= 300 && code < 400) return 'text-blue-400 bg-blue-500/10';
    if (code >= 400 && code < 500) return 'text-amber-400 bg-amber-500/10';
    if (code >= 500) return 'text-red-400 bg-red-500/10';
    return 'text-slate-400 bg-slate-500/10';
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'text-emerald-400';
      case 'POST': return 'text-blue-400';
      case 'PUT': return 'text-amber-400';
      case 'PATCH': return 'text-purple-400';
      case 'DELETE': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getSourceLabel = (source: string) => {
    return source === 'internal' ? 'Internal (Port 5001)' : 'External';
  };

  const getSourceBadgeColor = (source: string) => {
    return source === 'internal'
      ? 'bg-purple-500/10 text-purple-400'
      : 'bg-cyan-500/10 text-cyan-400';
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-medium text-white">API Logs</h1>
          <p className="text-sm text-slate-400 mt-1">
            Track all incoming API requests, origins, IPs, and status codes
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-3 py-1.5 text-sm rounded-lg border border-[#1f2233] text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          <button
            onClick={() => { setPage(1); fetchLogs(); fetchStats(); }}
            className="px-3 py-1.5 text-sm rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-[#0a0c13] border border-[#1f2233] rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Last 24h</p>
            <p className="text-2xl font-bold text-white mt-1">{stats.totalLast24h.toLocaleString()}</p>
          </div>
          <div className="bg-[#0a0c13] border border-[#1f2233] rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Last 7 Days</p>
            <p className="text-2xl font-bold text-white mt-1">{stats.totalLast7d.toLocaleString()}</p>
          </div>
          <div className="bg-[#0a0c13] border border-[#1f2233] rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Errors (4xx/5xx)</p>
            <p className="text-2xl font-bold text-red-400 mt-1">{stats.errorCount.toLocaleString()}</p>
          </div>
          <div className="bg-[#0a0c13] border border-[#1f2233] rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Avg Response</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{formatTime(Math.round(stats.avgResponseTime))}</p>
          </div>
          <div className="bg-[#0a0c13] border border-[#1f2233] rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Internal</p>
            <p className="text-2xl font-bold text-purple-400 mt-1">
              {stats.sourceBreakdown.find(s => s._id === 'internal')?.count.toLocaleString() || '0'}
            </p>
          </div>
          <div className="bg-[#0a0c13] border border-[#1f2233] rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider">External</p>
            <p className="text-2xl font-bold text-cyan-400 mt-1">
              {stats.sourceBreakdown.find(s => s._id === 'external')?.count.toLocaleString() || '0'}
            </p>
          </div>
        </div>
      )}

      {/* Status Breakdown */}
      {stats && stats.statusBreakdown.length > 0 && (
        <div className="bg-[#0a0c13] border border-[#1f2233] rounded-xl p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Status Code Breakdown (7 days)</h3>
          <div className="flex flex-wrap gap-2">
            {stats.statusBreakdown.map((s) => (
              <span
                key={s._id}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium ${getStatusColor(s._id)}`}
              >
                {s._id}: {s.count.toLocaleString()}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Top IPs */}
      {stats && stats.topIps.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-[#0a0c13] border border-[#1f2233] rounded-xl p-4">
            <h3 className="text-sm font-medium text-slate-300 mb-3">Top IP Addresses (7 days)</h3>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {stats.topIps.map((ip, i) => (
                <div key={ip._id} className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">
                    <span className="text-slate-600 mr-2">#{i + 1}</span>
                    {ip._id}
                  </span>
                  <span className="text-slate-300 font-medium">{ip.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#0a0c13] border border-[#1f2233] rounded-xl p-4">
            <h3 className="text-sm font-medium text-slate-300 mb-3">Top Endpoints (7 days)</h3>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {stats.topPaths.map((p, i) => (
                <div key={i} className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 truncate max-w-[70%]">
                    <span className="text-slate-600 mr-2">#{i + 1}</span>
                    <span className={getMethodColor(p._id.method)}>{p._id.method}</span>
                    {' '}{p._id.path}
                  </span>
                  <span className="text-slate-300 font-medium">{p.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-[#0a0c13] border border-[#1f2233] rounded-xl p-4"
        >
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Source</label>
              <select
                value={filterSource}
                onChange={(e) => { setFilterSource(e.target.value); setPage(1); }}
                className="w-full bg-[#131626] border border-[#1f2233] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="all">All Sources</option>
                <option value="internal">Internal</option>
                <option value="external">External</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Status Code</label>
              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                className="w-full bg-[#131626] border border-[#1f2233] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">All Statuses</option>
                <option value="200">200 OK</option>
                <option value="201">201 Created</option>
                <option value="400">400 Bad Request</option>
                <option value="401">401 Unauthorized</option>
                <option value="403">403 Forbidden</option>
                <option value="404">404 Not Found</option>
                <option value="500">500 Server Error</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Method</label>
              <select
                value={filterMethod}
                onChange={(e) => { setFilterMethod(e.target.value); setPage(1); }}
                className="w-full bg-[#131626] border border-[#1f2233] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">All Methods</option>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Path Contains</label>
              <input
                type="text"
                value={filterPath}
                onChange={(e) => { setFilterPath(e.target.value); setPage(1); }}
                placeholder="/api/products"
                className="w-full bg-[#131626] border border-[#1f2233] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">IP Address</label>
              <input
                type="text"
                value={filterIp}
                onChange={(e) => { setFilterIp(e.target.value); setPage(1); }}
                placeholder="192.168.1.1"
                className="w-full bg-[#131626] border border-[#1f2233] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Logs Table */}
      <div className="bg-[#0a0c13] border border-[#1f2233] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1f2233]">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Time</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Method</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Path</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Source</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">IP Address</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Origin</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Response Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2233]">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    No API logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-[#131626]/50 transition-colors">
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-xs">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`font-mono font-medium ${getMethodColor(log.method)}`}>
                        {log.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300 font-mono text-xs max-w-[250px] truncate" title={log.path}>
                      {log.path}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(log.statusCode)}`}>
                        {log.statusCode}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSourceBadgeColor(log.source)}`}>
                        {getSourceLabel(log.source)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs whitespace-nowrap">
                      {log.ipAddress}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs max-w-[200px] truncate" title={log.origin || log.referer}>
                      {log.origin || log.referer || '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                      {formatTime(log.responseTime)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-4 py-3 border-t border-[#1f2233]">
            <p className="text-xs text-slate-500">
              Showing {(page - 1) * 50 + 1}-{Math.min(page * 50, total)} of {total.toLocaleString()}
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-xs rounded-lg border border-[#1f2233] text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-xs rounded-lg border border-[#1f2233] text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminApiLogsPage;
