import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../theme';
import { calculateBatteryColor, calculateHealthColor } from '../utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  style?: StyleProp<ViewStyle>;
  barStyle?: StyleProp<ViewStyle>;
  showLabel?: boolean;
  label?: string;
  color?: string;
  height?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  style,
  barStyle,
  showLabel = false,
  label,
  color,
  height = 6,
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <View style={style}>
      {showLabel && (
        <Text style={styles.label}>
          {label || `${Math.round(percentage)}%`}
        </Text>
      )}
      <View style={[styles.track, { height, borderRadius: height / 2 }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${percentage}%`,
              backgroundColor: color || colors.primary,
              height,
              borderRadius: height / 2,
            },
            barStyle,
          ]}
        />
      </View>
    </View>
  );
};

interface BatteryIndicatorProps {
  level: number;
  showText?: boolean;
  size?: 'sm' | 'md';
}

export const BatteryIndicator: React.FC<BatteryIndicatorProps> = ({
  level,
  showText = true,
  size = 'md',
}) => {
  const color = calculateBatteryColor(level);
  const batteryWidth = size === 'sm' ? 28 : 36;
  const batteryHeight = size === 'sm' ? 14 : 18;

  return (
    <View style={styles.batteryContainer}>
      <View
        style={[
          styles.batteryBody,
          { width: batteryWidth, height: batteryHeight, borderRadius: 3 },
        ]}
      >
        <View
          style={[
            styles.batteryFill,
            {
              width: `${level}%`,
              backgroundColor: color,
              height: batteryHeight - 4,
              borderRadius: 2,
            },
          ]}
        />
      </View>
      <View
        style={[
          styles.batteryTip,
          { height: batteryHeight * 0.5, width: 3, borderRadius: 1.5 },
        ]}
      />
      {showText && (
        <Text style={[styles.batteryText, { color, fontSize: size === 'sm' ? fontSize.xs : fontSize.sm }]}>
          {level}%
        </Text>
      )}
    </View>
  );
};

interface HealthIndicatorProps {
  status: number;
  showText?: boolean;
}

export const HealthIndicator: React.FC<HealthIndicatorProps> = ({
  status,
  showText = true,
}) => {
  const color = calculateHealthColor(status);
  return (
    <View style={styles.healthContainer}>
      <View style={[styles.healthDot, { backgroundColor: color }]} />
      {showText && (
        <Text style={[styles.healthText, { color }]}>健康度 {status}%</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  batteryBody: {
    borderWidth: 1.5,
    borderColor: colors.textMuted,
    padding: 2,
    justifyContent: 'center',
  },
  batteryFill: {
    position: 'absolute',
    left: 2,
    top: 2,
  },
  batteryTip: {
    backgroundColor: colors.textMuted,
    marginLeft: 1,
  },
  batteryText: {
    marginLeft: spacing.sm,
    fontWeight: '600',
  },
  healthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  healthText: {
    marginLeft: spacing.sm,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
});
