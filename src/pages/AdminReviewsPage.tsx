import React, { useState, useEffect } from 'react';
import api from '../utils/api';

interface Review {
  _id: string;
  customerName: string;
  rating: number;
  title: string;
  comment: string;
  isApproved: boolean;
  createdAt: string;
  product?: { name: string };
  pcPart?: { name: string };
  accessory?: { name: string };
}

const AdminReviewsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (statusFilter === 'approved') params.isApproved = 'true';
      if (statusFilter === 'pending') params.isApproved = 'false';

      const response = await api.get('/reviews/admin/all', { params });
      setReviews(response.data.reviews || []);
      setTotalPages(response.data.pages || 1);
      setTotalReviews(response.data.total || 0);
    } catch (error) {
      console.error('Failed to fetch reviews', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [page, statusFilter]);

  const toggleApproval = async (id: string, currentStatus: boolean) => {
    try {
      await api.put(`/reviews/${id}/status`, { isApproved: !currentStatus });
      fetchReviews();
    } catch (error) {
      console.error('Failed to update review status', error);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <svg key={i} className={`w-4 h-4 ${i < rating ? 'text-amber-400' : 'text-slate-600'}`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-white">Product Reviews</h1>
          <p className="text-slate-500 text-sm mt-1">Moderate customer reviews and feedback</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="admin-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider">Total Reviews</p>
              <p className="text-2xl font-medium text-white mt-1">{totalReviews}</p>
            </div>
            <div className="w-8 h-8 bg-blue-500/10 rounded-md flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-card p-4">
        <div className="flex flex-col space-y-3">
          <div className="flex items-center space-x-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="admin-input"
              >
                <option value="all">All Reviews</option>
                <option value="pending">Pending Approval</option>
                <option value="approved">Approved</option>
              </select>
              <button 
                onClick={fetchReviews}
                className="bg-white/10 hover:bg-white/20 text-white text-sm rounded-md py-2 font-medium transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews table */}
      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1f2233] bg-[#07090e]">
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Rating / Item</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Customer</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Review</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Date</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Status</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2233]">
              {isLoading ? (
                <tr><td colSpan={6} className="p-4 text-center text-slate-500 text-sm">Loading reviews...</td></tr>
              ) : reviews.length === 0 ? (
                <tr><td colSpan={6} className="p-4 text-center text-slate-500 text-sm">No reviews found</td></tr>
              ) : (
                reviews.map(review => (
                  <tr key={review._id} className="hover:bg-[#1f2233]/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-1 mb-1">
                        {renderStars(review.rating)}
                      </div>
                      <p className="text-slate-500 text-[10px] truncate max-w-[200px] uppercase tracking-wider">
                        {review.product?.name || review.pcPart?.name || review.accessory?.name || 'Unknown Item'}
                      </p>
                    </td>
                    <td className="py-4 px-6 text-slate-200 font-medium">{review.customerName}</td>
                    <td className="py-4 px-6">
                      <p className="text-slate-200 font-medium text-sm mb-0.5">{review.title}</p>
                      <p className="text-slate-500 text-xs truncate max-w-[300px]">{review.comment}</p>
                    </td>
                    <td className="py-4 px-6 text-slate-500 text-center text-xs">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`admin-badge ${review.isApproved ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                        {review.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button 
                        onClick={() => toggleApproval(review._id, review.isApproved)}
                        className={`px-2.5 py-1 text-xs rounded-md transition-colors border ${review.isApproved ? 'bg-[#1f2233]/50 border-[#1f2233] hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 text-slate-300' : 'bg-white hover:bg-gray-200 text-black border-transparent font-medium'}`}
                      >
                        {review.isApproved ? 'Revoke' : 'Approve'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-3 border-t border-[#1f2233] flex items-center justify-between bg-[#07090e]">
          <div className="text-slate-500 text-xs">
            Showing {reviews.length > 0 ? (page - 1) * 20 + 1 : 0} to {Math.min(page * 20, totalReviews)} of {totalReviews}
          </div>
          <div className="flex items-center space-x-2">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-2.5 py-1 text-xs bg-[#1f2233]/50 hover:bg-[#1f2233] text-slate-300 rounded-md transition-colors disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-slate-500 text-xs px-2">Page {page} of {totalPages || 1}</span>
            <button 
              disabled={page === totalPages || totalPages === 0}
              onClick={() => setPage(p => p + 1)}
              className="px-2.5 py-1 text-xs bg-[#1f2233]/50 hover:bg-[#1f2233] text-slate-300 rounded-md transition-colors disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReviewsPage;
