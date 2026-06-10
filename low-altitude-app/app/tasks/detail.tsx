import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Text, Pressable, Modal, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../src/store/useAppStore';
import { colors, spacing, fontSize, borderRadius } from '../../src/theme';
import { Card, CardDivider, CardSection } from '../../src/components/Card';
import { TaskStatusBadge, PriorityBadge } from '../../src/components/Badge';
import { Button } from '../../src/components/Button';
import { InfoRow, SectionHeader } from '../../src/components/Common';
import { formatDateTime } from '../../src/utils';
import type { TaskStatus } from '../../src/types';

export default function TaskDetailScreen() {
  const router = useRouter();
  const selectedTaskId = useAppStore((s) => s.selectedTaskId);
  const getTaskById = useAppStore((s) => s.getTaskById);
  const updateTaskStatus = useAppStore((s) => s.updateTaskStatus);
  const addAbnormalPoint = useAppStore((s) => s.addAbnormalPoint);
  const getAirspaceApplicationById = useAppStore((s) => s.getAirspaceApplicationById);

  const task = selectedTaskId ? getTaskById(selectedTaskId) : undefined;
  const airspaceApp = task?.airspaceApplicationId
    ? getAirspaceApplicationById(task.airspaceApplicationId)
    : undefined;

  const [showAbnormalModal, setShowAbnormalModal] = useState(false);
  const [abnormalType, setAbnormalType] = useState('');
  const [abnormalDesc, setAbnormalDesc] = useState('');
  const [abnormalSeverity, setAbnormalSeverity] = useState<'minor' | 'moderate' | 'severe'>('moderate');

  if (!task) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.textMuted }}>未找到任务信息</Text>
        <Button title="返回" onPress={() => router.back()} style={{ marginTop: spacing.lg }} />
      </View>
    );
  }

  const canStart = task.status === 'pending';
  const canPause = task.status === 'in_progress';
  const canResume = task.status === 'paused';
  const canComplete = task.status === 'in_progress' || task.status === 'paused';

  const handleStatusChange = (newStatus: TaskStatus) => {
    const labels: Record<TaskStatus, string> = {
      pending: '待执行',
      in_progress: '开始执行',
      paused: '暂停',
      completed: '完成',
      cancelled: '取消',
    };
    Alert.alert('确认操作', `确定要${labels[newStatus]}该任务吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        onPress: () => updateTaskStatus(task.id, newStatus),
      },
    ]);
  };

  const handleAddAbnormal = () => {
    if (!abnormalType.trim() || !abnormalDesc.trim()) return;
    addAbnormalPoint(task.id, {
      taskId: task.id,
      coordinate: { latitude: 39.9042, longitude: 116.4074 },
      type: abnormalType.trim(),
      description: abnormalDesc.trim(),
      severity: abnormalSeverity,
      photos: [],
      handled: false,
    });
    setShowAbnormalModal(false);
    setAbnormalType('');
    setAbnormalDesc('');
    setAbnormalSeverity('moderate');
  };

  const goToMonitor = () => {
    router.push('/monitor');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
        <Card>
          <CardSection style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.taskName}>{task.name}</Text>
              <View style={{ flexDirection: 'row', marginTop: spacing.sm }}>
                <TaskStatusBadge status={task.status} />
                <View style={{ width: spacing.sm }} />
                <PriorityBadge priority={task.priority} />
              </View>
            </View>
          </CardSection>

          <CardDivider />

          <CardSection>
            <InfoRow label="巡检区域" value={task.areaName || '-'} />
            <InfoRow label="任务描述" value={task.description || '-'} />
            <InfoRow label="创建人" value={task.creatorName} />
            <InfoRow label="执行人" value={task.assigneeName || '未指派'} />
            <InfoRow label="计划时间" value={task.scheduledTime ? formatDateTime(task.scheduledTime) : '未计划'} />
            <InfoRow label="开始时间" value={task.startTime ? formatDateTime(task.startTime) : '-'} />
            <InfoRow label="创建时间" value={formatDateTime(task.createdAt)} />
          </CardSection>
        </Card>

        <Card>
          <SectionHeader title="执行配置" />
          <InfoRow label="无人机" value={task.droneName || '未选择'} />
          <InfoRow label="航线" value={task.routeName || '未选择'} />
          <InfoRow
            label="空域申请"
            value={
              airspaceApp ? (
                <View>
                  <Text style={{ color: colors.text, fontWeight: '500' }}>
                    {airspaceApp.status === 'approved' ? '已批准' : '审批中'}
                  </Text>
                </View>
              ) : (
                '未申请'
              )
            }
          />
        </Card>

        {task.status === 'in_progress' && (
          <Card>
            <SectionHeader title="快捷操作" />
            <View style={styles.actionRow}>
              <Button
                title="进入监控"
                icon={<Ionicons name="eye" size={18} color={colors.text} />}
                style={{ flex: 1, marginRight: spacing.sm }}
                onPress={goToMonitor}
              />
              <Button
                title="标记异常"
                variant="danger"
                icon={<Ionicons name="warning" size={18} color={colors.text} />}
                style={{ flex: 1, marginLeft: spacing.sm }}
                onPress={() => setShowAbnormalModal(true)}
              />
            </View>
          </Card>
        )}

        <Card>
          <SectionHeader
            title={`异常点 (${task.abnormalPoints.length})`}
            right={
              task.status === 'in_progress' ? (
                <Button
                  title="新增"
                  size="sm"
                  icon={<Ionicons name="add" size={14} color={colors.text} />}
                  onPress={() => setShowAbnormalModal(true)}
                />
              ) : null
            }
          />
          {task.abnormalPoints.length === 0 ? (
            <Text style={styles.emptyText}>暂无异常点记录</Text>
          ) : (
            task.abnormalPoints.map((ap) => (
              <View key={ap.id} style={styles.abnormalItem}>
                <View style={styles.abnormalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.abnormalType}>{ap.type}</Text>
                    <Text style={styles.abnormalMeta}>
                      {ap.reporterName} · {formatDateTime(ap.reportedAt)}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.abnormalSeverity,
                      {
                        color:
                          ap.severity === 'severe'
                            ? colors.danger
                            : ap.severity === 'moderate'
                            ? colors.warning
                            : colors.info,
                      },
                    ]}
                  >
                    {ap.severity === 'severe' ? '严重' : ap.severity === 'moderate' ? '中等' : '轻微'}
                  </Text>
                </View>
                <Text style={styles.abnormalDesc}>{ap.description}</Text>
                <View style={{ marginTop: spacing.sm }}>
                  <Text style={[styles.abnormalStatus, { color: ap.handled ? colors.success : colors.warning }]}>
                    {ap.handled ? `✓ 已处理 - ${ap.handlerName} · ${formatDateTime(ap.handledAt || '')}` : '待处理'}
                  </Text>
                  {ap.handlingNotes && (
                    <Text style={styles.abnormalNotes}>处理意见：{ap.handlingNotes}</Text>
                  )}
                </View>
              </View>
            ))
          )}
        </Card>

        <Card>
          <SectionHeader title="操作记录" />
          {!task.reports || task.reports.length === 0 ? (
            <Text style={styles.emptyText}>暂无操作记录</Text>
          ) : (
            task.reports.map((r) => (
              <View key={r.id} style={styles.logItem}>
                <Text style={styles.logTitle}>{r.title}</Text>
                <Text style={styles.logMeta}>
                  {r.generatedByName} · {formatDateTime(r.generatedAt)}
                </Text>
              </View>
            ))
          )}
        </Card>
      </ScrollView>

      {(task.status === 'pending' || task.status === 'in_progress' || task.status === 'paused') && (
        <View style={styles.footer}>
          {canStart && (
            <Button
              title="开始任务"
              style={{ flex: 1, marginRight: spacing.sm }}
              icon={<Ionicons name="play" size={18} color={colors.text} />}
              onPress={() => handleStatusChange('in_progress')}
            />
          )}
          {canPause && (
            <Button
              title="暂停"
              variant="secondary"
              style={{ flex: 1, marginRight: spacing.sm }}
              icon={<Ionicons name="pause" size={18} color={colors.text} />}
              onPress={() => handleStatusChange('paused')}
            />
          )}
          {canResume && (
            <Button
              title="继续"
              style={{ flex: 1, marginRight: spacing.sm }}
              icon={<Ionicons name="play" size={18} color={colors.text} />}
              onPress={() => handleStatusChange('in_progress')}
            />
          )}
          {canComplete && (
            <Button
              title="完成任务"
              variant="success"
              style={canStart || canPause || canResume ? { flex: 1, marginLeft: spacing.sm } : { flex: 1 }}
              icon={<Ionicons name="checkmark" size={18} color={colors.text} />}
              onPress={() => handleStatusChange('completed')}
            />
          )}
        </View>
      )}

      <Modal
        visible={showAbnormalModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAbnormalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>上报异常点</Text>
              <Pressable onPress={() => setShowAbnormalModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView>
              <Text style={styles.label}>异常类型</Text>
              <TextInput
                style={styles.input}
                placeholder="如：设备缺陷、违规建筑等"
                placeholderTextColor={colors.textMuted}
                value={abnormalType}
                onChangeText={setAbnormalType}
              />

              <Text style={[styles.label, { marginTop: spacing.lg }]}>严重程度</Text>
              <View style={styles.severityRow}>
                {(['minor', 'moderate', 'severe'] as const).map((s) => (
                  <Pressable
                    key={s}
                    style={[
                      styles.severityChip,
                      abnormalSeverity === s && {
                        borderColor:
                          s === 'severe'
                            ? colors.danger
                            : s === 'moderate'
                            ? colors.warning
                            : colors.info,
                        backgroundColor:
                          (s === 'severe'
                            ? colors.danger
                            : s === 'moderate'
                            ? colors.warning
                            : colors.info) + '20',
                      },
                    ]}
                    onPress={() => setAbnormalSeverity(s)}
                  >
                    <Text
                      style={[
                        styles.severityText,
                        {
                          color:
                            s === 'severe'
                              ? colors.danger
                              : s === 'moderate'
                              ? colors.warning
                              : colors.info,
                        },
                      ]}
                    >
                      {s === 'severe' ? '严重' : s === 'moderate' ? '中等' : '轻微'}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.label, { marginTop: spacing.lg }]}>详细描述</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="请详细描述异常情况"
                placeholderTextColor={colors.textMuted}
                value={abnormalDesc}
                onChangeText={setAbnormalDesc}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </ScrollView>
            <View style={styles.modalFooter}>
              <Button
                title="取消"
                variant="outline"
                style={{ flex: 1, marginRight: spacing.md }}
                onPress={() => setShowAbnormalModal(false)}
              />
              <Button
                title="提交"
                style={{ flex: 1 }}
                disabled={!abnormalType.trim() || !abnormalDesc.trim()}
                onPress={handleAddAbnormal}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  taskName: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: '700',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  actionRow: {
    flexDirection: 'row',
  },
  abnormalItem: {
    backgroundColor: colors.backgroundDark,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  abnormalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  abnormalType: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  abnormalMeta: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  abnormalSeverity: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  abnormalDesc: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    lineHeight: 20,
  },
  abnormalStatus: {
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  abnormalNotes: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  logItem: {
    marginBottom: spacing.md,
  },
  logTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  logMeta: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.text,
    fontSize: fontSize.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.lg,
  },
  textArea: {
    minHeight: 100,
  },
  severityRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
  },
  severityChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  severityText: {
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
