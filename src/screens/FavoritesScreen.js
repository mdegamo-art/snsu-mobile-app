import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Menu, Heart, FileText, Download, X } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, userActionsAPI, STORAGE_BASE } from '../services/api';

export default function FavoritesScreen({ navigation, onOpenSidebar }) {
  const [favorites, setFavorites]   = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const currentUser = await authAPI.getCurrentUser();
      setUser(currentUser);

      if (currentUser) {
        const res = await userActionsAPI.getFavorites();
        const raw = res.favorites || [];

        const formatted = raw
          .filter((f) => f.note || f.id)
          .map((f) => {
            const note = f.note || f;
            return {
              id:          String(note.id || f.note_id),
              title:       note.title || 'Untitled',
              subject:     note.subject || 'Other',
              description: note.description || '',
              file_path:   note.file_path || note.file || '',
              file_type:   note.file_type || 'pdf',
              uploadDate:  note.created_at
                ? new Date(note.created_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })
                : 'Unknown',
              uploaderName: note.user?.name || 'Unknown',
              downloads:    note.download_count || 0,
              favoritedAt:  f.created_at || f.favorited_at || '',
            };
          });

        setFavorites(formatted);
      }
    } catch (e) {
      console.error('FavoritesScreen loadData:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsub = navigation.addListener('focus', loadData);
    return unsub;
  }, [navigation, loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleRemove = (noteId) => {
    Alert.alert('Remove Favorite', 'Remove this note from your favorites?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await userActionsAPI.toggleFavorite(parseInt(noteId));
            setFavorites((prev) => prev.filter((n) => n.id !== String(noteId)));
          } catch (e) {
            Alert.alert('Error', 'Failed to remove from favorites');
          }
        },
      },
    ]);
  };

  const handleDownload = async (note) => {
    if (!user) return;
    setDownloadingId(note.id);
    try {
      await userActionsAPI.recordDownload(parseInt(note.id));

      const filePath = note.file_path || '';
      const fileUrl  = filePath.startsWith('http') ? filePath : `${STORAGE_BASE}${filePath}`;
      const fileName = filePath.split('/').pop() || `${note.title}.pdf`;
      const localUri = FileSystem.cacheDirectory + fileName;

      const token = await AsyncStorage.getItem('@auth_token');
      const { uri } = await FileSystem.downloadAsync(fileUrl, localUri, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `Save "${note.title}"` });
      } else {
        Alert.alert('Downloaded', `Saved to cache.`);
      }
    } catch (e) {
      Alert.alert('Error', 'Download failed: ' + (e.message || 'Unknown error'));
    } finally {
      setDownloadingId(null);
    }
  };

  const NoteCard = ({ note }) => (
    <View style={styles.noteCard}>
      {/* Remove heart */}
      <TouchableOpacity style={styles.heartBtn} onPress={() => handleRemove(note.id)}>
        <Heart size={20} color="#d32f2f" fill="#d32f2f" />
      </TouchableOpacity>

      <View style={styles.noteIcon}>
        <FileText size={30} color="#1565c0" />
      </View>

      <Text style={styles.noteTitle} numberOfLines={2}>{note.title}</Text>

      <View style={styles.subjectTag}>
        <Text style={styles.subjectTagText}>{note.subject}</Text>
      </View>

      <Text style={styles.noteDate}>{note.uploadDate}</Text>

      <TouchableOpacity
        style={styles.downloadBtn}
        onPress={() => handleDownload(note)}
        disabled={downloadingId === note.id}
      >
        {downloadingId === note.id
          ? <ActivityIndicator size="small" color="#1565c0" />
          : <><Download size={14} color="#1565c0" /><Text style={styles.downloadText}> Download</Text></>
        }
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.removeBtn}
        onPress={() => handleRemove(note.id)}
      >
        <X size={14} color="#d32f2f" />
        <Text style={styles.removeText}> Remove</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a237e" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onOpenSidebar} style={styles.menuButton}>
          <Menu size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.titleSection}>
        <Text style={styles.pageTitle}>My Favorite Notes</Text>
        <Text style={styles.pageSubtitle}>SAVED NOTES · {favorites.length} total</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
      >
        {favorites.length === 0 ? (
          <View style={styles.emptyState}>
            <Heart size={60} color="rgba(255,255,255,0.3)" />
            <Text style={styles.emptyTitle}>No Favorites Yet</Text>
            <Text style={styles.emptyText}>
              Tap the ❤ icon on any note in Browse to save it here.
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {favorites.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </View>
        )}
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#1a237e' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 50, paddingBottom: 10, paddingHorizontal: 20 },
  menuButton: { marginBottom: 10 },
  titleSection: {
    backgroundColor: '#ff4081',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
  },
  pageTitle:    { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  pageSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 5, letterSpacing: 2 },

  content: { flex: 1, backgroundColor: '#1a237e', paddingTop: 5 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingBottom: 100,
  },
  noteCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 14,
    marginBottom: 15,
    alignItems: 'center',
    position: 'relative',
    elevation: 3,
  },
  heartBtn: { position: 'absolute', top: 10, left: 10, zIndex: 1, padding: 4 },
  noteIcon: { marginTop: 12, marginBottom: 8 },
  noteTitle:    { fontSize: 13, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 8 },
  subjectTag:   { backgroundColor: '#7e57c2', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, marginBottom: 6 },
  subjectTagText:{ color: '#fff', fontSize: 10, fontWeight: '600' },
  noteDate:     { fontSize: 10, color: '#aaa', marginBottom: 10 },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    marginBottom: 6,
    width: '100%',
    justifyContent: 'center',
    minHeight: 38,
  },
  downloadText: { color: '#1565c0', fontSize: 12, fontWeight: '500' },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    width: '100%',
    justifyContent: 'center',
  },
  removeText: { color: '#d32f2f', fontSize: 12, fontWeight: '500' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginTop: 20, marginBottom: 10 },
  emptyText:  { fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 22 },
});