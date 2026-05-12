import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://192.168.1.5:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('@auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear auth data
      await AsyncStorage.removeItem('@auth_token');
      await AsyncStorage.removeItem('@current_user');
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  // Login
  login: async (email, password) => {
    const response = await api.post('/login', { email, password });
    if (response.data.success) {
      await AsyncStorage.setItem('@auth_token', response.data.token);
      await AsyncStorage.setItem('@current_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Logout
  logout: async () => {
    try {
      await api.post('/logout');
    } finally {
      await AsyncStorage.removeItem('@auth_token');
      await AsyncStorage.removeItem('@current_user');
    }
  },

  // Check if user is authenticated
  isAuthenticated: async () => {
    const token = await AsyncStorage.getItem('@auth_token');
    return !!token;
  },

  // Get current user
  getCurrentUser: async () => {
    const userData = await AsyncStorage.getItem('@current_user');
    return userData ? JSON.parse(userData) : null;
  },

  // Fetch profile from API
  fetchProfile: async () => {
    const response = await api.get('/profile');
    return response.data;
  },
};

// Notes API
export const notesAPI = {
  // Get all notes
  getNotes: async () => {
    const response = await api.get('/notes');
    return response.data;
  },

  // Get single note
  getNote: async (id) => {
    const response = await api.get(`/notes/${id}`);
    return response.data;
  },

  // Create note
  createNote: async (noteData) => {
    const response = await api.post('/notes', noteData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Download note
  downloadNote: async (id) => {
    const response = await api.get(`/notes/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Get comments
  getComments: async (id) => {
    const response = await api.get(`/notes/${id}/comments`);
    return response.data;
  },

  // Add comment
  addComment: async (id, comment) => {
    const response = await api.post(`/notes/${id}/comments`, { comment });
    return response.data;
  },

  // Rate note
  rateNote: async (id, rating) => {
    const response = await api.post(`/notes/${id}/rate`, { rating });
    return response.data;
  },
};

// User Actions API (Favorites & Downloads)
export const userActionsAPI = {
  // Get user's favorites
  getFavorites: async () => {
    const response = await api.get('/favorites');
    return response.data;
  },

  // Toggle favorite status
  toggleFavorite: async (noteId) => {
    const response = await api.post('/favorites/toggle', { note_id: noteId });
    return response.data;
  },

  // Check if note is favorited
  checkFavorite: async (noteId) => {
    const response = await api.get(`/favorites/check/${noteId}`);
    return response.data;
  },

  // Get download history
  getDownloadHistory: async () => {
    const response = await api.get('/downloads/history');
    return response.data;
  },

  // Record a download
  recordDownload: async (noteId) => {
    const response = await api.post('/downloads/record', { note_id: noteId });
    return response.data;
  },
};

// Profile API
export const profileAPI = {
  // Get profile
  getProfile: async () => {
    const response = await api.get('/profile');
    return response.data;
  },

  // Upload profile picture
  uploadPicture: async (formData) => {
    const response = await api.post('/profile/picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await api.post('/profile/password', passwordData);
    return response.data;
  },
};

export default api;
