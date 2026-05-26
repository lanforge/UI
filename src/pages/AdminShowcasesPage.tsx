import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

interface Showcase {
  _id: string;
  name: string;
  creatorName: string;
  creatorCode: string;
  total: number;
  isActive: boolean;
  createdAt: string;
}

const AdminShowcasesPage: React.FC = () => {
  const [showcases, setShowcases] = useState<Showcase[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchShowcases();
  }, []);

  const fetchShowcases = async () => {
    try {
      const res = await api.get(`/showcases/admin/all`);
      setShowcases(res.data.showcases);
    } catch (error) {
      setErrorMsg('Failed to load showcases');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const res = await api.post(
        `/showcases`,
        {
          name: 'New Showcase',
          creatorName: 'Creator Name',
          creatorCode: 'code',
          parts: [],
          isActive: false
        }
      );
      navigate(`/admin/showcases/${res.data.showcase._id}`);
    } catch (error) {
      setErrorMsg('Failed to create showcase');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this showcase?')) return;
    try {
      await api.delete(`/showcases/${id}`);
      fetchShowcases();
    } catch (error) {
      setErrorMsg('Failed to delete showcase');
    }
  };

  if (loading) {
    return <div className="p-8 text-slate-400">Loading showcases...</div>;
  }

  return (
    <div className="p-8">
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-sm mb-4">
          {errorMsg}
          <button onClick={() => setErrorMsg(null)} className="float-right text-slate-400 hover:text-white">x</button>
        </div>
      )}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-medium text-white">Creator Showcases</h1>
        <button
          onClick={handleCreate}
          className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors"
        >
          Create Showcase
        </button>
      </div>

      <div className="admin-card overflow-hidden">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-[#11141d] border-b border-[#1f2233]">
            <tr>
              <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Name</th>
              <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Creator</th>
              <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Code</th>
              <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Total</th>
              <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Status</th>
              <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1f2233]">
            {showcases.map((sc) => (
              <tr key={sc._id} className="hover:bg-[#1f2233]/30 transition-colors">
                <td className="py-4 px-6">{sc.name}</td>
                <td className="py-4 px-6">{sc.creatorName}</td>
                <td className="py-4 px-6">{sc.creatorCode}</td>
                <td className="py-4 px-6">${sc.total.toFixed(2)}</td>
                <td className="py-4 px-6">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${sc.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[#11141d] text-slate-400'}`}>
                    {sc.isActive ? 'Active' : 'Draft'}
                  </span>
                </td>
                <td className="py-4 px-6 text-right">
                  <Link
                    to={`/admin/showcases/${sc._id}`}
                    className="text-emerald-400 hover:text-emerald-300 mr-4"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(sc._id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {showcases.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  No showcases found. Create one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminShowcasesPage;
