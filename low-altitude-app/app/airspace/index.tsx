import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Polygon, Circle } from 'react-native-maps';
import { useAppStore } from '../../src/store/useAppStore';
import { colors, spacing, fontSize, borderRadius } from '../../src/theme';
import { Card, CardSection, CardDivider } from '../../src/components/Card';
import { ApprovalStatusBadge } from '../../src/components/Badge';
import { Button } from '../../src/components/Button';
import { SectionHeader } from '../../src/components/Common';
import { InfoRow } from '../../src/components/Common';
import { formatDateTime } from '../../src/utils';
import type { ApprovalStatus, Coordinate } from '../../src/types';

const PARK_CENTER: Coordinate = { latitude: 39.9042, longitude: 116.4074 };

const statusFilters: { key: ApprovalStatus | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'draft', label: '草稿' },
  { key: 'submitted', label: '已提交' },
  { key: 'reviewing', label: '审批中' },
  { key: 'approved', label: '已批准' },
  { key: 'rejected', label: '已驳回' },
];

export default function AirspaceListScreen() {
  const router = useRouter();
  const applications = useAppStore((s) => s.airspaceApplications);
  const drones = useAppStore((s) => s.drones);
  const [filter, setFilter] = useState<ApprovalStatus | 'all'>('all');

  const filteredApps = useMemo(() => {
    if (filter === 'all') return applications;
    return applications.filter((a) => a.status === filter);
  }, [applications, filter]);

  const stats = useMemo(() => ({
    total: applications.length,
    approved: applications.filter((a) => a.status === 'approved').length,
    reviewing: applications.filter((a) => a.status === 'reviewing' || a.status === 'submitted').length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
  }), [applications]);

  const handleAppPress = (appId: string) => {
    router.push(`/airspace/detail?id=${appId}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>申请总数</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.success }]}>{stats.approved}</Text>
          <Text style={styles.statLabel}>已批准</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.warning }]}>{stats.reviewing}</Text>
          <Text style={styles.statLabel}>审批中</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.danger }]}>{stats.rejected}</Text>
          <Text style={styles.statLabel}>已驳回</Text>
        </View>
      </View>

      <View style={styles.miniMapContainer}>
        <MapView
          style={styles.miniMap}
          initialRegion={{
            latitude: PARK_CENTER.latitude,
            longitude: PARK_CENTER.longitude,
            latitudeDelta: 0.03,
            longitudeDelta: 0.03,
          }}
          scrollEnabled={false}
          zoomEnabled={false}
        >
          {applications.filter((a) => a.status === 'approved').map((app) => {
            if (app.coordinates.length === 1) {
              return (
                <Circle
                  key={app.id}
                  center={app.coordinates[0]}
                  radius={500}
                  strokeColor={colors.success}
                  fillColor="rgba(102, 187, 106, 0.2)"
                  strokeWidth={2}
                />
              );
            }
            return (
              <Polygon
                key={app.id}
                coordinates={app.coordinates}
                strokeColor={colors.success}
                fillColor="rgba(102, 187, 106, 0.2)"
                strokeWidth={2}
              />
            );
          })}
          {applications.filter((a) => a.status === 'reviewing' || a.status === 'submitted').map((app) => {
            if (app.coordinates.length === 1) {
              return (
                <Circle
                  key={app.id}
                  center={app.coordinates[0]}
                  radius={500}
                  strokeColor={colors.warning}
                  fillColor="rgba(255, 167, 38, 0.2)"
                  strokeWidth={2}
                />
              );
            }
            return (
              <Polygon
                key={app.id}
                coordinates={app.coordinates}
                strokeColor={colors.warning}
                fillColor="rgba(255, 167, 38, 0.2)"
                strokeWidth={2}
              />
            );
          })}
        </MapView>
        <View style={styles.mapLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
            <Text style={styles.legendText}>已批准</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
            <Text style={styles.legendText}>审批中</Text>
          </View>
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
        <SectionHeader
          title={`申请列表 (${filteredApps.length})`}
          right={
            <Button
              title="新建申请"
              size="sm"
              icon={<Ionicons name="add" size={16} color={colors.text} />}
              onPress={() => router.push('/airspace/create')}
            />
          }
        />

        {filteredApps.map((app) => {
          const appDrones = drones.filter((d) => app.droneIds.includes(d.id));
          return (
            <Card key={app.id} onPress={() => handleAppPress(app.id)}>
              <CardSection style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1, paddingRight: spacing.md }}>
                  <Text style={styles.appName}>
                    {app.taskName || app.purpose || '未命名申请'}
                  </Text>
                  <Text style={styles.applicant}>
                    申请人：{app.applicantName}
                  </Text>
                </View>
                <ApprovalStatusBadge status={app.status} />
              </CardSection>

              <CardDivider />

              <CardSection>
                <InfoRow
                  label="飞行高度"
                  value={`${app.altitudeMin}m ~ ${app.altitudeMax}m`}
                />
                <InfoRow
                  label="作业时间"
                  value={`${formatDateTime(app.startTime)} ~ ${formatDateTime(app.endTime)}`}
                />
                <InfoRow
                  label="使用设备"
                  value={appDrones.length > 0 ? appDrones.map((d) => d.nickname).join('、') : '未选择'}
                />
                <InfoRow label="申请时间" value={formatDateTime(app.createdAt)} />
              </CardSection>

              {app.reviewNotes && (
                <>
                  <CardDivider />
                  <CardSection>
                    <View style={styles.reviewNote}>
                      <Ionicons
                        name={app.status === 'approved' ? 'checkmark-circle' : 'close-circle'}
                        size={18}
                        color={app.status === 'approved' ? colors.success : colors.danger}
                      />
                      <View style={{ flex: 1, marginLeft: spacing.sm }}>
                        <Text style={styles.reviewNoteLabel}>
                          {app.status === 'approved' ? '审批意见' : '驳回原因'} · {app.reviewerName}
                        </Text>
                        <Text style={styles.reviewNoteText}>{app.reviewNotes}</Text>
                      </View>
                    </View>
                  </CardSection>
                </>
              )}

              {app.status === 'draft' && (
                <CardSection style={{ paddingTop: 0 }}>
                  <View style={{ flexDirection: 'row' }}>
                    <Button
                      title="编辑"
                      size="sm"
                      variant="outline"
                      style={{ flex: 1, marginRight: spacing.sm }}
                    />
                    <Button
                      title="提交审批"
                      size="sm"
                      style={{ flex: 1 }}
                    />
                  </View>
                </CardSection>
              )}
            </Card>
          );
        })}
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
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  miniMapContainer: {
    height: 160,
    position: 'relative',
  },
  miniMap: {
    ...StyleSheet.absoluteFillObject,
  },
  mapLegend: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    backgroundColor: colors.overlay,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.md,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.xs,
  },
  legendText: {
    color: colors.text,
    fontSize: fontSize.xs,
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
  appName: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  applicant: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  reviewNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.backgroundDark,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  reviewNoteLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  reviewNoteText: {
    color: colors.text,
    fontSize: fontSize.md,
    marginTop: 2,
    lineHeight: 20,
  },
});
