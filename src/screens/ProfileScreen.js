import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Image,
  ActionSheetIOS,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import {
  Menu, Check, Trophy, Award, Flame, Diamond,
  Camera, Lock, X, Eye, EyeOff,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { authAPI, profileAPI, STORAGE_BASE } from '../services/api';

// ─── Build full image URL from stored path ────────────────────────────────────
function buildAvatarUrl(picturePath) {
  if (!picturePath) return null;
  if (picturePath.startsWith('http')) return picturePath;
  if (picturePath.startsWith('uploads/')) {
    // shared hosting: file lives directly in /public/
    return STORAGE_BASE.replace('/storage/', '/') + picturePath;
  }
  // local dev: file is under storage/app/public/
  return STORAGE_BASE + picturePath;
}

// ─── Achievement definitions ──────────────────────────────────────────────────
// Each badge is earned when its condition (computed from real profile data) is true.
function computeAchievements(profile) {
  const uploads   = profile?.uploads_count   ?? 0;
  const downloads = profile?.total_downloads ?? 0;
  const score     = profile?.contribution_score ?? 0;

  return [
    {
      id:       'first_upload',
      icon:     Award,
      title:    'First Upload',
      desc:     'Upload your first note',
      earned:   uploads >= 1,
      iconColor:'#ffc107',
      bgColor:  '#fff8e1',
      lockColor:'#e0c040',
    },
    {
      id:       'knowledge_sharer',
      icon:     Trophy,
      title:    'Knowledge Sharer',
      desc:     'Upload 5 or more notes',
      earned:   uploads >= 5,
      iconColor:'#2d8f3e',
      bgColor:  '#e8f5e9',
      lockColor:'#80c880',
    },
    {
      id:       'active_user',
      icon:     Flame,
      title:    'Active User',
      desc:     'Reach 50 total downloads on your notes',
      earned:   downloads >= 50,
      iconColor:'#ff5722',
      bgColor:  '#ffccbc',
      lockColor:'#ff9070',
    },
    {
      id:       'top_contributor',
      icon:     Diamond,
      title:    'Top Contributor',
      desc:     'Earn 100+ contribution points',
      earned:   score >= 100,
      iconColor:'#2196f3',
      bgColor:  '#e3f2fd',
      lockColor:'#90caf9',
    },
  ];
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ url, initials, onPress, uploading }) {
  return (
    <TouchableOpacity style={styles.avatarWrapper} onPress={onPress} activeOpacity={0.85}>
      {url ? (
        <Image source={{ uri: url }} style={styles.avatarImage} />
      ) : (
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      )}
      <View style={styles.cameraBadge}>
        {uploading
          ? <ActivityIndicator size="small" color="#fff" />
          : <Camera size={14} color="#fff" />
        }
      </View>
    </TouchableOpacity>
  );
}

