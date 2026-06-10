import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Text, TextInput, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Polyline, Marker, Polygon, Circle, Pressable as MapPressable } from 'react-native-maps';
import { useAppStore } from '../../src/store/useAppStore';
import { colors, spacing, fontSize, borderRadius } from '../../src/theme';
import { Card, CardDivider } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Badge } from '../../src/components/Badge';
import { SectionHeader } from '../../src/components/Common';
import { calculateRouteDistance, formatDistance } from '../../src/utils';
import type { Waypoint, Coordinate, FlightRoute } from '../../src/types';

const PARK_CENTER: Coordinate = { latitude: 39.9042, longitude: 116.4074 };

export default function RouteEditScreen() {
  const router = useRouter();
  const currentRoute = useAppStore((s) => s.currentRoute);
  const droneModels = useAppStore((s) => s.droneModels);
  const payloads = useAppStore((s) => s.payloads);
  const saveRoute = useAppStore((s) => s.saveRoute);

  const [name, setName] = useState(currentRoute?.name || '新建航线');
  const [waypoints, setWaypoints] = useState<Waypoint[]>(
    currentRoute?.waypoints || [
      { id: 'wp1', latitude: PARK_CENTER.latitude, longitude: PARK_CENTER.longitude, altitude: 100, speed: 8, action: 'photo' },
    ]
  );
  const [flightHeight, setFlightHeight] = useState(String(currentRoute?.flightHeight || 100));
  const [flightSpeed, setFlightSpeed] = useState(String(currentRoute?.flightSpeed || 8));
  const [selectedModel, setSelectedModel] = useState(droneModels[0]?.id || '');
  const [selectedPayloads, setSelectedPayloads] = useState<string[]>([]);
  const [editingWaypoint, setEditingWaypoint] = useState<string | null>(null);
  const [noFlyZones] = useState(currentRoute?.noFlyZones || []);

  const estimatedDistance = useMemo(() => calculateRouteDistance(waypoints), [waypoints]);
  const estimatedDuration = useMemo(() => {
    const speed = parseFloat(flightSpeed) || 8;
    if (speed === 0) return 0;
    return Math.round(estimatedDistance / speed / 60) + waypoints.filter(w => w.action === 'hover').reduce((acc, w) => acc + (w.duration || 0), 0);
  }, [estimatedDistance, flightSpeed, waypoints]);

  const handleMapPress = (e: any) => {
    const { coordinate } = e.nativeEvent;
    const newWaypoint: Waypoint = {
      id: `wp${Date.now()}`,
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      altitude: parseInt(flightHeight) || 100,
      speed: parseFloat(flightSpeed) || 8,
      action: 'photo',
    };
    setWaypoints([...waypoints, newWaypoint]);
  };

  const handleRemoveWaypoint = (id: string) => {
    setWaypoints(waypoints.filter((w) => w.id !== id));
  };

  const handleUpdateWaypoint = (id: string, field: keyof Waypoint, value: any) => {
    setWaypoints(waypoints.map((w) => (w.id === id ? { ...w, [field]: value } : w)));
  };

  const handleTogglePayload = (payloadId: string) => {
    if (selectedPayloads.includes(payloadId)) {
      setSelectedPayloads(selectedPayloads.filter((id) => id !== payloadId));
    } else {
      const model = droneModels.find((m) => m.id === selectedModel);
      if (model && model.supportedPayloads.includes(payloadId)) {
        setSelectedPayloads([...selectedPayloads, payloadId]);
      }
    }
  };

  const handleSave = () => {
    const route: FlightRoute = {
      id: currentRoute?.id || `r${Date.now()}`,
      name,
      waypoints,
      flightHeight: parseInt(flightHeight) || 100,
      flightSpeed: parseFloat(flightSpeed) || 8,
      noFlyZones,
      estimatedDistance,
      estimatedDuration,
    };
    saveRoute(route);
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: PARK_CENTER.latitude,
            longitude: PARK_CENTER.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
          onPress={handleMapPress}
          mapType="standard"
        >
          {waypoints.map((wp, index) => (
            <Marker
              key={wp.id}
              coordinate={{ latitude: wp.latitude, longitude: wp.longitude }}
              draggable
              onDragEnd={(e) => {
                const { latitude, longitude } = e.nativeEvent.coordinate;
                handleUpdateWaypoint(wp.id, 'latitude', latitude);
                handleUpdateWaypoint(wp.id, 'longitude', longitude);
              }}
            >
              <View style={styles.waypointMarker}>
                <Text style={styles.waypointText}>{index + 1}</Text>
              </View>
            </Marker>
          ))}
          {waypoints.length > 1 && (
            <Polyline
              coordinates={waypoints.map((wp) => ({
                latitude: wp.latitude,
                longitude: wp.longitude,
              }))}
              strokeColor={colors.primary}
              strokeWidth={3}
            />
          )}
          {noFlyZones.map((nfz) => {
            if (nfz.radius) {
              return (
                <Circle
                  key={nfz.id}
                  center={nfz.coordinates[0]}
                  radius={nfz.radius}
                  strokeColor={colors.danger}
                  fillColor="rgba(239, 83, 80, 0.15)"
                  strokeWidth={2}
                />
              );
            }
            return (
              <Polygon
                key={nfz.id}
                coordinates={nfz.coordinates}
                strokeColor={colors.danger}
                fillColor="rgba(239, 83, 80, 0.15)"
                strokeWidth={2}
              />
            );
          })}
        </MapView>
        <View style={styles.mapHint}>
          <Ionicons name="information-circle" size={16} color={colors.textMuted} />
          <Text style={styles.mapHintText}>点击地图添加航点，拖动航点可调整位置</Text>
        </View>
      </View>

      <ScrollView style={styles.panel} contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
        <SectionHeader title="航线基础信息" />
        <Card>
          <Text style={styles.label}>航线名称</Text>
          <TextInput
            style={styles.input}
            placeholder="请输入航线名称"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
          />

          <View style={{ flexDirection: 'row', marginTop: spacing.md }}>
            <View style={{ flex: 1, marginRight: spacing.sm }}>
              <Text style={styles.label}>飞行高度 (米)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={flightHeight}
                onChangeText={setFlightHeight}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>飞行速度 (m/s)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={flightSpeed}
                onChangeText={setFlightSpeed}
              />
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{waypoints.length}</Text>
              <Text style={styles.statLabel}>航点数</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatDistance(estimatedDistance)}</Text>
              <Text style={styles.statLabel}>预计距离</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{estimatedDuration}分钟</Text>
              <Text style={styles.statLabel}>预计时长</Text>
            </View>
          </View>
        </Card>

        <SectionHeader title={`航点列表 (${waypoints.length})`} style={{ marginTop: spacing.lg }} />
        <Card>
          {waypoints.length === 0 ? (
            <Text style={styles.emptyText}>暂无航点，请在地图上点击添加</Text>
          ) : (
            waypoints.map((wp, index) => (
              <View key={wp.id}>
                <Pressable
                  style={styles.waypointItem}
                  onPress={() => setEditingWaypoint(editingWaypoint === wp.id ? null : wp.id)}
                >
                  <View style={styles.waypointIndex}>
                    <Text style={styles.waypointIndexText}>{index + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.waypointCoord}>
                      {wp.latitude.toFixed(5)}, {wp.longitude.toFixed(5)}
                    </Text>
                    <View style={{ flexDirection: 'row', marginTop: spacing.xs }}>
                      <Badge text={`H:${wp.altitude}m`} color={colors.primary} size="sm" />
                      <View style={{ width: spacing.xs }} />
                      <Badge text={`V:${wp.speed}m/s`} color={colors.secondary} size="sm" />
                      <View style={{ width: spacing.xs }} />
                      <Badge
                        text={wp.action === 'hover' ? '悬停' : wp.action === 'photo' ? '拍照' : wp.action === 'video' ? '录像' : '通过'}
                        color={wp.action === 'hover' ? colors.warning : colors.info}
                        size="sm"
                      />
                    </View>
                  </View>
                  <Pressable
                    style={styles.deleteBtn}
                    onPress={() => handleRemoveWaypoint(wp.id)}
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                  </Pressable>
                </Pressable>
                {editingWaypoint === wp.id && (
                  <View style={styles.waypointEditor}>
                    <View style={{ flexDirection: 'row' }}>
                      <View style={{ flex: 1, marginRight: spacing.sm }}>
                        <Text style={styles.smallLabel}>高度 (米)</Text>
                        <TextInput
                          style={styles.smallInput}
                          keyboardType="numeric"
                          value={String(wp.altitude)}
                          onChangeText={(v) => handleUpdateWaypoint(wp.id, 'altitude', parseInt(v) || 0)}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.smallLabel}>速度 (m/s)</Text>
                        <TextInput
                          style={styles.smallInput}
                          keyboardType="numeric"
                          value={String(wp.speed)}
                          onChangeText={(v) => handleUpdateWaypoint(wp.id, 'speed', parseFloat(v) || 0)}
                        />
                      </View>
                    </View>
                    <Text style={[styles.smallLabel, { marginTop: spacing.sm }]}>动作</Text>
                    <View style={{ flexDirection: 'row' }}>
                      {(['none', 'hover', 'photo', 'video'] as const).map((action) => (
                        <Pressable
                          key={action}
                          style={[
                            styles.actionChip,
                            wp.action === action && styles.actionChipActive,
                          ]}
                          onPress={() => handleUpdateWaypoint(wp.id, 'action', action)}
                        >
                          <Text
                            style={[
                              styles.actionChipText,
                              wp.action === action && styles.actionChipTextActive,
                            ]}
                          >
                            {action === 'none' ? '通过' : action === 'hover' ? '悬停' : action === 'photo' ? '拍照' : '录像'}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}
                {index < waypoints.length - 1 && <CardDivider />}
              </View>
            ))
          )}
        </Card>

        <SectionHeader title="机型与载荷" style={{ marginTop: spacing.lg }} />
        <Card>
          <Text style={styles.label}>选择机型</Text>
          <View style={styles.modelList}>
            {droneModels.map((model) => (
              <Pressable
                key={model.id}
                style={[
                  styles.modelItem,
                  selectedModel === model.id && styles.modelItemActive,
                ]}
                onPress={() => {
                  setSelectedModel(model.id);
                  setSelectedPayloads([]);
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.modelName}>{model.name}</Text>
                  <Text style={styles.modelMeta}>
                    {model.manufacturer} · 续航{model.maxFlightTime}分钟 · 最大载荷{model.payloadCapacity}g
                  </Text>
                </View>
                {selectedModel === model.id && (
                  <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                )}
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { marginTop: spacing.lg }]}>选择载荷</Text>
          <View style={styles.payloadList}>
            {payloads.map((payload) => {
              const model = droneModels.find((m) => m.id === selectedModel);
              const supported = model?.supportedPayloads.includes(payload.id);
              const selected = selectedPayloads.includes(payload.id);
              return (
                <Pressable
                  key={payload.id}
                  style={[
                    styles.payloadItem,
                    selected && styles.payloadItemActive,
                    !supported && styles.payloadItemDisabled,
                  ]}
                  onPress={() => supported && handleTogglePayload(payload.id)}
                  disabled={!supported}
                >
                  <View style={styles.payloadIcon}>
                    <Ionicons
                      name={
                        payload.type === 'camera' ? 'camera-outline'
                        : payload.type === 'thermal' ? 'flame-outline'
                        : payload.type === 'lidar' ? 'scan-outline'
                        : payload.type === 'gas' ? 'cloud-outline'
                        : 'cube-outline'
                      }
                      size={20}
                      color={supported ? (selected ? colors.text : colors.primary) : colors.textMuted}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <Text style={[styles.payloadName, !supported && { color: colors.textMuted }]}>
                      {payload.name}
                    </Text>
                    <Text style={styles.payloadMeta}>
                      {payload.type === 'camera' ? '可见光/热成像' :
                        payload.type === 'lidar' ? '激光雷达' :
                        payload.type === 'thermal' ? '热成像' :
                        payload.type === 'gas' ? '气体检测' : '其他'}
                      {payload.resolution ? ` · ${payload.resolution}` : ''}
                    </Text>
                  </View>
                  {selected && (
                    <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                  )}
                  {!supported && (
                    <Badge text="不支持" color={colors.textMuted} size="sm" />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Card>

        <SectionHeader title="禁飞避让设置" style={{ marginTop: spacing.lg }} />
        <Card>
          <View style={styles.noFlyInfo}>
            <Ionicons name="alert-circle-outline" size={20} color={colors.warning} />
            <Text style={styles.noFlyText}>
              已检测到 {noFlyZones.length} 个禁飞/限制区域，航线规划时已自动避让。
            </Text>
          </View>
          {noFlyZones.map((nfz) => (
            <View key={nfz.id} style={styles.noFlyItem}>
              <View style={[styles.noFlyDot, { backgroundColor: nfz.type === 'airport' ? colors.danger : colors.warning }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.noFlyName}>{nfz.name}</Text>
                <Text style={styles.noFlyMeta}>
                  {nfz.type === 'restricted' ? '限制区' : nfz.type === 'airport' ? '机场净空区' : '警示区'}
                  {nfz.altitude ? ` · 限高 ${nfz.altitude}m` : ''}
                </Text>
              </View>
            </View>
          ))}
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="取消"
          variant="outline"
          style={{ flex: 1, marginRight: spacing.md }}
          onPress={() => router.back()}
        />
        <Button
          title="保存航线"
          style={{ flex: 1 }}
          disabled={!name.trim() || waypoints.length < 2}
          onPress={handleSave}
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
  mapContainer: {
    height: 280,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  waypointMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waypointText: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  mapHint: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.overlay,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  mapHintText: {
    color: colors.text,
    fontSize: fontSize.sm,
    marginLeft: spacing.xs,
  },
  panel: {
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
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: '500',
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
  smallInput: {
    backgroundColor: colors.backgroundDark,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    color: colors.text,
    fontSize: fontSize.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: colors.primary,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  waypointItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  waypointIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  waypointIndexText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  waypointCoord: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  deleteBtn: {
    padding: spacing.sm,
  },
  waypointEditor: {
    backgroundColor: colors.backgroundDark,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  actionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.card,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  actionChipText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  actionChipTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
  modelList: {
    marginTop: spacing.xs,
  },
  modelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.backgroundDark,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modelItemActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  modelName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  modelMeta: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  payloadList: {
    marginTop: spacing.xs,
  },
  payloadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.backgroundDark,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  payloadItemActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  payloadItemDisabled: {
    opacity: 0.6,
  },
  payloadIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cardLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payloadName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  payloadMeta: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  noFlyInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.warning + '15',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  noFlyText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginLeft: spacing.sm,
    flex: 1,
  },
  noFlyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  noFlyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.md,
  },
  noFlyName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  noFlyMeta: {
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
