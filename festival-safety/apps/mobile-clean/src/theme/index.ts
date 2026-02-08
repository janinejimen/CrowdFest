export const Colors = {
  // Primary lavender palette
  primary: '#E8D4F8',           // Light lavender
  primaryDark: '#C084FC',       // Medium purple
  secondary: '#D4F8E8',         // Light mint green
  accent: '#8B5CF6',            // Purple accent
  
  // Background colors
  background: '#F8F4FF',        // Very light lavender
  backgroundGradient: '#E8D4F8', // Lavender gradient
  cardBackground: '#FFFFFF',
  
  // Alert colors
  alert: '#EF4444',             // Red for emergency
  alertBg: '#FEE2E2',           // Light red background
  warning: '#F59E0B',           // Orange
  success: '#10B981',           // Green
  
  // Text colors
  textPrimary: '#1F2937',       // Dark gray
  textSecondary: '#6B7280',     // Medium gray
  textLight: '#9CA3AF',         // Light gray
  textWhite: '#FFFFFF',
  
  // UI elements
  white: '#FFFFFF',
  border: '#E5E7EB',
  inputBg: '#F9FAFB',
  inputBorder: '#D1D5DB',
  
  // Button colors
  buttonPrimary: '#E879F9',     // Pink from Figma
  buttonSecondary: '#D4F8E8',   // Light green
  buttonDisabled: '#D1D5DB',
};

export const Typography = {
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};