// ─── Change Password Modal ────────────────────────────────────────────────────
function ChangePasswordModal({ visible, onClose }) {
  const [currentPw, setCurrentPw]   = useState('');
  const [newPw, setNewPw]           = useState('');
  const [confirmPw, setConfirmPw]   = useState('');
  const [loading, setLoading]       = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const reset = () => {
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async () => {
    // ── Client-side validation ──────────────────────────
    if (!currentPw || !newPw || !confirmPw) {
      Alert.alert('Required', 'Please fill in all fields.'); return;
    }
    if (newPw.length < 8) {
      Alert.alert('Too Short', 'New password must be at least 8 characters.'); return;
    }
    if (newPw !== confirmPw) {
      Alert.alert('Mismatch', 'New password and confirmation do not match.'); return;
    }
    if (newPw === currentPw) {
      Alert.alert('Same Password', 'New password must be different from the current one.'); return;
    }

    setLoading(true);
    try {
      // POST /api/profile/password
      // Body: current_password, new_password, new_password_confirmation
      // Backend: StudentProfileController::changePassword()
      // Same DB → password change reflects instantly on web app too
      const res = await profileAPI.changePassword({
        current_password:      currentPw,
        new_password:          newPw,
        new_password_confirmation: confirmPw,
      });

      if (res.success) {
        Alert.alert(
          '✅ Password Changed',
          'Your password has been updated. This also applies to your web account.',
          [{ text: 'OK', onPress: handleClose }],
        );
      } else {
        Alert.alert('Failed', res.message || 'Could not change password.');
      }
    } catch (e) {
      const msg = e.response?.data?.message || e.message || 'Something went wrong.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const PwField = ({ label, value, onChange, show, onToggle, placeholder }) => (
    <View style={pwStyles.fieldGroup}>
      <Text style={pwStyles.label}>{label}</Text>
      <View style={pwStyles.inputRow}>
        <TextInput
          style={pwStyles.input}
          value={value}
          onChangeText={onChange}
          secureTextEntry={!show}
          placeholder={placeholder}
          placeholderTextColor="#bbb"
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={onToggle} style={pwStyles.eyeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          {show ? <EyeOff size={18} color="#888" /> : <Eye size={18} color="#888" />}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={pwStyles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={pwStyles.sheet}>
          {/* Header */}
          <View style={pwStyles.header}>
            <View style={pwStyles.headerLeft}>
              <Lock size={20} color="#1a5f2a" />
              <Text style={pwStyles.headerTitle}>Change Password</Text>
            </View>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={22} color="#666" />
            </TouchableOpacity>
          </View>

          <Text style={pwStyles.note}>
            This password is shared between your mobile app and web account — changing it here updates both.
          </Text>

          <PwField
            label="Current Password"
            value={currentPw}
            onChange={setCurrentPw}
            show={showCurrent}
            onToggle={() => setShowCurrent((v) => !v)}
            placeholder="Enter current password"
          />
          <PwField
            label="New Password"
            value={newPw}
            onChange={setNewPw}
            show={showNew}
            onToggle={() => setShowNew((v) => !v)}
            placeholder="Minimum 8 characters"
          />
          <PwField
            label="Confirm New Password"
            value={confirmPw}
            onChange={setConfirmPw}
            show={showConfirm}
            onToggle={() => setShowConfirm((v) => !v)}
            placeholder="Re-enter new password"
          />

          {/* Strength hint */}
          {newPw.length > 0 && (
            <View style={pwStyles.strengthRow}>
              <View style={[pwStyles.strengthBar, { backgroundColor: newPw.length >= 8 ? '#2d8f3e' : newPw.length >= 5 ? '#ffc107' : '#d32f2f' }]} />
              <Text style={pwStyles.strengthLabel}>
                {newPw.length >= 8 ? 'Strong ✓' : newPw.length >= 5 ? 'Medium' : 'Too short'}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[pwStyles.submitBtn, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={pwStyles.submitText}>Update Password</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Achievement Badge ────────────────────────────────────────────────────────
function AchievementBadge({ icon: Icon, title, desc, earned, iconColor, bgColor, lockColor }) {
  return (
    <TouchableOpacity
      style={[styles.badge, { backgroundColor: earned ? bgColor : '#f0f0f0' }]}
      activeOpacity={0.8}
      onPress={() =>
        Alert.alert(
          earned ? `🏆 ${title}` : `🔒 ${title}`,
          earned ? `Achievement unlocked!\n\n${desc}` : `Not yet earned.\n\n${desc}`,
        )
      }
    >
      <Icon size={26} color={earned ? iconColor : '#ccc'} />
      <Text style={[styles.badgeTitle, { color: earned ? '#333' : '#bbb' }]}>{title}</Text>
      {!earned && (
        <View style={styles.lockOverlay}>
          <Text style={{ fontSize: 10 }}>🔒</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ProfileScreen({ navigation, onOpenSidebar }) {
  const [profile, setProfile]         = useState(null);
  const [avatarUrl, setAvatarUrl]     = useState(null);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [uploading, setUploading]     = useState(false);
  const [showPwModal, setShowPwModal] = useState(false);

  // ── Load profile from backend ─────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const res  = await profileAPI.getProfile();
      const data = res.success ? res.profile : await authAPI.getCurrentUser();
      setProfile(data);
      setAvatarUrl(buildAvatarUrl(data?.profile_picture));
    } catch (e) {
      console.error('ProfileScreen loadData:', e);
      const u = await authAPI.getCurrentUser();
      setProfile(u);
      setAvatarUrl(buildAvatarUrl(u?.profile_picture));
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

  // ── Permission helper ──────────────────────────────────────────────────────
  const requestPermission = async (type) => {
    const fn = type === 'camera'
      ? ImagePicker.requestCameraPermissionsAsync
      : ImagePicker.requestMediaLibraryPermissionsAsync;
    const { status } = await fn();
    if (status !== 'granted') {
      Alert.alert('Permission Required', `${type === 'camera' ? 'Camera' : 'Photo library'} access is needed.`);
      return false;
    }
    return true;
  };

  // ── Pick / take photo ──────────────────────────────────────────────────────
  const pickFromLibrary = async () => {
    if (!(await requestPermission('library'))) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) await uploadPicture(result.assets[0]);
  };

  const takePhoto = async () => {
    if (!(await requestPermission('camera'))) return;
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) await uploadPicture(result.assets[0]);
  };

  const handleChangePhoto = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', 'Take Photo', 'Choose from Library'], cancelButtonIndex: 0 },
        (i) => { if (i === 1) takePhoto(); if (i === 2) pickFromLibrary(); },
      );
    } else {
      Alert.alert('Change Profile Picture', 'Choose an option', [
        { text: 'Cancel', style: 'cancel' },
        { text: '📷 Take Photo', onPress: takePhoto },
        { text: '🖼 Choose from Library', onPress: pickFromLibrary },
      ]);
    }
  };

  // ── Upload picture to backend ──────────────────────────────────────────────
  const uploadPicture = async (asset) => {
    setUploading(true);
    setAvatarUrl(asset.uri); // optimistic
    try {
      const ext      = asset.uri.split('.').pop() || 'jpg';
      const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
      const formData = new FormData();
      formData.append('profile_picture', { uri: asset.uri, name: `profile_${Date.now()}.${ext}`, type: mimeType });

      const res = await profileAPI.uploadPicture(formData);
      if (res.success) {
        const url = res.url || buildAvatarUrl(res.profile_picture);
        setAvatarUrl(url);
        setProfile((prev) => ({ ...prev, profile_picture: res.profile_picture }));
        Alert.alert('Success', 'Profile picture updated!');
      } else {
        throw new Error(res.message || 'Upload failed');
      }
    } catch (e) {
      setAvatarUrl(buildAvatarUrl(profile?.profile_picture)); // revert
      Alert.alert('Upload Failed', e.message || 'Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => await authAPI.logout() },
    ]);
  };

  const getInitials = (name) =>
    name ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a5f2a" />
      </View>
    );
  }

  const uploads           = profile?.uploads_count   ?? 0;
  const downloads         = profile?.total_downloads ?? 0;
  const contributionScore = profile?.contribution_score ?? (uploads * 10 + downloads);
  const memberSince       = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '2025';
  const achievements      = computeAchievements(profile);
  const earnedCount       = achievements.filter((a) => a.earned).length;

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a5f2a" />}
      >
        {/* ── Header ─────────────────────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onOpenSidebar} style={styles.menuButton}>
            <Menu size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* ── Profile card ───────────────────────────────── */}
        <View style={styles.profileCard}>
          <Avatar
            url={avatarUrl}
            initials={getInitials(profile?.name)}
            onPress={handleChangePhoto}
            uploading={uploading}
          />
          <Text style={styles.changePhotoHint}>Tap avatar to change photo</Text>
          <Text style={styles.profileName}>{profile?.name || 'User'}</Text>
          <Text style={styles.profileEmail}>{profile?.email}</Text>
          {!!profile?.student_id && <Text style={styles.profileMeta}>ID: {profile.student_id}</Text>}
          {!!profile?.program && (
            <Text style={styles.profileMeta}>
              {profile.program}{profile.year ? ` · ${profile.year}` : ''}
            </Text>
          )}
          <View style={styles.memberBadge}>
            <Check size={12} color="#2d8f3e" />
            <Text style={styles.memberText}>Member since {memberSince}</Text>
          </View>
        </View>

        {/* ── Account Statistics ──────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Account Statistics</Text>
          {[
            ['Total Uploads',   uploads],
            ['Total Downloads', downloads],
          ].map(([label, val]) => (
            <View key={label} style={styles.statRow}>
              <Text style={styles.statLabel}>{label}</Text>
              <Text style={styles.statValue}>{val}</Text>
            </View>
          ))}
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Contribution Score</Text>
            <Text style={[styles.statValue, { color: '#2d8f3e' }]}>{contributionScore} pts</Text>
          </View>
          <View style={[styles.statRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.statLabel}>Account Status</Text>
            <View style={styles.statusRow}>
              <Check size={13} color="#2d8f3e" />
              <Text style={styles.statusText}>
                {profile?.status === 'active' ? 'Active' : (profile?.status || 'Active')}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Achievements ────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.achievementHeader}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <Text style={styles.achievementCount}>
              {earnedCount}/{achievements.length} earned
            </Text>
          </View>

          <Text style={styles.achievementHint}>Tap a badge to see how to earn it.</Text>

          <View style={styles.badgesContainer}>
            {achievements.map((a) => (
              <AchievementBadge key={a.id} {...a} />
            ))}
          </View>

          {/* Progress bar */}
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${(earnedCount / achievements.length) * 100}%` }]} />
          </View>
          <Text style={styles.progressLabel}>
            {earnedCount === achievements.length
              ? '🎉 All achievements unlocked!'
              : `${achievements.length - earnedCount} more to go`}
          </Text>
        </View>

        {/* ── Security ────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Security</Text>
          <TouchableOpacity style={styles.securityItem} onPress={() => setShowPwModal(true)} activeOpacity={0.8}>
            <View style={styles.securityLeft}>
              <View style={styles.securityIconWrap}>
                <Lock size={18} color="#1a5f2a" />
              </View>
              <View>
                <Text style={styles.securityLabel}>Change Password</Text>
                <Text style={styles.securitySub}>Updates on both mobile & web</Text>
              </View>
            </View>
            <Text style={styles.securityArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* ── Logout ──────────────────────────────────────── */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Change Password Modal ────────────────────────── */}
      <ChangePasswordModal visible={showPwModal} onClose={() => setShowPwModal(false)} />
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
    paddingHorizontal: 20,
    paddingBottom: 35,
  },
  menuButton: { marginBottom: 10 },

  // Profile card
  profileCard: {
    backgroundColor: '#2d8f3e',
    marginHorizontal: 20,
    marginTop: -15,
    borderRadius: 20,
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },

  // Avatar
  avatarWrapper:   { width: 88, height: 88, borderRadius: 44, marginBottom: 6, position: 'relative' },
  avatarImage:     { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: '#ffc107' },
  avatarFallback:  { width: 88, height: 88, borderRadius: 44, backgroundColor: '#1a5f2a', borderWidth: 3, borderColor: '#ffc107', justifyContent: 'center', alignItems: 'center' },
  avatarText:      { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  cameraBadge:     { position: 'absolute', bottom: 2, right: 2, width: 26, height: 26, borderRadius: 13, backgroundColor: '#1a5f2a', borderWidth: 2, borderColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  changePhotoHint: { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginBottom: 10 },
  profileName:     { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 4, textAlign: 'center' },
  profileEmail:    { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 4, textAlign: 'center' },
  profileMeta:     { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 3, textAlign: 'center' },
  memberBadge:     { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, marginTop: 8 },
  memberText:      { fontSize: 11, color: '#fff', marginLeft: 5 },

  // Generic card
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 15,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a5f2a', marginBottom: 14 },
  statRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  statLabel:  { fontSize: 14, color: '#666' },
  statValue:  { fontSize: 14, fontWeight: '600', color: '#333' },
  statusRow:  { flexDirection: 'row', alignItems: 'center' },
  statusText: { fontSize: 13, color: '#2d8f3e', fontWeight: '500', marginLeft: 4 },

  // Achievements
  achievementHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  achievementCount:  { fontSize: 13, color: '#888', fontWeight: '500' },
  achievementHint:   { fontSize: 12, color: '#aaa', marginBottom: 16 },
  badgesContainer:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  badge: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
    position: 'relative',
  },
  badgeTitle:  { fontSize: 9, textAlign: 'center', marginTop: 5, fontWeight: '500' },
  lockOverlay: { position: 'absolute', top: 4, right: 4 },

  // Progress bar
  progressBarBg:   { height: 6, backgroundColor: '#f0f0f0', borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  progressBarFill: { height: '100%', backgroundColor: '#2d8f3e', borderRadius: 3 },
  progressLabel:   { fontSize: 12, color: '#888', textAlign: 'center' },

  // Security
  securityItem:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  securityLeft:    { flexDirection: 'row', alignItems: 'center' },
  securityIconWrap:{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#e8f5e9', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  securityLabel:   { fontSize: 15, color: '#333', fontWeight: '500' },
  securitySub:     { fontSize: 12, color: '#aaa', marginTop: 2 },
  securityArrow:   { fontSize: 22, color: '#ccc', marginRight: 4 },

  // Logout
  logoutButton:     { backgroundColor: '#fff', marginHorizontal: 20, marginTop: 15, borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#d32f2f' },
  logoutButtonText: { color: '#d32f2f', fontSize: 15, fontWeight: '600' },
});

// ─── Change Password Modal Styles ─────────────────────────────────────────────
const pwStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerLeft:  { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a5f2a', marginLeft: 8 },

  note: {
    fontSize: 13,
    color: '#888',
    lineHeight: 19,
    marginBottom: 20,
    backgroundColor: '#e8f5e9',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#2d8f3e',
  },

  fieldGroup: { marginBottom: 16 },
  label:      { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6 },
  inputRow:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', borderRadius: 12, borderWidth: 1, borderColor: '#e0e0e0' },
  input:      { flex: 1, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: '#333' },
  eyeBtn:     { paddingHorizontal: 12, paddingVertical: 13 },

  // Password strength
  strengthRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  strengthBar:  { height: 5, flex: 1, borderRadius: 3 },
  strengthLabel:{ fontSize: 12, color: '#666', width: 70 },

  submitBtn: {
    backgroundColor: '#2d8f3e',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
    elevation: 2,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});