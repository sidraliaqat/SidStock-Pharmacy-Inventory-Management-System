import api from './api';

const list = (search) => api.get('/categories', { params: search ? { search } : {} });
const getById = (id) => api.get(`/categories/${id}`);
const create = (payload) => api.post('/categories', payload);
const update = (id, payload) => api.put(`/categories/${id}`, payload);
const remove = (id) => api.delete(`/categories/${id}`);

export default { list, getById, create, update, remove };
