export const colors = {
  primary: '#1E88E5',
  primaryDark: '#1565C0',
  primaryLight: '#64B5F6',
  secondary: '#26A69A',
  accent: '#FF7043',
  warning: '#FFA726',
  danger: '#EF5350',
  success: '#66BB6A',
  info: '#42A5F5',
  
  background: '#0a1628',
  backgroundDark: '#060E1A',
  card: '#131F35',
  cardLight: '#1A2A45',
  
  text: '#FFFFFF',
  textSecondary: '#B0BEC5',
  textMuted: '#78909C',
  border: '#2A3A5A',
  borderLight: '#3D4F6F',
  
  statusGreen: '#4CAF50',
  statusYellow: '#FFC107',
  statusRed: '#F44336',
  statusBlue: '#2196F3',
  statusGrey: '#9E9E9E',
  
  overlay: 'rgba(0, 0, 0, 0.6)',
  gradient: ['#1E88E5', '#26A69A'],
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  xxxl: 28,
  display: 36,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 999,
};

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
};

export const theme = {
  colors,
  spacing,
  fontSize,
  borderRadius,
  shadow,
};

export type Theme = typeof theme;
