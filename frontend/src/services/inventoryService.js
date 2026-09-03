import api from './api';

const stockIn = (medicineId, payload) => api.post(`/inventory/${medicineId}/in`, payload);
const stockOut = (medicineId, payload) => api.post(`/inventory/${medicineId}/out`, payload);
const history = (params) => api.get('/inventory/history', { params });
const historyForMedicine = (medicineId, params) => api.get(`/inventory/history/${medicineId}`, { params });

export default { stockIn, stockOut, history, historyForMedicine };
