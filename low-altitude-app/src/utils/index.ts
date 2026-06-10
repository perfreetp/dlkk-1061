import type { TaskStatus, ApprovalStatus, DeviceStatus, AlertType, AlertLevel } from '../types';
import { colors } from '../theme';

export const statusTextMap: Record<TaskStatus, string> = {
  pending: '待执行',
  in_progress: '执行中',
  paused: '已暂停',
  completed: '已完成',
  cancelled: '已取消',
};

export const statusColorMap: Record<TaskStatus, string> = {
  pending: colors.statusGrey,
  in_progress: colors.statusBlue,
  paused: colors.statusYellow,
  completed: colors.statusGreen,
  cancelled: colors.statusRed,
};

export const approvalStatusTextMap: Record<ApprovalStatus, string> = {
  draft: '草稿',
  submitted: '已提交',
  reviewing: '审批中',
  approved: '已批准',
  rejected: '已驳回',
};

export const approvalStatusColorMap: Record<ApprovalStatus, string> = {
  draft: colors.statusGrey,
  submitted: colors.statusBlue,
  reviewing: colors.statusYellow,
  approved: colors.statusGreen,
  rejected: colors.statusRed,
};

export const deviceStatusTextMap: Record<DeviceStatus, string> = {
  online: '在线',
  offline: '离线',
  in_flight: '飞行中',
  maintenance: '维护中',
  charging: '充电中',
};

export const deviceStatusColorMap: Record<DeviceStatus, string> = {
  online: colors.statusGreen,
  offline: colors.statusGrey,
  in_flight: colors.statusBlue,
  maintenance: colors.statusYellow,
  charging: colors.info,
};

export const alertTypeTextMap: Record<AlertType, string> = {
  weather: '气象告警',
  fence: '围栏告警',
  takeoff: '起飞提醒',
  device: '设备告警',
  airspace: '空域告警',
  battery: '电量告警',
};

export const alertLevelTextMap: Record<AlertLevel, string> = {
  info: '提示',
  warning: '警告',
  danger: '危险',
  critical: '严重',
};

export const alertLevelColorMap: Record<AlertLevel, string> = {
  info: colors.info,
  warning: colors.warning,
  danger: colors.danger,
  critical: colors.statusRed,
};

export const priorityTextMap = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急',
};

export const priorityColorMap = {
  low: colors.textMuted,
  medium: colors.info,
  high: colors.warning,
  urgent: colors.danger,
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
};

export const formatDistance = (meters: number): string => {
  if (meters < 1000) return `${meters}米`;
  return `${(meters / 1000).toFixed(1)}公里`;
};

export const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}`;
};

export const formatTime = (dateStr: string): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const calculateBatteryColor = (level: number): string => {
  if (level > 60) return colors.statusGreen;
  if (level > 30) return colors.statusYellow;
  return colors.statusRed;
};

export const calculateHealthColor = (level: number): string => {
  if (level >= 85) return colors.statusGreen;
  if (level >= 70) return colors.statusYellow;
  return colors.statusRed;
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

export const haversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const calculateRouteDistance = (coords: { latitude: number; longitude: number }[]): number => {
  if (coords.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    total += haversineDistance(
      coords[i - 1].latitude,
      coords[i - 1].longitude,
      coords[i].latitude,
      coords[i].longitude
    );
  }
  return Math.round(total);
};
