import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import AdminAddUserModal from '../components/AdminAddUserModal';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

const AdminUsersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/admin/users', {
        params: { search: searchTerm, role: roleFilter, page }
      });
      setUsers(response.data.users || []);
      setTotalPages(response.data.pages || 1);
      setTotalUsers(response.data.total || 0);
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter]);

  const handleSearch = () => {
    setPage(1);
    fetchUsers();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500/10 text-red-400 border border-red-500/30';
      case 'staff': return 'bg-blue-500/10 text-blue-400 border border-blue-500/30';
      default: return 'bg-gray-500/10 text-slate-400 border border-gray-500/30';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    if (isActive) return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
    return 'bg-gray-500/10 text-slate-400 border border-gray-500/30';
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-white flex items-center space-x-2">
          <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a5.5 5.5 0 01-5.5 5.5" />
          </svg>
          <span>User Management</span>
        </h2>
        <button 
          onClick={() => setIsAddUserModalOpen(true)}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors font-medium text-sm"
        >
          + Add User
        </button>
      </div>

      {/* Search and filters */}
      <div className="admin-card p-4 shrink-0">
        <div className="flex flex-col space-y-3">
          <div className="flex items-center space-x-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search users..."
                className="admin-input pl-12 pr-4 w-full bg-[#0a0c13] border-[#1f2233] text-sm focus:border-emerald-500 rounded-lg py-2"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <svg className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button onClick={fetchUsers} className="p-2 bg-[#11141d] hover:bg-[#1f2233] text-slate-400 hover:text-white rounded-lg transition-colors" title="Refresh">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select 
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="admin-input px-3 py-2 bg-[#0a0c13] border-[#1f2233] text-sm rounded-lg"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
            </select>
            <button 
              onClick={handleSearch}
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg py-2 font-medium transition-colors"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Users table */}
      <div className="admin-card overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1f2233]">
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">User ID</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Name</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Email</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Role</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Status</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-4 text-center text-slate-400">Loading users...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-4 text-center text-slate-400">No users found.</td></tr>
              ) : users.map((user) => (
                <tr key={user._id} className="border-b border-[#1f2233]/50 hover:bg-[#1f2233]/30 transition-colors">
                  <td className="py-4 px-6">
                    <span className="text-white font-medium">{user._id.slice(-6).toUpperCase()}</span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white font-medium">{user.name}</p>
                        <p className="text-slate-400 text-sm">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-slate-300">{user.email}</p>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.isActive)}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <button className="p-1.5 text-slate-400 hover:text-white hover:bg-[#11141d] rounded-lg transition-colors" title="Edit">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-[#11141d] rounded-lg transition-colors" title="Deactivate">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-[#1f2233] flex items-center justify-between">
          <div className="text-slate-400 text-sm">
            Showing {users.length > 0 ? (page - 1) * 20 + 1 : 0} to {Math.min(page * 20, totalUsers)} of {totalUsers} users
          </div>
          <div className="flex items-center space-x-2">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 text-sm bg-[#11141d] hover:bg-[#1f2233] text-slate-300 rounded-lg transition-colors disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-slate-400 px-2">Page {page} of {totalPages || 1}</span>
            <button 
              disabled={page === totalPages || totalPages === 0}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 text-sm bg-[#11141d] hover:bg-[#1f2233] text-slate-300 rounded-lg transition-colors disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {isAddUserModalOpen && (
        <AdminAddUserModal
          onClose={() => setIsAddUserModalOpen(false)}
          onSuccess={() => {
            setIsAddUserModalOpen(false);
            fetchUsers();
          }}
        />
      )}
    </div>
  );
};

export default AdminUsersPage;
