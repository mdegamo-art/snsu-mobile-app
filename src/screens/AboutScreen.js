import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Menu, BookOpen, Target, Eye, Smartphone, Shield, GraduationCap, Check } from 'lucide-react-native';

export default function AboutScreen({ navigation, onOpenSidebar }) {
  const FeatureCard = ({ icon: Icon, title, description, color }) => (
    <View style={[styles.featureCard, { borderLeftColor: color }]}>
      <View style={styles.featureIconContainer}>
        <Icon size={24} color={color} />
      </View>
      <View style={styles.featureContent}>
        <Text style={[styles.featureTitle, { color }]}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onOpenSidebar} style={styles.menuButton}>
          <Menu size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.heroSection}>
          <View style={styles.iconContainer}>
            <BookOpen size={40} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>About SNSU Notes Sharing Platform</Text>
          <Text style={styles.heroDescription}>
            Empowering Surigao del Norte State University students through collaborative learning and knowledge sharing. Our platform connects students across all programs, making quality educational resources accessible to everyone in our community.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Target size={24} color="#d32f2f" />
            <Text style={styles.sectionTitle}>Our Mission</Text>
          </View>
          <Text style={styles.sectionText}>
            To create a vibrant academic ecosystem where SNSU students can freely share, access, and collaborate on educational materials, fostering a culture of mutual support and excellence in learning.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Eye size={24} color="#ff9800" />
            <Text style={styles.sectionTitle}>Our Vision</Text>
          </View>
          <Text style={styles.sectionText}>
            To be the leading student-driven knowledge platform at SNSU, where every learner has equal access to quality educational resources, empowering academic success and lifelong learning.
          </Text>
        </View>

        <Text style={styles.whyTitle}>Why Choose SNSU Notes?</Text>

        <FeatureCard
          icon={Smartphone}
          title="Easy to Use"
          description="Intuitive interface designed specifically for students. Upload and download notes with just a few clicks."
          color="#2d8f3e"
        />

        <FeatureCard
          icon={Shield}
          title="Secure Platform"
          description="Your academic materials are protected with verified @snsu.edu.ph accounts and secure hosting."
          color="#1565c0"
        />

        <FeatureCard
          icon={GraduationCap}
          title="Quality Content"
          description="All materials are shared by fellow SNSU students, ensuring relevance to our curriculum and programs."
          color="#7b1fa2"
        />

        <View style={styles.bottomPadding} />
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
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  menuButton: {
    marginBottom: 10,
  },
  content: {
    flex: 1,
  },
  heroSection: {
    backgroundColor: '#2d8f3e',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  heroDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a5f2a',
    marginLeft: 10,
  },
  sectionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  whyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d8f3e',
    marginHorizontal: 20,
    marginTop: 25,
    marginBottom: 15,
  },
  featureCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIconContainer: {
    marginRight: 15,
    marginTop: 2,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  bottomPadding: {
    height: 30,
  },
});
