import apiClient from './client';

/**
 * Fetches auto-detected datetime and numeric target column recommendations.
 * @param {string} datasetId 
 * @returns {Promise<Object>} ColumnRecommendations
 */
export const getRecommendations = async (datasetId) => {
  const response = await apiClient.get(`/api/preprocessing/recommendations/${datasetId}`);
  return response.data;
};

/**
 * Runs the time-series chronological sorting, imputation, and feature engineering pipeline.
 * @param {Object} payload 
 * @returns {Promise<Object>} PreprocessingResponse
 */
export const runPreprocessing = async (payload) => {
  const response = await apiClient.post('/api/preprocessing/process', payload);
  return response.data;
};
