import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Menu, FileText, AlertTriangle, CheckCircle, Clock } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { notesAPI, authAPI } from '../services/api';

const SUBJECTS = ['Advance Database', 'App.Dev', 'Networking', 'Other'];

export default function UploadScreen({ navigation, onOpenSidebar }) {
  const [title, setTitle]           = useState('');
  const [subject, setSubject]       = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading]   = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [user, setUser]             = useState(null);
  const [lastUpload, setLastUpload] = useState(null); // shows success banner

  useEffect(() => {
    authAPI.getCurrentUser().then(setUser);
  }, []);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.[0]) {
        setSelectedFile(result.assets[0]);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleUpload = async () => {
    if (!title.trim() || !subject) {
      Alert.alert('Required Fields', 'Please fill in Title and Subject');
      return;
    }
    if (!selectedFile) {
      Alert.alert('No File', 'Please select a file to upload');
      return;
    }
    if (!user) {
      Alert.alert('Not Logged In', 'Please log in to upload notes');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('subject', subject);
      formData.append('description', description.trim());
      formData.append('file', {
        uri:  selectedFile.uri,
        name: selectedFile.name,
        type: selectedFile.mimeType || 'application/pdf',
      });

      const res = await notesAPI.createNote(formData);

      if (res.success) {
        setLastUpload({ title: title.trim(), subject });
        setTitle('');
        setSubject('');
        setDescription('');
        setSelectedFile(null);
      } else {
        Alert.alert('Upload Failed', res.message || 'Please try again');
      }
    } catch (e) {
      console.error('Upload error:', e);
      Alert.alert('Upload Failed', e.response?.data?.message || e.message || 'Please try again');
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    setTitle('');
    setSubject('');
    setDescription('');
    setSelectedFile(null);
    setLastUpload(null);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onOpenSidebar} style={styles.menuButton}>
          <Menu size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Notes</Text>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">

        {/* ── Success / pending banner ─────────────────────────────────── */}
        {lastUpload && (
          <View style={styles.successBanner}>
            <CheckCircle size={22} color="#2d8f3e" style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.successTitle}>Uploaded successfully!</Text>
              <Text style={styles.successSub}>
                "{lastUpload.title}" is now <Text style={styles.pendingWord}>pending admin approval</Text>.
                It will appear in Browse Notes once approved.
              </Text>
            </View>
          </View>
        )}

        {/* ── Pending notice ───────────────────────────────────────────── */}
        <View style={styles.pendingNotice}>
          <Clock size={16} color="#f57c00" style={{ marginRight: 8 }} />
          <Text style={styles.pendingNoticeText}>
            All uploads require admin approval before they appear in Browse Notes.
          </Text>
        </View>

        {/* ── Title ───────────────────────────────────────────────────── */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Title <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Introduction to Databases"
            placeholderTextColor="#999"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* ── Subject dropdown ─────────────────────────────────────────── */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Subject <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity
            style={styles.dropdownBtn}
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <Text style={subject ? styles.dropdownSelected : styles.dropdownPlaceholder}>
              {subject || 'Select a subject'}
            </Text>
          </TouchableOpacity>

          {showDropdown && (
            <View style={styles.dropdown}>
              {SUBJECTS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={styles.dropdownItem}
                  onPress={() => { setSubject(s); setShowDropdown(false); }}
                >
                  <Text style={[styles.dropdownItemText, subject === s && styles.dropdownItemActive]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ── Description ─────────────────────────────────────────────── */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Briefly describe the content of your notes"
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* ── File picker ─────────────────────────────────────────────── */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>File <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity style={styles.fileArea} onPress={pickDocument}>
            <FileText size={28} color={selectedFile ? '#1a5f2a' : '#999'} />
            {selectedFile ? (
              <>
                <Text style={styles.fileName} numberOfLines={1}>{selectedFile.name}</Text>
                <Text style={styles.fileSize}>
                  {selectedFile.size
                    ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
                    : 'Size unknown'}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.filePrompt}>Tap to select a file</Text>
                <Text style={styles.fileHint}>PDF or DOC (max 10 MB)</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Buttons ─────────────────────────────────────────────────── */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.uploadBtn, uploading && styles.uploadBtnDisabled]}
            onPress={handleUpload}
            disabled={uploading}
          >
            {uploading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.uploadBtnText}>Upload Notes</Text>
            }
          </TouchableOpacity>
          <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        </View>

        {/* ── Warning ─────────────────────────────────────────────────── */}
        <View style={styles.warningBox}>
          <View style={styles.warningHeader}>
            <AlertTriangle size={15} color="#f57c00" />
            <Text style={styles.warningTitle}> Important</Text>
          </View>
          <Text style={styles.warningText}>
            All uploads are tied to your verified school account. Please upload only relevant
            academic materials. Inappropriate content will result in account suspension.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
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
  content:     { flex: 1, padding: 20 },

  successBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2d8f3e',
  },
  successTitle: { fontSize: 14, fontWeight: 'bold', color: '#1a5f2a', marginBottom: 4 },
  successSub:   { fontSize: 13, color: '#555', lineHeight: 19 },
  pendingWord:  { fontWeight: 'bold', color: '#f57c00' },

  pendingNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff8e1',
    borderRadius: 10,
    padding: 12,
    marginBottom: 18,
    borderLeftWidth: 3,
    borderLeftColor: '#ffc107',
  },
  pendingNoticeText: { flex: 1, fontSize: 13, color: '#666' },

  inputGroup:  { marginBottom: 20 },
  label:       { fontSize: 14, fontWeight: '600', color: '#2d8f3e', marginBottom: 8 },
  required:    { color: '#d32f2f' },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    color: '#333',
  },
  textArea: { height: 100, paddingTop: 13 },

  dropdownBtn: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dropdownSelected:   { fontSize: 15, color: '#333' },
  dropdownPlaceholder:{ fontSize: 15, color: '#999' },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 5,
  },
  dropdownItem:     { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  dropdownItemText: { fontSize: 15, color: '#666' },
  dropdownItemActive:{ color: '#2d8f3e', fontWeight: '600' },

  fileArea: {
    backgroundColor: '#f5f5f5',
    borderRadius: 15,
    padding: 30,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#c8e6c9',
    alignItems: 'center',
  },
  fileName:   { fontSize: 14, fontWeight: '600', color: '#333', marginTop: 10, textAlign: 'center' },
  fileSize:   { fontSize: 12, color: '#888', marginTop: 4 },
  filePrompt: { fontSize: 15, fontWeight: '600', color: '#555', marginTop: 10 },
  fileHint:   { fontSize: 12, color: '#999', marginTop: 4 },

  buttonRow: { flexDirection: 'row', marginBottom: 20 },
  uploadBtn: {
    flex: 1,
    backgroundColor: '#2d8f3e',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginRight: 10,
    elevation: 2,
  },
  uploadBtnDisabled: { backgroundColor: '#a5d6a7' },
  uploadBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  clearBtn: {
    width: 90,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  clearBtnText: { color: '#666', fontSize: 15, fontWeight: '500' },

  warningBox: {
    backgroundColor: '#fff8e1',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
    marginBottom: 10,
  },
  warningHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  warningTitle:  { fontSize: 13, fontWeight: 'bold', color: '#f57c00' },
  warningText:   { fontSize: 12, color: '#666', lineHeight: 18 },
});