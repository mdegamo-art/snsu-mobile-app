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
import { Menu, FileUp, Download, BookOpen } from 'lucide-react-native';
import { authAPI, dashboardAPI } from '../services/api';

export default function HomeScreen({ navigation, onOpenSidebar }) {
  const [user, setUser]       = useState(null);
  const [stats, setStats]     = useState({ myUploads: 0, downloads: 0, totalNotes: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const currentUser = await authAPI.getCurrentUser();
      setUser(currentUser);

      const res = await dashboardAPI.getStats();
      if (res.success) {
        setStats({
          myUploads:  res.stats.myUploads  ?? 0,
          downloads:  res.stats.totalDownloads ?? 0,
          totalNotes: res.stats.totalNotes ?? 0,
        });
      }
    } catch (e) {
      console.error('HomeScreen loadData:', e);
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

  const StatCard = ({ icon: Icon, title, subtitle, count, color, borderColor }) => (
    <View style={[styles.card, { borderTopColor: borderColor }]}>
      <View style={styles.cardHeader}>
        <Icon size={24} color={color} />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>
      <Text style={[styles.cardCount, { color }]}>{count}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a5f2a" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onOpenSidebar} style={styles.menuButton}>
          <Menu size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
        </Text>
        <Text style={styles.headerSubtitle}>
          Access and share academic resources with your fellow SNSU students
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a5f2a" />}
      >
        <StatCard
          icon={FileUp}
          title="My Uploads"
          subtitle="Notes you shared"
          count={stats.myUploads}
          color="#f57c00"
          borderColor="#ffc107"
        />
        <StatCard
          icon={Download}
          title="Total Downloads"
          subtitle="Downloads across all notes"
          count={stats.downloads}
          color="#9c27b0"
          borderColor="#8bc34a"
        />
        <StatCard
          icon={BookOpen}
          title="Available Notes"
          subtitle="Approved notes in the library"
          count={stats.totalNotes}
          color="#2d8f3e"
          borderColor="#2d8f3e"
        />

        {/* Pending note notice */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>📋 Approval Process</Text>
          <Text style={styles.infoText}>
            Uploaded notes are reviewed by the admin before appearing in Browse. You'll see them in
            "My Notes" with a <Text style={styles.bold}>Pending</Text> badge until approved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#1a5f2a',
    paddingTop: 50,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  menuButton: { marginBottom: 15, padding: 5 },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 5 },
  content: { flex: 1, padding: 15 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderTopWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginLeft: 10 },
  cardSubtitle: { fontSize: 12, color: '#888', marginLeft: 34 },
  cardCount: { fontSize: 36, fontWeight: 'bold', marginTop: 10, marginLeft: 34 },
  infoBox: {
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    padding: 16,
    marginTop: 5,
    marginBottom: 30,
    borderLeftWidth: 4,
    borderLeftColor: '#2d8f3e',
  },
  infoTitle: { fontSize: 14, fontWeight: 'bold', color: '#1a5f2a', marginBottom: 6 },
  infoText: { fontSize: 13, color: '#555', lineHeight: 20 },
  bold: { fontWeight: 'bold' },
});