import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { Colors, Typography, Spacing, BorderRadius } from '../theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'UserType'>;
};

export const UserTypeScreen = ({ navigation }: Props) => {
  const handleUserTypeSelect = (userType: 'attendee' | 'organizer') => {
    navigation.navigate('Login', { userType });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to</Text>
        <Text style={styles.subtitle}>Crowd Safety</Text>
        
        <Text style={styles.question}>Are you an...</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => handleUserTypeSelect('attendee')}
        >
          <Text style={styles.buttonText}>Attendee</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => handleUserTypeSelect('organizer')}
        >
          <Text style={styles.buttonText}>Event Organizer</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  title: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.sizes['4xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.accent,
    marginBottom: Spacing['2xl'],
  },
  question: {
    fontSize: Typography.sizes.xl,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  button: {
    backgroundColor: Colors.buttonPrimary,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing.md,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonSecondary: {
    backgroundColor: Colors.buttonSecondary,
  },
  buttonText: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
});