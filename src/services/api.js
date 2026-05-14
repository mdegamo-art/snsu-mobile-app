import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL = 'http://192.168.1.5:8000/api';
export const STORAGE_BASE  = 'http://192.168.1.5:8000/storage/';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15000,
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('@auth_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['@auth_token', '@current_user']);
    }
    return Promise.reject(error);
  },
);


export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/login', { email, password });
    if (response.data.success) {
      await AsyncStorage.setItem('@auth_token', response.data.token);
      await AsyncStorage.setItem('@current_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/logout');
    } finally {
      await AsyncStorage.multiRemove(['@auth_token', '@current_user']);
    }
  },

  isAuthenticated: async () => {
    const token = await AsyncStorage.getItem('@auth_token');
    return !!token;
  },

  getCurrentUser: async () => {
    const userData = await AsyncStorage.getItem('@current_user');
    return userData ? JSON.parse(userData) : null;
  },

  // GET /api/user  – fetch fresh profile from server
  fetchCurrentUser: async () => {
    const response = await api.get('/user');
    if (response.data) {
      await AsyncStorage.setItem('@current_user', JSON.stringify(response.data));
    }
    return response.data;
  },
};


export const notesAPI = {
  getNotes: async (params = {}) => {
    const response = await api.get('/notes', { params });
    return response.data; // { success, notes }
  },

  getNote: async (id) => {
    const response = await api.get(`/notes/${id}`);
    return response.data;
  },

  createNote: async (formData) => {
    const response = await api.post('/notes', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getDownloadUrl: (id) => `${API_BASE_URL}/notes/${id}/download`,

  getComments: async (id) => {
    const response = await api.get(`/notes/${id}/comments`);
    return response.data;
  },

  addComment: async (id, comment) => {
    const response = await api.post(`/notes/${id}/comments`, { comment });
    return response.data;
  },

  deleteComment: async (noteId, commentId) => {
    const response = await api.delete(`/notes/${noteId}/comments/${commentId}`);
    return response.data;
  },

  rateNote: async (id, rating) => {
    const response = await api.post(`/notes/${id}/rate`, { rating });
    return response.data;
  },

  getRating: async (id) => {
    const response = await api.get(`/notes/${id}/rating`);
    return response.data;
  },

  getMyNotes: async () => {
    const response = await api.get('/my-notes');
    return response.data;
  },
};


export const userActionsAPI = {
  // GET /api/favorites
  getFavorites: async () => {
    const response = await api.get('/favorites');
    return response.data; // { success, favorites }
  },

  // POST /api/favorites/toggle  { note_id }
  toggleFavorite: async (noteId) => {
    const response = await api.post('/favorites/toggle', { note_id: noteId });
    return response.data; // { success, is_favorited }
  },

  // GET /api/favorites/check/:noteId
  checkFavorite: async (noteId) => {
    const response = await api.get(`/favorites/check/${noteId}`);
    return response.data;
  },

  // GET /api/downloads/history
  getDownloadHistory: async () => {
    const response = await api.get('/downloads/history');
    return response.data;
  },

  // POST /api/downloads/record  { note_id }
  recordDownload: async (noteId) => {
    const response = await api.post('/downloads/record', { note_id: noteId });
    return response.data;
  },
};


export const profileAPI = {
  getProfile: async () => {
    const response = await api.get('/profile');
    return response.data;
  },

  uploadPicture: async (formData) => {
    const response = await api.post('/profile/picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  changePassword: async (data) => {
    const response = await api.post('/profile/password', data);
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put('/profile', data);
    return response.data;
  },
};


export const dashboardAPI = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },
};

export default api;