import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../theme';
import {
  statusTextMap,
  statusColorMap,
  approvalStatusTextMap,
  approvalStatusColorMap,
  deviceStatusTextMap,
  deviceStatusColorMap,
  alertLevelTextMap,
  alertLevelColorMap,
  priorityTextMap,
  priorityColorMap,
} from '../utils';
import type {
  TaskStatus,
  ApprovalStatus,
  DeviceStatus,
  AlertLevel,
} from '../types';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
  text: string;
  variant?: BadgeVariant;
  color?: string;
  style?: StyleProp<ViewStyle>;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ text, variant = 'default', color, style, size = 'sm' }) => {
  const bgColor = color || getVariantColor(variant);
  return (
    <View
      style={[
        styles.badge,
        size === 'md' && styles.badgeMd,
        { backgroundColor: bgColor + '22', borderColor: bgColor },
        style,
      ]}
    >
      <Text style={[styles.badgeText, { color: bgColor }, size === 'md' && styles.badgeTextMd]}>
        {text}
      </Text>
    </View>
  );
};

const getVariantColor = (variant: BadgeVariant): string => {
  const map: Record<BadgeVariant, string> = {
    default: colors.textMuted,
    primary: colors.primary,
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
    info: colors.info,
  };
  return map[variant];
};

interface StatusBadgeProps {
  status: TaskStatus;
}

export const TaskStatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  return (
    <Badge text={statusTextMap[status]} color={statusColorMap[status]} />
  );
};

interface ApprovalBadgeProps {
  status: ApprovalStatus;
}

export const ApprovalStatusBadge: React.FC<ApprovalBadgeProps> = ({ status }) => {
  return (
    <Badge text={approvalStatusTextMap[status]} color={approvalStatusColorMap[status]} />
  );
};

interface DeviceBadgeProps {
  status: DeviceStatus;
}

export const DeviceStatusBadge: React.FC<DeviceBadgeProps> = ({ status }) => {
  return (
    <Badge text={deviceStatusTextMap[status]} color={deviceStatusColorMap[status]} />
  );
};

interface AlertBadgeProps {
  level: AlertLevel;
}

export const AlertLevelBadge: React.FC<AlertBadgeProps> = ({ level }) => {
  return (
    <Badge text={alertLevelTextMap[level]} color={alertLevelColorMap[level]} />
  );
};

interface PriorityBadgeProps {
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  return (
    <Badge
      text={`优先级：${priorityTextMap[priority]}`}
      color={priorityColorMap[priority]}
    />
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeMd: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  badgeTextMd: {
    fontSize: fontSize.sm,
  },
});
