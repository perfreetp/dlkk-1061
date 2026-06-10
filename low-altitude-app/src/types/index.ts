export type TaskStatus = 'pending' | 'in_progress' | 'paused' | 'completed' | 'cancelled';
export type ApprovalStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'reviewing';
export type DeviceStatus = 'online' | 'offline' | 'in_flight' | 'maintenance' | 'charging';
export type AlertType = 'weather' | 'fence' | 'takeoff' | 'device' | 'airspace' | 'battery';
export type AlertLevel = 'info' | 'warning' | 'danger' | 'critical';

export interface Coordinate {
  latitude: number;
  longitude: number;
  altitude?: number;
}

export interface Waypoint extends Coordinate {
  id: string;
  speed?: number;
  action?: 'hover' | 'photo' | 'video' | 'none';
  duration?: number;
}

export interface FlightRoute {
  id: string;
  name: string;
  waypoints: Waypoint[];
  flightHeight: number;
  flightSpeed: number;
  noFlyZones: NoFlyZone[];
  estimatedDistance: number;
  estimatedDuration: number;
}

export interface NoFlyZone {
  id: string;
  name: string;
  type: 'restricted' | 'warning' | 'airport';
  coordinates: Coordinate[];
  radius?: number;
  altitude?: number;
}

export interface DroneModel {
  id: string;
  name: string;
  manufacturer: string;
  maxFlightTime: number;
  maxSpeed: number;
  maxAltitude: number;
  payloadCapacity: number;
  weight: number;
  supportedPayloads: string[];
}

export interface Payload {
  id: string;
  name: string;
  type: 'camera' | 'thermal' | 'lidar' | 'gas' | 'other';
  resolution?: string;
  weight: number;
  description: string;
}

export interface Drone {
  id: string;
  modelId: string;
  modelName: string;
  serialNumber: string;
  nickname: string;
  status: DeviceStatus;
  batteryLevel: number;
  healthStatus: number;
  lastMaintenance: string;
  totalFlightTime: number;
  totalFlights: number;
  currentLocation?: Coordinate;
  currentTaskId?: string;
  bound: boolean;
  payloadId?: string;
  firmwareVersion: string;
}

export interface InspectionTask {
  id: string;
  name: string;
  description: string;
  areaName: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  creatorId: string;
  creatorName: string;
  assigneeId?: string;
  assigneeName?: string;
  droneId?: string;
  droneName?: string;
  droneModelId?: string;
  droneModelName?: string;
  payloadId?: string;
  payloadName?: string;
  routeId?: string;
  routeName?: string;
  airspaceApplicationId?: string;
  scheduledTime?: string;
  startTime?: string;
  endTime?: string;
  createdAt: string;
  updatedAt: string;
  abnormalPoints: AbnormalPoint[];
  photos: string[];
  reports: TaskReport[];
}

export interface AbnormalPoint {
  id: string;
  taskId: string;
  coordinate: Coordinate;
  type: string;
  description: string;
  severity: 'minor' | 'moderate' | 'severe';
  photos: string[];
  reporterId: string;
  reporterName: string;
  reportedAt: string;
  handled: boolean;
  handledAt?: string;
  handlerId?: string;
  handlerName?: string;
  handlingNotes?: string;
}

export interface TaskReport {
  id: string;
  taskId: string;
  title: string;
  content: string;
  generatedAt: string;
  generatedById: string;
  generatedByName: string;
  fileUrl?: string;
}

export interface AirspaceApplication {
  id: string;
  taskId: string;
  taskName: string;
  applicantId: string;
  applicantName: string;
  coordinates: Coordinate[];
  altitudeMin: number;
  altitudeMax: number;
  startTime: string;
  endTime: string;
  purpose: string;
  droneIds: string[];
  status: ApprovalStatus;
  reviewerId?: string;
  reviewerName?: string;
  reviewNotes?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface Alert {
  id: string;
  type: AlertType;
  level: AlertLevel;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  taskId?: string;
  droneId?: string;
  location?: Coordinate;
  metadata?: Record<string, any>;
}

export interface WeatherInfo {
  timestamp: string;
  location: Coordinate;
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  visibility: number;
  precipitation: number;
  condition: string;
  flyable: boolean;
}

export interface FlightTelemetry {
  droneId: string;
  timestamp: string;
  location: Coordinate;
  altitude: number;
  speed: number;
  heading: number;
  batteryLevel: number;
  batteryVoltage: number;
  signalStrength: number;
  satelliteCount: number;
  flightMode: string;
  motors: number[];
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'inspector' | 'dispatcher' | 'viewer';
  phone: string;
  email: string;
  avatar?: string;
  department: string;
}

export interface FlightRecord {
  id: string;
  taskId: string;
  taskName: string;
  droneId: string;
  droneName: string;
  pilotId: string;
  pilotName: string;
  startTime: string;
  endTime: string;
  duration: number;
  distance: number;
  maxAltitude: number;
  maxSpeed: number;
  trajectory: Coordinate[];
  telemetry: FlightTelemetry[];
  abnormalCount: number;
  photos: number;
}

export interface Statistics {
  period: string;
  totalTasks: number;
  completedTasks: number;
  totalFlightTime: number;
  totalFlights: number;
  totalDistance: number;
  abnormalCount: number;
  userStats: UserStat[];
  droneStats: DroneStat[];
  dailyStats: DailyStat[];
}

export interface UserStat {
  userId: string;
  userName: string;
  tasks: number;
  flightTime: number;
  flights: number;
  utilization: number;
}

export interface DroneStat {
  droneId: string;
  droneName: string;
  flights: number;
  flightTime: number;
  utilization: number;
  abnormalCount: number;
}

export interface DailyStat {
  date: string;
  tasks: number;
  flightTime: number;
  flights: number;
}

export interface GeoFence {
  id: string;
  name: string;
  type: 'inclusion' | 'exclusion';
  coordinates: Coordinate[];
  altitudeMin: number;
  altitudeMax: number;
  active: boolean;
}
