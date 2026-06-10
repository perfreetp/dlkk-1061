import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../src/store/useAppStore';
import { colors, spacing, fontSize, borderRadius } from '../../src/theme';
import { Card, CardSection, CardDivider } from '../../src/components/Card';
import { TaskStatusBadge, PriorityBadge } from '../../src/components/Badge';
import { Button } from '../../src/components/Button';
import { SectionHeader } from '../../src/components/Common';
import { formatDateTime } from '../../src/utils';
import type { TaskStatus } from '../../src/types';

const statusFilters: { key: TaskStatus | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'in_progress', label: '执行中' },
  { key: 'pending', label: '待执行' },
  { key: 'completed', label: '已完成' },
];

export default function TaskListScreen() {
  const router = useRouter();
  const tasks = useAppStore((s) => s.tasks);
  const user = useAppStore((s) => s.user);
  const setSelectedTaskId = useAppStore((s) => s.setSelectedTaskId);
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');

  const filteredTasks = useMemo(() => {
    if (filter === 'all') return tasks;
    return tasks.filter((t) => t.status === filter);
  }, [tasks, filter]);

  const stats = useMemo(() => {
    return {
      total: tasks.length,
      inProgress: tasks.filter((t) => t.status === 'in_progress').length,
      pending: tasks.filter((t) => t.status === 'pending').length,
      completed: tasks.filter((t) => t.status === 'completed').length,
    };
  }, [tasks]);

  const handleTaskPress = (taskId: string) => {
    setSelectedTaskId(taskId);
    router.push('/tasks/detail');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.name[0]}</Text>
          </View>
          <View style={{ marginLeft: spacing.md }}>
            <Text style={styles.greeting}>你好，{user.name}</Text>
            <Text style={styles.userRole}>{user.department}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>全部任务</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.statusBlue }]}>{stats.inProgress}</Text>
            <Text style={styles.statLabel}>执行中</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.statusYellow }]}>{stats.pending}</Text>
            <Text style={styles.statLabel}>待执行</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.statusGreen }]}>{stats.completed}</Text>
            <Text style={styles.statLabel}>已完成</Text>
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

        <SectionHeader
          title={`任务列表 (${filteredTasks.length})`}
          right={
            <Button
              title="新建"
              size="sm"
              icon={<Ionicons name="add" size={16} color={colors.text} />}
              onPress={() => router.push('/tasks/create')}
            />
          }
        />

        {filteredTasks.map((task) => (
          <Card key={task.id} onPress={() => handleTaskPress(task.id)}>
            <CardSection style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, paddingRight: spacing.md }}>
                <Text style={styles.taskName}>{task.name}</Text>
                <Text style={styles.taskArea}>
                  <Ionicons name="location-outline" size={12} color={colors.textMuted} />
                  {'  '}{task.areaName}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <TaskStatusBadge status={task.status} />
              </View>
            </CardSection>

            <CardSection>
              <Text style={styles.taskDescription} numberOfLines={2}>
                {task.description || '暂无任务描述'}
              </Text>
            </CardSection>

            <CardDivider />

            <CardSection style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <PriorityBadge priority={task.priority} />
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                <Text style={styles.taskTime}>
                  {task.scheduledTime ? formatDateTime(task.scheduledTime) : '未计划'}
                </Text>
              </View>
            </CardSection>

            {task.droneName && (
              <CardSection style={{ marginTop: spacing.sm, paddingTop: 0 }}>
                <View style={styles.metaRow}>
                  <Ionicons name="airplane-outline" size={14} color={colors.primary} />
                  <Text style={styles.metaText}>{task.droneName}</Text>
                  {task.droneModelName && (
                    <>
                      <Text style={styles.metaDivider}>·</Text>
                      <Ionicons name="hardware-chip-outline" size={14} color={colors.textMuted} />
                      <Text style={styles.metaText}>{task.droneModelName}</Text>
                    </>
                  )}
                  {task.payloadName ? (
                    <>
                      <Text style={styles.metaDivider}>·</Text>
                      <Ionicons name="cube-outline" size={14} color={colors.secondary} />
                      <Text style={[styles.metaText, { color: colors.secondary }]}>{task.payloadName}</Text>
                    </>
                  ) : task.droneModelName ? (
                    <>
                      <Text style={styles.metaDivider}>·</Text>
                      <View style={styles.noPayloadTag}>
                        <Text style={styles.noPayloadText}>载荷未安装</Text>
                      </View>
                    </>
                  ) : null}
                  {task.assigneeName && (
                    <>
                      <Text style={styles.metaDivider}>·</Text>
                      <Ionicons name="person-outline" size={14} color={colors.primary} />
                      <Text style={styles.metaText}>{task.assigneeName}</Text>
                    </>
                  )}
                  {task.abnormalPoints.length > 0 && (
                    <>
                      <Text style={styles.metaDivider}>·</Text>
                      <Ionicons name="warning-outline" size={14} color={colors.warning} />
                      <Text style={[styles.metaText, { color: colors.warning }]}>
                        {task.abnormalPoints.length}处异常
                      </Text>
                    </>
                  )}
                </View>
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
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  greeting: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  userRole: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    marginHorizontal: 3,
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
  filterBar: {
    marginBottom: spacing.lg,
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
  taskName: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  taskArea: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  taskDescription: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    lineHeight: 20,
  },
  taskTime: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginLeft: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginLeft: 4,
  },
  metaDivider: {
    color: colors.borderLight,
    marginHorizontal: spacing.sm,
  },
  noPayloadTag: {
    backgroundColor: colors.warning + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
  },
  noPayloadText: {
    color: colors.warning,
    fontSize: fontSize.xs,
    fontWeight: '500',
  },
});
