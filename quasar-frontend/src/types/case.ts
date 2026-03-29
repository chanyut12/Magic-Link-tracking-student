export type KnownCaseStatus =
  | 'OPEN'
  | 'PENDING_REVIEW'
  | 'IN_PROGRESS'
  | 'AWAITING_HELP'
  | 'RESOLVED';

export type CaseStatus = KnownCaseStatus | (string & {});
export type CaseLinkStatus = 'ACTIVE' | 'LOCKED' | 'EXPIRED' | 'NONE';

export type CaseReviewAction = 'ASSIST' | 'FORWARD' | 'CLOSE';

export interface CaseRecord {
  id: number;
  student_id?: string | null | undefined;
  task_id?: string | null | undefined;
  student_name: string;
  student_school?: string | null | undefined;
  student_address?: string | null | undefined;
  reason?: string | null | undefined;
  reason_flagged?: string | null | undefined;
  status: CaseStatus;
  created_at: string;
  active_link_id?: string | null | undefined;
  active_link?: string | null | undefined;
  active_link_locked?: boolean | number | null | undefined;
  active_link_lock_reason?: string | null | undefined;
  active_link_expires_at?: string | null | undefined;
  active_link_assigned_to?: string | null | undefined;
  active_link_depth?: number | string | null | undefined;
  link_state?: CaseLinkStatus | null | undefined;
}

export interface CaseDashboardStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  today: number;
  pendingReview: number;
  activeLinks: number;
  delegations: number;
}

export interface CaseTaskSubmission {
  cause_category: string;
  cause_detail: string;
  recommendation: string;
  visit_lat: number | null;
  visit_lng: number | null;
  photo_paths: string;
  submitted_at: string;
}

export interface CaseTaskChainLink {
  id: string;
  assigned_to_name: string;
  delegation_depth: number;
  status: string;
  created_at: string;
  admin_locked?: number | boolean | null | undefined;
  submission?: CaseTaskSubmission | null | undefined;
}

export interface CaseReviewRecord {
  id: string;
  review_action: string;
  reviewed_by: string;
  reviewed_at: string;
  review_note: string | null;
}

export interface CaseTaskRecord {
  task_id: string;
  created_at: string;
  initial_assignee: string | null;
  link_count: number | string;
  has_submission: boolean;
}

export interface CaseTaskDetail {
  task_id: string;
  case_id: number | null;
  task_type: string;
  target_grade?: string | null | undefined;
  target_room?: string | null | undefined;
  student_name?: string | null | undefined;
  student_school?: string | null | undefined;
  student_address?: string | null | undefined;
  reason_flagged?: string | null | undefined;
  task_status: string;
  case_status?: CaseStatus | null | undefined;
  result_summary?: string | null | undefined;
  chain: CaseTaskChainLink[];
  reviews: CaseReviewRecord[];
}

export interface CaseReviewPayload {
  review_action: CaseReviewAction;
  review_note?: string | null | undefined;
  reviewed_by?: string | null | undefined;
}

export interface CaseReviewResponse {
  success?: boolean | undefined;
  message?: string | undefined;
  case?: Record<string, unknown> | null | undefined;
  review?: CaseReviewRecord | null | undefined;
}

export interface CaseTasksResponse {
  success?: boolean | undefined;
  data?: CaseTaskRecord[] | undefined;
}

export interface CaseReviewsResponse {
  success?: boolean | undefined;
  data?: CaseReviewRecord[] | undefined;
}
