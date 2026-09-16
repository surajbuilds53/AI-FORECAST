import apiClient from './client';

/**
 * Fetches supported machine learning model architectures.
 * @returns {Promise<Array>} List of AvailableModelInfo
 */
export const getAvailableModels = async () => {
  const response = await apiClient.get('/api/models/available');
  return response.data;
};

/**
 * Trains a machine learning model on the selected dataset with chronological splitting.
 * @param {Object} payload 
 * @returns {Promise<Object>} ModelTrainingResult
 */
export const trainModel = async (payload) => {
  const response = await apiClient.post('/api/models/train', payload);
  return response.data;
};

/**
 * Fetches list of all previously trained forecasting model runs.
 * @returns {Promise<Array>} List of ModelTrainingResult
 */
export const getTrainedModels = async () => {
  const response = await apiClient.get('/api/models');
  return response.data;
};

/**
 * Fetches details and performance telemetry for a specific trained model.
 * @param {string} modelId 
 * @returns {Promise<Object>} ModelTrainingResult
 */
export const getModelDetails = async (modelId) => {
  const response = await apiClient.get(`/api/models/${modelId}`);
  return response.data;
};
