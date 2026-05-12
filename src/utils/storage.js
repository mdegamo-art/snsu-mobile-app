import AsyncStorage from '@react-native-async-storage/async-storage';
import { notesAPI, authAPI } from '../services/api';

const KEYS = {
  NOTES_CACHE: '@notes_cache',
  FAVORITES: '@favorites',
  UPLOADS: '@uploads',
  DOWNLOADS: '@downloads',
};

// Legacy storage - kept for backwards compatibility but redirects to API
export const storage = {
  // User related - now handled by authAPI
  async getCurrentUser() {
    return await authAPI.getCurrentUser();
  },

  async setCurrentUser(user) {
    // Handled by authAPI.login()
  },

  async clearCurrentUser() {
    await authAPI.logout();
  },

  // Notes related - now fetch from API
  async getNotes() {
    try {
      const response = await notesAPI.getNotes();
      if (response.success && response.notes) {
        // Cache the notes for offline access
        await AsyncStorage.setItem(KEYS.NOTES_CACHE, JSON.stringify(response.notes));
        return response.notes;
      }
    } catch (error) {
      // Return cached notes if offline
      const cached = await AsyncStorage.getItem(KEYS.NOTES_CACHE);
      return cached ? JSON.parse(cached) : [];
    }
    return [];
  },

  async saveNote(note) {
    // Now handled via API - use notesAPI.createNote()
  },

  // Stats related - calculated from API data
  async getUserStats(userId) {
    const uploads = await this.getUserUploads(userId);
    const downloads = await this.getUserDownloads(userId);
    return {
      uploads: uploads.length,
      downloads: downloads.length,
      contributionScore: uploads.length * 10 + downloads.length * 2
    };
  },

  async getUserUploads(userId) {
    const data = await AsyncStorage.getItem(KEYS.UPLOADS);
    const uploads = data ? JSON.parse(data) : [];
    return uploads.filter(u => u.userId === userId);
  },

  async addUpload(userId, noteId) {
    const data = await AsyncStorage.getItem(KEYS.UPLOADS);
    const uploads = data ? JSON.parse(data) : [];
    uploads.push({ userId, noteId, date: new Date().toISOString() });
    await AsyncStorage.setItem(KEYS.UPLOADS, JSON.stringify(uploads));
  },

  async getUserDownloads(userId) {
    const data = await AsyncStorage.getItem(KEYS.DOWNLOADS);
    const downloads = data ? JSON.parse(data) : [];
    return downloads.filter(d => d.userId === userId);
  },

  async addDownload(userId, noteId) {
    const data = await AsyncStorage.getItem(KEYS.DOWNLOADS);
    const downloads = data ? JSON.parse(data) : [];
    downloads.push({ userId, noteId, date: new Date().toISOString() });
    await AsyncStorage.setItem(KEYS.DOWNLOADS, JSON.stringify(downloads));
  },

  // Favorites - kept in local storage
  async getFavorites(userId) {
    const data = await AsyncStorage.getItem(KEYS.FAVORITES);
    const favorites = data ? JSON.parse(data) : [];
    return favorites.filter(f => f.userId === userId);
  },

  async toggleFavorite(userId, noteId) {
    const data = await AsyncStorage.getItem(KEYS.FAVORITES);
    let favorites = data ? JSON.parse(data) : [];
    const existing = favorites.find(f => f.userId === userId && f.noteId === noteId);

    if (existing) {
      favorites = favorites.filter(f => !(f.userId === userId && f.noteId === noteId));
    } else {
      favorites.push({ userId, noteId, date: new Date().toISOString() });
    }

    await AsyncStorage.setItem(KEYS.FAVORITES, JSON.stringify(favorites));
    return !existing;
  },

  // Legacy methods - no longer needed with API
  async initSampleData() {
    // No longer needed - data comes from API
  },

  async getUsers() {
    return [];
  },

  async saveUser(user) {
    // No longer needed - users are created via admin panel
  },

  async findUserByEmail(email) {
    return null;
  }
};
