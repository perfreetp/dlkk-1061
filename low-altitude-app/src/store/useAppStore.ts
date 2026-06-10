import { create } from 'zustand';
import type {
  InspectionTask,
  Drone,
  FlightRoute,
  AirspaceApplication,
  Alert,
  FlightTelemetry,
  AbnormalPoint,
  WeatherInfo,
  Statistics,
  FlightRecord,
  Waypoint,
  User,
  TaskReport,
} from '../types';
import {
  mockTasks,
  mockDrones,
  mockRoutes,
  mockAirspaceApplications,
  mockAlerts,
  mockWeather,
  mockStatistics,
  mockFlightRecords,
  currentUser,
  mockDroneModels,
  mockPayloads,
} from '../data/mockData';

interface AppState {
  user: User;
  tasks: InspectionTask[];
  drones: Drone[];
  routes: FlightRoute[];
  airspaceApplications: AirspaceApplication[];
  alerts: Alert[];
  weather: WeatherInfo;
  statistics: Statistics;
  flightRecords: FlightRecord[];
  droneModels: typeof mockDroneModels;
  payloads: typeof mockPayloads;
  selectedTaskId: string | null;
  selectedDroneId: string | null;
  currentRoute: FlightRoute | null;
  editingWaypoints: Waypoint[];
  liveTelemetry: Record<string, FlightTelemetry>;

  setSelectedTaskId: (id: string | null) => void;
  setSelectedDroneId: (id: string | null) => void;
  setCurrentRoute: (route: FlightRoute | null) => void;
  setEditingWaypoints: (waypoints: Waypoint[]) => void;

  createTask: (task: Partial<InspectionTask>) => void;
  updateTaskStatus: (taskId: string, status: InspectionTask['status']) => void;
  addAbnormalPoint: (taskId: string, point: Omit<AbnormalPoint, 'id' | 'reporterId' | 'reporterName' | 'reportedAt'>) => void;
  addPhotosToAbnormalPoint: (taskId: string, abnormalId: string, photoUris: string[]) => void;

  bindDrone: (droneId: string) => void;
  unbindDrone: (droneId: string) => void;
  updateDroneStatus: (droneId: string, status: Drone['status']) => void;

  createAirspaceApplication: (app: Partial<AirspaceApplication>) => void;
  submitAirspaceApplication: (appId: string) => void;
  updateAirspaceApplication: (appId: string, updates: Partial<AirspaceApplication>) => void;

  markAlertRead: (alertId: string) => void;
  markAllAlertsRead: () => void;

  saveRoute: (route: FlightRoute) => void;

  generateReport: (taskId: string) => string;

  getTaskById: (id: string) => InspectionTask | undefined;
  getDroneById: (id: string) => Drone | undefined;
  getAirspaceApplicationById: (id: string) => AirspaceApplication | undefined;
  getFlightRecordByTaskId: (taskId: string) => FlightRecord | undefined;

  getUnreadAlertCount: () => number;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: currentUser,
  tasks: mockTasks,
  drones: mockDrones,
  routes: mockRoutes,
  airspaceApplications: mockAirspaceApplications,
  alerts: mockAlerts,
  weather: mockWeather,
  statistics: mockStatistics,
  flightRecords: mockFlightRecords,
  droneModels: mockDroneModels,
  payloads: mockPayloads,
  selectedTaskId: null,
  selectedDroneId: null,
  currentRoute: null,
  editingWaypoints: [],
  liveTelemetry: {},

  setSelectedTaskId: (id) => set({ selectedTaskId: id }),
  setSelectedDroneId: (id) => set({ selectedDroneId: id }),
  setCurrentRoute: (route) => set({ currentRoute: route }),
  setEditingWaypoints: (waypoints) => set({ editingWaypoints: waypoints }),

