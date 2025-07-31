// User Types
export interface User {
  _id: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  profilePicture?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser extends User {
  accessToken: string;
  refreshToken: string;
}

// API Types
export interface Api {
  _id: string;
  name: string;
  url: string;
  description?: string;
  tags: string[];
  userId: string;
  isActive: boolean;
  lastChecked?: string;
  checkInterval: number;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  authConfig?: {
    type: 'bearer' | 'basic' | 'api-key';
    credentials: Record<string, string>;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ApiSnapshot {
  _id: string;
  apiId: string;
  schema: any;
  responseTime: number;
  statusCode: number;
  size: number;
  headers: Record<string, string>;
  version: string;
  snapshotDate: string;
  createdAt: string;
}

export interface ApiChange {
  _id: string;
  apiId: string;
  snapshotId: string;
  changeType:
    | 'schema'
    | 'endpoint'
    | 'parameter'
    | 'response'
    | 'header'
    | 'status';
  severity: 'low' | 'medium' | 'high' | 'critical';
  path: string;
  oldValue: any;
  newValue: any;
  description: string;
  detectedAt: string;
  createdAt: string;
}

export interface Changelog {
  _id: string;
  apiId: string;
  title: string;
  description: string;
  version: string;
  changeDate: string;
  changes: string[];
  createdAt: string;
}

export interface Notification {
  _id: string;
  userId: string;
  apiId: string;
  type: 'email' | 'webhook' | 'sms';
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
}

// Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  role?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// API Management Types
export interface CreateApiRequest {
  name: string;
  url: string;
  description?: string;
  tags?: string[];
  checkInterval?: number;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  authConfig?: {
    type: 'bearer' | 'basic' | 'api-key';
    credentials: Record<string, string>;
  };
}

export interface UpdateApiRequest extends Partial<CreateApiRequest> {
  isActive?: boolean;
}

// UI State Types
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface FilterState {
  tags: string[];
  status: 'all' | 'active' | 'inactive';
  search: string;
}

export interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}

// Chart Data Types
export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface TimeSeriesData {
  responseTime: ChartDataPoint[];
  uptime: ChartDataPoint[];
  errors: ChartDataPoint[];
}

// WebSocket Types
export interface WebSocketMessage {
  type: 'api_change' | 'status_update' | 'notification';
  data: any;
  timestamp: string;
}

// Form Types
export interface FormFieldError {
  message: string;
  type: string;
}

export interface FormErrors {
  [key: string]: FormFieldError;
}

// Table Types
export interface Column<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

export interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  sorting?: {
    field: string;
    direction: 'asc' | 'desc';
    onSort: (field: string) => void;
  };
}

// Modal Types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}
