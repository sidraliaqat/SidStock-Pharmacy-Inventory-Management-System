import api from './api';

const login = (email, password) => api.post('/auth/login', { email, password });
const register = (name, email, password) => api.post('/auth/register', { name, email, password });
const me = () => api.get('/auth/me');
const updateProfile = (payload) => api.put('/auth/me', payload);

export default { login, register, me, updateProfile };
