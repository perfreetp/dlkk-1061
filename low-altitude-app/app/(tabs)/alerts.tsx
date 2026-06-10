import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../src/store/useAppStore';
import { colors, spacing, fontSize, borderRadius } from '../../src/theme';
import { Card, CardSection } from '../../src/components/Card';
import { AlertLevelBadge, Badge } from '../../src/components/Badge';
import { Button } from '../../src/components/Button';
import { SectionHeader, EmptyState } from '../../src/components/Common';
import { alertTypeTextMap, formatDateTime } from '../../src/utils';
import type { AlertType, AlertLevel } from '../../src/types';

const typeFilters: { key: AlertType | 'all'; label: string; icon: any }[] = [
  { key: 'all', label: '全部', icon: 'notifications-outline' },
  { key: 'weather', label: '气象', icon: 'cloud-outline' },
  { key: 'fence', label: '围栏', icon: 'shield-outline' },
  { key: 'takeoff', label: '起飞', icon: 'rocket-outline' },
  { key: 'device', label: '设备', icon: 'airplane-outline' },
  { key: 'battery', label: '电量', icon: 'battery-charging-outline' },
];

const levelFilters: { key: AlertLevel | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'critical', label: '严重' },
  { key: 'danger', label: '危险' },
  { key: 'warning', label: '警告' },
  { key: 'info', label: '提示' },
];

const getAlertIcon = (type: AlertType): keyof typeof Ionicons.glyphMap => {
  const map: Record<AlertType, keyof typeof Ionicons.glyphMap> = {
    weather: 'cloud',
    fence: 'shield',
    takeoff: 'rocket',
    device: 'airplane',
    airspace: 'map',
    battery: 'battery-charging',
  };
  return map[type];
};