  createTask: (task) => {
    const newTask: InspectionTask = {
      id: `t${Date.now()}`,
      name: task.name || '新建任务',
      description: task.description || '',
      areaName: task.areaName || '',
      status: 'pending',
      priority: task.priority || 'medium',
      creatorId: get().user.id,
      creatorName: get().user.name,
      assigneeId: task.assigneeId,
      assigneeName: task.assigneeName,
      droneId: task.droneId,
      droneName: task.droneName,
      droneModelId: task.droneModelId,
      droneModelName: task.droneModelName,
      payloadId: task.payloadId,
      payloadName: task.payloadName,
      routeId: task.routeId,
      routeName: task.routeName,
      scheduledTime: task.scheduledTime,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      abnormalPoints: [],
      photos: [],
      reports: [],
    };
    set((state) => ({ tasks: [newTask, ...state.tasks] }));
  },

  updateTaskStatus: (taskId, status) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status,
              updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
              startTime: status === 'in_progress' && !t.startTime
                ? new Date().toISOString().replace('T', ' ').slice(0, 19)
                : t.startTime,
              endTime: status === 'completed'
                ? new Date().toISOString().replace('T', ' ').slice(0, 19)
                : t.endTime,
            }
          : t
      ),
    }));
  },

  addAbnormalPoint: (taskId, point) => {
    const user = get().user;
    const newPoint: AbnormalPoint = {
      ...point,
      id: `ap${Date.now()}`,
      reporterId: user.id,
      reporterName: user.name,
      reportedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      handled: false,
    };
    const appendedPhotos = point.photos || [];
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              abnormalPoints: [...t.abnormalPoints, newPoint],
              photos: [...t.photos, ...appendedPhotos],
            }
          : t
      ),
    }));
  },

  bindDrone: (droneId) => {
    set((state) => ({
      drones: state.drones.map((d) =>
        d.id === droneId ? { ...d, bound: true } : d
      ),
    }));
  },

  unbindDrone: (droneId) => {
    set((state) => ({
      drones: state.drones.map((d) =>
        d.id === droneId ? { ...d, bound: false } : d
      ),
    }));
  },

  updateDroneStatus: (droneId, status) => {
    set((state) => ({
      drones: state.drones.map((d) =>
        d.id === droneId ? { ...d, status } : d
      ),
    }));
  },

  createAirspaceApplication: (app) => {
    const user = get().user;
    const newApp: AirspaceApplication = {
      id: `a${Date.now()}`,
      taskId: app.taskId || '',
      taskName: app.taskName || '',
      applicantId: user.id,
      applicantName: user.name,
      coordinates: app.coordinates || [],
      altitudeMin: app.altitudeMin || 0,
      altitudeMax: app.altitudeMax || 120,
      startTime: app.startTime || '',
      endTime: app.endTime || '',
      purpose: app.purpose || '',
      droneIds: app.droneIds || [],
      status: 'draft',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    set((state) => ({ airspaceApplications: [newApp, ...state.airspaceApplications] }));
    return newApp.id;
  },

  submitAirspaceApplication: (appId) => {
    set((state) => ({
      airspaceApplications: state.airspaceApplications.map((a) =>
        a.id === appId ? { ...a, status: 'submitted' as const } : a
      ),
    }));
  },

  updateAirspaceApplication: (appId, updates) => {
    set((state) => ({
      airspaceApplications: state.airspaceApplications.map((a) =>
        a.id === appId ? { ...a, ...updates } : a
      ),
    }));
  },

  addPhotosToAbnormalPoint: (taskId, abnormalId, photoUris) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              abnormalPoints: t.abnormalPoints.map((ap) =>
                ap.id === abnormalId
                  ? { ...ap, photos: [...ap.photos, ...photoUris] }
                  : ap
              ),
              photos: [...t.photos, ...photoUris],
            }
          : t
      ),
    }));
  },

  markAlertRead: (alertId) => {
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === alertId ? { ...a, read: true } : a
      ),
    }));
  },

  markAllAlertsRead: () => {
    set((state) => ({
      alerts: state.alerts.map((a) => ({ ...a, read: true })),
    }));
  },

  saveRoute: (route) => {
    set((state) => {
      const exists = state.routes.some((r) => r.id === route.id);
      if (exists) {
        return { routes: state.routes.map((r) => (r.id === route.id ? route : r)) };
      }
      return { routes: [...state.routes, route] };
    });
  },

  generateReport: (taskId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    const user = get().user;
    const flightRecord = get().flightRecords.find((r) => r.taskId === taskId);
    if (!task) return '';

    const abnormalWithPhotos = task.abnormalPoints.filter((ap) => ap.photos.length > 0);
    const totalPhotos = task.photos.length;
    const photosPerPoint = abnormalWithPhotos.length > 0
      ? abnormalWithPhotos.map((ap) =>
          `  · 异常点"${ap.type}"(${ap.severity === 'severe' ? '严重' : ap.severity === 'moderate' ? '中等' : '轻微'}): ${ap.photos.length}张`
        ).join('\n')
      : '';

    const abnormalSummary = task.abnormalPoints.length > 0
      ? task.abnormalPoints.map((ap, i) =>
          `${i + 1}. [${ap.severity === 'severe' ? '严重' : ap.severity === 'moderate' ? '中等' : '轻微'}] ${ap.type}: ${ap.description}${ap.photos.length > 0 ? ` (附${ap.photos.length}张照片)` : ''}`
        ).join('\n')
      : '无异常发现';

    const trajectorySummary = flightRecord
      ? `飞行时长: ${flightRecord.duration}分钟, 飞行距离: ${flightRecord.distance}m, 最大高度: ${flightRecord.maxAltitude}m, 最大速度: ${flightRecord.maxSpeed}m/s, 拍摄照片: ${flightRecord.photos}张`
      : '暂无飞行记录数据';

    const photoSection = totalPhotos > 0
      ? `共${totalPhotos}张现场照片${abnormalWithPhotos.length > 0 ? '，分布如下:\n' + photosPerPoint : '。'}`
      : '无现场照片';

    const reportContent = [
      `【巡检报告】${task.name}`,
      '',
      `一、基本信息`,
      `  任务名称: ${task.name}`,
      `  巡检区域: ${task.areaName || '-'}`,
      `  任务描述: ${task.description || '-'}`,
      `  执行人: ${task.assigneeName || '未指派'}`,
      `  无人机: ${task.droneName || '-'}${task.droneModelName ? ` (${task.droneModelName})` : ''}`,
      `  载荷: ${task.payloadName || '未安装'}`,
      `  航线: ${task.routeName || '-'}`,
      `  计划时间: ${task.scheduledTime || '-'}`,
      `  开始时间: ${task.startTime || '-'}`,
      `  结束时间: ${task.endTime || '-'}`,
      '',
      `二、飞行轨迹摘要`,
      `  ${trajectorySummary}`,
      '',
      `三、异常点 (${task.abnormalPoints.length}处)`,
      `  ${abnormalSummary}`,
      '',
      `四、现场照片`,
      `  ${photoSection}`,
      '',
      `五、巡检结论`,
      `  ${task.abnormalPoints.length === 0 ? '本次巡检未发现异常，设备运行正常。' : `本次巡检共发现${task.abnormalPoints.length}处异常，其中严重${task.abnormalPoints.filter(a => a.severity === 'severe').length}处、中等${task.abnormalPoints.filter(a => a.severity === 'moderate').length}处、轻微${task.abnormalPoints.filter(a => a.severity === 'minor').length}处，建议及时处理。`}`,
      '',
      `报告生成时间: ${new Date().toISOString().replace('T', ' ').slice(0, 19)}`,
      `报告生成人: ${user.name}`,
    ].join('\n');

    const reportId = `rpt${Date.now()}`;
    const newReport: TaskReport = {
      id: reportId,
      taskId: task.id,
      title: `${task.name} - 巡检报告`,
      content: reportContent,
      generatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      generatedById: user.id,
      generatedByName: user.name,
    };

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? { ...t, reports: [...t.reports, newReport] }
          : t
      ),
    }));

    return reportId;
  },

  getTaskById: (id) => get().tasks.find((t) => t.id === id),
  getDroneById: (id) => get().drones.find((d) => d.id === id),
  getAirspaceApplicationById: (id) => get().airspaceApplications.find((a) => a.id === id),
  getFlightRecordByTaskId: (taskId) => get().flightRecords.find((r) => r.taskId === taskId),

  getUnreadAlertCount: () => get().alerts.filter((a) => !a.read).length,
}));
