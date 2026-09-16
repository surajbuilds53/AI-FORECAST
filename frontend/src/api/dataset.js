import apiClient from './client';

/**
 * Uploads a CSV file with validation to the backend.
 * @param {File} file 
 * @param {Function} [onUploadProgress]
 * @returns {Promise<Object>} DatasetSummary
 */
export const uploadDataset = async (file, onUploadProgress) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post('/api/datasets/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });
  return response.data;
};

/**
 * Retrieves all stored datasets.
 * @returns {Promise<Array>} List of DatasetListItem
 */
export const getDatasets = async () => {
  const response = await apiClient.get('/api/datasets');
  return response.data;
};

/**
 * Retrieves summary, column profiling, and preview rows for a specific dataset.
 * @param {string} datasetId 
 * @returns {Promise<Object>} DatasetSummary
 */
export const getDatasetById = async (datasetId) => {
  const response = await apiClient.get(`/api/datasets/${datasetId}`);
  return response.data;
};

/**
 * Loads the built-in sample sales dataset for instant viva demonstration.
 * @returns {Promise<Object>} DatasetSummary
 */
export const loadSampleDataset = async () => {
  const response = await apiClient.post('/api/datasets/load-sample');
  return response.data;
};
