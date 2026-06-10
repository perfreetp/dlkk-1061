import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Text, TextInput, Pressable, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../src/store/useAppStore';
import { colors, spacing, fontSize, borderRadius } from '../../src/theme';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Badge } from '../../src/components/Badge';

export default function CreateAirspaceScreen() {
  const router = useRouter();
  const { editId } = useLocalSearchParams();
  const tasks = useAppStore((s) => s.tasks);
  const drones = useAppStore((s) => s.drones);
  const createAirspaceApplication = useAppStore((s) => s.createAirspaceApplication);
  const submitAirspaceApplication = useAppStore((s) => s.submitAirspaceApplication);
  const updateAirspaceApplication = useAppStore((s) => s.updateAirspaceApplication);
  const getAirspaceApplicationById = useAppStore((s) => s.getAirspaceApplicationById);

  const existingApp = editId ? getAirspaceApplicationById(String(editId)) : undefined;

  const [taskId, setTaskId] = useState(existingApp?.taskId || '');
  const [purpose, setPurpose] = useState(existingApp?.purpose || '');
  const [altitudeMin, setAltitudeMin] = useState(String(existingApp?.altitudeMin ?? '0'));
  const [altitudeMax, setAltitudeMax] = useState(String(existingApp?.altitudeMax ?? '120'));
  const [startDate, setStartDate] = useState(existingApp?.startTime ? existingApp.startTime.split(' ')[0] : '');
  const [startTime, setStartTime] = useState(existingApp?.startTime ? existingApp.startTime.split(' ')[1]?.slice(0, 5) : '');
  const [endDate, setEndDate] = useState(existingApp?.endTime ? existingApp.endTime.split(' ')[0] : '');
  const [endTime, setEndTime] = useState(existingApp?.endTime ? existingApp.endTime.split(' ')[1]?.slice(0, 5) : '');
  const [selectedDrones, setSelectedDrones] = useState<string[]>(existingApp?.droneIds || []);

  const selectedTask = tasks.find((t) => t.id === taskId);

  const toggleDrone = (droneId: string) => {
    if (selectedDrones.includes(droneId)) {
      setSelectedDrones(selectedDrones.filter((id) => id !== droneId));
    } else {
      setSelectedDrones([...selectedDrones, droneId]);
    }
  };

  const handleSave = (submit: boolean) => {
    if (editId && existingApp) {
      updateAirspaceApplication(String(editId), {
        taskId,
        taskName: selectedTask?.name || existingApp.taskName,
        purpose: purpose.trim(),
        altitudeMin: parseInt(altitudeMin) || 0,
        altitudeMax: parseInt(altitudeMax) || 120,
        startTime: startDate && startTime ? `${startDate} ${startTime}:00` : '',
        endTime: endDate && endTime ? `${endDate} ${endTime}:00` : '',
        droneIds: selectedDrones,
      });
      if (submit) {
        submitAirspaceApplication(String(editId));
      }
      router.back();
      return;
    }
    const appId = createAirspaceApplication({
      taskId,
      taskName: selectedTask?.name,
      purpose: purpose.trim(),
      altitudeMin: parseInt(altitudeMin) || 0,
      altitudeMax: parseInt(altitudeMax) || 120,
      startTime: startDate && startTime ? `${startDate} ${startTime}:00` : '',
      endTime: endDate && endTime ? `${endDate} ${endTime}:00` : '',
      droneIds: selectedDrones,
      coordinates: [{ latitude: 39.9042, longitude: 116.4074 }],
    });
    if (submit && appId) {
      submitAirspaceApplication(appId);
    }
    router.back();
  };

  const canSubmit = purpose.trim() && startDate && startTime && endDate && endTime && selectedDrones.length > 0;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
        <Card>
          <Text style={styles.label}>关联任务</Text>
          <View style={styles.optionList}>
            {tasks.map((task) => (
              <Pressable
                key={task.id}
                style={[
                  styles.optionItem,
                  taskId === task.id && styles.optionItemActive,
                ]}
                onPress={() => setTaskId(task.id)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionTitle}>{task.name}</Text>
                  <Text style={styles.optionSubtitle}>{task.areaName}</Text>
                </View>
                {taskId === task.id && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </Pressable>
            ))}
          </View>
        </Card>

        <Card>
          <Text style={styles.label}>飞行目的 *</Text>
          <TextInput
            style={styles.input}
            placeholder="请简要描述飞行目的"
            placeholderTextColor={colors.textMuted}
            value={purpose}
            onChangeText={setPurpose}
          />

          <Text style={[styles.label, { marginTop: spacing.lg }]}>飞行高度范围 (米)</Text>
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: spacing.sm }}>
              <Text style={styles.smallLabel}>最低高度</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={altitudeMin}
                onChangeText={setAltitudeMin}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.smallLabel}>最高高度</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={altitudeMax}
                onChangeText={setAltitudeMax}
              />
            </View>
          </View>
        </Card>

        <Card>
          <Text style={styles.label}>作业时间段 *</Text>
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: spacing.sm }}>
              <Text style={styles.smallLabel}>开始日期</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
                value={startDate}
                onChangeText={setStartDate}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.smallLabel}>开始时间</Text>
              <TextInput
                style={styles.input}
                placeholder="HH:MM"
                placeholderTextColor={colors.textMuted}
                value={startTime}
                onChangeText={setStartTime}
              />
            </View>
          </View>
          <View style={[styles.row, { marginTop: spacing.md }]}>
            <View style={{ flex: 1, marginRight: spacing.sm }}>
              <Text style={styles.smallLabel}>结束日期</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
                value={endDate}
                onChangeText={setEndDate}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.smallLabel}>结束时间</Text>
              <TextInput
                style={styles.input}
                placeholder="HH:MM"
                placeholderTextColor={colors.textMuted}
                value={endTime}
                onChangeText={setEndTime}
              />
            </View>
          </View>
        </Card>

        <Card>
          <Text style={styles.label}>使用设备 * ({selectedDrones.length} 台已选)</Text>
          <View style={styles.optionList}>
            {drones.filter((d) => d.bound).map((drone) => (
              <Pressable
                key={drone.id}
                style={[
                  styles.optionItem,
                  selectedDrones.includes(drone.id) && styles.optionItemActive,
                ]}
                onPress={() => toggleDrone(drone.id)}
              >
                <View style={styles.optionLeft}>
                  <Ionicons name="airplane" size={18} color={colors.primary} />
                  <View style={{ marginLeft: spacing.sm }}>
                    <Text style={styles.optionTitle}>{drone.nickname}</Text>
                    <Text style={styles.optionSubtitle}>
                      {drone.modelName} · 电量 {drone.batteryLevel}%
                    </Text>
                  </View>
                </View>
                {selectedDrones.includes(drone.id) ? (
                  <Badge text="已选" color={colors.primary} size="sm" />
                ) : (
                  <View style={styles.unselectedCircle} />
                )}
              </Pressable>
            ))}
          </View>
        </Card>

        <Card>
          <View style={styles.noticeBox}>
            <Ionicons name="alert-circle-outline" size={20} color={colors.info} />
            <Text style={styles.noticeText}>
              空域申请提交后将由管理员审批，一般1-2小时内完成审批。请提前规划，确保飞行前获得批准。
            </Text>
          </View>
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="取消"
          variant="outline"
          style={{ flex: 1, marginRight: spacing.sm }}
          onPress={() => router.back()}
        />
        <Button
          title={editId ? '保存修改' : '存草稿'}
          variant="secondary"
          style={{ flex: 1, marginRight: spacing.sm }}
          onPress={() => handleSave(false)}
        />
        <Button
          title={editId ? '提交审批' : '提交审批'}
          style={{ flex: 1 }}
          disabled={!canSubmit}
          onPress={() => handleSave(true)}
        />
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
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  smallLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.backgroundDark,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.text,
    fontSize: fontSize.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
  },
  optionList: {
    marginTop: spacing.xs,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.backgroundDark,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionItemActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  optionSubtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  unselectedCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.borderLight,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.info + '15',
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  noticeText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginLeft: spacing.sm,
    flex: 1,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.backgroundDark,
  },
});
