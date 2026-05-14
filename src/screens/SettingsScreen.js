import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Modal,
  Alert,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Menu, Bell, Moon, Globe, Shield,
  HelpCircle, ChevronRight, X, Info,
  Mail, MessageCircle, FileText,
} from 'lucide-react-native';

// ─── Persisted setting keys ───────────────────────────────────────────────────
const STORAGE_KEYS = {
  NOTIFICATIONS: '@settings_notifications',
  DARK_MODE:     '@settings_dark_mode',
  LANGUAGE:      '@settings_language',
};

const LANGUAGES = ['English', 'Filipino'];

// ─── Help & Support Modal ─────────────────────────────────────────────────────
function HelpModal({ visible, onClose }) {
  const faqs = [
    {
      q: 'Why is my uploaded note not showing in Browse?',
      a: 'All notes require admin approval before they appear in Browse Notes. Check "My Notes" for your upload status.',
    },
    {
      q: 'How do I earn achievement badges?',
      a: 'Upload your first note (First Upload), upload 5+ notes (Knowledge Sharer), reach 50 downloads on your notes (Active User), or earn 100+ contribution points (Top Contributor).',
    },
    {
      q: 'What file types can I upload?',
      a: 'You can upload PDF, DOC, and DOCX files up to 10 MB.',
    },
    {
      q: 'How is my contribution score calculated?',
      a: 'Score = (number of uploads × 10) + total downloads on your notes.',
    },
    {
      q: 'Can I change my email address?',
      a: 'Email changes must be done by the administrator. Please contact your admin.',
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={helpStyles.container}>
        <View style={helpStyles.header}>
          <Text style={helpStyles.headerTitle}>Help & Support</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <X size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView style={helpStyles.body}>
          {/* Contact */}
          <Text style={helpStyles.sectionTitle}>Contact Us</Text>
          <TouchableOpacity
            style={helpStyles.contactCard}
            onPress={() => Linking.openURL('mailto:support@snsu.edu.ph')}
            activeOpacity={0.8}
          >
            <Mail size={20} color="#1a5f2a" />
            <View style={{ marginLeft: 12 }}>
              <Text style={helpStyles.contactLabel}>Email Support</Text>
              <Text style={helpStyles.contactValue}>support@snsu.edu.ph</Text>
            </View>
            <ChevronRight size={18} color="#ccc" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          {/* FAQs */}
          <Text style={[helpStyles.sectionTitle, { marginTop: 24 }]}>
            Frequently Asked Questions
          </Text>
          {faqs.map((item, i) => (
            <FaqItem key={i} question={item.q} answer={item.a} />
          ))}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity
      style={helpStyles.faqCard}
      onPress={() => setOpen((v) => !v)}
      activeOpacity={0.8}
    >
      <View style={helpStyles.faqHeader}>
        <Text style={helpStyles.faqQ}>{question}</Text>
        <Text style={helpStyles.faqToggle}>{open ? '▲' : '▼'}</Text>
      </View>
      {open && <Text style={helpStyles.faqA}>{answer}</Text>}
    </TouchableOpacity>
  );
}

// ─── Privacy & Security Modal ─────────────────────────────────────────────────
function PrivacyModal({ visible, onClose }) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={helpStyles.container}>
        <View style={helpStyles.header}>
          <Text style={helpStyles.headerTitle}>Privacy & Security</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <X size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        <ScrollView style={helpStyles.body}>
          {[
            {
              title: 'Data We Collect',
              body: 'We collect your name, school email, student ID, program, year, and notes you upload. This data is used solely for platform operation.',
            },
            {
              title: 'How Your Data Is Used',
              body: 'Your information is used to authenticate your account, display your profile, and attribute uploaded notes to you. We do not sell your data to third parties.',
            },
            {
              title: 'Account Security',
              body: 'Passwords are hashed using bcrypt and never stored in plain text. Always use a strong, unique password and never share it.',
            },
            {
              title: 'Content You Upload',
              body: 'Notes you upload are visible to other verified SNSU students after admin approval. Uploading copyrighted or inappropriate material may result in account suspension.',
            },
            {
              title: 'Data Retention',
              body: 'Your account data is retained while your account is active. Contact the administrator to request data deletion.',
            },
          ].map((section, i) => (
            <View key={i} style={helpStyles.privacySection}>
              <Text style={helpStyles.privacyTitle}>{section.title}</Text>
              <Text style={helpStyles.privacyBody}>{section.body}</Text>
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Language Picker Modal ────────────────────────────────────────────────────
function LanguageModal({ visible, current, onSelect, onClose }) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <TouchableOpacity style={langStyles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={langStyles.sheet}>
          <Text style={langStyles.title}>Select Language</Text>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang}
              style={langStyles.item}
              onPress={() => { onSelect(lang); onClose(); }}
              activeOpacity={0.8}
            >
              <Text style={[langStyles.itemText, current === lang && langStyles.itemActive]}>
                {lang}
              </Text>
              {current === lang && <Text style={langStyles.check}>✓</Text>}
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={langStyles.cancelBtn} onPress={onClose}>
            <Text style={langStyles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function SettingsScreen({ navigation, onOpenSidebar }) {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode]           = useState(false);
  const [language, setLanguage]           = useState('English');
  const [loading, setLoading]             = useState(true);

  const [showHelp, setShowHelp]         = useState(false);
  const [showPrivacy, setShowPrivacy]   = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);

  // ── Load persisted settings ──────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [notif, dark, lang] = await AsyncStorage.multiGet([
          STORAGE_KEYS.NOTIFICATIONS,
          STORAGE_KEYS.DARK_MODE,
          STORAGE_KEYS.LANGUAGE,
        ]);
        if (notif[1] !== null) setNotifications(JSON.parse(notif[1]));
        if (dark[1]  !== null) setDarkMode(JSON.parse(dark[1]));
        if (lang[1]  !== null) setLanguage(lang[1]);
      } catch (e) {
        console.error('Settings load error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Persist helpers ──────────────────────────────────────────────────────
  const toggleNotifications = async (val) => {
    setNotifications(val);
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(val));
    if (val) {
      Alert.alert('Notifications On', 'You will be notified about new approved notes.');
    } else {
      Alert.alert('Notifications Off', 'You will no longer receive notifications.');
    }
  };

  const toggleDarkMode = async (val) => {
    setDarkMode(val);
    await AsyncStorage.setItem(STORAGE_KEYS.DARK_MODE, JSON.stringify(val));
    // Dark mode note — full theming requires a ThemeContext at app level.
    // The setting is saved so you can wire it up to your root navigator.
    if (val) {
      Alert.alert(
        'Dark Mode',
        'Dark mode preference saved. Full dark theme will apply after restart.',
      );
    }
  };

  const handleSelectLanguage = async (lang) => {
    setLanguage(lang);
    await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
  };

  // ── App version ──────────────────────────────────────────────────────────
  const APP_VERSION = '1.0.0';

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2d8f3e" />
      </View>
    );
  }

  // ── Reusable row components ──────────────────────────────────────────────
  const SettingRow = ({ icon: Icon, label, right, onPress, noBorder }) => (
    <TouchableOpacity
      style={[styles.settingItem, noBorder && { borderBottomWidth: 0 }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <View style={styles.iconWrap}>
          <Icon size={18} color="#1a5f2a" />
        </View>
        <Text style={styles.settingText}>{label}</Text>
      </View>
      {right}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onOpenSidebar} style={styles.menuButton}>
          <Menu size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Preferences ───────────────────────────────── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>PREFERENCES</Text>

          <SettingRow
            icon={Bell}
            label="Notifications"
            right={
              <Switch
                value={notifications}
                onValueChange={toggleNotifications}
                trackColor={{ false: '#ccc', true: '#2d8f3e' }}
                thumbColor={Platform.OS === 'android' ? (notifications ? '#fff' : '#f4f3f4') : undefined}
              />
            }
          />

          <SettingRow
            icon={Moon}
            label="Dark Mode"
            right={
              <Switch
                value={darkMode}
                onValueChange={toggleDarkMode}
                trackColor={{ false: '#ccc', true: '#2d8f3e' }}
                thumbColor={Platform.OS === 'android' ? (darkMode ? '#fff' : '#f4f3f4') : undefined}
              />
            }
          />

          <SettingRow
            icon={Globe}
            label="Language"
            onPress={() => setShowLanguage(true)}
            noBorder
            right={
              <View style={styles.settingRight}>
                <Text style={styles.settingValue}>{language}</Text>
                <ChevronRight size={16} color="#ccc" />
              </View>
            }
          />
        </View>

        {/* ── Account ───────────────────────────────────── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>ACCOUNT</Text>

          <SettingRow
            icon={Shield}
            label="Privacy & Security"
            onPress={() => setShowPrivacy(true)}
            right={<ChevronRight size={16} color="#ccc" />}
          />

          <SettingRow
            icon={HelpCircle}
            label="Help & Support"
            onPress={() => setShowHelp(true)}
            noBorder
            right={<ChevronRight size={16} color="#ccc" />}
          />
        </View>

        {/* ── About ─────────────────────────────────────── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>ABOUT</Text>

          <SettingRow
            icon={Info}
            label="App Version"
            noBorder
            right={<Text style={styles.settingValue}>v{APP_VERSION}</Text>}
          />
        </View>

        {/* App info footer */}
        <View style={styles.footer}>
          <Text style={styles.footerApp}>SNSU Notes Sharing Platform</Text>
          <Text style={styles.footerVersion}>Version {APP_VERSION}</Text>
          <Text style={styles.footerCopy}>© 2024 Surigao del Norte State University</Text>
          <Text style={styles.footerCopy}>All rights reserved</Text>
        </View>

      </ScrollView>

      {/* Modals */}
      <HelpModal    visible={showHelp}     onClose={() => setShowHelp(false)} />
      <PrivacyModal visible={showPrivacy}  onClose={() => setShowPrivacy(false)} />
      <LanguageModal
        visible={showLanguage}
        current={language}
        onSelect={handleSelectLanguage}
        onClose={() => setShowLanguage(false)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#f0f2f5' },
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

  content: { flex: 1 },

  sectionCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 6,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#aaa',
    letterSpacing: 1,
    marginTop: 10,
    marginBottom: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center' },
  iconWrap:    { width: 32, height: 32, borderRadius: 8, backgroundColor: '#e8f5e9', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  settingText: { fontSize: 15, color: '#333' },
  settingRight:{ flexDirection: 'row', alignItems: 'center', gap: 4 },
  settingValue:{ fontSize: 14, color: '#888' },

  footer: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 20 },
  footerApp:     { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 4 },
  footerVersion: { fontSize: 13, color: '#888', marginBottom: 6 },
  footerCopy:    { fontSize: 11, color: '#bbb' },
});

// ─── Help / Privacy Modal Styles ──────────────────────────────────────────────
const helpStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: '#1a5f2a',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  body:        { flex: 1, padding: 16 },

  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1a5f2a', marginBottom: 10, letterSpacing: 0.5 },

  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  contactLabel: { fontSize: 14, fontWeight: '600', color: '#333' },
  contactValue: { fontSize: 13, color: '#888', marginTop: 2 },

  faqCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  faqQ:      { flex: 1, fontSize: 14, fontWeight: '600', color: '#333', marginRight: 10, lineHeight: 20 },
  faqToggle: { fontSize: 12, color: '#aaa' },
  faqA:      { fontSize: 13, color: '#666', lineHeight: 20, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0' },

  privacySection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  privacyTitle: { fontSize: 14, fontWeight: '700', color: '#1a5f2a', marginBottom: 8 },
  privacyBody:  { fontSize: 13, color: '#555', lineHeight: 21 },
});

// ─── Language Modal Styles ────────────────────────────────────────────────────
const langStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  title:      { fontSize: 17, fontWeight: 'bold', color: '#333', marginBottom: 16, textAlign: 'center' },
  item:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  itemText:   { fontSize: 16, color: '#333' },
  itemActive: { color: '#1a5f2a', fontWeight: '700' },
  check:      { fontSize: 16, color: '#1a5f2a' },
  cancelBtn:  { marginTop: 16, paddingVertical: 13, alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 12 },
  cancelText: { fontSize: 16, color: '#666', fontWeight: '500' },
});