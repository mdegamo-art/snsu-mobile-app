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
} from 'react-native';
import { Menu, Upload, FileText, AlertTriangle } from 'lucide-react-native';
import { notesAPI, authAPI } from '../services/api';
import * as DocumentPicker from 'expo-document-picker';

const SUBJECTS = ['Advance Database', 'App.Dev', 'Networking', 'Other'];

export default function UploadScreen({ navigation, onOpenSidebar }) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [user, setUser] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await authAPI.getCurrentUser();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (result.canceled === false) {
        setSelectedFile(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleUpload = async () => {
    if (!title.trim() || !subject) {
      Alert.alert('Error', 'Please fill in all required fields (Title and Subject)');
      return;
    }

    if (!selectedFile) {
      Alert.alert('Error', 'Please select a file to upload');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to upload notes');
      return;
    }

    setUploading(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('subject', subject);
      formData.append('description', description.trim());
      formData.append('file', {
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: selectedFile.mimeType || 'application/pdf',
      });

      await notesAPI.createNote(formData);

      Alert.alert(
        'Success',
        'Your notes have been uploaded successfully!',
        [{ text: 'OK', onPress: () => {
          setTitle('');
          setSubject('');
          setDescription('');
          setSelectedFile(null);
          navigation.navigate('Browse');
        }}]
      );
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to upload notes. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    setTitle('');
    setSubject('');
    setDescription('');
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
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Title <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Introduction to Calculus"
            placeholderTextColor="#999"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Subject <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowSubjectDropdown(!showSubjectDropdown)}
          >
            <Text style={subject ? styles.dropdownTextSelected : styles.dropdownTextPlaceholder}>
              {subject || 'Select a subject'}
            </Text>
          </TouchableOpacity>

          {showSubjectDropdown && (
            <View style={styles.dropdown}>
              {SUBJECTS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSubject(s);
                    setShowSubjectDropdown(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    subject === s && styles.dropdownItemTextActive
                  ]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

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

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Upload File <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity style={styles.fileUploadArea} onPress={pickDocument}>
            <View style={styles.fileIconContainer}>
              <FileText size={24} color="#666" style={{ marginTop: -10 }} />
            </View>
            {selectedFile ? (
              <>
                <Text style={styles.fileUploadTitle} numberOfLines={1}>{selectedFile.name}</Text>
                <Text style={styles.fileUploadSubtitle}>
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.fileUploadTitle}>Click to upload file</Text>
                <Text style={styles.fileUploadSubtitle}>PDF, DOC, or Image (Max 10MB)</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]} onPress={handleUpload} disabled={uploading}>
            <Text style={styles.uploadButtonText}>{uploading ? 'Uploading...' : 'Upload Notes'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <View style={styles.infoHeader}>
            <AlertTriangle size={16} color="#f57c00" />
            <Text style={styles.infoTitle}>Important:</Text>
          </View>
          <Text style={styles.infoText}>
            All uploads are tied to your verified school account. Please ensure you upload only relevant academic materials. Inappropriate content will result in suspension.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  content: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d8f3e',
    marginBottom: 8,
  },
  required: {
    color: '#d32f2f',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    color: '#333',
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  dropdownButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dropdownTextPlaceholder: {
    fontSize: 15,
    color: '#999',
  },
  dropdownTextSelected: {
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#666',
  },
  dropdownItemTextActive: {
    color: '#2d8f3e',
    fontWeight: '600',
  },
  fileUploadArea: {
    backgroundColor: '#f5f5f5',
    borderRadius: 15,
    padding: 30,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#c8e6c9',
    alignItems: 'center',
  },
  fileIconContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  fileUploadTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  fileUploadSubtitle: {
    fontSize: 13,
    color: '#888',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  uploadButton: {
    flex: 1,
    backgroundColor: '#2d8f3e',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginRight: 10,
  },
  uploadButtonDisabled: {
    backgroundColor: '#a5d6a7',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  clearButton: {
    width: 100,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  clearButtonText: {
    color: '#666',
    fontSize: 15,
    fontWeight: '500',
  },
  infoBox: {
    backgroundColor: '#fff8e1',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
    marginBottom: 30,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#f57c00',
    marginLeft: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
});