export default function AlertsScreen() {
  const router = useRouter();
  const alerts = useAppStore((s) => s.alerts);
  const weather = useAppStore((s) => s.weather);
  const markAlertRead = useAppStore((s) => s.markAlertRead);
  const markAllAlertsRead = useAppStore((s) => s.markAllAlertsRead);

  const [typeFilter, setTypeFilter] = useState<AlertType | 'all'>('all');
  const [levelFilter, setLevelFilter] = useState<AlertLevel | 'all'>('all');
  const [onlyUnread, setOnlyUnread] = useState(false);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (typeFilter !== 'all' && a.type !== typeFilter) return false;
      if (levelFilter !== 'all' && a.level !== levelFilter) return false;
      if (onlyUnread && a.read) return false;
      return true;
    });
  }, [alerts, typeFilter, levelFilter, onlyUnread]);

  const unreadCount = alerts.filter((a) => !a.read).length;

  const stats = useMemo(() => ({
    total: alerts.length,
    unread: unreadCount,
    critical: alerts.filter((a) => a.level === 'critical').length,
    danger: alerts.filter((a) => a.level === 'danger').length,
    warning: alerts.filter((a) => a.level === 'warning').length,
  }), [alerts, unreadCount]);

  const handleAlertPress = (alertId: string) => {
    markAlertRead(alertId);
  };

  return (
    <View style={styles.container}>
      <View style={styles.weatherBar}>
        <View style={styles.weatherLeft}>
          <Ionicons
            name={weather.condition === '晴' ? 'sunny' : 'cloud'}
            size={32}
            color={weather.flyable ? colors.success : colors.warning}
          />
          <View style={{ marginLeft: spacing.md }}>
            <Text style={styles.weatherTemp}>{weather.temperature}°C {weather.condition}</Text>
            <Text style={styles.weatherDetail}>
              风速 {weather.windSpeed}m/s · 湿度 {weather.humidity}% · 能见度 {Math.round(weather.visibility / 1000)}km
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.weatherStatus,
            { backgroundColor: weather.flyable ? colors.success + '20' : colors.warning + '20' },
          ]}
        >
          <Text style={{ color: weather.flyable ? colors.success : colors.warning, fontWeight: '600' }}>
            {weather.flyable ? '适合飞行' : '谨慎飞行'}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.danger }]}>{stats.critical + stats.danger}</Text>
          <Text style={styles.statLabel}>严重/危险</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.warning }]}>{stats.warning}</Text>
          <Text style={styles.statLabel}>警告</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.unread}</Text>
          <Text style={styles.statLabel}>未读</Text>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeFilterBar}>
          {typeFilters.map((f) => (
            <Pressable
              key={f.key}
              style={[styles.typeChip, typeFilter === f.key && styles.typeChipActive]}
              onPress={() => setTypeFilter(f.key)}
            >
              <Ionicons
                name={f.icon}
                size={14}
                color={typeFilter === f.key ? colors.text : colors.textMuted}
              />
              <Text
                style={[
                  styles.typeChipText,
                  typeFilter === f.key && styles.typeChipTextActive,
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.bottomFilters}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {levelFilters.map((f) => (
              <Pressable
                key={f.key}
                style={[styles.levelChip, levelFilter === f.key && styles.levelChipActive]}
                onPress={() => setLevelFilter(f.key)}
              >
                <Text
                  style={[
                    styles.levelChipText,
                    levelFilter === f.key && styles.levelChipTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable
            style={[styles.unreadToggle, onlyUnread && styles.unreadToggleActive]}
            onPress={() => setOnlyUnread(!onlyUnread)}
          >
            <Ionicons
              name={onlyUnread ? 'mail-unread' : 'mail-outline'}
              size={16}
              color={onlyUnread ? colors.text : colors.textMuted}
            />
            <Text
              style={[
                styles.unreadToggleText,
                onlyUnread && { color: colors.text },
              ]}
            >
              仅未读
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
        <SectionHeader
          title={`告警列表 (${filteredAlerts.length})`}
          right={
            unreadCount > 0 ? (
              <Button
                title="全部已读"
                size="sm"
                variant="ghost"
                onPress={markAllAlertsRead}
              />
            ) : null
          }
        />

        {filteredAlerts.length === 0 ? (
          <EmptyState
            icon="checkmark-circle-outline"
            title="暂无告警"
            description="当前筛选条件下没有告警信息"
          />
        ) : (
          filteredAlerts.map((alert) => (
            <Card key={alert.id} onPress={() => handleAlertPress(alert.id)}>
              <CardSection>
                <View style={styles.alertHeader}>
                  <View
                    style={[
                      styles.alertIcon,
                      {
                        backgroundColor:
                          alert.level === 'critical' || alert.level === 'danger'
                            ? colors.danger + '20'
                            : alert.level === 'warning'
                            ? colors.warning + '20'
                            : colors.info + '20',
                      },
                    ]}
                  >
                    <Ionicons
                      name={getAlertIcon(alert.type)}
                      size={22}
                      color={
                        alert.level === 'critical' || alert.level === 'danger'
                          ? colors.danger
                          : alert.level === 'warning'
                          ? colors.warning
                          : colors.info
                      }
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.alertTitle}>{alert.title}</Text>
                      {!alert.read && <View style={styles.unreadDot} />}
                    </View>
                    <View style={styles.alertMeta}>
                      <Badge text={alertTypeTextMap[alert.type]} color={colors.textMuted} size="sm" />
                      <View style={{ width: spacing.sm }} />
                      <AlertLevelBadge level={alert.level} />
                    </View>
                  </View>
                </View>

                <Text style={styles.alertMessage}>{alert.message}</Text>

                <View style={styles.alertFooter}>
                  <View style={styles.alertTime}>
                    <Ionicons name="time-outline" size={12} color={colors.textMuted} />
                    <Text style={styles.alertTimeText}>{formatDateTime(alert.timestamp)}</Text>
                  </View>
                  {alert.droneId && (
                    <Pressable
                      onPress={() => {
                        useAppStore.getState().setSelectedDroneId(alert.droneId);
                        router.push('/devices/detail');
                      }}
                    >
                      <Badge text="查看设备" color={colors.primary} size="sm" />
                    </Pressable>
                  )}
                  {alert.taskId && (
                    <Pressable
                      style={{ marginLeft: spacing.sm }}
                      onPress={() => {
                        useAppStore.getState().setSelectedTaskId(alert.taskId);
                        router.push('/tasks/detail');
                      }}
                    >
                      <Badge text="查看任务" color={colors.secondary} size="sm" />
                    </Pressable>
                  )}
                </View>
              </CardSection>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  weatherBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  weatherLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherTemp: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  weatherDetail: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  weatherStatus: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  statValue: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: '700',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  filterContainer: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  typeFilterBar: {
    marginBottom: spacing.sm,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.card,
    marginRight: spacing.sm,
  },
  typeChipActive: {
    backgroundColor: colors.primary,
  },
  typeChipText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '500',
    marginLeft: 4,
  },
  typeChipTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
  bottomFilters: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 16,
    backgroundColor: colors.card,
    marginRight: spacing.sm,
  },
  levelChipActive: {
    backgroundColor: colors.primary + '20',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  levelChipText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  levelChipTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  unreadToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 16,
    backgroundColor: colors.card,
    marginLeft: 'auto',
  },
  unreadToggleActive: {
    backgroundColor: colors.primary + '20',
  },
  unreadToggleText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginLeft: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  alertHeader: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  alertIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
    marginLeft: spacing.sm,
  },
  alertMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  alertMessage: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    lineHeight: 22,
    marginTop: spacing.sm,
  },
  alertFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  alertTime: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  alertTimeText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginLeft: 4,
  },
});
