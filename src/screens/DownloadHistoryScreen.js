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
import { Menu, FileText, Download, BookOpen } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, userActionsAPI, STORAGE_BASE } from '../services/api';

export default function DownloadHistoryScreen({ navigation, onOpenSidebar }) {
  const [downloads, setDownloads]   = useState([]);
  const [stats, setStats]           = useState({ mostDownloaded: [], total: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading]       = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [user, setUser]             = useState(null);

  const loadData = useCallback(async () => {
    try {
      const currentUser = await authAPI.getCurrentUser();
      setUser(currentUser);

      if (currentUser) {
        const res = await userActionsAPI.getDownloadHistory();
        const raw = res.downloads || res.history?.data || [];

        const formatted = raw
          .filter((d) => d.note || d.note_id)
          .map((d) => {
            const note = d.note || {};
            return {
              downloadId:  String(d.id || `${d.note_id}-${d.created_at}`),
              id:          String(note.id || d.note_id),
              title:       note.title || 'Untitled',
              subject:     note.subject || 'Other',
              description: note.description || '',
              file_path:   note.file_path || '',
              file_type:   note.file_type || 'pdf',
              uploadDate:  note.created_at
                ? new Date(note.created_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })
                : 'Unknown',
              downloadDate: d.downloaded_at || d.created_at
                ? new Date(d.downloaded_at || d.created_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })
                : 'Unknown',
              uploaderName: note.user?.name || 'Unknown',
            };
          });

        setDownloads(formatted);

        // Build most downloaded subjects from local data
        const subjectMap = {};
        formatted.forEach((n) => {
          subjectMap[n.subject] = (subjectMap[n.subject] || 0) + 1;
        });
        const mostDownloaded = Object.entries(subjectMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([subject, count]) => ({ subject, count }));

        setStats({ mostDownloaded, total: formatted.length });
      }
    } catch (e) {
      console.error('DownloadHistoryScreen loadData:', e);
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

  const handleDownload = async (note) => {
    setDownloadingId(note.id);
    try {
      await userActionsAPI.recordDownload(parseInt(note.id));
      const fileUrl  = note.file_path.startsWith('http') ? note.file_path : `${STORAGE_BASE}${note.file_path}`;
      const fileName = note.file_path.split('/').pop() || `${note.title}.pdf`;
      const localUri = FileSystem.cacheDirectory + fileName;
      const token    = await AsyncStorage.getItem('@auth_token');

      const { uri } = await FileSystem.downloadAsync(fileUrl, localUri, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `Save "${note.title}"` });
      } else {
        Alert.alert('Downloaded', 'File saved to cache.');
      }
    } catch (e) {
      Alert.alert('Error', 'Download failed: ' + (e.message || 'Unknown'));
    } finally {
      setDownloadingId(null);
    }
  };

  const NoteCard = ({ note }) => (
    <View style={styles.noteCard}>
      <View style={styles.noteIcon}>
        <FileText size={30} color="#1565c0" />
      </View>
      <Text style={styles.noteTitle} numberOfLines={2}>{note.title}</Text>
      <View style={styles.subjectTag}>
        <Text style={styles.subjectTagText}>{note.subject}</Text>
      </View>
      <Text style={styles.noteDate}>Downloaded: {note.downloadDate}</Text>

      <TouchableOpacity
        style={styles.downloadBtn}
        onPress={() => handleDownload(note)}
        disabled={downloadingId === note.id}
      >
        {downloadingId === note.id
          ? <ActivityIndicator size="small" color="#1565c0" />
          : <><Download size={14} color="#1565c0" /><Text style={styles.downloadText}> Re-download</Text></>
        }
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2962ff" />
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
        <Text style={styles.pageTitle}>Download History</Text>

        {stats.mostDownloaded.length > 0 && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Most Downloaded Subjects</Text>
            <View style={styles.booksIconWrap}>
              <BookOpen size={26} color="#ff9800" />
            </View>
            <View style={styles.subjectsList}>
              {stats.mostDownloaded.map((item, i) => (
                <View key={i} style={styles.subjectItem}>
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
      >
        {downloads.length === 0 ? (
          <View style={styles.emptyState}>
            <Download size={60} color="rgba(255,255,255,0.3)" />
            <Text style={styles.emptyTitle}>No Downloads Yet</Text>
            <Text style={styles.emptyText}>Your downloaded notes will appear here.</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {downloads.map((note) => (
              <NoteCard key={note.downloadId} note={note} />
            ))}
          </View>
        )}
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#2962ff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:           { paddingTop: 50, paddingBottom: 10, paddingHorizontal: 20 },
  menuButton:       { marginBottom: 10 },
  titleSection:     { paddingHorizontal: 20, paddingBottom: 20 },
  pageTitle:        { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  statsCard:        { backgroundColor: '#fff', borderRadius: 20, padding: 20, alignItems: 'center' },
  statsTitle:       { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  booksIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff3e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectsList: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  subjectItem:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 15 },
  subjectName:  { fontSize: 13, color: '#333', fontWeight: '500' },
  subjectCount: { fontSize: 12, color: '#666', marginLeft: 4 },
  content:      { flex: 1, backgroundColor: '#1a237e', borderTopLeftRadius: 25, borderTopRightRadius: 25, paddingTop: 20 },
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
    elevation: 3,
  },
  noteIcon:      { marginTop: 8, marginBottom: 8 },
  noteTitle:     { fontSize: 13, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 8 },
  subjectTag:    { backgroundColor: '#7e57c2', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, marginBottom: 6 },
  subjectTagText:{ color: '#fff', fontSize: 10, fontWeight: '600' },
  noteDate:      { fontSize: 10, color: '#aaa', marginBottom: 10, textAlign: 'center' },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    width: '100%',
    justifyContent: 'center',
    minHeight: 38,
  },
  downloadText: { color: '#1565c0', fontSize: 12, fontWeight: '500' },
  emptyState:   { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyTitle:   { fontSize: 20, fontWeight: 'bold', color: '#fff', marginTop: 20, marginBottom: 10 },
  emptyText:    { fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 22 },
});