import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Polyline, Marker, Polygon, Circle } from 'react-native-maps';
import { useAppStore } from '../../src/store/useAppStore';
import { colors, spacing, fontSize, borderRadius } from '../../src/theme';
import { Card, CardDivider } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { SectionHeader, EmptyState } from '../../src/components/Common';
import { Badge } from '../../src/components/Badge';
import { formatDistance, formatDuration } from '../../src/utils';
import type { Coordinate } from '../../src/types';

const PARK_CENTER: Coordinate = { latitude: 39.9042, longitude: 116.4074 };

export default function RouteListScreen() {
  const router = useRouter();
  const routes = useAppStore((s) => s.routes);
  const setCurrentRoute = useAppStore((s) => s.setCurrentRoute);
  const weather = useAppStore((s) => s.weather);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(routes[0]?.id || null);

  const activeRoute = routes.find((r) => r.id === selectedRoute);

  const handleEditRoute = (routeId: string) => {
    const route = routes.find((r) => r.id === routeId);
    if (route) {
      setCurrentRoute(route);
      router.push('/routes/edit');
    }
  };

  const handleCreateNew = () => {
    setCurrentRoute(null);
    router.push('/routes/edit');
  };

  return (
    <View style={styles.container}>
      <View style={styles.weatherBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons
            name={weather.condition === '晴' ? 'sunny-outline' : 'cloud-outline'}
            size={20}
            color={weather.flyable ? colors.success : colors.warning}
          />
          <Text style={[styles.weatherText, { color: weather.flyable ? colors.success : colors.warning }]}>
            {weather.condition} {weather.temperature}°C
          </Text>
          <Text style={styles.weatherText}>
            风速 {weather.windSpeed}m/s · 湿度 {weather.humidity}%
          </Text>
        </View>
        <Badge
          text={weather.flyable ? '适合飞行' : '谨慎飞行'}
          color={weather.flyable ? colors.success : colors.warning}
        />
      </View>

      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: PARK_CENTER.latitude,
            longitude: PARK_CENTER.longitude,
            latitudeDelta: 0.025,
            longitudeDelta: 0.025,
          }}
          mapType="satellite"
        >
          {activeRoute?.waypoints.map((wp, index) => (
            <Marker
              key={wp.id}
              coordinate={{ latitude: wp.latitude, longitude: wp.longitude }}
              title={`航点 ${index + 1}`}
              description={`高度: ${wp.altitude}m, 速度: ${wp.speed}m/s`}
            >
              <View style={styles.waypointMarker}>
                <Text style={styles.waypointText}>{index + 1}</Text>
              </View>
            </Marker>
          ))}
          {activeRoute && activeRoute.waypoints.length > 1 && (
            <Polyline
              coordinates={activeRoute.waypoints.map((wp) => ({
                latitude: wp.latitude,
                longitude: wp.longitude,
              }))}
              strokeColor={colors.primary}
              strokeWidth={3}
              lineDashPattern={[10, 5]}
            />
          )}
          {activeRoute?.noFlyZones.map((nfz) => {
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
      </View>

      <View style={styles.bottomPanel}>
        <SectionHeader
          title="航线列表"
          right={
            <Button
              title="新建航线"
              size="sm"
              icon={<Ionicons name="add" size={16} color={colors.text} />}
              onPress={handleCreateNew}
            />
          }
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.routeList}
          contentContainerStyle={{ paddingRight: spacing.lg }}
        >
          {routes.map((route) => (
            <Pressable
              key={route.id}
              style={[
                styles.routeCard,
                selectedRoute === route.id && styles.routeCardActive,
              ]}
              onPress={() => setSelectedRoute(route.id)}
            >
              <Text style={styles.routeName}>{route.name}</Text>
              <View style={styles.routeStats}>
                <View style={styles.routeStatItem}>
                  <Ionicons name="navigate-outline" size={12} color={colors.textMuted} />
                  <Text style={styles.routeStatText}>{formatDistance(route.estimatedDistance)}</Text>
                </View>
                <View style={styles.routeStatItem}>
                  <Ionicons name="time-outline" size={12} color={colors.textMuted} />
                  <Text style={styles.routeStatText}>{formatDuration(route.estimatedDuration)}</Text>
                </View>
              </View>
              <View style={styles.routeParams}>
                <Badge text={`H${route.flightHeight}m`} color={colors.primary} size="sm" />
                <Badge text={`V${route.flightSpeed}m/s`} color={colors.secondary} size="sm" />
                <Badge text={`${route.waypoints.length}航点`} color={colors.info} size="sm" />
              </View>
              <Button
                title="编辑"
                size="sm"
                variant="outline"
                style={{ marginTop: spacing.sm }}
                onPress={() => handleEditRoute(route.id)}
              />
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  weatherBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  weatherText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginLeft: spacing.sm,
  },
  mapContainer: {
    flex: 1,
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
  bottomPanel: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  routeList: {
    flexDirection: 'row',
    marginHorizontal: -spacing.lg,
    paddingLeft: spacing.lg,
  },
  routeCard: {
    width: 220,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginRight: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  routeCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  routeName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  routeStats: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  routeStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  routeStatText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginLeft: 4,
  },
  routeParams: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
});
