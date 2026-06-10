import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSize } from '../../src/theme';
import { useAppStore } from '../../src/store/useAppStore';

export default function TabLayout() {
  const unreadCount = useAppStore((s) => s.getUnreadAlertCount());

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.backgroundDark,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: fontSize.xs,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        },
        headerTitleStyle: {
          color: colors.text,
          fontSize: fontSize.xl,
          fontWeight: '700',
        },
        headerTintColor: colors.primary,
      }}
    >
      <Tabs.Screen
        name="tasks"
        options={{
          title: '任务看板',
          tabBarLabel: '任务',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="clipboard-outline" size={size} color={color} />
          ),
          headerTitle: '任务看板',
        }}
      />
      <Tabs.Screen
        name="routes"
        options={{
          title: '航线规划',
          tabBarLabel: '航线',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size} color={color} />
          ),
          headerTitle: '航线规划',
        }}
      />
      <Tabs.Screen
        name="devices"
        options={{
          title: '设备清单',
          tabBarLabel: '设备',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="airplane-outline" size={size} color={color} />
          ),
          headerTitle: '设备清单',
        }}
      />
      <Tabs.Screen
        name="airspace"
        options={{
          title: '空域申请',
          tabBarLabel: '空域',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cloud-outline" size={size} color={color} />
          ),
          headerTitle: '空域申请',
        }}
      />
      <Tabs.Screen
        name="monitor"
        options={{
          title: '实时监控',
          tabBarLabel: '监控',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="eye-outline" size={size} color={color} />
          ),
          headerTitle: '实时监控',
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: '告警中心',
          tabBarLabel: '告警',
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="notifications-outline" size={size} color={color} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          ),
          headerTitle: '告警中心',
        }}
      />
      <Tabs.Screen
        name="review"
        options={{
          title: '任务复盘',
          tabBarLabel: '复盘',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
          headerTitle: '任务复盘',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '700',
  },
});
