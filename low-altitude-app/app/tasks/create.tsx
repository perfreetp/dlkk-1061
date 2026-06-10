import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Text, TextInput, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../src/store/useAppStore';
import { colors, spacing, fontSize, borderRadius } from '../../src/theme';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { Badge } from '../../src/components/Badge';

const priorities = [
  { key: 'low', label: '低', color: colors.textMuted },
  { key: 'medium', label: '中', color: colors.info },
  { key: 'high', label: '高', color: colors.warning },
  { key: 'urgent', label: '紧急', color: colors.danger },
];

export default function CreateTaskScreen() {
  const router = useRouter();
  const createTask = useAppStore((s) => s.createTask);
  const drones = useAppStore((s) => s.drones);
  const routes = useAppStore((s) => s.routes);
  const droneModels = useAppStore((s) => s.droneModels);
  const payloads = useAppStore((s) => s.payloads);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [areaName, setAreaName] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [selectedDrone, setSelectedDrone] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [selectedPayload, setSelectedPayload] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  const availablePayloads = useMemo(() => {
    if (!selectedModel) return [];
    const model = droneModels.find((m) => m.id === selectedModel);
    if (!model) return [];
    if (model.supportedPayloads.length === 0) return [];
    return payloads.filter((p) => model.supportedPayloads.includes(p.id));
  }, [selectedModel, droneModels, payloads]);

  const selectedModelData = useMemo(() => {
    return droneModels.find((m) => m.id === selectedModel);
  }, [selectedModel, droneModels]);

  const handleSelectDrone = (droneId: string) => {
    if (selectedDrone === droneId) {
      setSelectedDrone(null);
      setSelectedModel(null);
      setSelectedPayload(null);
      return;
    }
    setSelectedDrone(droneId);
    const drone = drones.find((d) => d.id === droneId);
    if (drone) {
      setSelectedModel(drone.modelId);
      if (drone.payloadId) {
        setSelectedPayload(drone.payloadId);
      } else {
        setSelectedPayload(null);
      }
    }
  };

  const handleSelectModel = (modelId: string) => {
    if (selectedModel === modelId) return;
    setSelectedModel(modelId);
    setSelectedPayload(null);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    const drone = drones.find((d) => d.id === selectedDrone);
    const route = routes.find((r) => r.id === selectedRoute);
    const model = droneModels.find((m) => m.id === selectedModel);
    const payload = payloads.find((p) => p.id === selectedPayload);
    const scheduledTimeStr = scheduledDate && scheduledTime
      ? `${scheduledDate} ${scheduledTime}:00`
      : undefined;

    createTask({
      name: name.trim(),
      description: description.trim(),
      areaName: areaName.trim(),
      priority,
      droneId: selectedDrone || undefined,
      droneName: drone?.nickname,
      droneModelId: selectedModel || undefined,
      droneModelName: model?.name,
      payloadId: selectedPayload || undefined,
      payloadName: payload?.name,
      routeId: selectedRoute || undefined,
      routeName: route?.name,
      scheduledTime: scheduledTimeStr,
    });
    router.back();
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
        <Card>
          <Text style={styles.label}>任务名称 *</Text>
          <TextInput
            style={styles.input}
            placeholder="请输入任务名称"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
          />

          <Text style={[styles.label, { marginTop: spacing.lg }]}>巡检区域</Text>
          <TextInput
            style={styles.input}
            placeholder="请输入巡检区域名称"
            placeholderTextColor={colors.textMuted}
            value={areaName}
            onChangeText={setAreaName}
          />

          <Text style={[styles.label, { marginTop: spacing.lg }]}>任务描述</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="请输入任务详细描述"
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </Card>

        <Card>
          <Text style={styles.label}>任务优先级</Text>
          <View style={styles.priorityRow}>
            {priorities.map((p) => (
              <Pressable
                key={p.key}
                style={[
                  styles.priorityChip,
                  priority === p.key && {
                    backgroundColor: p.color + '22',
                    borderColor: p.color,
                  },
                ]}
                onPress={() => setPriority(p.key as any)}
              >
                <Text
                  style={[
                    styles.priorityText,
                    priority === p.key && { color: p.color },
                  ]}
                >
                  {p.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>

        <Card>
          <Text style={styles.label}>计划时间</Text>
          <View style={styles.timeRow}>
            <View style={{ flex: 1, marginRight: spacing.sm }}>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
                value={scheduledDate}
                onChangeText={setScheduledDate}
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextInput
                style={styles.input}
                placeholder="HH:MM"
                placeholderTextColor={colors.textMuted}
                value={scheduledTime}
                onChangeText={setScheduledTime}
              />
            </View>
          </View>
        </Card>

        <Card>
          <Text style={styles.label}>选择无人机</Text>
          <View style={styles.optionList}>
            {drones.filter((d) => d.bound).map((drone) => (
              <Pressable
                key={drone.id}
                style={[
                  styles.optionItem,
                  selectedDrone === drone.id && styles.optionItemActive,
                ]}
                onPress={() => handleSelectDrone(drone.id)}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="airplane" size={16} color={colors.primary} />
                    <Text style={styles.optionTitle}>{drone.nickname}</Text>
                  </View>
                  <Text style={styles.optionSubtitle}>
                    {drone.modelName} · 电量 {drone.batteryLevel}%
                  </Text>
                  {drone.payloadId && (
                    <Text style={styles.optionPayload}>
                      <Ionicons name="cube-outline" size={12} color={colors.secondary} />
                      {'  '}{payloads.find((p) => p.id === drone.payloadId)?.name || '未知载荷'}
                    </Text>
                  )}
                </View>
                {selectedDrone === drone.id && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </Pressable>
            ))}
          </View>
        </Card>

        <Card>
          <SectionLabel title="机型选择" />
          <View style={styles.optionList}>
            {droneModels.map((model) => (
              <Pressable
                key={model.id}
                style={[
                  styles.optionItem,
                  selectedModel === model.id && styles.optionItemActive,
                ]}
                onPress={() => handleSelectModel(model.id)}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="hardware-chip-outline" size={16} color={colors.primary} />
                    <Text style={styles.optionTitle}>{model.name}</Text>
                    <Text style={styles.optionManufacturer}>{model.manufacturer}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', marginTop: spacing.xs, flexWrap: 'wrap' }}>
                    <Badge text={`续航 ${model.maxFlightTime}min`} color={colors.success} size="sm" />
                    <View style={{ width: spacing.xs }} />
                    <Badge text={`最大 ${model.maxSpeed}m/s`} color={colors.info} size="sm" />
                    <View style={{ width: spacing.xs }} />
                    <Badge text={`升限 ${model.maxAltitude}m`} color={colors.secondary} size="sm" />
                  </View>
                  {model.supportedPayloads.length === 0 && (
                    <Text style={styles.noPayloadHint}>内置相机，无需外挂载荷</Text>
                  )}
                </View>
                {selectedModel === model.id && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </Pressable>
            ))}
          </View>
        </Card>

        {selectedModel && availablePayloads.length > 0 && (
          <Card>
            <SectionLabel title="载荷选择" />
            <View style={styles.optionList}>
              <Pressable
                style={[
                  styles.optionItem,
                  selectedPayload === null && styles.optionItemActive,
                ]}
                onPress={() => setSelectedPayload(null)}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="remove-circle-outline" size={16} color={colors.textMuted} />
                    <Text style={styles.optionTitle}>不安装载荷</Text>
                  </View>
                  <Text style={styles.optionSubtitle}>任务将使用无人机内置相机</Text>
                </View>
                {selectedPayload === null && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </Pressable>
              {availablePayloads.map((payload) => (
                <Pressable
                  key={payload.id}
                  style={[
                    styles.optionItem,
                    selectedPayload === payload.id && styles.optionItemActive,
                  ]}
                  onPress={() => setSelectedPayload(payload.id)}
                >
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons
                        name={payload.type === 'camera' ? 'camera-outline' : payload.type === 'lidar' ? 'scan-outline' : payload.type === 'thermal' ? 'thermometer-outline' : payload.type === 'gas' ? 'nuclear-outline' : 'cube-outline'}
                        size={16}
                        color={colors.secondary}
                      />
                      <Text style={styles.optionTitle}>{payload.name}</Text>
                    </View>
                    <Text style={styles.optionSubtitle}>{payload.description}</Text>
                    {payload.resolution && (
                      <Text style={styles.optionPayload}>
                        <Ionicons name="image-outline" size={12} color={colors.info} />
                        {'  '}{payload.resolution} · {payload.weight}g
                      </Text>
                    )}
                  </View>
                  {selectedPayload === payload.id && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  )}
                </Pressable>
              ))}
            </View>
          </Card>
        )}

        {selectedModel && availablePayloads.length === 0 && selectedModelData && (
          <Card>
            <SectionLabel title="载荷状态" />
            <View style={styles.noPayloadBox}>
              <Ionicons name="information-circle-outline" size={20} color={colors.info} />
              <Text style={styles.noPayloadText}>
                {selectedModelData.name} 内置相机，无需安装外挂载荷
              </Text>
            </View>
          </Card>
        )}

        <Card>
          <Text style={styles.label}>选择航线</Text>
          <View style={styles.optionList}>
            {routes.map((route) => (
              <Pressable
                key={route.id}
                style={[
                  styles.optionItem,
                  selectedRoute === route.id && styles.optionItemActive,
                ]}
                onPress={() => setSelectedRoute(route.id)}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="map" size={16} color={colors.secondary} />
                    <Text style={styles.optionTitle}>{route.name}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', marginTop: spacing.xs }}>
                    <Badge
                      text={`高度 ${route.flightHeight}m`}
                      color={colors.primary}
                      size="sm"
                    />
                    <View style={{ width: spacing.sm }} />
                    <Badge
                      text={`速度 ${route.flightSpeed}m/s`}
                      color={colors.secondary}
                      size="sm"
                    />
                  </View>
                </View>
                {selectedRoute === route.id && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </Pressable>
            ))}
          </View>
          <Button
            title="去航线规划创建新航线"
            variant="outline"
            size="sm"
            style={{ marginTop: spacing.md }}
            onPress={() => router.navigate('/routes')}
          />
        </Card>

        {selectedModel && (
          <Card>
            <SectionLabel title="配置预览" />
            <View style={styles.configPreview}>
              <View style={styles.configRow}>
                <Ionicons name="hardware-chip-outline" size={16} color={colors.primary} />
                <Text style={styles.configLabel}>机型</Text>
                <Text style={styles.configValue}>{selectedModelData?.name || '-'}</Text>
              </View>
              <View style={styles.configRow}>
                <Ionicons name="cube-outline" size={16} color={colors.secondary} />
                <Text style={styles.configLabel}>载荷</Text>
                <Text style={styles.configValue}>
                  {selectedPayload
                    ? payloads.find((p) => p.id === selectedPayload)?.name || '-'
                    : selectedModelData && selectedModelData.supportedPayloads.length === 0
                      ? '内置相机'
                      : '未安装'}
                </Text>
                {!selectedPayload && selectedModelData && selectedModelData.supportedPayloads.length > 0 && (
                  <Badge text="未安装" color={colors.textMuted} size="sm" />
                )}
              </View>
              {selectedDrone && (
                <View style={styles.configRow}>
                  <Ionicons name="airplane-outline" size={16} color={colors.success} />
                  <Text style={styles.configLabel}>绑定机</Text>
                  <Text style={styles.configValue}>{drones.find((d) => d.id === selectedDrone)?.nickname || '-'}</Text>
                </View>
              )}
              {selectedRoute && (
                <View style={styles.configRow}>
                  <Ionicons name="map-outline" size={16} color={colors.warning} />
                  <Text style={styles.configLabel}>航线</Text>
                  <Text style={styles.configValue}>{routes.find((r) => r.id === selectedRoute)?.name || '-'}</Text>
                </View>
              )}
            </View>
          </Card>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="取消"
          variant="outline"
          style={{ flex: 1, marginRight: spacing.md }}
          onPress={() => router.back()}
        />
        <Button
          title="创建任务"
          style={{ flex: 1 }}
          disabled={!name.trim()}
          onPress={handleSubmit}
        />
      </View>
    </View>
  );
}

function SectionLabel({ title }: { title: string }) {
  return (
    <Text style={styles.label}>{title}</Text>
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
  textArea: {
    minHeight: 100,
    paddingTop: spacing.sm + 2,
  },
  priorityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  priorityChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundDark,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  priorityText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  timeRow: {
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
  optionTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '500',
    marginLeft: spacing.sm,
  },
  optionSubtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: 2,
    marginLeft: spacing.xs + 20,
  },
  optionManufacturer: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginLeft: spacing.sm,
  },
  optionPayload: {
    color: colors.secondary,
    fontSize: fontSize.sm,
    marginTop: 2,
    marginLeft: spacing.xs + 20,
  },
  noPayloadHint: {
    color: colors.info,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    marginLeft: spacing.xs + 20,
  },
  noPayloadBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.info + '15',
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  noPayloadText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    marginLeft: spacing.sm,
    flex: 1,
  },
  configPreview: {
    backgroundColor: colors.backgroundDark,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  configRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  configLabel: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    marginLeft: spacing.sm,
    width: 60,
  },
  configValue: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '500',
    flex: 1,
    marginLeft: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.backgroundDark,
  },
});
