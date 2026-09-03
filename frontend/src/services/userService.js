import api from './api';

const list = () => api.get('/users');
const getById = (id) => api.get(`/users/${id}`);
const create = (payload) => api.post('/users', payload);
const update = (id, payload) => api.put(`/users/${id}`, payload);
const remove = (id) => api.delete(`/users/${id}`);

export default { list, getById, create, update, remove };
