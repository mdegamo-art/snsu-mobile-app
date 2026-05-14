import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
  TextInput,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Menu, Search, FileText, Heart, Download,
  ChevronDown, X, Star, Send, Trash2,
} from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notesAPI, userActionsAPI, authAPI, STORAGE_BASE } from '../services/api';

const SUBJECTS = ['All Subjects', 'Advance Database', 'App.Dev', 'Networking', 'Capstone 1'];

// ─── Star Rating ──────────────────────────────────────────────────────────────
function StarRating({ rating, onRate, size = 24, readonly = false }) {
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => !readonly && onRate && onRate(star)}
          disabled={readonly}
          activeOpacity={readonly ? 1 : 0.7}
          hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
        >
          <Star
            size={size}
            color="#ffc107"
            fill={star <= rating ? '#ffc107' : 'transparent'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Note Detail Modal ────────────────────────────────────────────────────────
function NoteDetailModal({ note, visible, onClose, user, onFavoriteToggle, isFavorite }) {
  const [comments, setComments]               = useState([]);
  const [newComment, setNewComment]           = useState('');
  const [userRating, setUserRating]           = useState(0);
  const [avgRating, setAvgRating]             = useState(0);
  const [totalRatings, setTotalRatings]       = useState(0);
  const [downloading, setDownloading]         = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (visible && note) {
      loadComments();
      loadRating();
    }
  }, [visible, note]);

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const res = await notesAPI.getComments(note.id);
      setComments(res.data || res.comments || []);
    } catch (e) {
      console.error('loadComments:', e);
    } finally {
      setLoadingComments(false);
    }
  };

  const loadRating = async () => {
    try {
      const res = await notesAPI.getRating(note.id);
      if (res.success) {
        setAvgRating(res.data?.average_rating ?? 0);
        setTotalRatings(res.data?.total_ratings ?? 0);
        setUserRating(res.data?.user_rating ?? 0);
      }
    } catch (e) {
      console.error('loadRating:', e);
    }
  };

  const handleRate = async (star) => {
    if (!user) { Alert.alert('Login Required', 'Please login to rate notes'); return; }
    try {
      const res = await notesAPI.rateNote(note.id, star);
      setUserRating(star);
      if (res.success) {
        setAvgRating(res.data?.average_rating ?? star);
        setTotalRatings(res.data?.total_ratings ?? totalRatings);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to submit rating');
    }
  };

  const handleAddComment = async () => {
    if (!user) { Alert.alert('Login Required', 'Please login to comment'); return; }
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await notesAPI.addComment(note.id, newComment.trim());
      if (res.success) {
        setComments((prev) => [res.data, ...prev]);
        setNewComment('');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = (commentId) => {
    Alert.alert('Delete Comment', 'Remove this comment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await notesAPI.deleteComment(note.id, commentId);
            setComments((prev) => prev.filter((c) => c.id !== commentId));
          } catch (e) {
            Alert.alert('Error', 'Failed to delete comment');
          }
        },
      },
    ]);
  };

  const handleDownload = async () => {
    if (!user) { Alert.alert('Login Required', 'Please login to download notes'); return; }
    setDownloading(true);
    try {
      await userActionsAPI.recordDownload(note.id);
      const filePath = note.file_path || note.fileName || '';
      const fileUrl  = filePath.startsWith('http') ? filePath : `${STORAGE_BASE}${filePath}`;
      const fileName = filePath.split('/').pop() || `${note.title}.pdf`;
      const localUri = FileSystem.cacheDirectory + fileName;
      const token    = await AsyncStorage.getItem('@auth_token');

      const { uri } = await FileSystem.downloadAsync(fileUrl, localUri, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Save "${note.title}"`,
        });
      } else {
        Alert.alert('Downloaded', `Saved to: ${uri}`);
      }
    } catch (e) {
      console.error('Download error:', e);
      Alert.alert('Error', 'Failed to download: ' + (e.message || 'Unknown error'));
    } finally {
      setDownloading(false);
    }
  };

  if (!note) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={modalStyles.container}>
          {/* Header */}
          <View style={modalStyles.header}>
            <TouchableOpacity
              onPress={onClose}
              style={modalStyles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={modalStyles.headerTitle} numberOfLines={1}>{note.title}</Text>
            <TouchableOpacity
              onPress={() => onFavoriteToggle(note.id)}
              style={modalStyles.favBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Heart size={22} color="#fff" fill={isFavorite ? '#fff' : 'transparent'} />
            </TouchableOpacity>
          </View>

          <ScrollView style={modalStyles.body} keyboardShouldPersistTaps="handled">
            {/* Meta */}
            <View style={modalStyles.metaRow}>
              <View style={modalStyles.subjectBadge}>
                <Text style={modalStyles.subjectText}>{note.subject}</Text>
              </View>
              <Text style={modalStyles.uploaderText}>by {note.user?.name || 'Unknown'}</Text>
            </View>

            {!!note.description && (
              <Text style={modalStyles.description}>{note.description}</Text>
            )}

            {/* Download button */}
            <TouchableOpacity
              style={[modalStyles.downloadBtn, downloading && { opacity: 0.7 }]}
              onPress={handleDownload}
              disabled={downloading}
              activeOpacity={0.8}
            >
              {downloading
                ? <ActivityIndicator size="small" color="#fff" />
                : <><Download size={18} color="#fff" /><Text style={modalStyles.downloadText}> Download</Text></>
              }
            </TouchableOpacity>

            {/* Rating */}
            <View style={modalStyles.section}>
              <Text style={modalStyles.sectionTitle}>Rating</Text>
              <View style={modalStyles.ratingRow}>
                <Text style={modalStyles.avgRating}>{Number(avgRating).toFixed(1)}</Text>
                <StarRating rating={Math.round(avgRating)} size={18} readonly />
                <Text style={modalStyles.ratingCount}>({totalRatings})</Text>
              </View>
              {user && (
                <>
                  <Text style={modalStyles.rateLabel}>Your rating:</Text>
                  <StarRating rating={userRating} onRate={handleRate} size={28} />
                </>
              )}
            </View>

            {/* Comments */}
            <View style={modalStyles.section}>
              <Text style={modalStyles.sectionTitle}>Comments</Text>

              {user && (
                <View style={modalStyles.commentInputRow}>
                  <TextInput
                    style={modalStyles.commentInput}
                    placeholder="Write a comment…"
                    placeholderTextColor="#aaa"
                    value={newComment}
                    onChangeText={setNewComment}
                    multiline
                  />
                  <TouchableOpacity
                    style={[
                      modalStyles.sendBtn,
                      (!newComment.trim() || submittingComment) && { opacity: 0.5 },
                    ]}
                    onPress={handleAddComment}
                    disabled={submittingComment || !newComment.trim()}
                    activeOpacity={0.8}
                  >
                    {submittingComment
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Send size={18} color="#fff" />
                    }
                  </TouchableOpacity>
                </View>
              )}

              {loadingComments ? (
                <ActivityIndicator size="small" color="#1a5f2a" style={{ marginTop: 10 }} />
              ) : comments.length === 0 ? (
                <Text style={modalStyles.noComments}>No comments yet. Be the first!</Text>
              ) : (
                comments.map((c) => (
                  <View key={c.id} style={modalStyles.commentCard}>
                    <View style={modalStyles.commentMeta}>
                      <View style={modalStyles.commentAvatar}>
                        <Text style={modalStyles.commentInitial}>
                          {(c.user?.name || 'U')[0].toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={modalStyles.commentName}>{c.user?.name || 'User'}</Text>
                        <Text style={modalStyles.commentDate}>
                          {c.created_at
                            ? new Date(c.created_at).toLocaleDateString('en-US', {
                                month: 'short', day: 'numeric', year: 'numeric',
                              })
                            : ''}
                        </Text>
                      </View>
                      {user && String(c.user_id) === String(user.id) && (
                        <TouchableOpacity
                          onPress={() => handleDeleteComment(c.id)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Trash2 size={16} color="#d32f2f" />
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={modalStyles.commentText}>{c.comment}</Text>
                  </View>
                ))
              )}

              <View style={{ height: 40 }} />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Note Card ────────────────────────────────────────────────────────────────
// ROOT CAUSE FIX:
//   Old code → TouchableOpacity (card) wrapping TouchableOpacity (fav) + TouchableOpacity (detail btn)
//   Android's touch system gives the tap to the innermost touchable, causing misses & delays.
//
// New architecture:
//   - noteCardWrapper: plain View with relative positioning
//   - Pressable (card body): handles the "open detail" tap for the whole card area
//   - Pressable (fav): absolutely positioned on top, independent touch target
//   - "View Details" label: plain View (not a button) — the card Pressable already handles the tap
function NoteCard({ note, isFav, onPress, onFavToggle }) {
  return (
    <View style={styles.noteCardWrapper}>
      {/* Card body — full tap area */}
      <Pressable
        style={styles.noteCard}
        onPress={onPress}
        android_ripple={{ color: 'rgba(0,0,0,0.06)', borderless: false }}
      >
        {/* Top spacer so content clears the absolute fav button */}
        <View style={{ width: '100%', height: 8 }} />

        <View style={styles.noteIcon}>
          <FileText size={32} color="#1565c0" />
        </View>

        <Text style={styles.noteTitle} numberOfLines={2}>{note.title}</Text>

        <View style={styles.subjectTag}>
          <Text style={styles.subjectTagText}>{note.subject}</Text>
        </View>

        <View style={styles.starRow}>
          <StarRating rating={Math.round(note.averageRating)} size={14} readonly />
          <Text style={styles.ratingLabel}>{Number(note.averageRating).toFixed(1)}</Text>
        </View>

        <Text style={styles.noteDate}>{note.uploadDate}</Text>

        {/* Styled like a button but IS NOT a touchable — card Pressable handles the tap */}
        <View style={styles.detailBtnWrap}>
          <Text style={styles.detailBtnText}>View Details</Text>
        </View>
      </Pressable>

      {/* Fav button — sits above the card in z-order, independent press */}
      <Pressable
        style={styles.favBtn}
        onPress={onFavToggle}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        android_ripple={{ color: 'rgba(211,47,47,0.15)', radius: 20, borderless: true }}
      >
        <Heart
          size={20}
          color={isFav ? '#d32f2f' : '#ccc'}
          fill={isFav ? '#d32f2f' : 'transparent'}
        />
      </Pressable>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function BrowseScreen({ navigation, onOpenSidebar }) {
  const [notes, setNotes]                     = useState([]);
  const [filteredNotes, setFilteredNotes]     = useState([]);
  const [searchQuery, setSearchQuery]         = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
  const [showDropdown, setShowDropdown]       = useState(false);
  const [favorites, setFavorites]             = useState([]);
  const [refreshing, setRefreshing]           = useState(false);
  const [user, setUser]                       = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [selectedNote, setSelectedNote]       = useState(null);
  const [showDetail, setShowDetail]           = useState(false);

  const loadData = useCallback(async () => {
    try {
      const currentUser = await authAPI.getCurrentUser();
      setUser(currentUser);

      const res = await notesAPI.getNotes();
      const raw = res.notes || [];

      const formatted = raw.map((n) => ({
        id:            n.id,
        title:         n.title,
        subject:       n.subject || 'Other',
        description:   n.description || '',
        file_path:     n.file_path || '',
        file_type:     n.file_type || 'pdf',
        uploadDate:    n.created_at
          ? new Date(n.created_at).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            })
          : 'Unknown',
        uploaderName:  n.user?.name || 'Unknown',
        user:          n.user,
        downloads:     n.download_count || 0,
        averageRating: n.average_rating || 0,
      }));

      setNotes(formatted);
      setFilteredNotes(formatted);

      if (currentUser) {
        const favRes = await userActionsAPI.getFavorites();
        const ids = (favRes.favorites || []).map((f) =>
          String(f.note?.id || f.note_id || f.id),
        );
        setFavorites(ids);
      }
    } catch (e) {
      console.error('BrowseScreen loadData:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsub = navigation.addListener('focus', loadData);
    return unsub;
  }, [navigation, loadData]);

  useEffect(() => {
    let f = notes;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      f = f.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.description.toLowerCase().includes(q),
      );
    }
    if (selectedSubject !== 'All Subjects') {
      f = f.filter((n) => n.subject === selectedSubject);
    }
    setFilteredNotes(f);
  }, [searchQuery, selectedSubject, notes]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Optimistic toggle — UI updates instantly, then reconciles with server
  const handleToggleFavorite = useCallback(async (noteId) => {
    if (!user) { Alert.alert('Login Required', 'Please login to add favorites'); return; }
    const id = String(noteId);
    const wasActive = favorites.includes(id);

    // 1. Instant UI flip
    setFavorites((prev) =>
      wasActive ? prev.filter((fid) => fid !== id) : [...prev, id],
    );

    try {
      const res = await userActionsAPI.toggleFavorite(Number(noteId));
      const serverVal = res.is_favorited ?? res.is_favorite;
      // 2. Reconcile if server disagrees
      if (serverVal !== undefined) {
        setFavorites((prev) =>
          serverVal
            ? prev.includes(id) ? prev : [...prev, id]
            : prev.filter((fid) => fid !== id),
        );
      }
    } catch (e) {
      // 3. Revert on network error
      setFavorites((prev) =>
        wasActive ? [...prev, id] : prev.filter((fid) => fid !== id),
      );
      Alert.alert('Error', 'Failed to update favorite');
    }
  }, [user, favorites]);

  const openDetail = useCallback((note) => {
    setSelectedNote(note);
    setShowDetail(true);
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a5f2a" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onOpenSidebar} style={styles.menuButton}>
          <Menu size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Browse Notes</Text>
      </View>

      {/* Search + subject filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrap}>
          <Search size={18} color="#888" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by title or description"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={16} color="#aaa" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.dropdownBtn}
          onPress={() => setShowDropdown((v) => !v)}
          activeOpacity={0.8}
        >
          <Text style={styles.dropdownText}>{selectedSubject}</Text>
          <ChevronDown size={18} color="#666" />
        </TouchableOpacity>

        {showDropdown && (
          <View style={styles.dropdown}>
            {SUBJECTS.map((s) => (
              <TouchableOpacity
                key={s}
                style={styles.dropdownItem}
                onPress={() => { setSelectedSubject(s); setShowDropdown(false); }}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.dropdownItemText,
                  selectedSubject === s && styles.dropdownItemActive,
                ]}>
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <Text style={styles.resultsText}>
        Showing {filteredNotes.length} approved note{filteredNotes.length !== 1 ? 's' : ''}
      </Text>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a5f2a" />
        }
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={false}
      >
        {filteredNotes.length === 0 ? (
          <View style={styles.emptyState}>
            <FileText size={60} color="#ddd" />
            <Text style={styles.emptyTitle}>No notes found</Text>
            <Text style={styles.emptyText}>Try a different search or subject filter.</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                isFav={favorites.includes(String(note.id))}
                onPress={() => openDetail(note)}
                onFavToggle={() => handleToggleFavorite(note.id)}
              />
            ))}
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Detail Modal */}
      <NoteDetailModal
        note={selectedNote}
        visible={showDetail}
        onClose={() => { setShowDetail(false); setSelectedNote(null); }}
        user={user}
        isFavorite={selectedNote ? favorites.includes(String(selectedNote.id)) : false}
        onFavoriteToggle={handleToggleFavorite}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    backgroundColor: '#1a5f2a',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  menuButton:  { marginBottom: 10 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff' },

  searchContainer: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#fff',
    zIndex: 20,
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchInput:        { flex: 1, paddingVertical: 11, fontSize: 14, color: '#333' },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dropdownText: { fontSize: 14, color: '#333' },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  dropdownItem:       { paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  dropdownItemText:   { fontSize: 14, color: '#666' },
  dropdownItemActive: { color: '#2d8f3e', fontWeight: '600' },

  resultsText: { fontSize: 13, color: '#888', paddingHorizontal: 20, marginVertical: 8 },
  content:     { flex: 1, paddingHorizontal: 10 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },

  // ─── Card layout ─────────────────────────────────────────────────────────────
  noteCardWrapper: {
    width: '48%',
    marginBottom: 15,
    position: 'relative', // required for absolute fav button
  },
  noteCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden', // clips android_ripple to rounded corners
  },
  favBtn: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,   // above the card Pressable
    padding: 6,
    borderRadius: 20,
  },

  noteIcon:       { marginBottom: 8 },
  noteTitle:      { fontSize: 13, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 8 },
  subjectTag:     { backgroundColor: '#7e57c2', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, marginBottom: 6 },
  subjectTagText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  starRow:        { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  ratingLabel:    { fontSize: 11, color: '#888', marginLeft: 4 },
  noteDate:       { fontSize: 10, color: '#aaa', marginBottom: 10 },

  // Plain View styled to look like a button — NOT a Touchable (card Pressable handles the tap)
  detailBtnWrap: {
    width: '100%',
    backgroundColor: '#e8f5e9',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  detailBtnText: { color: '#1a5f2a', fontSize: 12, fontWeight: '600' },

  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#555', marginTop: 16, marginBottom: 6 },
  emptyText:  { fontSize: 13, color: '#888', textAlign: 'center' },
});

const modalStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: '#1a5f2a',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeBtn:    { padding: 6 },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: 'bold', color: '#fff', marginHorizontal: 10 },
  favBtn:      { padding: 6 },
  body:        { flex: 1, padding: 16 },

  metaRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 },
  subjectBadge: { backgroundColor: '#7e57c2', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  subjectText:  { color: '#fff', fontSize: 12, fontWeight: '600' },
  uploaderText: { fontSize: 13, color: '#666' },
  description:  { fontSize: 14, color: '#555', lineHeight: 22, marginBottom: 16 },

  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1565c0',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 20,
  },
  downloadText: { color: '#fff', fontSize: 15, fontWeight: 'bold', marginLeft: 4 },

  section:      { backgroundColor: '#fff', borderRadius: 15, padding: 16, marginBottom: 16, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a5f2a', marginBottom: 12 },

  ratingRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avgRating:   { fontSize: 28, fontWeight: 'bold', color: '#ffc107', marginRight: 8 },
  ratingCount: { fontSize: 13, color: '#888', marginLeft: 6 },
  rateLabel:   { fontSize: 13, color: '#555', marginBottom: 6 },

  commentInputRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 16 },
  commentInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    maxHeight: 100,
    marginRight: 8,
  },
  sendBtn: {
    backgroundColor: '#1a5f2a',
    borderRadius: 10,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  noComments:    { fontSize: 13, color: '#aaa', textAlign: 'center', paddingVertical: 20 },
  commentCard:   { backgroundColor: '#f9f9f9', borderRadius: 10, padding: 12, marginBottom: 10 },
  commentMeta:   { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  commentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1a5f2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  commentInitial: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  commentName:    { fontSize: 13, fontWeight: '600', color: '#333' },
  commentDate:    { fontSize: 11, color: '#aaa' },
  commentText:    { fontSize: 13, color: '#555', lineHeight: 20 },
});