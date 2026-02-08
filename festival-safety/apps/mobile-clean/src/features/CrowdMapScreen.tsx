import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { Colors, Typography, Spacing, BorderRadius } from '../theme';

interface CrowdDensity {
  id: string;
  latitude: number;
  longitude: number;
  density: 'low' | 'medium' | 'high' | 'critical';
  count: number;
}

const MOCK_CROWD_DATA: CrowdDensity[] = [
  { id: '1', latitude: 30.2672, longitude: -97.7431, density: 'medium', count: 150 },
  { id: '2', latitude: 30.2680, longitude: -97.7440, density: 'high', count: 350 },
  { id: '3', latitude: 30.2665, longitude: -97.7425, density: 'low', count: 50 },
  { id: '4', latitude: 30.2675, longitude: -97.7445, density: 'critical', count: 500 },
];

const getDensityColor = (density: string) => {
  switch (density) {
    case 'low':
      return Colors.success;
    case 'medium':
      return Colors.warning;
    case 'high':
      return '#FCA5A5';
    case 'critical':
      return Colors.alert;
    default:
      return Colors.success;
  }
};

const getDensityColorWithOpacity = (density: string) => {
  const color = getDensityColor(density);
  const opacity = getDensityOpacity(density);
  
  // Convert hex to rgba
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const getDensityOpacity = (density: string) => {
  switch (density) {
    case 'low':
      return 0.2;
    case 'medium':
      return 0.3;
    case 'high':
      return 0.4;
    case 'critical':
      return 0.5;
    default:
      return 0.2;
  }
};

export const CrowdMapScreen = () => {
  const [crowdData, setCrowdData] = useState<CrowdDensity[]>(MOCK_CROWD_DATA);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCrowdData((prev) =>
        prev.map((area) => ({
          ...area,
          count: Math.max(10, area.count + Math.floor(Math.random() * 20 - 10)),
        }))
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Crowd Map</Text>
        <Text style={styles.headerSubtitle}>Real-time density tracking</Text>
      </View>

      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 30.2672,
          longitude: -97.7431,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
      >
        {crowdData.map((area) => (
          <React.Fragment key={area.id}>
            <Circle
              center={{
                latitude: area.latitude,
                longitude: area.longitude,
              }}
              radius={50}
              fillColor={getDensityColorWithOpacity(area.density)}
              strokeColor={getDensityColor(area.density)}
              strokeWidth={2}
            />
            <Marker
              coordinate={{
                latitude: area.latitude,
                longitude: area.longitude,
              }}
              title={`${area.density.toUpperCase()} Density`}
              description={`${area.count} people`}
            />
          </React.Fragment>
        ))}
      </MapView>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Crowd Density</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
            <Text style={styles.legendText}>Low (0-100)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.warning }]} />
            <Text style={styles.legendText}>Medium (100-250)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FCA5A5' }]} />
            <Text style={styles.legendText}>High (250-400)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.alert }]} />
            <Text style={styles.legendText}>Critical (400+)</Text>
          </View>
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
  headerSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  map: {
    flex: 1,
    width: Dimensions.get('window').width,
  },
  legend: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  legendTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  legendItems: {
    gap: Spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.sm,
  },
  legendText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
});