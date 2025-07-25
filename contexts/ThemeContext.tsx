import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ThemeColors {
  background: string;
  surface: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  overlay: string;
  tabBar: string;
  tabBarActive: string;
  tabBarInactive: string;
}

export const lightTheme: ThemeColors = {
  background: '#f8f9fa',
  surface: '#ffffff',
  card: '#ffffff',
  text: '#333333',
  textSecondary: '#666666',
  border: '#e0e0e0',
  primary: '#E60012',
  secondary: '#FF6B35',
  accent: '#4CAF50',
  success: '#4CAF50',
  warning: '#FFA500',
  error: '#E60012',
  overlay: 'rgba(0, 0, 0, 0.5)',
  tabBar: '#ffffff',
  tabBarActive: '#E60012',
  tabBarInactive: '#666666',
};

export const darkTheme: ThemeColors = {
  background: '#121212',
  surface: '#1e1e1e',
  card: '#2d2d2d',
  text: '#ffffff',
  textSecondary: '#b3b3b3',
  border: '#404040',
  primary: '#FF4444',
  secondary: '#FF8A65',
  accent: '#66BB6A',
  success: '#66BB6A',
  warning: '#FFB74D',
  error: '#FF5252',
  overlay: 'rgba(0, 0, 0, 0.7)',
  tabBar: '#1e1e1e',
  tabBarActive: '#FF4444',
  tabBarInactive: '#b3b3b3',
};

interface ThemeContextType {
  isDarkMode: boolean;
  theme: ThemeColors;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme_preference');
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const saveThemePreference = async (isDark: boolean) => {
    try {
      await AsyncStorage.setItem('theme_preference', isDark ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    saveThemePreference(newTheme);
  };

  const setTheme = (isDark: boolean) => {
    setIsDarkMode(isDark);
    saveThemePreference(isDark);
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  if (!isLoaded) {
    return null; // or a loading spinner
  }

  return (
    <ThemeContext.Provider value={{ isDarkMode, theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};