import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Menu, Home, Upload, User, FileUp, Download, BookOpen } from 'lucide-react-native';
import { storage } from '../utils/storage';
import { notesAPI, authAPI } from '../services/api';

export default function HomeScreen({ navigation, onOpenSidebar }) {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    myUploads: 0,
    downloads: 0,
    totalNotes: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const currentUser = await authAPI.getCurrentUser();
      setUser(currentUser);

      if (currentUser) {
        const userStats = await storage.getUserStats(currentUser.id);
        const notesResponse = await notesAPI.getNotes();

        setStats({
          myUploads: userStats.uploads || 0,
          downloads: userStats.downloads || 0,
          totalNotes: notesResponse.notes?.length || 0,
        });
      }
    } catch (error) {
      console.error('Error loading home data:', error);
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onOpenSidebar} style={styles.menuButton}>
            <Menu size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>Welcome!</Text>
        <Text style={styles.headerSubtitle}>
          Access and share academic resources with your fellow SNSU students
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
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
          title="Downloads"
          subtitle="Total downloads"
          count={stats.downloads}
          color="#9c27b0"
          borderColor="#8bc34a"
        />

        <StatCard
          icon={BookOpen}
          title="Total Notes"
          subtitle="Available resources"
          count={stats.totalNotes}
          color="#2d8f3e"
          borderColor="#2d8f3e"
        />
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
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTop: {
    marginBottom: 15,
  },
  menuButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderTopWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#888',
    marginLeft: 34,
  },
  cardCount: {
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: 10,
    marginLeft: 34,
  },
});
