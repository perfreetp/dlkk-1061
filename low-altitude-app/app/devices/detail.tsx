import React from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../src/store/useAppStore';
import { colors, spacing, fontSize, borderRadius } from '../../src/theme';
import { Card, CardSection, CardDivider } from '../../src/components/Card';
import { DeviceStatusBadge, Badge } from '../../src/components/Badge';
import { Button } from '../../src/components/Button';
import { InfoRow, SectionHeader } from '../../src/components/Common';
import { BatteryIndicator, HealthIndicator, ProgressBar } from '../../src/components/Progress';
import { formatDate, formatDuration } from '../../src/utils';

export default function DeviceDetailScreen() {
  const router = useRouter();
  const selectedDroneId = useAppStore((s) => s.selectedDroneId);
  const getDroneById = useAppStore((s) => s.getDroneById);
  const payloads = useAppStore((s) => s.payloads);
  const droneModels = useAppStore((s) => s.droneModels);
  const unbindDrone = useAppStore((s) => s.unbindDrone);
  const updateDroneStatus = useAppStore((s) => s.updateDroneStatus);

  const drone = selectedDroneId ? getDroneById(selectedDroneId) : undefined;
  const model = drone ? droneModels.find((m) => m.id === drone.modelId) : undefined;
  const payload = drone?.payloadId ? payloads.find((p) => p.id === drone.payloadId) : undefined;

  if (!drone) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.textMuted }}>未找到设备信息</Text>
        <Button title="返回" onPress={() => router.back()} style={{ marginTop: spacing.lg }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
        <Card>
          <CardSection style={{ alignItems: 'center' }}>
            <View style={styles.droneIconLarge}>
              <Ionicons name="airplane" size={56} color={colors.primary} />
            </View>
            <Text style={styles.droneName}>{drone.nickname}</Text>
            <View style={{ flexDirection: 'row', marginTop: spacing.sm, alignItems: 'center' }}>
              <DeviceStatusBadge status={drone.status} />
              <View style={{ width: spacing.sm }} />
              {drone.bound ? (
                <Badge text="已绑定" color={colors.success} />
              ) : (
                <Badge text="未绑定" color={colors.textMuted} />
              )}
            </View>
          </CardSection>

          <CardDivider />

          <CardSection>
            <InfoRow label="设备型号" value={drone.modelName} />
            <InfoRow label="序列号" value={drone.serialNumber} />
            <InfoRow label="固件版本" value={drone.firmwareVersion} />
            <InfoRow
              label="载荷设备"
              value={payload ? `${payload.name} (${payload.type})` : '未安装'}
            />
          </CardSection>
        </Card>

        <Card>
          <SectionHeader title="状态监测" />
          <View style={styles.statusGrid}>
            <View style={styles.statusBox}>
              <Text style={styles.statusTitle}>电池电量</Text>
              <BatteryIndicator level={drone.batteryLevel} size="md" />
              <ProgressBar
                value={drone.batteryLevel}
                color={drone.batteryLevel > 60 ? colors.success : drone.batteryLevel > 30 ? colors.warning : colors.danger}
                style={{ marginTop: spacing.md }}
                showLabel
                height={8}
              />
            </View>
            <View style={styles.statusBox}>
              <Text style={styles.statusTitle}>设备健康</Text>
              <HealthIndicator status={drone.healthStatus} />
              <ProgressBar
                value={drone.healthStatus}
                color={drone.healthStatus >= 85 ? colors.success : drone.healthStatus >= 70 ? colors.warning : colors.danger}
                style={{ marginTop: spacing.md }}
                showLabel
                height={8}
              />
            </View>
          </View>

          <CardDivider />

          <InfoRow label="上次维护" value={formatDate(drone.lastMaintenance)} />
          <InfoRow label="累计飞行时间" value={formatDuration(drone.totalFlightTime)} />
          <InfoRow label="累计飞行架次" value={`${drone.totalFlights} 架次`} />
        </Card>

        {model && (
          <Card>
            <SectionHeader title="机型参数" />
            <InfoRow label="生产厂商" value={model.manufacturer} />
            <InfoRow label="最大续航" value={`${model.maxFlightTime} 分钟`} />
            <InfoRow label="最大速度" value={`${model.maxSpeed} m/s`} />
            <InfoRow label="最大升限" value={`${model.maxAltitude} 米`} />
            <InfoRow label="最大载荷" value={`${model.payloadCapacity} g`} />
            <InfoRow label="机身重量" value={`${model.weight} g`} />
          </Card>
        )}

        <Card>
          <SectionHeader title="飞行日志" />
          <View style={styles.logItem}>
            <View style={[styles.logDot, { backgroundColor: colors.primary }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.logTitle}>设备启动自检通过</Text>
              <Text style={styles.logTime}>2024-06-11 14:02:30</Text>
            </View>
          </View>
          <View style={styles.logItem}>
            <View style={[styles.logDot, { backgroundColor: colors.success }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.logTitle}>固件更新完成 v03.01.0000</Text>
              <Text style={styles.logTime}>2024-06-08 10:15:00</Text>
            </View>
          </View>
          <View style={styles.logItem}>
            <View style={[styles.logDot, { backgroundColor: colors.warning }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.logTitle}>IMU校准完成</Text>
              <Text style={styles.logTime}>2024-06-01 16:30:00</Text>
            </View>
          </View>
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={drone.bound ? '解绑设备' : '绑定设备'}
          variant={drone.bound ? 'outline' : 'primary'}
          style={{ flex: 1, marginRight: spacing.md }}
          icon={<Ionicons name={drone.bound ? "link" : "unlink"} size={18} color={drone.bound ? colors.primary : colors.text} />}
          onPress={() => {
            if (drone.bound) {
              unbindDrone(drone.id);
            } else {
              router.push('/devices/scan');
            }
          }}
        />
        {drone.status === 'online' && (
          <Button
            title="执行任务"
            style={{ flex: 1 }}
            icon={<Ionicons name="play" size={18} color={colors.text} />}
          />
        )}
        {drone.status === 'offline' && (
          <Button
            title="开机连接"
            variant="secondary"
            style={{ flex: 1 }}
            icon={<Ionicons name="power" size={18} color={colors.text} />}
            onPress={() => updateDroneStatus(drone.id, 'online')}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  droneIconLarge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  droneName: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: '700',
  },
  statusGrid: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  statusBox: {
    flex: 1,
    marginRight: spacing.md,
  },
  statusBox: {
    flex: 1,
  },
  statusBox: {
    flex: 1,
  },
  statusTitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  logDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    marginRight: spacing.md,
  },
  logTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  logTime: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.backgroundDark,
  },
});
