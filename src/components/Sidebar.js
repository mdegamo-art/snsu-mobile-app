import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
  ScrollView,
} from 'react-native';
import { X, Home, Search, Upload, User, LogOut, Heart, Download, Info, BookOpen, Settings } from 'lucide-react-native';
import { authAPI } from '../services/api';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.75;

export default function Sidebar({ isOpen, onClose, navigation, currentRoute, user }) {
  const translateX = React.useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;

  React.useEffect(() => {
    Animated.timing(translateX, {
      toValue: isOpen ? 0 : -SIDEBAR_WIDTH,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [isOpen]);

  const menuItems = [
    { icon: Home,   label: 'Home',        route: 'Home' },
    { icon: Search, label: 'Browse Notes', route: 'Browse' },
    { icon: Upload, label: 'Upload Notes', route: 'Upload' },
    { icon: User,   label: 'Profile',      route: 'Profile' },
  ];

  const secondaryItems = [
    { icon: Heart,    label: 'My Favorites',    route: 'Favorites' },
    { icon: Download, label: 'Download History', route: 'DownloadHistory' },
    { icon: BookOpen, label: 'My Notes',          route: 'MyNotes' },
    { icon: Settings, label: 'Settings',          route: 'Settings' },
    { icon: Info,     label: 'About',             route: 'About' },
  ];

  const tabRoutes = ['Home', 'Browse', 'Upload', 'Profile'];

  const handleNavigation = (route) => {
    if (tabRoutes.includes(route)) {
      navigation.navigate('MainTabs', { screen: route });
    } else {
      navigation.navigate(route);
    }
    onClose();
  };

  return (
    <>
      {isOpen && (
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
      )}
      <Animated.View style={[styles.container, { transform: [{ translateX }] }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/my-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#1a5f2a" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* User section */}
          {user && (
            <View style={styles.userSection}>
              <View style={styles.userAvatar}>
                <Text style={styles.userInitials}>
                  {(user.name || user.fullName)
                    ? (user.name || user.fullName).split(' ').map((n) => n[0]).join('').toUpperCase()
                    : 'U'}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName} numberOfLines={1}>{user.name || user.fullName || 'User'}</Text>
                <Text style={styles.userEmail} numberOfLines={1}>{user.email}</Text>
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>✓ Active</Text>
                </View>
              </View>
            </View>
          )}

          {/* Main menu */}
          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>Main Menu</Text>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.menuItem, currentRoute === item.route && styles.menuItemActive]}
                onPress={() => handleNavigation(item.route)}
              >
                <item.icon size={22} color={currentRoute === item.route ? '#2d8f3e' : '#666'} />
                <Text style={[styles.menuItemText, currentRoute === item.route && styles.menuItemTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.divider} />

          {/* Secondary menu */}
          <View style={styles.menuSection}>
            {secondaryItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.menuItem, currentRoute === item.route && styles.menuItemActive]}
                onPress={() => handleNavigation(item.route)}
              >
                <item.icon size={20} color={currentRoute === item.route ? '#2d8f3e' : '#888'} />
                <Text style={[styles.menuItemTextSecondary, currentRoute === item.route && styles.menuItemTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={async () => {
              onClose();
              await authAPI.logout();
            }}
          >
            <LogOut size={20} color="#d32f2f" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 998,
  },
  container: {
    position: 'absolute', top: 0, left: 0,
    width: SIDEBAR_WIDTH, height: '100%',
    backgroundColor: '#fff', zIndex: 999,
    shadowColor: '#000', shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3, shadowRadius: 5, elevation: 10,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20,
    backgroundColor: '#1a5f2a',
  },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logo:          { width: 50, height: 50, borderRadius: 25, backgroundColor: '#fff' },
  closeButton:   { padding: 8, backgroundColor: '#fff', borderRadius: 20 },
  userSection: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 20,
    backgroundColor: '#f5f5f5', borderBottomWidth: 1, borderBottomColor: '#e0e0e0',
  },
  userAvatar: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: '#1a5f2a', justifyContent: 'center', alignItems: 'center',
  },
  userInitials: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  userInfo:     { marginLeft: 12, flex: 1 },
  userName:     { fontSize: 16, fontWeight: '600', color: '#333' },
  userEmail:    { fontSize: 12, color: '#666', marginTop: 2 },
  verifiedBadge:{ backgroundColor: '#e8f5e9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, alignSelf: 'flex-start', marginTop: 4 },
  verifiedText: { fontSize: 10, color: '#2d8f3e', fontWeight: '500' },
  scrollContent: { flex: 1 },
  menuSection:   { paddingHorizontal: 15, paddingVertical: 10 },
  sectionTitle:  { fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginLeft: 5 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 15,
    borderRadius: 10, marginBottom: 4,
  },
  menuItemActive:        { backgroundColor: '#e8f5e9' },
  menuItemText:          { fontSize: 15, color: '#666', marginLeft: 15, fontWeight: '500' },
  menuItemTextActive:    { color: '#2d8f3e', fontWeight: '600' },
  menuItemTextSecondary: { fontSize: 14, color: '#888', marginLeft: 15 },
  divider:       { height: 1, backgroundColor: '#e0e0e0', marginHorizontal: 20, marginVertical: 10 },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingBottom: 30, paddingTop: 15,
    borderTopWidth: 1, borderTopColor: '#e0e0e0', backgroundColor: '#fff',
  },
  logoutButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, marginBottom: 10 },
  logoutText:   { fontSize: 15, color: '#d32f2f', marginLeft: 12, fontWeight: '500' },
  versionText:  { fontSize: 11, color: '#aaa', textAlign: 'center' },
});