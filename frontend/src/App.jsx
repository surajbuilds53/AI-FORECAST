import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import DatasetsPage from './pages/DatasetsPage';
import PreprocessingPage from './pages/PreprocessingPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ModelsPage from './pages/ModelsPage';
import EvaluationPage from './pages/EvaluationPage';
import ForecastPage from './pages/ForecastPage';
import VivaGuidePage from './pages/VivaGuidePage';
import ErrorBoundary from './components/ErrorBoundary';
import { useBackendHealth } from './hooks/useBackendHealth';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [currentDataset, setCurrentDataset] = useState(null);
  const [preprocessedData, setPreprocessedData] = useState(null);
  const [trainedModels, setTrainedModels] = useState([]);
  const [latestForecast, setLatestForecast] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { status: backendStatus, isChecking, refreshHealth } = useBackendHealth();

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-['Inter',system-ui,sans-serif]">
      {/* Sidebar navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        backendStatus={backendStatus}
        isChecking={isChecking}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          backendStatus={backendStatus}
          checkBackendHealth={refreshHealth}
          isChecking={isChecking}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        <main className="flex-1 p-6 md:p-8">
          <div className="max-w-6xl mx-auto">
            <ErrorBoundary onReset={() => setCurrentTab('dashboard')}>
              {currentTab === 'dashboard' && (
                <Dashboard
                  backendStatus={backendStatus}
                  currentDataset={currentDataset}
                  setCurrentDataset={setCurrentDataset}
                  trainedModels={trainedModels}
                  latestForecast={latestForecast}
                  onNavigate={(tab) => setCurrentTab(tab)}
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
                  onNavigate={(tab) => setCurrentTab(tab)}
                />
              )}

              {currentTab === 'analytics' && (
                <AnalyticsPage
                  currentDataset={currentDataset}
                  onNavigate={(tab) => setCurrentTab(tab)}
                />
              )}

              {currentTab === 'models' && (
                <ModelsPage
                  currentDataset={currentDataset}
                  trainedModels={trainedModels}
                  setTrainedModels={setTrainedModels}
                  onNavigate={(tab) => setCurrentTab(tab)}
                />
              )}

              {currentTab === 'evaluation' && (
                <EvaluationPage
                  onNavigate={(tab) => setCurrentTab(tab)}
                />
              )}

              {currentTab === 'forecasts' && (
                <ForecastPage
                  latestForecast={latestForecast}
                  setLatestForecast={setLatestForecast}
                  onNavigate={(tab) => setCurrentTab(tab)}
                />
              )}

              {currentTab === 'viva' && (
                <VivaGuidePage
                  onNavigate={(tab) => setCurrentTab(tab)}
                />
              )}
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}
