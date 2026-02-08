import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';
import { Colors, Typography, Spacing, BorderRadius } from '../theme';

type Props = {
  route: RouteProp<RootStackParamList, 'EventHome'>;
};

export const EventHomeScreen = ({ route }: Props) => {
  const { eventName } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.primary} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{eventName} Home</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>EVENTS DETAILS</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>• Saturday, 2/13</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>• 8PM</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>• Zilker Park</Text>
          </View>
        </View>

        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapText}>📍 Map View</Text>
          <Text style={styles.mapSubtext}>Crowd density map will appear here</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
    padding: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  detailRow: {
    marginBottom: Spacing.sm,
  },
  detailLabel: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
  },
  mapPlaceholder: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  mapText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  mapSubtext: {
    fontSize: Typography.sizes.sm,
    color: Colors.textLight,
  },
});