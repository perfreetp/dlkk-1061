import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../src/store/useAppStore';
import { colors, spacing, fontSize, borderRadius } from '../../src/theme';
import { Card, CardSection, CardDivider } from '../../src/components/Card';
import { DeviceStatusBadge, Badge } from '../../src/components/Badge';
import { Button } from '../../src/components/Button';
import { SectionHeader } from '../../src/components/Common';
import { BatteryIndicator, HealthIndicator } from '../../src/components/Progress';
import { formatDate, formatDuration } from '../../src/utils';
import type { DeviceStatus } from '../../src/types';

const statusFilters: { key: DeviceStatus | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'online', label: '在线' },
  { key: 'in_flight', label: '飞行中' },
  { key: 'charging', label: '充电中' },
  { key: 'offline', label: '离线' },
  { key: 'maintenance', label: '维护中' },
];

export default function DeviceListScreen() {
  const router = useRouter();
  const drones = useAppStore((s) => s.drones);
  const setSelectedDroneId = useAppStore((s) => s.setSelectedDroneId);
  const [filter, setFilter] = useState<DeviceStatus | 'all'>('all');

  const filteredDrones = useMemo(() => {
    if (filter === 'all') return drones;
    return drones.filter((d) => d.status === filter);
  }, [drones, filter]);

  const stats = useMemo(() => ({
    total: drones.length,
    online: drones.filter((d) => d.status === 'online').length,
    inFlight: drones.filter((d) => d.status === 'in_flight').length,
    charging: drones.filter((d) => d.status === 'charging').length,
    bound: drones.filter((d) => d.bound).length,
  }), [drones]);

  const handleDronePress = (droneId: string) => {
    setSelectedDroneId(droneId);
    router.push('/devices/detail');
  };

  return (
    <View style={styles.container}>
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>设备总数</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.success }]}>{stats.online}</Text>
          <Text style={styles.statLabel}>在线</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{stats.inFlight}</Text>
          <Text style={styles.statLabel}>飞行中</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.statusBlue }]}>{stats.bound}</Text>
          <Text style={styles.statLabel}>已绑定</Text>
        </View>
      </View>

      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {statusFilters.map((f) => (
            <Pressable
              key={f.key}
              style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filter === f.key && styles.filterChipTextActive,
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
        <View style={{ flexDirection: 'row', marginBottom: spacing.md }}>
          <Button
            title="扫码绑定"
            icon={<Ionicons name="qr-code-outline" size={18} color={colors.text} />}
            style={{ flex: 1, marginRight: spacing.sm }}
            onPress={() => router.push('/devices/scan')}
          />
          <Button
            title="设备状态检查"
            variant="outline"
            icon={<Ionicons name="heart-outline" size={18} color={colors.primary} />}
            style={{ flex: 1 }}
          />
        </View>

        <SectionHeader title={`设备列表 (${filteredDrones.length})`} />

        {filteredDrones.map((drone) => (
          <Card key={drone.id} onPress={() => handleDronePress(drone.id)}>
            <CardSection style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, flexDirection: 'row' }}>
                <View style={styles.droneIcon}>
                  <Ionicons name="airplane" size={28} color={colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.droneName}>{drone.nickname}</Text>
                    {drone.bound ? (
                      <Badge text="已绑定" color={colors.success} size="sm" />
                    ) : (
                      <Badge text="未绑定" color={colors.textMuted} size="sm" />
                    )}
                  </View>
                  <Text style={styles.droneModel}>
                    {drone.modelName} · SN: {drone.serialNumber}
                  </Text>
                </View>
              </View>
              <DeviceStatusBadge status={drone.status} />
            </CardSection>

            <CardDivider />

            <CardSection>
              <View style={styles.statusRow}>
                <View style={styles.statusItem}>
                  <Text style={styles.statusLabel}>电池</Text>
                  <BatteryIndicator level={drone.batteryLevel} />
                </View>
                <View style={styles.statusItem}>
                  <Text style={styles.statusLabel}>健康度</Text>
                  <HealthIndicator status={drone.healthStatus} />
                </View>
              </View>
            </CardSection>

            <CardSection style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 0 }}>
              <View style={styles.infoItem}>
                <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                <Text style={styles.infoText}>累计 {formatDuration(drone.totalFlightTime)}</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="repeat-outline" size={14} color={colors.textMuted} />
                <Text style={styles.infoText}>{drone.totalFlights} 架次</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="build-outline" size={14} color={colors.textMuted} />
                <Text style={styles.infoText}>{formatDate(drone.lastMaintenance)}</Text>
              </View>
            </CardSection>

            {drone.status === 'online' && drone.bound && (
              <CardSection style={{ paddingTop: 0 }}>
                <Button
                  title="执行任务"
                  size="sm"
                  icon={<Ionicons name="play" size={16} color={colors.text} />}
                />
              </CardSection>
            )}
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  statValue: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: '700',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  filterBar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.card,
    marginRight: spacing.sm,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  droneIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  droneName: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginRight: spacing.sm,
  },
  droneModel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusItem: {
    flex: 1,
  },
  statusLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginLeft: 4,
  },
});
