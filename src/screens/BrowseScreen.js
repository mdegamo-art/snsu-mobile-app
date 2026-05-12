import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Menu, Search, FileText, Heart, Download, ChevronDown } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { storage } from '../utils/storage';
import { notesAPI, authAPI, userActionsAPI } from '../services/api';

const SUBJECTS = ['All Subjects', 'Advance Database', 'App.Dev', 'Networking', 'Other'];

export default function BrowseScreen({ navigation, onOpenSidebar }) {
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  const [downloadingNoteId, setDownloadingNoteId] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const currentUser = await authAPI.getCurrentUser();
      setUser(currentUser);

      const notesResponse = await notesAPI.getNotes();
      const apiNotes = notesResponse.notes || [];

      // Transform API notes to match expected format
      const formattedNotes = apiNotes.map(note => ({
        id: note.id.toString(),
        title: note.title,
        subject: note.subject || 'Other',
        description: note.description || '',
        fileName: note.file ? note.file.split('/').pop() : 'file.pdf',
        fileType: 'pdf',
        fileSize: note.file_size || 'Unknown',
        uploadDate: note.created_at ? new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown',
        uploaderId: note.user_id?.toString() || 'unknown',
        uploaderName: note.user?.name || 'Unknown',
        downloads: note.downloads || 0,
      }));

      setNotes(formattedNotes);
      setFilteredNotes(formattedNotes);

      if (currentUser) {
        const favoritesResponse = await userActionsAPI.getFavorites();
        const favoriteNoteIds = favoritesResponse.favorites?.map(f => f.note_id?.toString() || f.note?.id?.toString()) || [];
        setFavorites(favoriteNoteIds);
      }
    } catch (error) {
      console.error('Error loading browse data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  useEffect(() => {
    let filtered = notes;

    if (searchQuery) {
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedSubject !== 'All Subjects') {
      filtered = filtered.filter(note => note.subject === selectedSubject);
    }

    setFilteredNotes(filtered);
  }, [searchQuery, selectedSubject, notes]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleToggleFavorite = async (noteId) => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to add favorites');
      return;
    }

    try {
      const response = await userActionsAPI.toggleFavorite(parseInt(noteId));
      
      if (response.is_favorite) {
        setFavorites([...favorites, noteId]);
      } else {
        setFavorites(favorites.filter(id => id !== noteId));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorite');
    }
  };

  const handleDownload = async (note) => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to download notes');
      return;
    }

    setDownloadingNoteId(note.id);

    try {
      // Record download in API
      await userActionsAPI.recordDownload(parseInt(note.id));

      // Construct file URL from backend
      const fileUrl = `http://192.168.1.5:8000/storage/${note.fileName}`;
      
      // Download to cache directory
      const { uri } = await FileSystem.downloadAsync(fileUrl, FileSystem.cacheDirectory + note.fileName);
      
      // Share the file so user can save it
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Save ${note.title}`,
        });
      } else {
        Alert.alert('Download Complete', `File saved to app cache: ${uri}`);
      }
    } catch (error) {
      console.error('Error downloading:', error);
      Alert.alert('Error', 'Failed to download note: ' + (error.message || 'Unknown error'));
    } finally {
      setDownloadingNoteId(null);
    }
  };

  const NoteCard = ({ note }) => (
    <View style={styles.noteCard} pointerEvents="box-none">
      <TouchableOpacity
        style={styles.favoriteButton}
        onPress={() => handleToggleFavorite(note.id)}
      >
        <Text style={{ fontSize: 24 }}>{favorites.includes(note.id) ? '❤️' : '🤍'}</Text>
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
        disabled={downloadingNoteId === note.id}
      >
        {downloadingNoteId === note.id ? (
          <ActivityIndicator size="small" color="#1565c0" />
        ) : (
          <Text style={styles.downloadText}>⬇️ Download</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => handleToggleFavorite(note.id)}
      >
        <Text style={styles.addText}>❤️ Add</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onOpenSidebar} style={styles.menuButton}>
          <Menu size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Browse Notes</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by title"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setShowSubjectDropdown(!showSubjectDropdown)}
        >
          <Text style={styles.dropdownText}>{selectedSubject}</Text>
          <ChevronDown size={20} color="#666" />
        </TouchableOpacity>

        {showSubjectDropdown && (
          <View style={styles.dropdown}>
            {SUBJECTS.map((subject) => (
              <TouchableOpacity
                key={subject}
                style={styles.dropdownItem}
                onPress={() => {
                  setSelectedSubject(subject);
                  setShowSubjectDropdown(false);
                }}
              >
                <Text style={[
                  styles.dropdownItemText,
                  selectedSubject === subject && styles.dropdownItemTextActive
                ]}>
                  {subject}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <Text style={styles.resultsText}>Showing {filteredNotes.length} notes</Text>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.grid}>
          {filteredNotes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1a5f2a',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  menuButton: {
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchContainer: {
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#fff',
    zIndex: 10,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dropdownText: {
    fontSize: 15,
    color: '#333',
  },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#666',
  },
  dropdownItemTextActive: {
    color: '#2d8f3e',
    fontWeight: '600',
  },
  resultsText: {
    fontSize: 14,
    color: '#888',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
    paddingBottom: 100,
  },
  noteCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 6,
    width: '100%',
    justifyContent: 'center',
    minHeight: 40,
    elevation: 2,
  },
  downloadText: {
    color: '#1565c0',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 5,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    width: '100%',
    justifyContent: 'center',
    minHeight: 40,
    elevation: 2,
  },
  addText: {
    color: '#d32f2f',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 5,
  },
});
