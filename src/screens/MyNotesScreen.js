import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { FileText, Eye, Heart, Trash2 } from 'lucide-react-native';
import { storage } from '../utils/storage';
import { notesAPI, authAPI } from '../services/api';

export default function MyNotesScreen({ navigation, onOpenSidebar }) {
  const [myNotes, setMyNotes] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const loadMyNotes = async () => {
    try {
      const user = await authAPI.getCurrentUser();
      setCurrentUser(user);
      if (user) {
        const notesResponse = await notesAPI.getNotes();
        const allNotes = notesResponse.notes || [];
        // Filter notes by current user - API returns user_id
        const userNotes = allNotes
          .filter(note => note.user_id?.toString() === user.id?.toString())
          .map(note => ({
            id: note.id.toString(),
            title: note.title,
            subject: note.subject || 'Other',
            description: note.description || '',
            fileName: note.file ? note.file.split('/').pop() : 'file.pdf',
            fileType: 'pdf',
            fileSize: note.file_size || 'Unknown',
            uploadDate: note.created_at ? new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown',
            uploaderId: note.user_id?.toString(),
            uploaderName: note.user?.name || 'Unknown',
            downloads: note.downloads || 0,
            views: note.views || 0,
            favorites: note.favorites || 0,
          }));
        setMyNotes(userNotes);
      }
    } catch (error) {
      console.error('Error loading my notes:', error);
    }
    setRefreshing(false);
  };

  useEffect(() => {
    loadMyNotes();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadMyNotes();
  };

  const handleDeleteNote = async (noteId) => {
    // In a real app, implement delete functionality
    alert('Delete functionality would be implemented here');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onOpenSidebar} style={styles.menuButton}>
          <View style={styles.menuIcon}>
            <View style={styles.menuLine} />
            <View style={[styles.menuLine, { width: 18 }]} />
            <View style={styles.menuLine} />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Notes</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{myNotes.length}</Text>
            <Text style={styles.statLabel}>Uploaded Notes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {myNotes.reduce((sum, note) => sum + (note.views || 0), 0)}
            </Text>
            <Text style={styles.statLabel}>Total Views</Text>
          </View>
        </View>

        {myNotes.length === 0 ? (
          <View style={styles.emptyState}>
            <FileText size={64} color="#ddd" />
            <Text style={styles.emptyTitle}>No notes uploaded yet</Text>
            <Text style={styles.emptySubtitle}>
              Start sharing your notes with the community!
            </Text>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => navigation.navigate('MainTabs', { screen: 'Upload' })}
            >
              <Text style={styles.uploadButtonText}>Upload Notes</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.notesList}>
            {myNotes.map((note) => (
              <View key={note.id} style={styles.noteCard}>
                <View style={styles.noteHeader}>
                  <View style={styles.subjectBadge}>
                    <Text style={styles.subjectText}>{note.subject}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteNote(note.id)}>
                    <Trash2 size={18} color="#d32f2f" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.noteTitle}>{note.title}</Text>
                <Text style={styles.noteDescription} numberOfLines={2}>
                  {note.description}
                </Text>
                <View style={styles.noteFooter}>
                  <View style={styles.stat}>
                    <Eye size={14} color="#666" />
                    <Text style={styles.statText}>{note.views || 0} views</Text>
                  </View>
                  <View style={styles.stat}>
                    <Heart size={14} color="#d32f2f" />
                    <Text style={styles.statText}>{note.favorites || 0} favorites</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
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
    backgroundColor: '#2d8f3e',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    marginRight: 15,
    padding: 5,
  },
  menuIcon: {
    width: 24,
    height: 18,
    justifyContent: 'space-between',
  },
  menuLine: {
    width: 24,
    height: 2,
    backgroundColor: '#fff',
    borderRadius: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  statsCard: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2d8f3e',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  uploadButton: {
    backgroundColor: '#2d8f3e',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  notesList: {
    padding: 15,
  },
  noteCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  subjectBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  subjectText: {
    color: '#2d8f3e',
    fontSize: 12,
    fontWeight: '600',
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  noteDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  noteFooter: {
    flexDirection: 'row',
    gap: 15,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#666',
  },
});
