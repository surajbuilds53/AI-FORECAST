import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Database, 
  Sparkles, 
  RefreshCw, 
  Calendar, 
  Hash, 
  Tag, 
  Table, 
  Clock, 
  Info,
  ArrowRight
} from 'lucide-react';
import { uploadDataset, loadSampleDataset, getDatasets, getDatasetById } from '../api/dataset';

export default function DatasetsPage({ currentDataset, setCurrentDataset }) {
  const [datasetsList, setDatasetsList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch available datasets on component mount
  const fetchDatasetsList = async () => {
    try {
      const data = await getDatasets();
      setDatasetsList(data);
    } catch (err) {
      console.error('Failed to load datasets list:', err);
    }
  };

  useEffect(() => {
    fetchDatasetsList();
  }, []);

  const handleFileUpload = async (file) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setErrorMessage('Invalid file format. Please upload a standard .csv file.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    setUploadProgress(0);

    try {
      const summary = await uploadDataset(file, (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      });
      setCurrentDataset(summary);
      setSuccessMessage(`Dataset "${summary.filename}" uploaded & validated successfully!`);
      await fetchDatasetsList();
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'Error uploading dataset.';
      setErrorMessage(detail);
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLoadSample = async () => {
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const summary = await loadSampleDataset();
      setCurrentDataset(summary);
      setSuccessMessage('Sample daily retail sales dataset (120 days) loaded successfully!');
      await fetchDatasetsList();
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'Error loading sample dataset.';
      setErrorMessage(detail);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectExistingDataset = async (datasetId) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const summary = await getDatasetById(datasetId);
      setCurrentDataset(summary);
      setSuccessMessage(`Switched to dataset "${summary.filename}"`);
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || 'Failed to fetch dataset details');
    } finally {
      setIsLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderTypeBadge = (type) => {
    switch (type) {
      case 'datetime':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Calendar className="w-3 h-3" /> Datetime
          </span>
        );
      case 'numeric':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Hash className="w-3 h-3" /> Numeric
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Tag className="w-3 h-3" /> Categorical
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 mb-2">
            <Database className="w-3.5 h-3.5" />
            <span>Milestone 2 Active</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Dataset Ingestion & Exploration
          </h1>
          <p className="text-sm text-slate-400">
            Upload CSV time-series data, validate integrity, inspect inferred types, and explore preview rows.
          </p>
        </div>

        {/* Viva Quick Demo Action */}
        <button
          onClick={handleLoadSample}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-all duration-150 disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4 text-indigo-200" />
          <span>Load Sample Sales Dataset (Demo)</span>
        </button>
      </div>

      {/* Status Alerts */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-sm">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMessage}</div>
          <button onClick={() => setErrorMessage('')} className="text-rose-400 hover:text-white text-xs font-bold">Dismiss</button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3 text-emerald-300 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{successMessage}</div>
          <button onClick={() => setSuccessMessage('')} className="text-emerald-400 hover:text-white text-xs font-bold">Dismiss</button>
        </div>
      )}

      {/* Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
          }
        }}
        className={`relative border-2 border-dashed rounded-2xl p-8 md:p-12 text-center transition-all duration-200 ${
          isDragging 
            ? 'border-indigo-500 bg-indigo-500/10 scale-[0.99]' 
            : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900/80'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept=".csv,text/csv"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileUpload(e.target.files[0]);
            }
          }}
          className="hidden"
        />

        <div className="max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center">
            {isLoading ? (
              <RefreshCw className="w-7 h-7 animate-spin text-indigo-400" />
            ) : (
              <Upload className="w-7 h-7 text-indigo-400" />
            )}
          </div>

          <div>
            <h3 className="text-base font-semibold text-white">
              {isLoading ? 'Validating & Processing CSV...' : 'Drag & drop your CSV dataset here'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Supports standard tabular CSV files (max 10 MB). Strict type parsing and sanitization applied.
            </p>
          </div>

          {isLoading && uploadProgress > 0 && (
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-2 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors"
            >
              Browse Local Files (.csv)
            </button>
          </div>
        </div>
      </div>

      {/* Available Datasets quick switcher */}
      {datasetsList.length > 0 && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Repository Datasets ({datasetsList.length})
            </span>
            <button
              onClick={fetchDatasetsList}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {datasetsList.map((item) => {
              const isSelected = currentDataset?.id === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectExistingDataset(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-2 transition-colors ${
                    isSelected
                      ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{item.filename}</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ({item.row_count} rows)
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Dataset Inspection Section */}
      {currentDataset ? (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Rows</span>
              <div className="text-2xl font-bold text-white mt-1 font-mono">{currentDataset.row_count.toLocaleString()}</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Chronological observations</p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Columns</span>
              <div className="text-2xl font-bold text-white mt-1 font-mono">{currentDataset.column_count}</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Features & target</p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Missing Cells</span>
              <div className="text-2xl font-bold text-white mt-1 font-mono">
                {currentDataset.total_missing_values}
                <span className="text-xs font-normal text-slate-400 ml-1.5">
                  ({currentDataset.missing_cells_percentage}%)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {currentDataset.total_missing_values === 0 ? 'Zero null values (Clean)' : 'Requires imputation'}
              </p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">File Size</span>
              <div className="text-2xl font-bold text-white mt-1 font-mono">
                {formatBytes(currentDataset.file_size_bytes)}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Disk footprint</p>
            </div>
          </div>

          {/* Column Profiling Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl shadow-black/20">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Automated Column Profiling</h3>
                <p className="text-xs text-slate-400">Statistical data types, missing value frequencies, and value distributions</p>
              </div>
              <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
                {currentDataset.columns.length} Features Inferred
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800/80">
                  <tr>
                    <th className="px-5 py-3">Column Name</th>
                    <th className="px-5 py-3">Inferred Type</th>
                    <th className="px-5 py-3">Raw Dtype</th>
                    <th className="px-5 py-3">Missing Values</th>
                    <th className="px-5 py-3">Unique Values</th>
                    <th className="px-5 py-3">Sample Values</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {currentDataset.columns.map((col) => (
                    <tr key={col.name} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-white font-mono">{col.name}</td>
                      <td className="px-5 py-3.5">{renderTypeBadge(col.inferred_type)}</td>
                      <td className="px-5 py-3.5 font-mono text-slate-400">{col.dtype}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={col.missing_count > 0 ? 'text-amber-400 font-medium' : 'text-slate-400'}>
                            {col.missing_count} ({col.missing_percentage}%)
                          </span>
                          {col.missing_count > 0 && (
                            <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-amber-400 h-1.5" style={{ width: `${Math.min(col.missing_percentage, 100)}%` }} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-400">{col.unique_count.toLocaleString()}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-1.5 flex-wrap">
                          {col.sample_values.map((val, idx) => (
                            <span key={idx} className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px] font-mono border border-slate-700/60">
                              {val}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Data Preview Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl shadow-black/20">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Table className="w-4 h-4 text-indigo-400" />
                  Dataset Preview (First {currentDataset.preview_rows.length} Rows)
                </h3>
                <p className="text-xs text-slate-400">Verifies data parsing and row alignment before preprocessing</p>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {currentDataset.filename}
              </span>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-slate-500 font-mono w-12 text-center">#</th>
                    {currentDataset.columns.map((col) => (
                      <th key={col.name} className="px-4 py-3 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span>{col.name}</span>
                          <span className="text-[10px] text-slate-500 lowercase">({col.inferred_type[0]})</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                  {currentDataset.preview_rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-2.5 text-slate-500 text-center text-[11px] bg-slate-950/40">{rIdx + 1}</td>
                      {currentDataset.columns.map((col) => (
                        <td key={col.name} className="px-4 py-2.5 whitespace-nowrap">
                          {row[col.name] !== null && row[col.name] !== undefined ? (
                            String(row[col.name])
                          ) : (
                            <span className="text-amber-400/80 italic font-sans text-[11px]">NaN</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-8 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-xl bg-slate-800/60 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <Info className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-white">No Dataset Active</h4>
          <p className="text-xs text-slate-400 mt-1 mb-4 leading-relaxed">
            Upload your CSV dataset above or click the sample demo button to explore data profiling and preview tables.
          </p>
          <button
            onClick={handleLoadSample}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            Load Sample Dataset
          </button>
        </div>
      )}
    </div>
  );
}
