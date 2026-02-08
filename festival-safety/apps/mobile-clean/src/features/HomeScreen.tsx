import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { Colors, Typography, Spacing, BorderRadius } from '../theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

interface Event {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
}

const EVENTS: Event[] = [
  {
    id: '1',
    name: 'ACL',
    date: 'Saturday, 2/13',
    time: '8PM',
    location: 'Zilker Park',
  },
];

export const HomeScreen = ({ navigation }: Props) => {
  const handleEventPress = (event: Event) => {
    navigation.navigate('EventHome', { 
      eventId: event.id, 
      eventName: event.name 
    });
  };

  const renderEvent = ({ item }: { item: Event }) => (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={() => handleEventPress(item)}
    >
      <View style={styles.eventHeader}>
        <Text style={styles.eventName}>{item.name}</Text>
      </View>
      <View style={styles.eventDetails}>
        <Text style={styles.eventDetail}>📅 {item.date}</Text>
        <Text style={styles.eventDetail}>🕐 {item.time}</Text>
        <Text style={styles.eventDetail}>📍 {item.location}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <View style={styles.header}>
        <Text style={styles.title}>Hello,</Text>
        <Text style={styles.subtitle}>Events</Text>
      </View>

      <FlatList
        data={EVENTS}
        renderItem={renderEvent}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  listContent: {
    padding: Spacing.xl,
  },
  eventCard: {
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  eventHeader: {
    marginBottom: Spacing.md,
  },
  eventName: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  eventDetails: {
    gap: Spacing.xs,
  },
  eventDetail: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
  },
});