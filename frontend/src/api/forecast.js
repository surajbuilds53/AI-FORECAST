import apiClient from './client';

/**
 * Generates recursive multi-step future predictions with empirical confidence intervals.
 * @param {Object} payload { model_id, forecast_horizon, confidence_level, dataset_id }
 * @returns {Promise<Object>} ForecastResponse
 */
export const generateForecast = async (payload) => {
  const response = await apiClient.post('/api/forecast/generate', payload);
  return response.data;
};

/**
 * Returns direct URL for downloading forecast CSV export.
 * @param {string} modelId 
 * @param {number} horizon 
 * @param {number} confidence 
 * @returns {string} Download URL
 */
export const getForecastExportUrl = (modelId, horizon = 14, confidence = 0.95) => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
  return `${baseUrl}/api/forecast/export?model_id=${encodeURIComponent(modelId)}&forecast_horizon=${horizon}&confidence_level=${confidence}`;
};
