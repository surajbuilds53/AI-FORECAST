import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import DatasetsPage from './pages/DatasetsPage';
import PreprocessingPage from './pages/PreprocessingPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ModelsPage from './pages/ModelsPage';
import { useBackendHealth } from './hooks/useBackendHealth';
import { TrendingUp, Settings, Info } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [currentDataset, setCurrentDataset] = useState(null);
  const [preprocessedData, setPreprocessedData] = useState(null);
  const [trainedModels, setTrainedModels] = useState([]);
  const { status: backendStatus, isChecking, refreshHealth } = useBackendHealth();

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
          checkBackendHealth={refreshHealth}
          isChecking={isChecking}
        />

        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-950/40">
          {currentTab === 'dashboard' && (
            <Dashboard 
              backendStatus={backendStatus} 
              currentDataset={currentDataset}
              trainedModels={trainedModels}
              onNavigateToDatasets={() => setCurrentTab('datasets')}
              onNavigateToModels={() => setCurrentTab('models')}
            />
          )}

          {currentTab === 'datasets' && (
            <DatasetsPage 
              currentDataset={currentDataset} 
              setCurrentDataset={setCurrentDataset} 
            />
          )}

          {currentTab === 'preprocessing' && (
            <PreprocessingPage 
              currentDataset={currentDataset} 
              preprocessedData={preprocessedData}
              setPreprocessedData={setPreprocessedData}
              onNavigateToDatasets={() => setCurrentTab('datasets')}
            />
          )}

          {currentTab === 'analytics' && (
            <AnalyticsPage 
              currentDataset={currentDataset}
              onNavigateToDatasets={() => setCurrentTab('datasets')}
            />
          )}

          {currentTab === 'models' && (
            <ModelsPage 
              currentDataset={currentDataset}
              trainedModels={trainedModels}
              setTrainedModels={setTrainedModels}
              onNavigateToDatasets={() => setCurrentTab('datasets')}
            />
          )}

          {currentTab === 'forecasts' && renderTabPlaceholder('Forecasting & Inference', TrendingUp, 'Milestone 7', 'Generate future predictions for 7, 14, or 30 days, view historical vs predicted charts, and export results.')}
          {currentTab === 'settings' && renderTabPlaceholder('Platform Settings', Settings, 'Milestone 1', 'Configure API endpoints, database connection strings, and telemetry preferences.')}
        </main>
      </div>
    </div>
  );
}
