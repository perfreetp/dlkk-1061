import React, { useState, useEffect, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Text, Pressable, Modal, TextInput, Alert, Dimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Polyline, Marker, Polygon, Circle } from 'react-native-maps';
import * as ImagePicker from 'expo-image-picker';
import { useAppStore } from '../../src/store/useAppStore';
import { colors, spacing, fontSize, borderRadius } from '../../src/theme';
import { Button } from '../../src/components/Button';
import { Badge } from '../../src/components/Badge';
import { BatteryIndicator, ProgressBar } from '../../src/components/Progress';
import type { Coordinate, FlightTelemetry } from '../../src/types';

const PARK_CENTER: Coordinate = { latitude: 39.9042, longitude: 116.4074 };
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function MonitorScreen() {
  const router = useRouter();
  const tasks = useAppStore((s) => s.tasks);
  const drones = useAppStore((s) => s.drones);
  const weather = useAppStore((s) => s.weather);
  const alerts = useAppStore((s) => s.alerts);
  const selectedTaskId = useAppStore((s) => s.selectedTaskId);
  const addAbnormal = useAppStore((s) => s.addAbnormalPoint);
  const updateTaskStatus = useAppStore((s) => s.updateTaskStatus);

  const activeTasks = tasks.filter((t) => t.status === 'in_progress' || t.status === 'paused');
  const inFlightDrones = drones.filter((d) => d.status === 'in_flight');
  const activeTask = selectedTaskId
    ? activeTasks.find((t) => t.id === selectedTaskId) || activeTasks[0]
    : activeTasks[0];
  const activeDrone = inFlightDrones[0];

  const isPaused = activeTask?.status === 'paused';

  const [showAbnormalModal, setShowAbnormalModal] = useState(false);
  const [abnormalType, setAbnormalType] = useState('');
  const [abnormalDesc, setAbnormalDesc] = useState('');
  const [abnormalSeverity, setAbnormalSeverity] = useState<'minor' | 'moderate' | 'severe'>('moderate');
  const [abnormalPhotos, setAbnormalPhotos] = useState<string[]>([]);
  const [showControls, setShowControls] = useState(true);
  const [flightMode, setFlightMode] = useState<'AUTO' | 'MANUAL'>('AUTO');
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [pausedAt, setPausedAt] = useState<string | null>(null);
  const [pauseDuration, setPauseDuration] = useState(0);

  const trajectory = useMemo(() => {
    const points: Coordinate[] = [];
    for (let i = 0; i <= playbackIndex; i++) {
      const t = i / 49;
      points.push({
        latitude: PARK_CENTER.latitude + 0.005 * Math.sin(t * Math.PI * 2),
        longitude: PARK_CENTER.longitude + 0.005 * Math.cos(t * Math.PI * 2),
        altitude: 80 + 20 * Math.sin(t * Math.PI),
      });
    }
    return points;
  }, [playbackIndex]);

  const telemetry: FlightTelemetry | null = useMemo(() => {
    if (!activeDrone) return null;
    const t = playbackIndex / 49;
    return {
      droneId: activeDrone.id,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      location: trajectory[trajectory.length - 1] || PARK_CENTER,
      altitude: trajectory[trajectory.length - 1]?.altitude || 100,
      speed: isPaused ? 0 : 6 + Math.random() * 4,
      heading: Math.random() * 360,
      batteryLevel: activeDrone.batteryLevel,
      batteryVoltage: 48 - t * 2,
      signalStrength: 85 + Math.random() * 10,
      satelliteCount: 14 + Math.floor(Math.random() * 4),
      flightMode: isPaused ? 'HOVER' : flightMode,
      motors: isPaused ? [0, 0, 0, 0, 0, 0] : [1800, 1850, 1780, 1820, 1810, 1830],
    };
  }, [activeDrone, playbackIndex, flightMode, trajectory, isPaused]);

  useEffect(() => {
    if (inFlightDrones.length === 0 || isPaused) return;
    const interval = setInterval(() => {
      setPlaybackIndex((p) => (p >= 49 ? 0 : p + 1));
    }, 500);
    return () => clearInterval(interval);
  }, [inFlightDrones.length, isPaused]);

  useEffect(() => {
    if (!isPaused || !pausedAt) return;
    const interval = setInterval(() => {
      const start = new Date(pausedAt).getTime();
      setPauseDuration(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, pausedAt]);

  const handlePause = () => {
    if (!activeTask) return;
    if (isPaused) {
      updateTaskStatus(activeTask.id, 'in_progress');
      setPausedAt(null);
      setPauseDuration(0);
    } else {
      updateTaskStatus(activeTask.id, 'paused');
      setPausedAt(new Date().toISOString());
      setPauseDuration(0);
    }
  };

  const formatPauseDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('权限不足', '需要摄像头权限才能拍照');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setAbnormalPhotos((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('权限不足', '需要相册访问权限');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      setAbnormalPhotos((prev) => [...prev, ...uris]);
    }
  };

  const removePhoto = (index: number) => {
    setAbnormalPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddAbnormal = () => {
    if (!activeTask || !abnormalType.trim() || !abnormalDesc.trim()) return;
    addAbnormal(activeTask.id, {
      taskId: activeTask.id,
      coordinate: telemetry?.location || PARK_CENTER,
      type: abnormalType.trim(),
      description: abnormalDesc.trim(),
      severity: abnormalSeverity,
      photos: abnormalPhotos,
      handled: false,
    });
    setShowAbnormalModal(false);
    setAbnormalType('');
    setAbnormalDesc('');
    setAbnormalSeverity('moderate');
    setAbnormalPhotos([]);
    Alert.alert('上报成功', `异常点已成功上报${abnormalPhotos.length > 0 ? `，包含 ${abnormalPhotos.length} 张照片` : ''}`);
  };

  if (activeTasks.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>实时监控</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyInner}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="airplane-outline" size={80} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>暂无无人机在飞</Text>
          <Text style={styles.emptyDesc}>当前没有正在执行的飞行任务</Text>
          <Button
            title="去任务看板"
            style={{ marginTop: spacing.xxl, paddingHorizontal: spacing.xxxl }}
            onPress={() => router.navigate('/tasks')}
          />
        </View>
      </View>
    );
  }

  const droneLocation = telemetry?.location || activeDrone?.currentLocation || PARK_CENTER;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>实时监控 - {activeTask?.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.videoContainer}>
        <View style={styles.videoFeed}>
          <View style={styles.videoOverlayTop}>
            <View style={styles.videoInfo}>
              <Badge text={isPaused ? '悬停暂停' : flightMode === 'AUTO' ? '自动飞行' : '手动控制'} color={isPaused ? colors.warning : colors.primary} />
              {!isPaused && <Badge text="REC" color={colors.danger} />}
              {isPaused && <Badge text="暂停中" color={colors.warning} />}
            </View>
            <View style={styles.timeInfo}>
              <Ionicons name="time-outline" size={14} color={colors.text} />
              <Text style={styles.timeText}>
                {isPaused ? `暂停 ${formatPauseDuration(pauseDuration)}` : `飞行 ${Math.floor(playbackIndex * 0.5)}:00`}
              </Text>
            </View>
          </View>
          <View style={styles.videoPlaceholder}>
            <Ionicons name="videocam-outline" size={64} color={colors.textMuted} />
            <Text style={styles.videoText}>实时画面 - {activeDrone?.nickname}</Text>
            <Text style={styles.videoSubText}>
              {telemetry?.location.latitude.toFixed(6)}, {telemetry?.location.longitude.toFixed(6)}
            </Text>
            {isPaused && (
              <View style={styles.pauseOverlay}>
                <Ionicons name="pause-circle" size={48} color={colors.warning} />
                <Text style={styles.pauseOverlayText}>悬停暂停中</Text>
                <Text style={styles.pauseOverlayTimer}>已暂停 {formatPauseDuration(pauseDuration)}</Text>
              </View>
            )}
          </View>
          <View style={styles.videoOverlayBottom}>
            <View style={styles.telemetryBar}>
              <View style={styles.telemetryItem}>
                <Ionicons name="arrow-up-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.telemetryText}>ALT {(telemetry?.altitude || 0).toFixed(1)}m</Text>
              </View>
              <View style={styles.telemetryItem}>
                <Ionicons name="speedometer-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.telemetryText}>SPD {(telemetry?.speed || 0).toFixed(1)}m/s</Text>
              </View>
              <View style={styles.telemetryItem}>
                <Ionicons name="compass-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.telemetryText}>HDG {(telemetry?.heading || 0).toFixed(0)}°</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: PARK_CENTER.latitude,
            longitude: PARK_CENTER.longitude,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          }}
          mapType="satellite"
        >
          {trajectory.length > 1 && (
            <Polyline
              coordinates={trajectory}
              strokeColor={colors.primary}
              strokeWidth={3}
            />
          )}
          <Marker
            coordinate={droneLocation}
            anchor={{ x: 0.5, y: 0.5 }}
            flat
          >
            <View style={styles.droneMarker}>
              <Ionicons name="airplane" size={20} color={colors.text} />
            </View>
          </Marker>
          {activeTask?.abnormalPoints.map((ap) => (
            <Marker
              key={ap.id}
              coordinate={ap.coordinate}
              pinColor={ap.severity === 'severe' ? colors.danger : ap.severity === 'moderate' ? colors.warning : colors.info}
            />
          ))}
        </MapView>

        <View style={styles.mapStats}>
          <View style={styles.mapStat}>
            <Ionicons name="cloud-outline" size={14} color={weather.flyable ? colors.success : colors.warning} />
            <Text style={[styles.mapStatText, { color: weather.flyable ? colors.success : colors.warning }]}>
              {weather.condition} {weather.temperature}°C
            </Text>
          </View>
          <View style={styles.mapStat}>
            <Ionicons name="alert-circle-outline" size={14} color={colors.danger} />
            <Text style={[styles.mapStatText, { color: colors.danger }]}>
              {alerts.filter((a) => !a.read && a.level === 'danger').length} 告警
            </Text>
          </View>
        </View>
      </View>

      {showControls && (
        <View style={styles.controlPanel}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: spacing.lg }}
          >
            <View style={styles.statusCard}>
              <View style={styles.statusCardHeader}>
                <Ionicons name="airplane" size={18} color={colors.primary} />
                <Text style={styles.statusCardTitle}>{activeDrone?.nickname}</Text>
              </View>
              <View style={styles.statusCardBody}>
                <BatteryIndicator level={telemetry?.batteryLevel || 0} />
                <ProgressBar
                  value={telemetry?.signalStrength || 0}
                  label={`信号 ${Math.round(telemetry?.signalStrength || 0)}%`}
                  showLabel
                  color={colors.success}
                  style={{ marginTop: spacing.sm }}
                  height={4}
                />
                <View style={styles.satelliteInfo}>
                  <Ionicons name="globe-outline" size={12} color={colors.textMuted} />
                  <Text style={styles.satelliteText}>
                    卫星 {telemetry?.satelliteCount || 0} 颗
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.statusCard}>
              <View style={styles.statusCardHeader}>
                <Ionicons name="clipboard" size={18} color={colors.secondary} />
                <Text style={styles.statusCardTitle}>当前任务</Text>
              </View>
              <View style={styles.statusCardBody}>
                <Text style={styles.taskName} numberOfLines={1}>{activeTask?.name}</Text>
                <Text style={styles.taskProgress}>
                  {isPaused ? '⏸ 任务已暂停' : `已发现 ${activeTask?.abnormalPoints.length || 0} 处异常`}
                </Text>
                <View style={styles.taskActions}>
                  <Button
                    title="标记异常"
                    size="sm"
                    variant="danger"
                    icon={<Ionicons name="warning" size={14} color={colors.text} />}
                    onPress={() => setShowAbnormalModal(true)}
                  />
                </View>
              </View>
            </View>

            <View style={styles.statusCard}>
              <View style={styles.statusCardHeader}>
                <Ionicons name="camera" size={18} color={colors.info} />
                <Text style={styles.statusCardTitle}>拍照/录像</Text>
              </View>
              <View style={styles.cameraActions}>
                <Pressable style={styles.captureBtn}>
                  <Ionicons name="camera" size={24} color={colors.text} />
                  <Text style={styles.captureText}>拍照</Text>
                </Pressable>
                <Pressable style={[styles.captureBtn, styles.recordBtn]}>
                  <Ionicons name="videocam" size={24} color={colors.danger} />
                  <Text style={[styles.captureText, { color: colors.danger }]}>录像中</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      )}

      <View style={styles.actionBar}>
        <Pressable
          style={styles.actionBtn}
          onPress={() => setFlightMode(flightMode === 'AUTO' ? 'MANUAL' : 'AUTO')}
        >
          <Ionicons
            name={flightMode === 'AUTO' ? 'navigate' : 'hand-left'}
            size={22}
            color={flightMode === 'AUTO' ? colors.primary : colors.warning}
          />
          <Text style={[styles.actionBtnText, { color: flightMode === 'AUTO' ? colors.primary : colors.warning }]}>
            {flightMode === 'AUTO' ? '自动' : '手动'}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.actionBtn, isPaused && styles.actionBtnResume]}
          onPress={handlePause}
        >
          <Ionicons
            name={isPaused ? 'play' : 'pause'}
            size={22}
            color={isPaused ? colors.success : colors.warning}
          />
          <Text style={[styles.actionBtnText, { color: isPaused ? colors.success : colors.warning }]}>
            {isPaused ? '继续' : '悬停'}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.actionBtn, styles.actionBtnReturn]}
          onPress={() => Alert.alert('一键返航', '确定要让无人机自动返航吗？', [
            { text: '取消', style: 'cancel' },
            { text: '确定返航', style: 'destructive' },
          ])}
        >
          <Ionicons name="return-up-back" size={22} color={colors.danger} />
          <Text style={[styles.actionBtnText, { color: colors.danger }]}>返航</Text>
        </Pressable>

        <Pressable
          style={[styles.actionBtn, styles.actionBtnEmergency]}
          onPress={() => Alert.alert('紧急迫降', '警告！将触发紧急迫降程序，请确认当前区域适合降落。', [
            { text: '取消', style: 'cancel' },
            { text: '紧急迫降', style: 'destructive' },
          ])}
        >
          <Ionicons name="alert" size={22} color={colors.text} />
          <Text style={[styles.actionBtnText, { color: colors.text }]}>迫降</Text>
        </Pressable>

        <Pressable style={styles.actionBtn} onPress={() => setShowControls(!showControls)}>
          <Ionicons
            name={showControls ? 'chevron-down' : 'chevron-up'}
            size={22}
            color={colors.textSecondary}
          />
          <Text style={styles.actionBtnText}>{showControls ? '收起' : '展开'}</Text>
        </Pressable>
      </View>

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
              <Text style={styles.label}>异常类型 *</Text>
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
                          s === 'severe' ? colors.danger :
                          s === 'moderate' ? colors.warning : colors.info,
                        backgroundColor:
                          (s === 'severe' ? colors.danger :
                           s === 'moderate' ? colors.warning : colors.info) + '20',
                      },
                    ]}
                    onPress={() => setAbnormalSeverity(s)}
                  >
                    <Text
                      style={[
                        styles.severityText,
                        {
                          color:
                            s === 'severe' ? colors.danger :
                            s === 'moderate' ? colors.warning : colors.info,
                        },
                      ]}
                    >
                      {s === 'severe' ? '严重' : s === 'moderate' ? '中等' : '轻微'}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.label, { marginTop: spacing.lg }]}>详细描述 *</Text>
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

              <Text style={[styles.label, { marginTop: spacing.lg }]}>现场照片</Text>
              <View style={styles.photoRow}>
                <Pressable style={styles.addPhotoBtn} onPress={handleTakePhoto}>
                  <Ionicons name="camera" size={28} color={colors.primary} />
                  <Text style={styles.addPhotoText}>拍照</Text>
                </Pressable>
                <Pressable style={styles.addPhotoBtn} onPress={handlePickImage}>
                  <Ionicons name="images" size={28} color={colors.primary} />
                  <Text style={styles.addPhotoText}>相册</Text>
                </Pressable>
              </View>
              {abnormalPhotos.length > 0 && (
                <View style={styles.photoPreviewRow}>
                  <Text style={styles.photoCountText}>已选择 {abnormalPhotos.length} 张照片</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {abnormalPhotos.map((uri, idx) => (
                      <View key={idx} style={styles.photoPreviewItem}>
                        <Image source={{ uri }} style={styles.photoPreview} />
                        <Pressable
                          style={styles.photoRemoveBtn}
                          onPress={() => removePhoto(idx)}
                        >
                          <Ionicons name="close-circle" size={18} color={colors.danger} />
                        </Pressable>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
            </ScrollView>
            <View style={styles.modalFooter}>
              <Button
                title="取消"
                variant="outline"
                style={{ flex: 1, marginRight: spacing.md }}
                onPress={() => setShowAbnormalModal(false)}
              />
              <Button
                title="提交上报"
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.backgroundDark,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxxl,
  },
  emptyIconWrap: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '600',
  },
  emptyDesc: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    marginTop: spacing.sm,
  },
  videoContainer: {
    height: 260,
  },
  videoFeed: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  videoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    marginTop: spacing.md,
  },
  videoSubText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  pauseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseOverlayText: {
    color: colors.warning,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  pauseOverlayTimer: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    marginTop: spacing.xs,
  },
  videoOverlayTop: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  videoInfo: {
    flexDirection: 'row',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.overlay,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  timeText: {
    color: colors.text,
    fontSize: fontSize.sm,
    marginLeft: 4,
    fontWeight: '600',
  },
  videoOverlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  telemetryBar: {
    flexDirection: 'row',
    backgroundColor: colors.overlay,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: 'space-around',
  },
  telemetryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  telemetryText: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginLeft: 4,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  droneMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  mapStats: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'column',
  },
  mapStat: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.overlay,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  mapStatText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    marginLeft: 4,
  },
  controlPanel: {
    paddingVertical: spacing.md,
    paddingLeft: spacing.lg,
    backgroundColor: colors.backgroundDark,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statusCard: {
    width: SCREEN_WIDTH * 0.6,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginRight: spacing.md,
  },
  statusCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statusCardTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  statusCardBody: {
    flex: 1,
  },
  satelliteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  satelliteText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginLeft: 4,
  },
  taskName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  taskProgress: {
    color: colors.warning,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  taskActions: {
    marginTop: spacing.md,
  },
  cameraActions: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  captureBtn: {
    alignItems: 'center',
    padding: spacing.sm,
  },
  recordBtn: {
    backgroundColor: colors.danger + '20',
    borderRadius: borderRadius.md,
  },
  captureText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.backgroundDark,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionBtn: {
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  actionBtnReturn: {
    backgroundColor: colors.danger + '15',
    borderRadius: borderRadius.md,
  },
  actionBtnResume: {
    backgroundColor: colors.success + '20',
    borderRadius: borderRadius.md,
  },
  actionBtnEmergency: {
    backgroundColor: colors.danger,
    borderRadius: borderRadius.md,
  },
  actionBtnText: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    marginTop: 2,
    fontWeight: '500',
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
    marginHorizontal: spacing.lg,
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
  photoRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
  },
  addPhotoBtn: {
    width: 80,
    height: 80,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  addPhotoText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  photoPreviewRow: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  photoCountText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
  },
  photoPreviewItem: {
    position: 'relative',
    marginRight: spacing.sm,
  },
  photoPreview: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.md,
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.background,
    borderRadius: 9,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
