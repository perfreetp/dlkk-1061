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

  bindDrone: (droneId: string) => void;
  unbindDrone: (droneId: string) => void;
  updateDroneStatus: (droneId: string, status: Drone['status']) => void;

  createAirspaceApplication: (app: Partial<AirspaceApplication>) => void;
  submitAirspaceApplication: (appId: string) => void;

  markAlertRead: (alertId: string) => void;
  markAllAlertsRead: () => void;

  saveRoute: (route: FlightRoute) => void;

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
      payloadId: task.payloadId,
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
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? { ...t, abnormalPoints: [...t.abnormalPoints, newPoint] }
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

  getTaskById: (id) => get().tasks.find((t) => t.id === id),
  getDroneById: (id) => get().drones.find((d) => d.id === id),
  getAirspaceApplicationById: (id) => get().airspaceApplications.find((a) => a.id === id),
  getFlightRecordByTaskId: (taskId) => get().flightRecords.find((r) => r.taskId === taskId),

  getUnreadAlertCount: () => get().alerts.filter((a) => !a.read).length,
}));
