import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useState, useEffect, useCallback } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Home, Search, Upload, User } from 'lucide-react-native';

import { authAPI } from './src/services/api';
import Sidebar from './src/components/Sidebar';

// Screens
import LoginScreen from './src/screens/LoginScreen';
// Signup removed - registration is admin-only
import HomeScreen from './src/screens/HomeScreen';
import BrowseScreen from './src/screens/BrowseScreen';
import UploadScreen from './src/screens/UploadScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AboutScreen from './src/screens/AboutScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import DownloadHistoryScreen from './src/screens/DownloadHistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import MyNotesScreen from './src/screens/MyNotesScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack (Login only - registration is admin-only)
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

// Main Tab Navigator
function MainTabs({ onOpenSidebar }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingBottom: 10,
          paddingTop: 10,
          height: 70,
        },
        tabBarActiveTintColor: '#2d8f3e',
        tabBarInactiveTintColor: '#888',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        options={{
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      >
        {props => <HomeScreen {...props} onOpenSidebar={onOpenSidebar} />}
      </Tab.Screen>
      <Tab.Screen
        name="Browse"
        options={{
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
        }}
      >
        {props => <BrowseScreen {...props} onOpenSidebar={onOpenSidebar} />}
      </Tab.Screen>
      <Tab.Screen
        name="Upload"
        options={{
          tabBarIcon: ({ color, size }) => <Upload size={size} color={color} />,
        }}
      >
        {props => <UploadScreen {...props} onOpenSidebar={onOpenSidebar} />}
      </Tab.Screen>
      <Tab.Screen
        name="Profile"
        options={{
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      >
        {props => <ProfileScreen {...props} onOpenSidebar={onOpenSidebar} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// Main Stack (authenticated screens)
function MainStack({ onOpenSidebar, sidebarOpen, onCloseSidebar, currentRoute, currentUser }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs">
        {props => (
          <>
            <MainTabs {...props} onOpenSidebar={onOpenSidebar} />
            <Sidebar
              isOpen={sidebarOpen}
              onClose={onCloseSidebar}
              navigation={props.navigation}
              currentRoute={currentRoute}
              user={currentUser}
            />
          </>
        )}
      </Stack.Screen>
      <Stack.Screen name="About">
        {props => (
          <>
            <AboutScreen {...props} onOpenSidebar={onOpenSidebar} />
            <Sidebar
              isOpen={sidebarOpen}
              onClose={onCloseSidebar}
              navigation={props.navigation}
              currentRoute="About"
              user={currentUser}
            />
          </>
        )}
      </Stack.Screen>
      <Stack.Screen name="Favorites">
        {props => (
          <>
            <FavoritesScreen {...props} onOpenSidebar={onOpenSidebar} />
            <Sidebar
              isOpen={sidebarOpen}
              onClose={onCloseSidebar}
              navigation={props.navigation}
              currentRoute="Favorites"
              user={currentUser}
            />
          </>
        )}
      </Stack.Screen>
      <Stack.Screen name="DownloadHistory">
        {props => (
          <>
            <DownloadHistoryScreen {...props} onOpenSidebar={onOpenSidebar} />
            <Sidebar
              isOpen={sidebarOpen}
              onClose={onCloseSidebar}
              navigation={props.navigation}
              currentRoute="DownloadHistory"
              user={currentUser}
            />
          </>
        )}
      </Stack.Screen>
      <Stack.Screen name="Settings">
        {props => (
          <>
            <SettingsScreen {...props} onOpenSidebar={onOpenSidebar} />
            <Sidebar
              isOpen={sidebarOpen}
              onClose={onCloseSidebar}
              navigation={props.navigation}
              currentRoute="Settings"
              user={currentUser}
            />
          </>
        )}
      </Stack.Screen>
      <Stack.Screen name="MyNotes">
        {props => (
          <>
            <MyNotesScreen {...props} onOpenSidebar={onOpenSidebar} />
            <Sidebar
              isOpen={sidebarOpen}
              onClose={onCloseSidebar}
              navigation={props.navigation}
              currentRoute="MyNotes"
              user={currentUser}
            />
          </>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

// Root Navigator
function RootNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentRoute, setCurrentRoute] = useState('Home');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const initApp = async () => {
      const isAuth = await authAPI.isAuthenticated();
      if (isAuth) {
        const user = await authAPI.getCurrentUser();
        setIsAuthenticated(true);
        setCurrentUser(user);
      }
      setIsLoading(false);
    };
    initApp();
  }, []);

  // Listen for auth changes
  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = await authAPI.isAuthenticated();
      const user = isAuth ? await authAPI.getCurrentUser() : null;
      setIsAuthenticated(isAuth);
      setCurrentUser(user);
    };

    const interval = setInterval(checkAuth, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleStateChange = useCallback(async (state) => {
    if (state?.routes?.[0]?.state?.routes) {
      const currentTab = state.routes[0].state.routes[state.routes[0].state.index];
      setCurrentRoute(currentTab?.name || 'Home');
    }
    const user = await authAPI.getCurrentUser();
    setCurrentUser(user);
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a5f2a' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <NavigationContainer onStateChange={handleStateChange}>
      <StatusBar style="light" backgroundColor="#1a5f2a" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main">
            {() => (
              <MainStack
                onOpenSidebar={() => setSidebarOpen(true)}
                sidebarOpen={sidebarOpen}
                onCloseSidebar={() => setSidebarOpen(false)}
                currentRoute={currentRoute}
                currentUser={currentUser}
              />
            )}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return <RootNavigator />;
}
