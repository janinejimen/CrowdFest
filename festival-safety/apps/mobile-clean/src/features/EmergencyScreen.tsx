import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../theme';

export const EmergencyScreen = () => {
  const handleEmergencyPress = () => {
    console.log('Emergency alert triggered!');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <View style={styles.content}>
        <Text style={styles.title}>🚨 Emergency</Text>
        <Text style={styles.subtitle}>
          Press the button below if you need immediate assistance
        </Text>

        <TouchableOpacity 
          style={styles.emergencyButton}
          onPress={handleEmergencyPress}
        >
          <Text style={styles.emergencyIcon}>🔔</Text>
          <Text style={styles.emergencyText}>ALERT</Text>
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Area (A, B, C, D, etc)
          </Text>
          <Text style={styles.infoSubtext}>Emergency</Text>
        </View>

        <View style={styles.contactBox}>
          <Text style={styles.contactLabel}>Who</Text>
          <Text style={styles.contactSubtext}>
            This will notify nearby event staff
          </Text>
        </View>
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
    padding: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  emergencyButton: {
    backgroundColor: Colors.alert,
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    shadowColor: Colors.alert,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emergencyIcon: {
    fontSize: 60,
    marginBottom: Spacing.sm,
  },
  emergencyText: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.white,
  },
  infoBox: {
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: '100%',
    marginBottom: Spacing.md,
  },
  infoText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  infoSubtext: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
  },
  contactBox: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  contactLabel: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  contactSubtext: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
});