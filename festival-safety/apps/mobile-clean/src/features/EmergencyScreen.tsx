import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../theme';

type EmergencyType = 'medical' | 'crowd' | 'safety' | 'lost';

interface EmergencyAlert {
  type: EmergencyType;
  title: string;
  icon: string;
  description: string;
}

const EMERGENCY_TYPES: EmergencyAlert[] = [
  {
    type: 'medical',
    title: 'Medical Emergency',
    icon: '🏥',
    description: 'Request immediate medical assistance',
  },
  {
    type: 'crowd',
    title: 'Crowd Issue',
    icon: '👥',
    description: 'Report dangerous crowd density or crushing',
  },
  {
    type: 'safety',
    title: 'Safety Concern',
    icon: '⚠️',
    description: 'Report safety hazard or suspicious activity',
  },
  {
    type: 'lost',
    title: 'Lost Person',
    icon: '🔍',
    description: 'Report a lost child or separated group member',
  },
];

export const EmergencyScreen = () => {
  const [selectedType, setSelectedType] = useState<EmergencyType | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [alertSent, setAlertSent] = useState(false);

  const handleQuickAlert = () => {
    Alert.alert(
      '🚨 Emergency Alert',
      'Are you sure you want to send an immediate emergency alert? This will notify all nearby staff.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Alert',
          style: 'destructive',
          onPress: sendEmergencyAlert,
        },
      ]
    );
  };

  const handleTypeSelect = (type: EmergencyType) => {
    setSelectedType(type);
    setShowConfirmation(true);
  };

  const sendEmergencyAlert = () => {
    // TODO: Send to backend
    console.log('Emergency alert sent:', selectedType || 'quick');
    setShowConfirmation(false);
    setAlertSent(true);
    
    setTimeout(() => {
      setAlertSent(false);
      setSelectedType(null);
    }, 3000);
  };

  const getAlertDetails = () => {
    return EMERGENCY_TYPES.find((t) => t.type === selectedType);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>🚨 Emergency</Text>
          <Text style={styles.subtitle}>
            Get immediate help from event staff
          </Text>
        </View>

        {/* Quick Emergency Button */}
        <View style={styles.quickAlertSection}>
          <Text style={styles.sectionTitle}>Immediate Emergency</Text>
          <TouchableOpacity 
            style={styles.emergencyButton}
            onPress={handleQuickAlert}
            activeOpacity={0.8}
          >
            <Text style={styles.emergencyIcon}>🔔</Text>
            <Text style={styles.emergencyText}>SEND ALERT NOW</Text>
          </TouchableOpacity>
          <Text style={styles.quickAlertInfo}>
            Tap to instantly alert all nearby event staff
          </Text>
        </View>

        {/* Emergency Types */}
        <View style={styles.typesSection}>
          <Text style={styles.sectionTitle}>Specify Emergency Type</Text>
          <Text style={styles.typesSubtitle}>
            Choose a specific type for faster response
          </Text>

          {EMERGENCY_TYPES.map((emergency) => (
            <TouchableOpacity
              key={emergency.type}
              style={styles.typeCard}
              onPress={() => handleTypeSelect(emergency.type)}
            >
              <View style={styles.typeIcon}>
                <Text style={styles.typeIconText}>{emergency.icon}</Text>
              </View>
              <View style={styles.typeContent}>
                <Text style={styles.typeTitle}>{emergency.title}</Text>
                <Text style={styles.typeDescription}>
                  {emergency.description}
                </Text>
              </View>
              <Text style={styles.typeArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Your Location */}
        <View style={styles.locationSection}>
          <Text style={styles.sectionTitle}>Your Location</Text>
          <View style={styles.locationCard}>
            <Text style={styles.locationIcon}>📍</Text>
            <View style={styles.locationContent}>
              <Text style={styles.locationText}>Area B - Main Stage</Text>
              <Text style={styles.locationSubtext}>
                Staff will be dispatched to your current location
              </Text>
            </View>
          </View>
        </View>

        {/* Safety Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Important Safety Information</Text>
          <Text style={styles.infoText}>
            • Your location is shared with event staff when you send an alert
          </Text>
          <Text style={styles.infoText}>
            • Average response time: 2-3 minutes
          </Text>
          <Text style={styles.infoText}>
            • For life-threatening emergencies, also call 911
          </Text>
          <Text style={styles.infoText}>
            • Stay in place if safe to do so
          </Text>
        </View>
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmation}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmation(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalIcon}>
              {getAlertDetails()?.icon}
            </Text>
            <Text style={styles.modalTitle}>
              {getAlertDetails()?.title}
            </Text>
            <Text style={styles.modalDescription}>
              Send alert to notify event staff about this emergency?
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => {
                  setShowConfirmation(false);
                  setSelectedType(null);
                }}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalButtonConfirm}
                onPress={sendEmergencyAlert}
              >
                <Text style={styles.modalButtonConfirmText}>Send Alert</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={alertSent}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModal}>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.successTitle}>Alert Sent!</Text>
            <Text style={styles.successText}>
              Event staff have been notified and are on their way to your location.
            </Text>
          </View>
        </View>
      </Modal>
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
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  quickAlertSection: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    alignSelf: 'flex-start',
  },
  emergencyButton: {
    backgroundColor: Colors.alert,
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: Spacing.lg,
    shadowColor: Colors.alert,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  emergencyIcon: {
    fontSize: 70,
    marginBottom: Spacing.sm,
  },
  emergencyText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.white,
  },
  quickAlertInfo: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  typesSection: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  typesSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  typeCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  typeIconText: {
    fontSize: 24,
  },
  typeContent: {
    flex: 1,
  },
  typeTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  typeDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  typeArrow: {
    fontSize: Typography.sizes['2xl'],
    color: Colors.textLight,
  },
  locationSection: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  locationCard: {
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  locationContent: {
    flex: 1,
  },
  locationText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  locationSubtext: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  infoSection: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  infoTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  infoText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalIcon: {
    fontSize: 60,
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  modalButtonCancel: {
    flex: 1,
    backgroundColor: Colors.inputBg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  modalButtonCancelText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
  },
  modalButtonConfirm: {
    flex: 1,
    backgroundColor: Colors.alert,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  modalButtonConfirmText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.white,
  },
  successModal: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 70,
    marginBottom: Spacing.md,
  },
  successTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.success,
    marginBottom: Spacing.sm,
  },
  successText: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});