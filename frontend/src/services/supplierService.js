import api from './api';

const list = (search) => api.get('/suppliers', { params: search ? { search } : {} });
const getById = (id) => api.get(`/suppliers/${id}`);
const create = (payload) => api.post('/suppliers', payload);
const update = (id, payload) => api.put(`/suppliers/${id}`, payload);
const remove = (id) => api.delete(`/suppliers/${id}`);

export default { list, getById, create, update, remove };
