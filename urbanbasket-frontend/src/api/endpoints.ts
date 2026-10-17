import api from './axios';

type PageLike<T> = { content?: T };

function unwrap<T>(data: T | PageLike<T>): T {
  if (data && typeof data === 'object' && 'content' in data && Array.isArray((data as PageLike<T>).content)) {
    return (data as PageLike<T>).content as T;
  }
  return data as T;
}

async function getList(url: string, params?: Record<string, unknown>) {
  const res = await api.get(url, { params });
  return { data: unwrap(res.data) as never[] };
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: Record<string, unknown>) =>
    api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data: Record<string, unknown>) => api.put('/users/me', data),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (email: string, otp: string, newPassword: string) =>
    api.post('/auth/reset-password', { email, otp, newPassword }),
};

export const productApi = {
  getAll: (params?: Record<string, unknown>) =>
    getList('/products', { size: 200, sortBy: 'name', direction: 'asc', ...params }),
  getById: (id: number) => api.get(`/products/${id}`),
  create: (data: Record<string, unknown>) => api.post('/products', data),
  update: (id: number, data: Record<string, unknown>) =>
    api.put(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
  getLowStock: () => api.get('/products/low-stock'),
};

export const orderApi = {
  getAll: () => getList('/orders', { size: 200 }),
  getById: (id: number) => api.get(`/orders/${id}`),
  create: (data: Record<string, unknown>) => api.post('/orders', data),
  updateStatus: (id: number, status: string) =>
    api.patch(`/orders/${id}/status`, { status }),
  cancel: (id: number) => api.post(`/orders/${id}/cancel`),
  getMyOrders: () => api.get('/orders/my'),
};

export const returnApi = {
  getMine: () => api.get('/returns/my'),
  getAll: () => api.get('/returns'),
  create: (orderId: number, reason: string) => api.post('/returns', { orderId, reason }),
  approve: (id: number) => api.patch(`/returns/${id}/approve`),
  reject: (id: number) => api.patch(`/returns/${id}/reject`),
  refund: (id: number) => api.patch(`/returns/${id}/refund`),
};

export const cartApi = {
  get: () => api.get('/cart'),
  addItem: (productId: number, quantity: number) =>
    api.post('/cart/items', { productId, quantity }),
  updateItem: (itemId: number, quantity: number) =>
    api.patch(`/cart/items/${itemId}`, { quantity }),
  removeItem: (itemId: number) => api.delete(`/cart/items/${itemId}`),
};

export const attendanceApi = {
  getAll: () => getList('/attendance', { size: 200 }),
  markAttendance: (data: Record<string, unknown>) =>
    api.post('/admin/attendance', data),
  update: (id: number, data: Record<string, unknown>) =>
    api.put(`/admin/attendance/${id}`, data),
};

export const expenseApi = {
  getAll: () => getList('/expenses', { size: 200 }),
  create: (data: Record<string, unknown>) => api.post('/expenses', data),
  update: (id: number, data: Record<string, unknown>) =>
    api.put(`/expenses/${id}`, data),
  delete: (id: number) => api.delete(`/expenses/${id}`),
};

export const supplierApi = {
  getAll: () => api.get('/suppliers'),
  create: (data: Record<string, unknown>) => api.post('/suppliers', data),
  update: (id: number, data: Record<string, unknown>) =>
    api.put(`/suppliers/${id}`, data),
  delete: (id: number) => api.delete(`/suppliers/${id}`),
  createLogin: (id: number, data: Record<string, unknown>) =>
    api.post(`/suppliers/${id}/login`, data),
};

export const purchaseApi = {
  getAll: () => getList('/purchases', { size: 200 }),
  getMine: () => api.get('/purchases/mine'),
  create: (data: Record<string, unknown>) => api.post('/purchases', data),
  deliver: (id: number) => api.post(`/purchases/${id}/deliver`),
};

export const analyticsApi = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getSalesChart: (period: string) =>
    api.get('/analytics/sales', { params: { period } }),
  getFinancialReport: (month: number, year: number) =>
    api.get('/analytics/financial', { params: { month, year } }),
  getTopProducts: () => api.get('/analytics/top-products'),
};

export const adminApi = {
  getAccounts: () => api.get('/admin/accounts'),
  createAccount: (data: Record<string, unknown>) =>
    api.post('/admin/accounts', data),
  updateAccount: (id: number, data: Record<string, unknown>) =>
    api.put(`/admin/accounts/${id}`, data),
  updateAccountStatus: (id: number, active: boolean) =>
    api.patch(`/admin/accounts/${id}/status`, { active }),
  deleteAccount: (id: number) => api.delete(`/admin/accounts/${id}`),
};
