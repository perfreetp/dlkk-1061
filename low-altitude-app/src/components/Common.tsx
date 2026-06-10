import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize } from '../theme';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  style?: StyleProp<ViewStyle>;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'inbox-outline',
  title,
  description,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Ionicons name={icon} size={64} color={colors.textMuted} />
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
    </View>
  );
};

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  right,
  style,
}) => {
  return (
    <View style={[styles.header, style]}>
      <View style={styles.headerLeft}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
};

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const InfoRow: React.FC<InfoRowProps> = ({ label, value, style }) => {
  return (
    <View style={[styles.infoRow, style]}>
      <Text style={styles.infoLabel}>{label}</Text>
      {typeof value === 'string' || typeof value === 'number' ? (
        <Text style={styles.infoValue}>{String(value)}</Text>
      ) : (
        value
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  title: {
    color: colors.textSecondary,
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  description: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  infoLabel: {
    color: colors.textMuted,
    fontSize: fontSize.md,
  },
  infoValue: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
});
