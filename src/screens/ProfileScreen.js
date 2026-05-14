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
} from 'react-native';
import { Menu, Check, Trophy, Award, Flame, Diamond } from 'lucide-react-native';
import { authAPI, profileAPI } from '../services/api';

export default function ProfileScreen({ navigation, onOpenSidebar }) {
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await profileAPI.getProfile();
      if (res.success) {
        setProfile(res.profile);
      } else {
        // fall back to cached user
        const u = await authAPI.getCurrentUser();
        setProfile(u);
      }
    } catch (e) {
      console.error('ProfileScreen loadData:', e);
      const u = await authAPI.getCurrentUser();
      setProfile(u);
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

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await authAPI.logout();
        },
      },
    ]);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const AchievementBadge = ({ icon: Icon, title, iconColor, bgColor }) => (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      <Icon size={26} color={iconColor} />
      <Text style={styles.badgeTitle}>{title}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a5f2a" />
      </View>
    );
  }

  const uploads           = profile?.uploads_count ?? 0;
  const downloads         = profile?.total_downloads ?? 0;
  const contributionScore = profile?.contribution_score ?? (uploads * 10 + downloads);
  const memberSince       = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '2025';

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a5f2a" />}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onOpenSidebar} style={styles.menuButton}>
            <Menu size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* ── Profile card ─────────────────────────────── */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(profile?.name)}</Text>
          </View>
          <Text style={styles.profileName}>{profile?.name || 'User'}</Text>
          <Text style={styles.profileEmail}>{profile?.email}</Text>
          {profile?.student_id && (
            <Text style={styles.profileStudentId}>ID: {profile.student_id}</Text>
          )}
          {profile?.program && (
            <Text style={styles.profileProgram}>{profile.program} {profile.year ? `· ${profile.year}` : ''}</Text>
          )}
          <View style={styles.memberBadge}>
            <Check size={12} color="#2d8f3e" />
            <Text style={styles.memberText}>Member since {memberSince}</Text>
          </View>
        </View>

        {/* ── Stats ───────────────────────────────────── */}
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Account Statistics</Text>
          {[
            ['Total Uploads', uploads],
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
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Account Status</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Check size={13} color="#2d8f3e" />
              <Text style={{ fontSize: 13, color: '#2d8f3e', fontWeight: '500', marginLeft: 4 }}>
                {profile?.status === 'active' ? 'Active' : (profile?.status || 'Active')}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Achievements ────────────────────────────── */}
        <View style={styles.achievementsCard}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.badgesContainer}>
            <AchievementBadge icon={Award}   title="First Upload"      iconColor="#ffc107" bgColor="#fff8e1" />
            <AchievementBadge icon={Trophy}  title="Knowledge Sharer"  iconColor="#2d8f3e" bgColor="#e8f5e9" />
            <AchievementBadge icon={Flame}   title="Active User"       iconColor="#ff5722" bgColor="#ffccbc" />
            <AchievementBadge icon={Diamond} title="Top Contributor"   iconColor="#2196f3" bgColor="#e3f2fd" />
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#1a5f2a',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  menuButton: { marginBottom: 10 },

  profileCard: {
    backgroundColor: '#2d8f3e',
    marginHorizontal: 20,
    marginTop: -10,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1a5f2a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffc107',
    marginBottom: 12,
  },
  avatarText:      { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  profileName:     { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  profileEmail:    { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  profileStudentId:{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 2 },
  profileProgram:  { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 8 },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  memberText: { fontSize: 11, color: '#fff', marginLeft: 5 },

  statsCard: {
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statLabel: { fontSize: 14, color: '#666' },
  statValue: { fontSize: 14, fontWeight: '600', color: '#333' },

  achievementsCard: {
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
    marginBottom: 15,
  },
  badgesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badge: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
  },
  badgeTitle: { fontSize: 9, color: '#333', textAlign: 'center', marginTop: 5, fontWeight: '500' },

  logoutButton: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d32f2f',
    marginBottom: 10,
  },
  logoutButtonText: { color: '#d32f2f', fontSize: 15, fontWeight: '600' },
});