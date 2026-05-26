import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const CDN_BASE = 'https://cdn.lanforge.co';

interface CdnFile {
  ObjectName: string;
  Path: string;
  IsDirectory: boolean;
  Length: number;
  LastChanged: string;
}

interface CDNImagePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  /**
   * Optionally provide a default path prefix, e.g. "products" or "Parts/gpu"
   */
  defaultPath?: string;
}

const CDNImagePicker: React.FC<CDNImagePickerProps> = ({ isOpen, onClose, onSelect, defaultPath }) => {
  const [currentPath, setCurrentPath] = useState('');
  const [files, setFiles] = useState<CdnFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fetchFiles = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/uploads/cdn-files', {
        params: { path: path || '/' }
      });
      // Sort: folders first, then by name
      const sorted = (res.data.files || []).sort((a: CdnFile, b: CdnFile) => {
        if (a.IsDirectory && !b.IsDirectory) return -1;
        if (!a.IsDirectory && b.IsDirectory) return 1;
        return a.ObjectName.localeCompare(b.ObjectName);
      });
      setFiles(sorted);
    } catch (err: any) {
      console.error('Failed to fetch CDN files', err);
      setError(err.response?.data?.message || 'Failed to fetch files from CDN');
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      const initialPath = defaultPath ? defaultPath.replace(/^\/+|\/+$/g, '') : '';
      setCurrentPath(initialPath);
      fetchFiles(initialPath);
      setPreviewUrl(null);
    }
  }, [isOpen, defaultPath, fetchFiles]);

  const navigateToFolder = (folderName: string) => {
    const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
    setCurrentPath(newPath);
    fetchFiles(newPath);
    setPreviewUrl(null);
  };

  const goUp = () => {
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    const newPath = parts.join('/');
    setCurrentPath(newPath);
    fetchFiles(newPath);
    setPreviewUrl(null);
  };

  const getImageUrl = (file: CdnFile): string => {
    let path = (file.Path || '').replace(/^\/+/, '');
    path = path.replace(/^lanforge\//i, '');
    const dirPath = path.endsWith('/') ? path : (path ? `${path}/` : '');
    return `${CDN_BASE}/${dirPath}${file.ObjectName}`;
  };

  const selectImage = (file: CdnFile) => {
    if (file.IsDirectory) return;
    onSelect(getImageUrl(file));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string): string => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  if (!isOpen) return null;

  // Get parent folders for breadcrumb
  const pathParts = currentPath.split('/').filter(Boolean);
  const breadcrumbs = [
    { label: 'Root', path: '' },
    ...pathParts.map((part, idx) => ({
      label: part,
      path: pathParts.slice(0, idx + 1).join('/')
    }))
  ];

  const imageFiles = files.filter(f => !f.IsDirectory);
  const folders = files.filter(f => f.IsDirectory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-[#0f111a] border border-[#1f2233] rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1f2233] shrink-0">
          <h2 className="text-lg font-medium text-white">CDN Image Picker</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Breadcrumb navigation */}
        <div className="flex items-center space-x-1 px-4 py-2 bg-[#0a0c13] border-b border-[#1f2233] shrink-0 overflow-x-auto">
          {currentPath && (
            <button
              onClick={goUp}
              className="p-1 text-slate-400 hover:text-white transition-colors shrink-0"
              title="Go up"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.path}>
              {idx > 0 && <span className="text-slate-600 text-xs mx-1">/</span>}
              <button
                onClick={() => {
                  setCurrentPath(crumb.path);
                  fetchFiles(crumb.path);
                  setPreviewUrl(null);
                }}
                className={`text-xs px-2 py-0.5 rounded hover:bg-[#1f2233] transition-colors ${
                  idx === breadcrumbs.length - 1
                    ? 'text-emerald-400 font-medium'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {crumb.label}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Main content area */}
        <div className="flex flex-1 min-h-0">
          {/* File grid */}
          <div className={`flex-1 overflow-y-auto p-4 ${previewUrl ? 'hidden md:block' : ''}`}>
            {loading && (
              <div className="flex items-center justify-center h-48">
                <svg className="animate-spin h-8 w-8 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-sm">
                {error}
              </div>
            )}

            {!loading && !error && files.length === 0 && (
              <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">This folder is empty</p>
                <p className="text-xs mt-1">Upload images using the "Upload Images" button above</p>
              </div>
            )}

            {!loading && !error && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {/* Folders */}
                {folders.map((folder) => (
                  <button
                    key={folder.ObjectName}
                    onClick={() => navigateToFolder(folder.ObjectName)}
                    className="flex flex-col items-center justify-center p-4 rounded-xl border border-[#1f2233] bg-[#0a0c13] hover:border-emerald-500/50 hover:bg-[#11141d] transition-all cursor-pointer group"
                  >
                    <svg className="w-10 h-10 text-amber-400 mb-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                    </svg>
                    <span className="text-xs text-slate-300 text-center truncate w-full group-hover:text-white transition-colors">
                      {folder.ObjectName}
                    </span>
                  </button>
                ))}

                {/* Image files */}
                {imageFiles.map((file) => {
                  const ext = file.ObjectName.split('.').pop()?.toLowerCase() || '';
                  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
                  if (!isImage) return null;
                  return (
                    <button
                      key={file.ObjectName}
                      onClick={() => selectImage(file)}
                      onMouseEnter={() => setPreviewUrl(getImageUrl(file))}
                      className="relative group rounded-xl overflow-hidden border border-[#1f2233] hover:border-emerald-500/70 transition-all cursor-pointer bg-[#0a0c13]"
                    >
                      <div className="aspect-square">
                        <img
                          src={getImageUrl(file)}
                          alt={file.ObjectName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          loading="lazy"
                        />
                      </div>
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 pt-6">
                        <p className="text-xs text-white truncate">{file.ObjectName}</p>
                        <p className="text-[10px] text-slate-400">{formatFileSize(file.Length)}</p>
                      </div>
                      {/* Select indicator on hover */}
                      <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/10 transition-colors flex items-center justify-center">
                        <span className="text-emerald-400 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 px-2 py-1 rounded">
                          Select
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Preview pane (desktop) */}
          {previewUrl && (
            <div className="hidden md:flex flex-col w-72 border-l border-[#1f2233] p-4 shrink-0 overflow-y-auto">
              <h3 className="text-sm font-medium text-slate-400 mb-3">Preview</h3>
              <div className="rounded-xl overflow-hidden border border-[#1f2233] bg-[#0a0c13] mb-3">
                <img src={previewUrl} alt="Preview" className="w-full aspect-square object-cover" />
              </div>
              <button
                onClick={() => {
                  onSelect(previewUrl);
                }}
                className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Select This Image
              </button>
              <p className="text-[10px] text-slate-600 mt-2 break-all text-center">{previewUrl}</p>
            </div>
          )}
        </div>

        {/* Bottom bar - Upload button + close */}
        <div className="flex items-center justify-between p-4 border-t border-[#1f2233] shrink-0">
          <p className="text-xs text-slate-500">
            {files.length > 0
              ? `${imageFiles.length} image(s) in ${folders.length} folder(s)`
              : 'No files found'}
          </p>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#11141d] hover:bg-[#1f2233] text-slate-300 rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CDNImagePicker;
