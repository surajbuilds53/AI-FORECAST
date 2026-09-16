import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { uploadDataset, loadSampleDataset, getDatasets, getDatasetById } from '../api/dataset';

export default function DatasetsPage({ currentDataset, setCurrentDataset }) {
  const [datasetsList, setDatasetsList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedDateCol, setSelectedDateCol] = useState('');
  const [selectedTargetCol, setSelectedTargetCol] = useState('');
  const fileInputRef = useRef(null);

  const fetchDatasetsList = async () => {
    try {
      const data = await getDatasets();
      setDatasetsList(data || []);
    } catch (err) {
      console.error('Failed to load datasets list:', err);
    }
  };

  useEffect(() => {
    fetchDatasetsList();
  }, []);

  // Initialize column configurations when currentDataset changes
  useEffect(() => {
    if (currentDataset) {
      const detectedDate = currentDataset.detected_datetime_column || currentDataset.columns?.find((c) =>
        c.inferred_type === 'Datetime' || ['date', 'time', 'timestamp', 'day'].some((k) => c.name.toLowerCase().includes(k))
      )?.name || currentDataset.columns?.[0]?.name || '';

      const detectedTarget = currentDataset.columns?.find((c) =>
        c.inferred_type === 'Numeric' && c.name !== detectedDate
      )?.name || currentDataset.columns?.find((c) => c.inferred_type === 'Numeric')?.name || '';

      setSelectedDateCol(detectedDate);
      setSelectedTargetCol(detectedTarget);
    }
  }, [currentDataset]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setErrorMessage('Could not load the dataset: Invalid file format. Please upload a standard .csv file.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const summary = await uploadDataset(file);
      setCurrentDataset(summary);
      await fetchDatasetsList();
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'Could not load the dataset.';
      setErrorMessage(detail);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLoadSample = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const summary = await loadSampleDataset();
      setCurrentDataset(summary);
      await fetchDatasetsList();
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'Could not load the dataset.';
      setErrorMessage(detail);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectExisting = async (id) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const summary = await getDatasetById(id);
      setCurrentDataset(summary);
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || 'Could not load the dataset.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".csv"
        className="hidden"
      />

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Datasets
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Upload and inspect the data used for forecasting.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            Upload CSV
          </button>
          <button
            onClick={handleLoadSample}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Load Sample Dataset'}
          </button>
        </div>
      </div>

      {/* ERROR STATE */}
      {errorMessage && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block">Could not load the dataset.</span>
            <span className="text-xs text-red-600 mt-0.5 block">{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage('')}
            className="text-xs font-semibold text-red-700 hover:text-red-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {currentDataset ? (
        <div className="space-y-6">
          {/* SECTION 1 — DATASET INFORMATION */}
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div>
                <span className="text-xs text-slate-500 block">Dataset Name</span>
                <span className="font-medium text-slate-900 truncate block mt-0.5" title={currentDataset.filename}>
                  {currentDataset.filename}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Rows</span>
                <span className="font-medium text-slate-900 block mt-0.5">
                  {currentDataset.row_count?.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Columns</span>
                <span className="font-medium text-slate-900 block mt-0.5">
                  {currentDataset.column_count}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Date Column</span>
                <span className="font-medium text-slate-900 block mt-0.5 truncate">
                  {selectedDateCol || '—'}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Target Column</span>
                <span className="font-medium text-slate-900 block mt-0.5 truncate">
                  {selectedTargetCol || '—'}
                </span>
              </div>
            </div>

            {/* Switch datasets selector if multiple exist */}
            {datasetsList.length > 1 && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Available on server:</span>
                <div className="flex items-center gap-2">
                  <select
                    value={currentDataset.filename}
                    onChange={(e) => handleSelectExisting(e.target.value)}
                    className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-700 text-xs focus:outline-none focus:border-blue-500"
                  >
                    {datasetsList.map((d) => (
                      <option key={d.id} value={d.filename}>
                        {d.filename} ({d.row_count} rows)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2 — COLUMN SELECTION */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
            <h2 className="text-base font-semibold text-slate-900">
              Column Configuration
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date Column */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 block">
                  Date / Time Column
                </label>
                <select
                  value={selectedDateCol}
                  onChange={(e) => setSelectedDateCol(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {currentDataset.columns?.map((col) => {
                    const isRec = col.inferred_type === 'Datetime' || col.name.toLowerCase().includes('date');
                    return (
                      <option key={col.name} value={col.name}>
                        {col.name} {isRec ? '(Recommended)' : `(${col.inferred_type})`}
                      </option>
                    );
                  })}
                </select>
                <p className="text-xs text-slate-500">
                  The date column determines the time order of observations.
                </p>
              </div>

              {/* Target Column */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 block">
                  Target Column
                </label>
                <select
                  value={selectedTargetCol}
                  onChange={(e) => setSelectedTargetCol(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {currentDataset.columns?.filter((c) => c.name !== selectedDateCol).map((col) => {
                    const isRec = col.inferred_type === 'Numeric';
                    return (
                      <option key={col.name} value={col.name}>
                        {col.name} {isRec ? '(Recommended Numeric)' : `(${col.inferred_type})`}
                      </option>
                    );
                  })}
                </select>
                <p className="text-xs text-slate-500">
                  The target column is the value the model will forecast.
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 3 — DATA PREVIEW */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                Data Preview
              </h2>
              <span className="text-xs text-slate-500 font-mono">
                Showing first {currentDataset.preview_rows?.length || 0} rows
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-96">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-700 font-medium">
                  <tr>
                    {currentDataset.columns?.map((col) => (
                      <th key={col.name} className="py-2.5 px-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{col.name}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{col.inferred_type}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                  {currentDataset.preview_rows?.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      {currentDataset.columns?.map((col) => (
                        <td key={col.name} className="py-2 px-3 whitespace-nowrap">
                          {row[col.name] !== null && row[col.name] !== undefined ? String(row[col.name]) : '—'}
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
        /* EMPTY STATE */
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center space-y-4 max-w-lg mx-auto my-8">
          <div className="w-12 h-12 rounded-lg bg-slate-100 text-slate-600 mx-auto flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-slate-900">
              No dataset loaded
            </h2>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Upload a CSV file or load the sample dataset to inspect your data.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              Upload CSV
            </button>
            <button
              onClick={handleLoadSample}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              Load Sample Dataset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
