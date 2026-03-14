const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || res.statusText);
  return data as T;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface Parent { _id: string; name: string; phone: string; email: string; createdAt: string }
export interface Student {
  _id: string; name: string; dob: string; gender: string; currentGrade: string;
  parentId: { _id: string; name: string }; createdAt: string;
}
export interface ClassItem {
  _id: string; name: string; subject: string; dayOfWeek: number;
  timeSlot: string; teacherName: string; maxStudents: number;
}
export interface Pkg {
  _id: string; key: string; name: string; price: number;
  originalPrice: number | null; totalSessions: number; benefits: string[]; isPopular: boolean;
}
export interface Sub {
  _id: string; packageName: string; price?: number | null;
  startDate: string; endDate: string; totalSessions: number; usedSessions: number;
  studentId?: { _id: string; name: string }; packageId?: Pkg | null;
}
export interface Registration {
  _id: string;
  classId: { _id: string; name: string; timeSlot: string; dayOfWeek: number };
  studentId: { _id: string; name: string };
  createdAt: string;
}
export interface AttendanceRecord {
  _id: string;
  classId: { _id: string; name: string; timeSlot: string; dayOfWeek?: number };
  studentId: { _id: string; name: string };
  date: string; status: string; note: string;
}
export interface DashboardData {
  stats: {
    totalParents: number; totalStudents: number; totalClasses: number;
    totalRegistrations: number; activeSubs: number; expiredSubs: number;
  };
  subsByPackage: { _id: string; count: number }[];
  classesByDay: { _id: number; count: number }[];
  todayAttendance: { _id: string; count: number }[];
  revenueByMonth: { _id: { year: number; month: number }; total: number; count: number }[];
  recentActivities: { _id: string; action: string; entity: string; description: string; createdAt: string }[];
}
export interface ActivityItem {
  _id: string; action: string; entity: string; description: string; createdAt: string;
}

export const api = {
  dashboard: () => request<DashboardData>('/dashboard'),

  parents: {
    list: (params?: { search?: string; page?: number }) => {
      const q = new URLSearchParams();
      if (params?.search) q.set('search', params.search);
      if (params?.page) q.set('page', String(params.page));
      return request<PaginatedResponse<Parent>>(`/parents?${q}`);
    },
    get: (id: string) => request<Parent>(`/parents/${id}`),
    create: (body: { name: string; phone: string; email: string }) =>
      request<Parent>('/parents', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Partial<{ name: string; phone: string; email: string }>) =>
      request<Parent>(`/parents/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => request<{ success: boolean }>(`/parents/${id}`, { method: 'DELETE' }),
  },

  students: {
    list: (params?: { search?: string; parentId?: string; page?: number }) => {
      const q = new URLSearchParams();
      if (params?.search) q.set('search', params.search);
      if (params?.parentId) q.set('parentId', params.parentId);
      if (params?.page) q.set('page', String(params.page));
      return request<PaginatedResponse<Student>>(`/students?${q}`);
    },
    get: (id: string) => request<Student>(`/students/${id}`),
    create: (body: { name: string; dob: string; gender: string; current_grade: string; parent_id: string }) =>
      request<Student>('/students', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Record<string, unknown>) =>
      request<Student>(`/students/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => request<{ success: boolean }>(`/students/${id}`, { method: 'DELETE' }),
  },

  classes: {
    list: (params?: { day?: number; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.day !== undefined) q.set('day', String(params.day));
      if (params?.search) q.set('search', params.search);
      return request<PaginatedResponse<ClassItem>>(`/classes?${q}`);
    },
    create: (body: Record<string, unknown>) =>
      request<ClassItem>('/classes', { method: 'POST', body: JSON.stringify(body) }),
  },

  register: (classId: string, studentId: string) =>
    request<unknown>(`/classes/${classId}/register`, {
      method: 'POST',
      body: JSON.stringify({ student_id: studentId }),
    }),

  registrations: {
    list: (params?: { studentId?: string; classId?: string }) => {
      const q = new URLSearchParams();
      if (params?.studentId) q.set('studentId', params.studentId);
      if (params?.classId) q.set('classId', params.classId);
      return request<PaginatedResponse<Registration>>(`/registrations?${q}`);
    },
    delete: (id: string) =>
      request<{ message: string; refunded: boolean }>(`/registrations/${id}`, { method: 'DELETE' }),
  },

  packages: {
    list: () => request<Pkg[]>('/packages'),
  },

  subscriptions: {
    list: (params?: { studentId?: string; active?: string; page?: number }) => {
      const q = new URLSearchParams();
      if (params?.studentId) q.set('studentId', params.studentId);
      if (params?.active) q.set('active', params.active);
      if (params?.page) q.set('page', String(params.page));
      return request<PaginatedResponse<Sub>>(`/subscriptions?${q}`);
    },
    get: (id: string) => request<Sub>(`/subscriptions/${id}`),
    create: (body: {
      student_id: string; package_key?: string; package_name?: string;
      start_date: string; end_date: string;
    }) => request<Sub>('/subscriptions', { method: 'POST', body: JSON.stringify(body) }),
    use: (id: string) => request<Sub>(`/subscriptions/${id}/use`, { method: 'PATCH' }),
  },

  attendance: {
    list: (params?: { classId?: string; studentId?: string; date?: string; page?: number }) => {
      const q = new URLSearchParams();
      if (params?.classId) q.set('classId', params.classId);
      if (params?.studentId) q.set('studentId', params.studentId);
      if (params?.date) q.set('date', params.date);
      if (params?.page) q.set('page', String(params.page));
      return request<PaginatedResponse<AttendanceRecord>>(`/attendance?${q}`);
    },
    create: (body: { classId: string; studentId: string; date: string; status?: string; note?: string }) =>
      request<AttendanceRecord>('/attendance', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: { status?: string; note?: string }) =>
      request<AttendanceRecord>(`/attendance/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  },
};
