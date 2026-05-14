import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Menu, FileText, Eye, Heart, Clock, CheckCircle, XCircle, Download } from 'lucide-react-native';
import { authAPI, notesAPI } from '../services/api';

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  color: '#f57c00', bg: '#fff8e1', Icon: Clock },
  approved: { label: 'Approved', color: '#2d8f3e', bg: '#e8f5e9', Icon: CheckCircle },
  rejected: { label: 'Rejected', color: '#d32f2f', bg: '#ffebee', Icon: XCircle },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.Icon;
  return (
    <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
      <Icon size={12} color={cfg.color} />
      <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

export default function MyNotesScreen({ navigation, onOpenSidebar }) {
  const [myNotes, setMyNotes]     = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading]     = useState(true);
  const [user, setUser]           = useState(null);

  const loadMyNotes = useCallback(async () => {
    try {
      const currentUser = await authAPI.getCurrentUser();
      setUser(currentUser);

      if (currentUser) {
        // Use dedicated my-notes endpoint which returns all statuses for the user
        const res = await notesAPI.getMyNotes();
        const raw = res.notes || res.data || [];

        const formatted = raw.map((n) => ({
          id:          n.id,
          title:       n.title,
          subject:     n.subject || 'Other',
          description: n.description || '',
          status:      n.status || 'pending',
          uploadDate:  n.created_at
            ? new Date(n.created_at).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
              })
            : 'Unknown',
          downloads: n.download_count || 0,
          views:     n.views || 0,
          favorites: n.favorites_count || n.favorites || 0,
        }));

        setMyNotes(formatted);
      }
    } catch (e) {
      console.error('MyNotesScreen loadMyNotes:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMyNotes();
    const unsub = navigation.addListener('focus', loadMyNotes);
    return unsub;
  }, [navigation, loadMyNotes]);

  const onRefresh = () => { setRefreshing(true); loadMyNotes(); };

  const pendingCount  = myNotes.filter((n) => n.status === 'pending').length;
  const approvedCount = myNotes.filter((n) => n.status === 'approved').length;
  const rejectedCount = myNotes.filter((n) => n.status === 'rejected').length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2d8f3e" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onOpenSidebar} style={styles.menuButton}>
          <Menu size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Notes</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2d8f3e" />}
      >
        {/* ── Stats summary ─────────────────────────────── */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { borderTopColor: '#2d8f3e' }]}>
            <Text style={[styles.statNum, { color: '#2d8f3e' }]}>{approvedCount}</Text>
            <Text style={styles.statLbl}>Approved</Text>
          </View>
          <View style={[styles.statBox, { borderTopColor: '#f57c00' }]}>
            <Text style={[styles.statNum, { color: '#f57c00' }]}>{pendingCount}</Text>
            <Text style={styles.statLbl}>Pending</Text>
          </View>
          <View style={[styles.statBox, { borderTopColor: '#d32f2f' }]}>
            <Text style={[styles.statNum, { color: '#d32f2f' }]}>{rejectedCount}</Text>
            <Text style={styles.statLbl}>Rejected</Text>
          </View>
        </View>

        {/* ── Pending explanation ───────────────────────── */}
        {pendingCount > 0 && (
          <View style={styles.pendingInfo}>
            <Clock size={14} color="#f57c00" style={{ marginRight: 6 }} />
            <Text style={styles.pendingInfoText}>
              {pendingCount} note{pendingCount > 1 ? 's are' : ' is'} awaiting admin approval and won't
              appear in Browse Notes yet.
            </Text>
          </View>
        )}

        {/* ── Empty state ───────────────────────────────── */}
        {myNotes.length === 0 ? (
          <View style={styles.emptyState}>
            <FileText size={64} color="#ddd" />
            <Text style={styles.emptyTitle}>No notes uploaded yet</Text>
            <Text style={styles.emptySub}>Start sharing your notes with the community!</Text>
            <TouchableOpacity
              style={styles.uploadBtn}
              onPress={() => navigation.navigate('MainTabs', { screen: 'Upload' })}
            >
              <Text style={styles.uploadBtnText}>Upload Notes</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.notesList}>
            {myNotes.map((note) => (
              <View key={note.id} style={styles.noteCard}>
                <View style={styles.noteCardHeader}>
                  <View style={styles.subjectBadge}>
                    <Text style={styles.subjectText}>{note.subject}</Text>
                  </View>
                  <StatusBadge status={note.status} />
                </View>

                <Text style={styles.noteTitle}>{note.title}</Text>

                {note.description ? (
                  <Text style={styles.noteDesc} numberOfLines={2}>{note.description}</Text>
                ) : null}

                <View style={styles.noteFooter}>
                  <View style={styles.footerStat}>
                    <Download size={13} color="#666" />
                    <Text style={styles.footerStatText}>{note.downloads} downloads</Text>
                  </View>
                  <View style={styles.footerStat}>
                    <Heart size={13} color="#d32f2f" />
                    <Text style={styles.footerStatText}>{note.favorites} favorites</Text>
                  </View>
                  <Text style={styles.noteDate}>{note.uploadDate}</Text>
                </View>

                {note.status === 'rejected' && (
                  <View style={styles.rejectedHint}>
                    <Text style={styles.rejectedHintText}>
                      This note was not approved by the admin. You may re-upload with corrections.
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#2d8f3e',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton:  { marginRight: 15, padding: 5 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  content:     { flex: 1 },

  statsRow: { flexDirection: 'row', padding: 15, gap: 10 },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderTopWidth: 3,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  statNum: { fontSize: 26, fontWeight: 'bold' },
  statLbl: { fontSize: 11, color: '#666', marginTop: 4 },

  pendingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff8e1',
    marginHorizontal: 15,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#ffc107',
  },
  pendingInfoText: { flex: 1, fontSize: 12, color: '#666', lineHeight: 18 },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginTop: 20 },
  emptySub:   { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 8 },
  uploadBtn: {
    backgroundColor: '#2d8f3e',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  uploadBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  notesList: { padding: 15 },
  noteCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  noteCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  subjectBadge:   { backgroundColor: '#e8f5e9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  subjectText:    { color: '#2d8f3e', fontSize: 12, fontWeight: '600' },

  statusBadge:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  statusText:   { fontSize: 11, fontWeight: '600' },

  noteTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 6 },
  noteDesc:  { fontSize: 13, color: '#888', marginBottom: 10, lineHeight: 19 },

  noteFooter:     { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  footerStat:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerStatText: { fontSize: 12, color: '#666' },
  noteDate:       { fontSize: 11, color: '#aaa', marginLeft: 'auto' },

  rejectedHint: {
    backgroundColor: '#ffebee',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#d32f2f',
  },
  rejectedHintText: { fontSize: 12, color: '#c62828', lineHeight: 18 },
});