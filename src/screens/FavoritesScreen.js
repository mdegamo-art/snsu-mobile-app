import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { Menu, Heart, FileText, Download, X } from 'lucide-react-native';
import { authAPI, userActionsAPI } from '../services/api';

export default function FavoritesScreen({ navigation, onOpenSidebar }) {
  const [favorites, setFavorites] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const currentUser = await authAPI.getCurrentUser();
      setUser(currentUser);

      if (currentUser) {
        const response = await userActionsAPI.getFavorites();
        // Transform API favorites to match expected format
        const favoriteNotes = response.favorites?.map(fav => ({
          id: fav.note?.id?.toString() || fav.note_id?.toString(),
          title: fav.note?.title || 'Untitled',
          subject: fav.note?.subject || 'Other',
          description: fav.note?.description || '',
          fileName: fav.note?.file ? fav.note.file.split('/').pop() : 'file.pdf',
          fileType: 'pdf',
          fileSize: fav.note?.file_size || 'Unknown',
          uploadDate: fav.note?.created_at ? new Date(fav.note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown',
          uploaderId: fav.note?.user_id?.toString() || 'unknown',
          uploaderName: fav.note?.user?.name || 'Unknown',
          downloads: fav.note?.downloads || 0,
        })) || [];

        setFavorites(favoriteNotes);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleRemoveFavorite = async (noteId) => {
    if (!user) return;

    Alert.alert(
      'Remove from Favorites',
      'Are you sure you want to remove this note from your favorites?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await userActionsAPI.toggleFavorite(parseInt(noteId));
              setFavorites(favorites.filter(note => note.id !== noteId));
            } catch (error) {
              console.error('Error removing favorite:', error);
              Alert.alert('Error', 'Failed to remove from favorites');
            }
          }
        }
      ]
    );
  };

  const handleDownload = async (note) => {
    if (!user) return;

    try {
      await userActionsAPI.recordDownload(parseInt(note.id));
      Alert.alert(
        'Download Recorded',
        `Download recorded for "${note.title}"`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error recording download:', error);
      Alert.alert('Error', 'Failed to record download');
    }
  };

  const NoteCard = ({ note }) => (
    <View style={styles.noteCard}>
      <TouchableOpacity
        style={styles.favoriteButton}
        onPress={() => handleRemoveFavorite(note.id)}
      >
        <Heart size={24} color="#d32f2f" fill="#d32f2f" />
      </TouchableOpacity>
      
      <View style={styles.noteIconContainer}>
        <FileText size={32} color="#1565c0" />
      </View>
      
      <Text style={styles.noteTitle}>{note.title}</Text>
      
      <View style={styles.subjectTag}>
        <Text style={styles.subjectText}>{note.subject}</Text>
      </View>
      
      <Text style={styles.noteDate}>{note.uploadDate}</Text>
      
      <TouchableOpacity
        style={styles.downloadButton}
        onPress={() => handleDownload(note)}
      >
        <Download size={18} color="#1565c0" />
        <Text style={styles.downloadText}>Download</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveFavorite(note.id)}
      >
        <X size={18} color="#d32f2f" />
        <Text style={styles.removeText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onOpenSidebar} style={styles.menuButton}>
          <Menu size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.titleSection}>
        <Text style={styles.pageTitle}>My Favorite Notes</Text>
        <Text style={styles.pageSubtitle}>SAVED NOTES</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {favorites.length === 0 ? (
          <View style={styles.emptyState}>
            <Heart size={60} color="#ddd" />
            <Text style={styles.emptyTitle}>No Favorites Yet</Text>
            <Text style={styles.emptyText}>
              Start adding notes to your favorites by clicking the heart icon on any note.
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {favorites.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </View>
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a237e',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: 20,
  },
  menuButton: {
    marginBottom: 10,
  },
  titleSection: {
    backgroundColor: '#ff4081',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  pageSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
    letterSpacing: 2,
  },
  content: {
    flex: 1,
    backgroundColor: '#1a237e',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: 20,
  },
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
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    position: 'relative',
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 1,
  },
  noteIconContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subjectTag: {
    backgroundColor: '#7e57c2',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
    marginBottom: 8,
  },
  subjectText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
  },
  noteDate: {
    fontSize: 11,
    color: '#aaa',
    marginBottom: 10,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 6,
    width: '100%',
    justifyContent: 'center',
  },
  downloadText: {
    color: '#1565c0',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 5,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    width: '100%',
    justifyContent: 'center',
  },
  removeText: {
    color: '#d32f2f',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 5,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomPadding: {
    height: 30,
  },
});
