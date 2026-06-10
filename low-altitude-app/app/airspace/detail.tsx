import React from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Polygon, Circle } from 'react-native-maps';
import { useAppStore } from '../../src/store/useAppStore';
import { colors, spacing, fontSize, borderRadius } from '../../src/theme';
import { Card, CardSection, CardDivider } from '../../src/components/Card';
import { ApprovalStatusBadge } from '../../src/components/Badge';
import { Button } from '../../src/components/Button';
import { InfoRow, SectionHeader } from '../../src/components/Common';
import { formatDateTime } from '../../src/utils';

const PARK_CENTER = { latitude: 39.9042, longitude: 116.4074 };

export default function AirspaceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const getAirspaceApplicationById = useAppStore((s) => s.getAirspaceApplicationById);
  const getDroneById = useAppStore((s) => s.getDroneById);
  const submitAirspaceApplication = useAppStore((s) => s.submitAirspaceApplication);

  const app = id ? getAirspaceApplicationById(String(id)) : undefined;

  if (!app) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.textMuted }}>未找到申请信息</Text>
        <Button title="返回" onPress={() => router.back()} style={{ marginTop: spacing.lg }} />
      </View>
    );
  }

  const drones = app.droneIds.map((did) => getDroneById(did)).filter(Boolean);
  const canSubmit = app.status === 'draft';

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: PARK_CENTER.latitude,
              longitude: PARK_CENTER.longitude,
              latitudeDelta: 0.03,
              longitudeDelta: 0.03,
            }}
          >
            {app.coordinates.length === 1 ? (
              <Circle
                center={app.coordinates[0]}
                radius={800}
                strokeColor={colors.primary}
                fillColor="rgba(30, 136, 229, 0.15)"
                strokeWidth={2}
              />
            ) : (
              <Polygon
                coordinates={app.coordinates}
                strokeColor={colors.primary}
                fillColor="rgba(30, 136, 229, 0.15)"
                strokeWidth={2}
              />
            )}
          </MapView>
        </View>

        <Card>
          <CardSection style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, paddingRight: spacing.md }}>
              <Text style={styles.appName}>
                {app.taskName || app.purpose || '空域飞行申请'}
              </Text>
              <Text style={styles.applicantInfo}>
                <Ionicons name="person-outline" size={14} color={colors.textMuted} />
                {'  '}{app.applicantName}
              </Text>
            </View>
            <ApprovalStatusBadge status={app.status} />
          </CardSection>

          <CardDivider />

          <CardSection>
            <InfoRow
              label="飞行目的"
              value={app.purpose || '-'}
            />
            <InfoRow
              label="飞行高度"
              value={`${app.altitudeMin}m ~ ${app.altitudeMax}m`}
            />
            <InfoRow
              label="开始时间"
              value={formatDateTime(app.startTime)}
            />
            <InfoRow
              label="结束时间"
              value={formatDateTime(app.endTime)}
            />
            <InfoRow
              label="申请时间"
              value={formatDateTime(app.createdAt)}
            />
          </CardSection>
        </Card>

        <Card>
          <SectionHeader title={`使用设备 (${drones.length})`} />
          {drones.length === 0 ? (
            <Text style={styles.emptyText}>未选择设备</Text>
          ) : (
            drones.map((drone) => drone && (
              <View key={drone.id} style={styles.droneItem}>
                <View style={styles.droneIcon}>
                  <Ionicons name="airplane" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={styles.droneName}>{drone.nickname}</Text>
                  <Text style={styles.droneModel}>{drone.modelName} · {drone.serialNumber}</Text>
                </View>
              </View>
            ))
          )}
        </Card>

        {(app.reviewerId || app.reviewNotes) && (
          <Card>
            <SectionHeader title="审批信息" />
            <InfoRow label="审批人" value={app.reviewerName || '-'} />
            {app.reviewedAt && (
              <InfoRow label="审批时间" value={formatDateTime(app.reviewedAt)} />
            )}
            {app.reviewNotes && (
              <View style={styles.reviewNote}>
                <Ionicons
                  name={app.status === 'approved' ? 'checkmark-circle' : 'close-circle'}
                  size={18}
                  color={app.status === 'approved' ? colors.success : colors.danger}
                />
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <Text style={styles.reviewNoteLabel}>
                    {app.status === 'approved' ? '审批意见' : '驳回原因'}
                  </Text>
                  <Text style={styles.reviewNoteText}>{app.reviewNotes}</Text>
                </View>
              </View>
            )}
          </Card>
        )}

        <Card>
          <SectionHeader title="审批流程" />
          <View style={styles.flowContainer}>
            <View style={styles.flowStep}>
              <View style={[styles.flowDot, { backgroundColor: colors.success }]}>
                <Ionicons name="checkmark" size={14} color={colors.text} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.flowTitle}>提交申请</Text>
                <Text style={styles.flowTime}>{formatDateTime(app.createdAt)}</Text>
              </View>
            </View>
            <View style={styles.flowLine} />
            <View style={styles.flowStep}>
              <View
                style={[
                  styles.flowDot,
                  {
                    backgroundColor:
                      app.status === 'submitted' || app.status === 'reviewing' || app.status === 'approved' || app.status === 'rejected'
                        ? app.status === 'rejected' ? colors.danger : colors.success
                        : colors.border,
                  },
                ]}
              >
                {(app.status === 'approved' || app.status === 'rejected') && (
                  <Ionicons
                    name={app.status === 'approved' ? 'checkmark' : 'close'}
                    size={14}
                    color={colors.text}
                  />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.flowTitle}>管理员审批</Text>
                <Text style={styles.flowTime}>
                  {app.reviewedAt ? formatDateTime(app.reviewedAt) : app.status === 'reviewing' ? '审批中...' : '待审批'}
                </Text>
              </View>
            </View>
            <View style={styles.flowLine} />
            <View style={styles.flowStep}>
              <View
                style={[
                  styles.flowDot,
                  { backgroundColor: app.status === 'approved' ? colors.success : colors.border },
                ]}
              >
                {app.status === 'approved' && (
                  <Ionicons name="checkmark" size={14} color={colors.text} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.flowTitle}>飞行执行</Text>
                <Text style={styles.flowTime}>
                  {app.status === 'approved' ? '已批准，可执行飞行' : '等待批准'}
                </Text>
              </View>
            </View>
          </View>
        </Card>
      </ScrollView>

      {canSubmit && (
        <View style={styles.footer}>
          <Button
            title="取消"
            variant="outline"
            style={{ flex: 1, marginRight: spacing.md }}
            onPress={() => router.back()}
          />
          <Button
            title="提交审批"
            style={{ flex: 1 }}
            onPress={() => {
              submitAirspaceApplication(app.id);
              router.back();
            }}
          />
        </View>
      )}
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
  },
  mapContainer: {
    height: 220,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  appName: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  applicantInfo: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  droneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  droneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  droneIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  droneName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  droneModel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  reviewNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.backgroundDark,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
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
  flowContainer: {
    paddingLeft: spacing.sm,
  },
  flowStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flowDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  flowLine: {
    width: 2,
    height: spacing.xxl,
    backgroundColor: colors.border,
    marginLeft: 13,
    marginVertical: spacing.xs / 2,
  },
  flowTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  flowTime: {
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
