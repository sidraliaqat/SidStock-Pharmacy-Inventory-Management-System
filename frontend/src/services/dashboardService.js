import api from './api';

const admin = () => api.get('/dashboard/admin');
const user = () => api.get('/dashboard/user');

export default { admin, user };
