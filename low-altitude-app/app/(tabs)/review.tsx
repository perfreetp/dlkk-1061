import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Text, Pressable, Dimensions, Modal, Share, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Polyline, Marker } from 'react-native-maps';
import { LineChart, BarChart, ContributionGraph, PieChart } from 'react-native-chart-kit';
import { useAppStore } from '../../src/store/useAppStore';
import { colors, spacing, fontSize, borderRadius } from '../../src/theme';
import { Card, CardSection, CardDivider } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { SectionHeader, InfoRow, EmptyState } from '../../src/components/Common';
import { Badge } from '../../src/components/Badge';
import { ProgressBar } from '../../src/components/Progress';
import { formatDateTime, formatDistance, formatDuration } from '../../src/utils';
import type { Coordinate, TaskReport } from '../../src/types';

const PARK_CENTER: Coordinate = { latitude: 39.9042, longitude: 116.4074 };
const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TabKey = 'overview' | 'flights' | 'stats' | 'reports';

const chartConfig = {
  backgroundColor: colors.card,
  backgroundGradientFrom: colors.card,
  backgroundGradientTo: colors.card,
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(30, 136, 229, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(176, 190, 197, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '3',
    strokeWidth: '2',
    stroke: colors.primary,
  },
};

export default function ReviewScreen() {
  const router = useRouter();
  const statistics = useAppStore((s) => s.statistics);
  const flightRecords = useAppStore((s) => s.flightRecords);
  const tasks = useAppStore((s) => s.tasks);
  const drones = useAppStore((s) => s.drones);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(flightRecords[0]?.id || null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [viewingReport, setViewingReport] = useState<TaskReport | null>(null);
  const [generatingTaskId, setGeneratingTaskId] = useState<string | null>(null);

  const generateReport = useAppStore((s) => s.generateReport);

  const selectedFlight = flightRecords.find((f) => f.id === selectedFlightId);
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  const tabs: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'overview', label: '总览', icon: 'stats-chart' },
    { key: 'flights', label: '飞行记录', icon: 'time' },
    { key: 'stats', label: '利用率', icon: 'analytics' },
    { key: 'reports', label: '巡检报告', icon: 'document-text' },
  ];

  const dailyFlightData = {
    labels: statistics.dailyStats.map((d) => d.date),
    datasets: [
      {
        data: statistics.dailyStats.map((d) => d.flightTime),
      },
    ],
  };

  const dailyTaskData = {
    labels: statistics.dailyStats.map((d) => d.date),
    datasets: [
      {
        data: statistics.dailyStats.map((d) => d.tasks),
      },
    ],
  };

  const utilizationPieData = [
    {
      name: '巡检1号',
      population: statistics.droneStats[0]?.utilization || 0,
      color: colors.primary,
      legendFontColor: colors.textSecondary,
      legendFontSize: 12,
    },
    {
      name: '巡检2号',
      population: statistics.droneStats[1]?.utilization || 0,
      color: colors.secondary,
      legendFontColor: colors.textSecondary,
      legendFontSize: 12,
    },
    {
      name: '机动侦察',
      population: statistics.droneStats[2]?.utilization || 0,
      color: colors.warning,
      legendFontColor: colors.textSecondary,
      legendFontSize: 12,
    },
    {
      name: '闲置',
      population: Math.max(0, 100 - Math.max(...statistics.droneStats.map((d) => d.utilization), 0)),
      color: colors.border,
      legendFontColor: colors.textSecondary,
      legendFontSize: 12,
    },
  ];

  const completionRate = statistics.totalTasks > 0
    ? Math.round((statistics.completedTasks / statistics.totalTasks) * 100)
    : 0;

  const handleViewReplay = (flightId: string) => {
    setSelectedFlightId(flightId);
    router.push(`/review/detail?id=${flightId}`);
  };

  const handleGenerateReport = (taskId: string) => {
    setGeneratingTaskId(taskId);
    const reportId = generateReport(taskId);
    if (reportId) {
      const freshTasks = useAppStore.getState().tasks;
      const task = freshTasks.find((t) => t.id === taskId);
      const report = task?.reports.find((r) => r.id === reportId);
      if (report) {
        setViewingReport(report);
        setShowReportModal(true);
      }
    }
    setGeneratingTaskId(null);
  };

  const handleViewReport = (task: typeof completedTasks[0]) => {
    if (task.reports.length > 0) {
      setViewingReport(task.reports[task.reports.length - 1]);
      setShowReportModal(true);
    } else {
      handleGenerateReport(task.id);
    }
  };

  const handleExportPDF = async (task: typeof completedTasks[0]) => {
    let report = task.reports.length > 0 ? task.reports[task.reports.length - 1] : null;
    if (!report) {
      const reportId = generateReport(task.id);
      const freshTasks = useAppStore.getState().tasks;
      const updatedTask = freshTasks.find((t) => t.id === task.id);
      report = updatedTask?.reports.find((r) => r.id === reportId) || null;
    }
    if (!report) return;

    try {
      await Share.share({
        message: report.content,
        title: report.title,
      });
    } catch (e) {
      Alert.alert('导出失败', '无法导出报告，请重试');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={tab.icon}
              size={20}
              color={activeTab === tab.key ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
        {activeTab === 'overview' && (
          <>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: colors.primary }]}>{statistics.totalTasks}</Text>
                <Text style={styles.statLabel}>总任务数</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: colors.success }]}>{statistics.completedTasks}</Text>
                <Text style={styles.statLabel}>已完成</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: colors.secondary }]}>{formatDuration(statistics.totalFlightTime)}</Text>
                <Text style={styles.statLabel}>总飞行时长</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: colors.warning }]}>{statistics.totalFlights}</Text>
                <Text style={styles.statLabel}>飞行架次</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: colors.info }]}>{formatDistance(statistics.totalDistance)}</Text>
                <Text style={styles.statLabel}>总飞行距离</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: colors.danger }]}>{statistics.abnormalCount}</Text>
                <Text style={styles.statLabel}>异常点</Text>
              </View>
            </View>

            <Card>
              <SectionHeader title={`任务完成率 (${statistics.period})`} />
              <View style={styles.progressRow}>
                <View style={{ flex: 1 }}>
                  <ProgressBar
                    value={completionRate}
                    showLabel
                    label={`${statistics.completedTasks} / ${statistics.totalTasks} (${completionRate}%)`}
                    height={10}
                    color={colors.success}
                  />
                </View>
              </View>
            </Card>

            <Card>
              <SectionHeader title="每日飞行时长 (小时)" />
              <LineChart
                data={dailyFlightData}
                width={SCREEN_WIDTH - spacing.lg * 2 - spacing.lg}
                height={200}
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => `rgba(38, 166, 154, ${opacity})`,
                }}
                bezier
                style={styles.chart}
              />
            </Card>

            <Card>
              <SectionHeader title="每日任务完成数" />
              <BarChart
                data={dailyTaskData}
                width={SCREEN_WIDTH - spacing.lg * 2 - spacing.lg}
                height={200}
                chartConfig={chartConfig}
                style={styles.chart}
                showValuesOnTopOfBars
              />
            </Card>
          </>
        )}

        {activeTab === 'flights' && (
          <>
            <SectionHeader title={`飞行记录 (${flightRecords.length})`} />
            {flightRecords.length === 0 ? (
              <EmptyState
                icon="airplane-outline"
                title="暂无飞行记录"
                description="完成飞行任务后将自动生成记录"
              />
            ) : (
              flightRecords.map((flight) => (
                <Card key={flight.id} onPress={() => handleViewReplay(flight.id)}>
                  <CardSection style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.flightTaskName}>{flight.taskName}</Text>
                      <Text style={styles.flightMeta}>
                        {flight.droneName} · {flight.pilotName}
                      </Text>
                    </View>
                    <Badge text={flight.abnormalCount > 0 ? `${flight.abnormalCount}处异常` : '正常'} color={flight.abnormalCount > 0 ? colors.warning : colors.success} />
                  </CardSection>
                  <CardDivider />
                  <CardSection>
                    <InfoRow label="飞行时间" value={`${formatDateTime(flight.startTime)} ~ ${formatDateTime(flight.endTime)}`} />
                    <InfoRow label="飞行时长" value={formatDuration(flight.duration)} />
                    <InfoRow label="飞行距离" value={formatDistance(flight.distance)} />
                    <InfoRow label="最大高度" value={`${flight.maxAltitude} 米`} />
                    <InfoRow label="最大速度" value={`${flight.maxSpeed} m/s`} />
                    <InfoRow label="拍摄照片" value={`${flight.photos} 张`} />
                  </CardSection>
                  <CardSection style={{ paddingTop: 0 }}>
                    <Button
                      title="轨迹回放"
                      size="sm"
                      variant="outline"
                      icon={<Ionicons name="play-circle-outline" size={16} color={colors.primary} />}
                      onPress={() => handleViewReplay(flight.id)}
                    />
                  </CardSection>
                </Card>
              ))
            )}
          </>
        )}

        {activeTab === 'stats' && (
          <>
            <Card>
              <SectionHeader title="设备利用率分布" />
              <PieChart
                data={utilizationPieData}
                width={SCREEN_WIDTH - spacing.lg * 2 - spacing.lg}
                height={200}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
                hasLegend={false}
              />
              <View style={styles.legendWrap}>
                {utilizationPieData.slice(0, 3).map((item, i) => (
                  <View key={i} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                    <Text style={styles.legendText}>
                      {item.name}: {item.population}%
                    </Text>
                  </View>
                ))}
              </View>
            </Card>

            <Card>
              <SectionHeader title="设备详细统计" />
              {statistics.droneStats.map((stat) => (
                <View key={stat.droneId} style={styles.droneStatRow}>
                  <View style={styles.droneStatHeader}>
                    <Ionicons name="airplane" size={18} color={colors.primary} />
                    <Text style={styles.droneStatName}>{stat.droneName}</Text>
                  </View>
                  <View style={{ marginTop: spacing.sm }}>
                    <ProgressBar
                      value={stat.utilization}
                      showLabel
                      label={`利用率 ${stat.utilization}%`}
                      height={8}
                      color={stat.utilization >= 70 ? colors.success : stat.utilization >= 40 ? colors.warning : colors.danger}
                    />
                  </View>
                  <View style={styles.droneStatInfo}>
                    <View style={styles.droneStatInfoItem}>
                      <Text style={styles.droneStatInfoValue}>{stat.flights}</Text>
                      <Text style={styles.droneStatInfoLabel}>架次</Text>
                    </View>
                    <View style={styles.droneStatInfoItem}>
                      <Text style={styles.droneStatInfoValue}>{formatDuration(stat.flightTime)}</Text>
                      <Text style={styles.droneStatInfoLabel}>时长</Text>
                    </View>
                    <View style={styles.droneStatInfoItem}>
                      <Text style={[styles.droneStatInfoValue, { color: stat.abnormalCount > 0 ? colors.danger : colors.success }]}>
                        {stat.abnormalCount}
                      </Text>
                      <Text style={styles.droneStatInfoLabel}>异常</Text>
                    </View>
                  </View>
                  {stat.droneId !== statistics.droneStats[statistics.droneStats.length - 1].droneId && (
                    <CardDivider />
                  )}
                </View>
              ))}
            </Card>

            <Card>
              <SectionHeader title="人员效率统计" />
              {statistics.userStats.map((stat) => (
                <View key={stat.userId} style={styles.userStatRow}>
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>{stat.userName[0]}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.userName}>{stat.userName}</Text>
                      <Badge text={`效率 ${stat.utilization}%`} color={stat.utilization >= 60 ? colors.success : colors.warning} />
                    </View>
                    <View style={styles.userStatInfoRow}>
                      <View style={styles.userStatInfoItem}>
                        <Text style={styles.userStatInfoValue}>{stat.tasks}</Text>
                        <Text style={styles.userStatInfoLabel}>任务</Text>
                      </View>
                      <View style={styles.userStatInfoItem}>
                        <Text style={styles.userStatInfoValue}>{stat.flights}</Text>
                        <Text style={styles.userStatInfoLabel}>架次</Text>
                      </View>
                      <View style={styles.userStatInfoItem}>
                        <Text style={styles.userStatInfoValue}>{formatDuration(stat.flightTime)}</Text>
                        <Text style={styles.userStatInfoLabel}>飞行时长</Text>
                      </View>
                    </View>
                  </View>
                  {stat.userId !== statistics.userStats[statistics.userStats.length - 1].userId && (
                    <CardDivider />
                  )}
                </View>
              ))}
            </Card>
          </>
        )}

        {activeTab === 'reports' && (
          <>
            <SectionHeader title={`巡检报告 (${completedTasks.length})`} />
            {completedTasks.length === 0 ? (
              <EmptyState
                icon="document-text-outline"
                title="暂无报告"
                description="任务完成后将自动生成巡检报告"
              />
            ) : (
              completedTasks.map((task) => (
                <Card key={task.id}>
                  <CardSection style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, paddingRight: spacing.md }}>
                      <Text style={styles.reportTitle}>{task.name}</Text>
                      <Text style={styles.reportArea}>
                        <Ionicons name="location-outline" size={12} color={colors.textMuted} />
                        {'  '}{task.areaName}
                      </Text>
                      <Text style={styles.reportTime}>
                        <Ionicons name="time-outline" size={12} color={colors.textMuted} />
                        {'  '}{formatDateTime(task.endTime || task.updatedAt)}
                      </Text>
                    </View>
                    <Badge text={task.abnormalPoints.length > 0 ? `${task.abnormalPoints.length}处异常` : '正常'} color={task.abnormalPoints.length > 0 ? colors.warning : colors.success} />
                  </CardSection>

                  <CardDivider />

                  <CardSection>
                    <InfoRow label="执行人" value={task.assigneeName || '-'} />
                    <InfoRow label="使用设备" value={task.droneName || '-'} />
                    <InfoRow
                      label="异常点"
                      value={
                        task.abnormalPoints.length > 0
                          ? task.abnormalPoints.map((ap) => `${ap.type}(${ap.severity === 'severe' ? '严重' : ap.severity === 'moderate' ? '中等' : '轻微'})`).join('、')
                          : '无异常'
                      }
                    />
                  </CardSection>

                  <CardSection style={{ paddingTop: 0, flexDirection: 'row' }}>
                    <Button
                      title={task.reports.length > 0 ? '查看报告' : '生成报告'}
                      size="sm"
                      style={{ flex: 1, marginRight: spacing.sm }}
                      icon={<Ionicons name={task.reports.length > 0 ? 'eye-outline' : 'document-text-outline'} size={14} color={colors.text} />}
                      onPress={() => handleViewReport(task)}
                      loading={generatingTaskId === task.id}
                    />
                    <Button
                      title="导出PDF"
                      size="sm"
                      variant="outline"
                      style={{ flex: 1, marginLeft: spacing.sm }}
                      icon={<Ionicons name="download-outline" size={14} color={colors.primary} />}
                      onPress={() => handleExportPDF(task)}
                    />
                  </CardSection>
                </Card>
              ))
            )}
          </>
        )}
      </ScrollView>

      <Modal
        visible={showReportModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={styles.reportModalOverlay}>
          <View style={styles.reportModalContent}>
            <View style={styles.reportModalHeader}>
              <Text style={styles.reportModalTitle} numberOfLines={1}>
                {viewingReport?.title || '巡检报告'}
              </Text>
              <Pressable onPress={() => setShowReportModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView style={styles.reportModalBody}>
              {viewingReport && (
                <>
                  <View style={styles.reportMetaRow}>
                    <View style={styles.reportMetaItem}>
                      <Ionicons name="person-outline" size={14} color={colors.textMuted} />
                      <Text style={styles.reportMetaText}>{viewingReport.generatedByName}</Text>
                    </View>
                    <View style={styles.reportMetaItem}>
                      <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                      <Text style={styles.reportMetaText}>{formatDateTime(viewingReport.generatedAt)}</Text>
                    </View>
                  </View>
                  <View style={styles.reportContentBox}>
                    {viewingReport.content.split('\n').map((line, i) => (
                      <Text
                        key={i}
                        style={[
                          styles.reportContentText,
                          line.startsWith('【') && styles.reportContentTitle,
                          line.startsWith('一、') || line.startsWith('二、') || line.startsWith('三、') || line.startsWith('四、') || line.startsWith('五、')
                            ? styles.reportContentSection
                            : null,
                        ]}
                      >
                        {line || ' '}
                      </Text>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>
            <View style={styles.reportModalFooter}>
              <Button
                title="关闭"
                variant="outline"
                style={{ flex: 1, marginRight: spacing.md }}
                onPress={() => setShowReportModal(false)}
              />
              <Button
                title="分享导出"
                style={{ flex: 1 }}
                icon={<Ionicons name="share-outline" size={16} color={colors.text} />}
                onPress={async () => {
                  if (viewingReport) {
                    try {
                      await Share.share({
                        message: viewingReport.content,
                        title: viewingReport.title,
                      });
                    } catch (e) {}
                  }
                }}
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.sm,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
    marginBottom: spacing.lg,
  },
  statBox: {
    width: '33.33%',
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.sm,
  },
  statNumber: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    textAlign: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textAlign: 'center',
    marginTop: 2,
  },
  progressRow: {
    marginTop: spacing.sm,
  },
  chart: {
    marginVertical: spacing.sm,
    borderRadius: 16,
  },
  flightTaskName: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  flightMeta: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  legendWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    paddingVertical: spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.sm,
  },
  legendText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  droneStatRow: {
    marginBottom: spacing.md,
  },
  droneStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  droneStatName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  droneStatInfo: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  droneStatInfoItem: {
    flex: 1,
    alignItems: 'center',
  },
  droneStatInfoValue: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  droneStatInfoLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  userStatRow: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  userName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  userStatInfoRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  userStatInfoItem: {
    flex: 1,
  },
  userStatInfoValue: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  userStatInfoLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 1,
  },
  reportTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  reportArea: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  reportTime: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  reportModalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  reportModalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '90%',
  },
  reportModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  reportModalTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
    flex: 1,
    marginRight: spacing.md,
  },
  reportModalBody: {
    flex: 1,
    padding: spacing.lg,
  },
  reportMetaRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  reportMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.xl,
  },
  reportMetaText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginLeft: spacing.xs,
  },
  reportContentBox: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  reportContentText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    lineHeight: 22,
  },
  reportContentTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  reportContentSection: {
    color: colors.primary,
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  reportModalFooter: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});