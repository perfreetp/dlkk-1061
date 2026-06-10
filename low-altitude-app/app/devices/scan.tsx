import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../src/store/useAppStore';
import { colors, spacing, fontSize, borderRadius } from '../../src/theme';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';

export default function ScanScreen() {
  const router = useRouter();
  const drones = useAppStore((s) => s.drones);
  const bindDrone = useAppStore((s) => s.bindDrone);
  const [scanning, setScanning] = useState(true);
  const [scanProgress, setScanProgress] = useState(0);

  useEffect(() => {
    if (!scanning) return;
    const interval = setInterval(() => {
      setScanProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setScanning(false);
          return 100;
        }
        return p + 5;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [scanning]);

  const simulateScan = () => {
    setScanning(true);
    setScanProgress(0);
  };

  const handleBind = () => {
    const unboundDrones = drones.filter((d) => !d.bound);
    if (unboundDrones.length === 0) {
      Alert.alert('提示', '暂无可绑定的设备');
      return;
    }
    const drone = unboundDrones[0];
    Alert.alert('发现设备', `检测到设备：${drone.nickname}\n型号：${drone.modelName}\nSN：${drone.serialNumber}\n\n是否绑定该设备？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '绑定',
        onPress: () => {
          bindDrone(drone.id);
          Alert.alert('绑定成功', `已成功绑定设备：${drone.nickname}`);
          setTimeout(() => router.back(), 1000);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.scanArea}>
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
          {scanning && (
            <View
              style={[
                styles.scanLine,
                { top: `${scanProgress}%` },
              ]}
            />
          )}
        </View>

        <Text style={styles.scanHint}>
          {scanning ? '正在扫描二维码...' : '扫描完成'}
        </Text>
        <Text style={styles.scanSubHint}>
          将无人机机身二维码对准扫描框
        </Text>
      </View>

      <View style={styles.actionArea}>
        <Card style={styles.infoCard}>
          <View style={styles.infoItem}>
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.infoText}>
              请确保无人机电源已开启，机身二维码清晰可见
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.success} />
            <Text style={styles.infoText}>
              绑定后可远程控制和实时监控该设备
            </Text>
          </View>
        </Card>

        {!scanning && (
          <Button
            title="绑定检测到的设备"
            style={{ marginBottom: spacing.md }}
            icon={<Ionicons name="link-outline" size={20} color={colors.text} />}
            onPress={handleBind}
          />
        )}

        <View style={{ flexDirection: 'row' }}>
          <Button
            title="重新扫描"
            variant="outline"
            style={{ flex: 1, marginRight: spacing.md }}
            icon={<Ionicons name="refresh-outline" size={18} color={colors.primary} />}
            onPress={simulateScan}
          />
          <Button
            title="手动输入SN"
            variant="outline"
            style={{ flex: 1 }}
            icon={<Ionicons name="create-outline" size={18} color={colors.primary} />}
            onPress={() => {
              Alert.prompt
                ? Alert.prompt(
                    '手动输入序列号',
                    '请输入无人机机身序列号(SN)',
                    [
                      { text: '取消', style: 'cancel' },
                      {
                        text: '确定',
                        onPress: (text: string | undefined) => {
                          if (text) {
                            const drone = drones.find((d) => d.serialNumber === text);
                            if (drone) {
                              bindDrone(drone.id);
                              Alert.alert('绑定成功', `已成功绑定设备：${drone.nickname}`);
                              setTimeout(() => router.back(), 1000);
                            } else {
                              Alert.alert('未找到设备', '请检查序列号是否正确');
                            }
                          }
                        },
                      },
                    ],
                    'plain-text'
                  )
                : Alert.alert('提示', '请使用扫码方式绑定设备');
            }}
          />
        </View>

        <Pressable style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelText}>取消</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scanArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundDark,
  },
  scanFrame: {
    width: 240,
    height: 240,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: colors.primary,
    borderWidth: 4,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  scanHint: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginTop: spacing.xxxl,
  },
  scanSubHint: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    marginTop: spacing.sm,
  },
  actionArea: {
    padding: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  infoCard: {
    marginBottom: spacing.lg,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  infoText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    marginLeft: spacing.sm,
    flex: 1,
    lineHeight: 20,
  },
  cancelBtn: {
    marginTop: spacing.lg,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  cancelText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
  },
});
