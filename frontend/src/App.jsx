import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import { Database, Cpu, LineChart, Settings, Info } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [backendStatus, setBackendStatus] = useState({
    healthy: false,
    service: '',
    version: '',
    error: null,
  });
  const [isChecking, setIsChecking] = useState(false);

  // Function to query the FastAPI /health endpoint
  const checkBackendHealth = async () => {
    setIsChecking(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/health');
      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }
      const data = await response.json();
      setBackendStatus({
        healthy: data.status === 'healthy',
        service: data.service || 'FastAPI',
        version: data.version || '0.1.0',
        error: null,
      });
    } catch (err) {
      setBackendStatus({
        healthy: false,
        service: '',
        version: '',
        error: err.message,
      });
    } finally {
      setIsChecking(false);
    }
  };

  // Check health on initial component mount
  useEffect(() => {
    checkBackendHealth();
  }, []);

  // Placeholder view for tabs scheduled for future milestones
  const renderTabPlaceholder = (title, icon, milestone, description) => {
    const IconComponent = icon;
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center mb-4">
          <IconComponent className="w-7 h-7" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 mb-3">
          <Info className="w-3.5 h-3.5" />
          <span>Scheduled for {milestone}</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{title} Module</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
          {description}
        </p>
        <button
          onClick={() => setCurrentTab('dashboard')}
          className="px-4 py-2 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0b0f19] text-slate-100 font-['Inter',sans-serif]">
      {/* Sidebar navigation */}
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header 
          backendStatus={backendStatus} 
          checkBackendHealth={checkBackendHealth}
          isChecking={isChecking}
        />

        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-950/40">
          {currentTab === 'dashboard' && <Dashboard backendStatus={backendStatus} />}
          {currentTab === 'datasets' && renderTabPlaceholder('Datasets Management', Database, 'Milestone 2', 'Upload CSV/Excel data files, inspect automated time-series columns, and generate exploratory summary statistics.')}
          {currentTab === 'models' && renderTabPlaceholder('Machine Learning Models', Cpu, 'Milestone 3', 'Train and configure time-series forecasting algorithms (ARIMA, Prophet, XGBoost, LSTM).')}
          {currentTab === 'forecasts' && renderTabPlaceholder('Forecasting & Inference', LineChart, 'Milestone 4', 'Generate future predictions, visualize confidence intervals, and evaluate forecast accuracy metrics.')}
          {currentTab === 'settings' && renderTabPlaceholder('Platform Settings', Settings, 'Milestone 1', 'Environment settings, API endpoints, and telemetry preferences.')}
        </main>
      </div>
    </div>
  );
}
