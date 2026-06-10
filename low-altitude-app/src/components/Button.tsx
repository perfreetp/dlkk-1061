import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
  fullWidth = false,
}) => {
  const buttonStyles = [
    styles.button,
    getSizeStyle(size),
    getVariantStyle(variant),
    disabled || loading ? styles.disabled : null,
    fullWidth ? styles.fullWidth : null,
    style,
  ];

  const textStyles = [
    styles.text,
    getTextVariantStyle(variant),
    getTextSizeStyle(size),
    disabled ? styles.textDisabled : null,
    textStyle,
  ];

  return (
    <Pressable
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.text} />
      ) : (
        <>
          {icon}
          {icon && <Text style={{ width: spacing.sm }} />}
          <Text style={textStyles}>{title}</Text>
        </>
      )}
    </Pressable>
  );
};

const getSizeStyle = (size: ButtonSize): ViewStyle => {
  const map: Record<ButtonSize, ViewStyle> = {
    sm: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md, minHeight: 32 },
    md: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, minHeight: 44 },
    lg: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl, minHeight: 52 },
  };
  return map[size];
};

const getTextSizeStyle = (size: ButtonSize): TextStyle => {
  const map: Record<ButtonSize, TextStyle> = {
    sm: { fontSize: fontSize.sm },
    md: { fontSize: fontSize.md },
    lg: { fontSize: fontSize.lg },
  };
  return map[size];
};

const getVariantStyle = (variant: ButtonVariant): ViewStyle => {
  const map: Record<ButtonVariant, ViewStyle> = {
    primary: { backgroundColor: colors.primary },
    secondary: { backgroundColor: colors.cardLight },
    outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary },
    danger: { backgroundColor: colors.danger },
    ghost: { backgroundColor: 'transparent' },
    success: { backgroundColor: colors.success },
  };
  return map[variant];
};

const getTextVariantStyle = (variant: ButtonVariant): TextStyle => {
  const map: Record<ButtonVariant, TextStyle> = {
    primary: { color: colors.text },
    secondary: { color: colors.text },
    outline: { color: colors.primary },
    danger: { color: colors.text },
    ghost: { color: colors.primary },
  };
  return map[variant];
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
  },
  text: {
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
  textDisabled: {
    opacity: 0.8,
  },
  fullWidth: {
    width: '100%',
  },
});
