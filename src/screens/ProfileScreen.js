import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { Menu, Edit3, Check, Trophy, Award, Flame, Diamond, Settings, Mail, Eye, History, ChevronRight } from 'lucide-react-native';
import { storage } from '../utils/storage';
import { authAPI } from '../services/api';

export default function ProfileScreen({ navigation, onOpenSidebar }) {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    uploads: 0,
    downloads: 0,
    contributionScore: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const currentUser = await authAPI.getCurrentUser();
      setUser(currentUser);

      if (currentUser) {
        const userStats = await storage.getUserStats(currentUser.id);
        setStats(userStats);
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
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

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await authAPI.logout();
            // Navigation auto-switches via RootNavigator auth state polling
          }
        },
      ]
    );
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const AchievementBadge = ({ icon: Icon, title, iconColor, bgColor }) => (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      <Icon size={28} color={iconColor} />
      <Text style={styles.badgeTitle}>{title}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onOpenSidebar} style={styles.menuButton}>
            <Menu size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(user?.name || user?.fullName)}</Text>
              </View>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name || user?.fullName || 'User'}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              <View style={styles.memberBadge}>
                <Check size={12} color="#2d8f3e" />
                <Text style={styles.memberText}>Member since {user?.memberSince || '2025'}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Account Statistics</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Uploads</Text>
            <Text style={styles.statValue}>{stats.uploads}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Downloads</Text>
            <Text style={styles.statValue}>{stats.downloads}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Contribution Score</Text>
            <Text style={[styles.statValue, styles.statValueHighlight]}>{stats.contributionScore} pts</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Account Status</Text>
            <View style={styles.statusBadge}>
              <Check size={12} color="#2d8f3e" />
              <Text style={styles.statusText}>Verified</Text>
            </View>
          </View>
        </View>

        <View style={styles.achievementsCard}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.badgesContainer}>
            <AchievementBadge
              icon={Award}
              title="First Upload"
              iconColor="#ffc107"
              bgColor="#fff8e1"
            />
            <AchievementBadge
              icon={Trophy}
              title="Knowledge Sharer"
              iconColor="#2d8f3e"
              bgColor="#e8f5e9"
            />
            <AchievementBadge
              icon={Flame}
              title="Active User"
              iconColor="#ff5722"
              bgColor="#ffccbc"
            />
            <AchievementBadge
              icon={Diamond}
              title="Top Contributor"
              iconColor="#2196f3"
              bgColor="#e3f2fd"
            />
          </View>
        </View>

        <View style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Mail size={20} color="#2d8f3e" />
              <Text style={styles.settingLabel}>Email Notifications</Text>
            </View>
            <View style={styles.statusBadge}>
              <Check size={12} color="#2d8f3e" />
              <Text style={styles.statusText}>Enabled</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Eye size={20} color="#666" />
              <Text style={styles.settingLabel}>Profile Visibility</Text>
            </View>
            <Text style={styles.settingValue}>Public</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <History size={20} color="#666" />
              <Text style={styles.settingLabel}>Download History</Text>
            </View>
            <Text style={styles.settingValue}>Private</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.editButton}>
            <Edit3 size={18} color="#fff" />
            <Text style={styles.editButtonText}>Edit Profile Settings</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  menuButton: {
    marginBottom: 10,
  },
  profileCard: {
    backgroundColor: '#2d8f3e',
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#1a5f2a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffc107',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 6,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  memberText: {
    fontSize: 11,
    color: '#fff',
    marginLeft: 4,
  },
  statsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a5f2a',
    marginBottom: 15,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  statValueHighlight: {
    color: '#2d8f3e',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 13,
    color: '#2d8f3e',
    fontWeight: '500',
    marginLeft: 4,
  },
  achievementsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badge: {
    width: '23%',
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
  },
  badgeTitle: {
    fontSize: 10,
    color: '#2d8f3e',
    textAlign: 'center',
    marginTop: 5,
    fontWeight: '500',
  },
  settingsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
  },
  settingValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2d8f3e',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 15,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  logoutButton: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d32f2f',
  },
  logoutButtonText: {
    color: '#d32f2f',
    fontSize: 15,
    fontWeight: '600',
  },
});
