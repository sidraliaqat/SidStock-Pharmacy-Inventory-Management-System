import api from './api';

const list = (params) => api.get('/medicines', { params });
const getById = (id) => api.get(`/medicines/${id}`);
const create = (formData) => api.post('/medicines', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
const update = (id, formData) => api.put(`/medicines/${id}`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
const remove = (id) => api.delete(`/medicines/${id}`);
const restore = (id) => api.patch(`/medicines/${id}/restore`);
const lowStock = () => api.get('/medicines/low-stock');
const outOfStock = () => api.get('/medicines/out-of-stock');
const expired = () => api.get('/medicines/expired');
const expiringSoon = () => api.get('/medicines/expiring-soon');

const exportCsv = async (params) => {
  const response = await api.get('/medicines/export', { params, responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'medicines-export.csv');
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export default { list, getById, create, update, remove, restore, lowStock, outOfStock, expired, expiringSoon, exportCsv };