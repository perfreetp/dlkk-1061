import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Pressable } from 'react-native';
import { colors, spacing, borderRadius, shadow } from '../theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  padding?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, style, onPress, padding = true }) => {
  const Container = onPress ? Pressable : View;
  return (
    <Container
      style={[styles.card, padding && styles.cardPadding, style, shadow.sm]}
      onPress={onPress}
    >
      {children}
    </Container>
  );
};

interface CardSectionProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const CardSection: React.FC<CardSectionProps> = ({ children, style }) => {
  return <View style={[styles.section, style]}>{children}</View>;
};

interface CardDividerProps {
  style?: StyleProp<ViewStyle>;
}

export const CardDivider: React.FC<CardDividerProps> = ({ style }) => {
  return <View style={[styles.divider, style]} />;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  cardPadding: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
});
