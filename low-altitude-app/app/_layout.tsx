import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, StyleSheet } from 'react-native';
import { colors } from '../src/theme';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <View style={styles.container}>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: colors.background,
              },
              headerTintColor: colors.text,
              headerTitleStyle: {
                color: colors.text,
              },
              contentStyle: {
                backgroundColor: colors.background,
              },
            }}
          >
            <Stack.Screen
              name="(tabs)"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="tasks/create"
              options={{ title: '创建任务', presentation: 'modal' }}
            />
            <Stack.Screen
              name="tasks/detail"
              options={{ title: '任务详情' }}
            />
            <Stack.Screen
              name="devices/scan"
              options={{ title: '扫码绑定' }}
            />
            <Stack.Screen
              name="devices/detail"
              options={{ title: '设备详情' }}
            />
            <Stack.Screen
              name="airspace/create"
              options={{ title: '空域申请', presentation: 'modal' }}
            />
            <Stack.Screen
              name="airspace/detail"
              options={{ title: '申请详情' }}
            />
            <Stack.Screen
              name="routes/edit"
              options={{ title: '编辑航线' }}
            />
            <Stack.Screen
              name="review/detail"
              options={{ title: '飞行回放' }}
            />
          </Stack>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
