import { API_BASE_URL } from './api';
import { getSession, normalizeSchoolId } from './sessionService';

export type ActivityApprovalStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PUBLISHED' | 'ARCHIVED';
export type ActivityVisibilityType = 'WHOLE_SCHOOL' | 'SELECTED_CLASSES' | 'SELECTED_STUDENTS' | 'STUDENT_PARENTS_ONLY';
export type ActivityMediaType = 'PHOTO' | 'VIDEO';

export type ActivityMedia = {
  id?: string | number;
  activityId?: string | number;
  fileName?: string;
  contentType?: string;
  storageKey?: string;
  mediaType?: ActivityMediaType | string;
  thumbnailKey?: string;
  uploadedAt?: string;
  url?: string;
  mediaUrl?: string;
  publicUrl?: string;
  signedUrl?: string;
  thumbnailUrl?: string;
};

export type Activity = {
  id: string | number;
  schoolId?: string;
  title: string;
  description?: string;
  activityDate?: string;
  createdBy?: string | number;
  createdByName?: string;
  approvalStatus?: ActivityApprovalStatus | string;
  visibilityType?: ActivityVisibilityType | string;
  coverMediaId?: string | number;
  media?: ActivityMedia[];
  mediaItems?: ActivityMedia[];
  likeCount?: number;
  viewCount?: number;
  mediaCount?: number;
  totalMediaCount?: number;
  photoCount?: number;
  photosCount?: number;
  videoCount?: number;
  videosCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type ActivityCreateRequest = {
  title: string;
  description: string;
  activityDate: string;
  visibilityType: ActivityVisibilityType;
  classIds?: Array<string | number>;
  studentIds?: Array<string | number>;
};

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  message?: string;
  errorCode?: string;
};

function getAuthHeaders() {
  const session = getSession();
  const schoolId = normalizeSchoolId(session?.schoolId || 'TST2');

  return {
    'Content-Type': 'application/json',
    'X-School-Id': schoolId,
    ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
  };
}

function unwrap<T>(payload: T | ApiEnvelope<T>): T {
  if (payload && typeof payload === 'object' && 'data' in (payload as ApiEnvelope<T>)) {
    return (payload as ApiEnvelope<T>).data as T;
  }
  return payload as T;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  });

  const raw = await response.text();
  let payload: any = null;

  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = raw;
    }
  }

  if (!response.ok) {
    const message =
      payload?.message ||
      payload?.errorCode ||
      (typeof payload === 'string' ? payload : '') ||
      `Request failed (${response.status})`;
    throw new Error(message);
  }

  return unwrap<T>(payload);
}

export async function fetchActivityFeed(page = 0, size = 20): Promise<Activity[]> {
  const data = await request<Activity[] | { content?: Activity[]; activities?: Activity[] }>(
    `/api/feed?page=${page}&size=${size}`
  );

  if (Array.isArray(data)) return data;
  return data?.content || data?.activities || [];
}

export async function fetchActivityDetail(activityId: string | number): Promise<Activity> {
  return request<Activity>(`/api/feed/${activityId}`);
}

export async function fetchActivityGallery(page = 0, size = 50): Promise<Activity[]> {
  try {
    const data = await request<Activity[] | { content?: Activity[]; activities?: Activity[] }>(
      `/api/feed/gallery?page=${page}&size=${size}`
    );

    if (Array.isArray(data)) return data;
    return data?.content || data?.activities || [];
  } catch {
    return fetchActivityFeed(page, size);
  }
}

export async function fetchActivityTimeline(page = 0, size = 50): Promise<Activity[]> {
  try {
    const data = await request<Activity[] | { content?: Activity[]; activities?: Activity[] }>(
      `/api/feed/timeline?page=${page}&size=${size}`
    );

    if (Array.isArray(data)) return data;
    return data?.content || data?.activities || [];
  } catch {
    return fetchActivityFeed(page, size);
  }
}

export async function createActivityDraft(payload: ActivityCreateRequest): Promise<Activity> {
  const session = getSession();
  const isTeacher = session?.role === 'TEACHER';
  const path = isTeacher ? '/api/activities/teacher' : '/api/activities';

  return request<Activity>(path, {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      schoolId: normalizeSchoolId(session?.schoolId || 'TST2'),
      createdBy: session?.userId,
    }),
  });
}

export async function submitActivity(activityId: string | number): Promise<Activity> {
  const session = getSession();
  return request<Activity>(`/api/activities/${activityId}/submit`, { method: 'POST' });
}


export async function fetchPendingActivityApprovals(): Promise<Activity[]> {
  const data = await request<Activity[] | { content?: Activity[]; activities?: Activity[] }>(
    `/api/activities/pending`
  );

  if (Array.isArray(data)) return data;
  return data?.content || data?.activities || [];
}

export async function approveActivity(activityId: string | number, remarks?: string): Promise<Activity> {
  return request<Activity>(`/api/activities/${activityId}/approve`, {
    method: 'POST',
    body: JSON.stringify({ remarks: remarks || 'Approved for publishing.' }),
  });
}

export async function rejectActivity(activityId: string | number, remarks: string): Promise<Activity> {
  return request<Activity>(`/api/activities/${activityId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ remarks }),
  });
}

export async function publishActivity(activityId: string | number): Promise<Activity> {
  return request<Activity>(`/api/activities/${activityId}/publish`, { method: 'POST' });
}
