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
import { Menu, FileText, Download, X, BookOpen } from 'lucide-react-native';
import { authAPI, userActionsAPI } from '../services/api';

export default function DownloadHistoryScreen({ navigation, onOpenSidebar }) {
  const [downloads, setDownloads] = useState([]);
  const [stats, setStats] = useState({
    mostDownloaded: [],
    totalDownloads: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const currentUser = await authAPI.getCurrentUser();
      setUser(currentUser);

      if (currentUser) {
        const response = await userActionsAPI.getDownloadHistory();
        const downloadHistory = response.downloads || [];

        // Transform API downloads to match expected format
        const downloadedNotes = downloadHistory.map(download => ({
          downloadId: download.id?.toString() || `${download.note_id}-${download.created_at}`,
          id: download.note?.id?.toString() || download.note_id?.toString(),
          title: download.note?.title || 'Untitled',
          subject: download.note?.subject || 'Other',
          description: download.note?.description || '',
          fileName: download.note?.file ? download.note.file.split('/').pop() : 'file.pdf',
          fileType: 'pdf',
          fileSize: download.note?.file_size || 'Unknown',
          uploadDate: download.note?.created_at ? new Date(download.note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown',
          downloadDate: download.created_at ? new Date(download.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown',
          uploaderId: download.note?.user_id?.toString() || 'unknown',
          uploaderName: download.note?.user?.name || 'Unknown',
          downloads: download.note?.downloads || 0,
        })).filter(note => note.id);

        setDownloads(downloadedNotes);

        // Calculate most downloaded subjects
        const subjectCount = {};
        downloadedNotes.forEach(note => {
          subjectCount[note.subject] = (subjectCount[note.subject] || 0) + 1;
        });

        const mostDownloaded = Object.entries(subjectCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([subject, count]) => ({ subject, count }));

        setStats({
          mostDownloaded,
          totalDownloads: downloadedNotes.length,
        });
      }
    } catch (error) {
      console.error('Error loading download history:', error);
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

  const handleRemoveFromHistory = (noteId) => {
    // Just remove from display, actual removal would need additional storage logic
    setDownloads(downloads.filter(note => note.id !== noteId));
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
    }
  };

  const NoteCard = ({ note }) => (
    <View style={styles.noteCard}>
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
        onPress={() => handleRemoveFromHistory(note.id)}
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
        <Text style={styles.pageTitle}>Download History</Text>
        
        {stats.mostDownloaded.length > 0 && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Most Downloaded Subjects</Text>
            <View style={styles.booksIcon}>
              <BookOpen size={28} color="#ff9800" />
            </View>
            <View style={styles.subjectsList}>
              {stats.mostDownloaded.map((item, index) => (
                <View key={index} style={styles.subjectItem}>
                  <Text style={styles.subjectName}>{item.subject}</Text>
                  <Text style={styles.subjectCount}>({item.count})</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {downloads.length === 0 ? (
          <View style={styles.emptyState}>
            <Download size={60} color="rgba(255,255,255,0.3)" />
            <Text style={styles.emptyTitle}>No Downloads Yet</Text>
            <Text style={styles.emptyText}>
              Your downloaded notes will appear here.
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {downloads.map((note) => (
              <NoteCard key={note.downloadId} note={note} />
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
    backgroundColor: '#2962ff',
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
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  booksIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff3e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  subjectsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  subjectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  subjectName: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  subjectCount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
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
