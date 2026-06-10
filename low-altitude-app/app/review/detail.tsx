import React, { useState, useEffect, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Text, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Polyline, Marker } from 'react-native-maps';
import { useAppStore } from '../../src/store/useAppStore';
import { colors, spacing, fontSize, borderRadius } from '../../src/theme';
import { Card, CardSection, CardDivider } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Badge } from '../../src/components/Badge';
import { InfoRow, SectionHeader } from '../../src/components/Common';
import { ProgressBar } from '../../src/components/Progress';
import { formatDateTime, formatDistance, formatDuration } from '../../src/utils';

const PARK_CENTER = { latitude: 39.9042, longitude: 116.4074 };

export default function ReplayDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const flightRecords = useAppStore((s) => s.flightRecords);

  const flight = id ? flightRecords.find((f) => f.id === String(id)) : undefined;

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);

  const trajectory = flight?.trajectory || [];
  const telemetry = flight?.telemetry || [];
  const progress = trajectory.length > 0 ? (currentIndex / (trajectory.length - 1)) * 100 : 0;

  useEffect(() => {
    if (!isPlaying || trajectory.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((p) => {
        if (p >= trajectory.length - 1) {
          setIsPlaying(false);
          return trajectory.length - 1;
        }
        return p + playbackSpeed;
      });
    }, 200);
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, trajectory.length]);

  const currentTelemetry = telemetry[currentIndex] || telemetry[telemetry.length - 1] || null;
  const currentLocation = trajectory[currentIndex] || trajectory[0] || PARK_CENTER;

  const displayTrajectory = useMemo(() => {
    return trajectory.slice(0, currentIndex + 1);
  }, [trajectory, currentIndex]);

  if (!flight) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.textMuted }}>未找到飞行记录</Text>
        <Button title="返回" onPress={() => router.back()} style={{ marginTop: spacing.lg }} />
      </View>
    );
  }

  const handlePlayPause = () => {
    if (currentIndex >= trajectory.length - 1) {
      setCurrentIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsPlaying(false);
  };

  const handleSpeedChange = () => {
    const speeds = [1, 2, 4, 8];
    const idx = speeds.indexOf(playbackSpeed);
    setPlaybackSpeed(speeds[(idx + 1) % speeds.length]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: PARK_CENTER.latitude,
            longitude: PARK_CENTER.longitude,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          }}
        >
          {trajectory.length > 1 && (
            <Polyline
              coordinates={trajectory}
              strokeColor={colors.border}
              strokeWidth={2}
              lineDashPattern={[5, 5]}
            />
          )}
          {displayTrajectory.length > 1 && (
            <Polyline
              coordinates={displayTrajectory}
              strokeColor={colors.primary}
              strokeWidth={4}
            />
          )}
          {flight.abnormalCount > 0 &&
            telemetry
              .filter((t, i) => i % 10 === 0 && i > 0)
              .slice(0, flight.abnormalCount)
              .map((t, i) => (
                <Marker
                  key={i}
                  coordinate={t.location}
                  pinColor={i % 2 === 0 ? colors.danger : colors.warning}
                />
              ))}
          <Marker coordinate={currentLocation} anchor={{ x: 0.5, y: 0.5 }} flat>
            <View style={styles.droneMarker}>
              <Ionicons name="airplane" size={18} color={colors.text} />
            </View>
          </Marker>
          {trajectory.length > 0 && (
            <Marker coordinate={trajectory[0]}>
              <View style={[styles.pointMarker, styles.startMarker]}>
                <Text style={styles.pointMarkerText}>S</Text>
              </View>
            </Marker>
          )}
          {trajectory.length > 1 && (
            <Marker coordinate={trajectory[trajectory.length - 1]}>
              <View style={[styles.pointMarker, styles.endMarker]}>
                <Text style={styles.pointMarkerText}>E</Text>
              </View>
            </Marker>
          )}
        </MapView>

        <View style={styles.flightInfoOverlay}>
          <Text style={styles.flightInfoTitle}>{flight.taskName}</Text>
          <Text style={styles.flightInfoSub}>
            {flight.droneName} · {formatDateTime(flight.startTime)}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <Card>
          <CardSection>
            <SectionHeader title="飞行控制" />
            <View style={styles.controlsRow}>
              <Pressable style={styles.controlBtn} onPress={handleReset}>
                <Ionicons name="refresh" size={22} color={colors.textSecondary} />
                <Text style={styles.controlBtnText}>重置</Text>
              </Pressable>
              <Pressable style={[styles.controlBtn, styles.playBtn]} onPress={handlePlayPause}>
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={32}
                  color={colors.text}
                />
              </Pressable>
              <Pressable style={styles.controlBtn} onPress={handleSpeedChange}>
                <Text style={styles.speedText}>{playbackSpeed}x</Text>
                <Text style={styles.controlBtnText}>倍速</Text>
              </Pressable>
            </View>
            <View style={{ marginTop: spacing.lg }}>
              <ProgressBar
                value={progress}
                showLabel
                label={`${currentIndex + 1} / ${trajectory.length} 航点 (${Math.round(progress)}%)`}
                height={8}
              />
            </View>
          </CardSection>
        </Card>

        <Card>
          <SectionHeader title="实时遥测" />
          <View style={styles.telemetryGrid}>
            <View style={styles.telemetryItem}>
              <Ionicons name="arrow-up-outline" size={20} color={colors.primary} />
              <Text style={styles.telemetryValue}>
                {(currentTelemetry?.altitude || 0).toFixed(1)}m
              </Text>
              <Text style={styles.telemetryLabel}>高度</Text>
            </View>
            <View style={styles.telemetryItem}>
              <Ionicons name="speedometer-outline" size={20} color={colors.secondary} />
              <Text style={styles.telemetryValue}>
                {(currentTelemetry?.speed || 0).toFixed(1)}m/s
              </Text>
              <Text style={styles.telemetryLabel}>速度</Text>
            </View>
            <View style={styles.telemetryItem}>
              <Ionicons name="compass-outline" size={20} color={colors.warning} />
              <Text style={styles.telemetryValue}>
                {(currentTelemetry?.heading || 0).toFixed(0)}°
              </Text>
              <Text style={styles.telemetryLabel}>航向</Text>
            </View>
            <View style={styles.telemetryItem}>
              <Ionicons name="battery-charging-outline" size={20} color={colors.success} />
              <Text style={styles.telemetryValue}>
                {Math.round(currentTelemetry?.batteryLevel || 0)}%
              </Text>
              <Text style={styles.telemetryLabel}>电量</Text>
            </View>
            <View style={styles.telemetryItem}>
              <Ionicons name="wifi-outline" size={20} color={colors.info} />
              <Text style={styles.telemetryValue}>
                {Math.round(currentTelemetry?.signalStrength || 0)}%
              </Text>
              <Text style={styles.telemetryLabel}>信号</Text>
            </View>
            <View style={styles.telemetryItem}>
              <Ionicons name="globe-outline" size={20} color={colors.accent} />
              <Text style={styles.telemetryValue}>
                {currentTelemetry?.satelliteCount || 0}
              </Text>
              <Text style={styles.telemetryLabel}>卫星</Text>
            </View>
          </View>
        </Card>

        <Card>
          <SectionHeader title="飞行信息" />
          <InfoRow label="任务名称" value={flight.taskName} />
          <InfoRow label="无人机" value={flight.droneName} />
          <InfoRow label="飞手" value={flight.pilotName} />
          <InfoRow label="起飞时间" value={formatDateTime(flight.startTime)} />
          <InfoRow label="降落时间" value={formatDateTime(flight.endTime)} />
          <InfoRow label="飞行时长" value={formatDuration(flight.duration)} />
          <InfoRow label="飞行距离" value={formatDistance(flight.distance)} />
          <InfoRow label="最大高度" value={`${flight.maxAltitude} 米`} />
          <InfoRow label="最大速度" value={`${flight.maxSpeed} m/s`} />
          <InfoRow label="拍摄照片" value={`${flight.photos} 张`} />
          <InfoRow
            label="异常点"
            value={
              flight.abnormalCount > 0 ? (
                <Badge text={`${flight.abnormalCount} 处`} color={colors.warning} />
              ) : (
                '无异常'
              )
            }
          />
        </Card>

        <Card>
          <SectionHeader title="报告与数据" />
          <View style={styles.actionRow}>
            <Button
              title="生成巡检报告"
              style={{ flex: 1, marginRight: spacing.sm }}
              icon={<Ionicons name="document-text-outline" size={16} color={colors.text} />}
            />
            <Button
              title="导出数据"
              variant="outline"
              style={{ flex: 1 }}
              icon={<Ionicons name="download-outline" size={16} color={colors.primary} />}
            />
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mapContainer: {
    height: 280,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  droneMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  pointMarker: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.text,
  },
  startMarker: {
    backgroundColor: colors.success,
  },
  endMarker: {
    backgroundColor: colors.danger,
  },
  pointMarkerText: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  flightInfoOverlay: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: colors.overlay,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  flightInfoTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  flightInfoSub: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtn: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.xxxl,
  },
  controlBtnText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  speedText: {
    color: colors.primary,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  telemetryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  telemetryItem: {
    width: '33.33%',
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  telemetryValue: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  telemetryLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
  },
});
