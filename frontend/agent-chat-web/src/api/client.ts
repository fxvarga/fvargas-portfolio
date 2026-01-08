import type {
  RunDto,
  RunSummary,
  CreateRunRequest,
  SendMessageRequest,
  ApprovalDto,
  ApprovalResolutionRequest,
  KnowledgeItemDto,
  KnowledgeSearchResponse,
  KnowledgeMetadataDto,
  KnowledgeItemType,
} from '@/types';

const API_BASE = '/api';

export class ApiError extends Error {
  status: number;
  
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(response.status, text || response.statusText);
  }
  return response.json() as Promise<T>;
}

function getHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-Tenant-Id': 'default', // TODO: Get from auth context
  };
}

// Runs API
export async function listRuns(): Promise<RunSummary[]> {
  const response = await fetch(`${API_BASE}/runs`, {
    headers: getHeaders(),
  });
  return handleResponse<RunSummary[]>(response);
}

export async function getRun(runId: string): Promise<RunDto> {
  const response = await fetch(`${API_BASE}/runs/${runId}`, {
    headers: getHeaders(),
  });
  return handleResponse<RunDto>(response);
}

// Response type for creating a run
interface CreateRunResponse {
  runId: string;
  correlationId: string;
}

export async function createRun(request: CreateRunRequest): Promise<CreateRunResponse> {
  const response = await fetch(`${API_BASE}/runs`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ message: request.initialMessage }),
  });
  return handleResponse<CreateRunResponse>(response);
}

export async function sendMessage(
  runId: string,
  request: SendMessageRequest,
): Promise<void> {
  const response = await fetch(`${API_BASE}/runs/${runId}/messages`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ message: request.content }), // Backend expects 'message' not 'content'
  });
  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(response.status, text || response.statusText);
  }
}

// SSE streaming endpoint
export function streamRun(
  runId: string,
  onEvent: (event: MessageEvent) => void,
  onError: (error: Event) => void,
): EventSource {
  const eventSource = new EventSource(`${API_BASE}/runs/${runId}/stream`);
  eventSource.onmessage = onEvent;
  eventSource.onerror = onError;
  return eventSource;
}

// Approvals API
export async function getPendingApprovals(): Promise<ApprovalDto[]> {
  const response = await fetch(`${API_BASE}/approvals`, {
    headers: getHeaders(),
  });
  return handleResponse<ApprovalDto[]>(response);
}

export async function getApproval(approvalId: string): Promise<ApprovalDto> {
  const response = await fetch(`${API_BASE}/approvals/${approvalId}`, {
    headers: getHeaders(),
  });
  return handleResponse<ApprovalDto>(response);
}

// Backend has separate endpoints for approve/reject/edit
interface ApprovalActionRequest {
  runId: string;
  reason?: string;
}

interface EditApprovalRequest extends ApprovalActionRequest {
  editedArgs: unknown;
}

export async function approveToolCall(
  approvalId: string,
  runId: string,
  reason?: string,
): Promise<void> {
  const body: ApprovalActionRequest = { runId, reason };
  const response = await fetch(`${API_BASE}/approvals/${approvalId}/approve`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(response.status, text || response.statusText);
  }
}

export async function rejectToolCall(
  approvalId: string,
  runId: string,
  reason?: string,
): Promise<void> {
  const body: ApprovalActionRequest = { runId, reason };
  const response = await fetch(`${API_BASE}/approvals/${approvalId}/reject`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(response.status, text || response.statusText);
  }
}

export async function editAndApproveToolCall(
  approvalId: string,
  runId: string,
  editedArgs: unknown,
  reason?: string,
): Promise<void> {
  const body: EditApprovalRequest = { runId, editedArgs, reason };
  const response = await fetch(`${API_BASE}/approvals/${approvalId}/edit`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(response.status, text || response.statusText);
  }
}

// Helper function that matches the old interface for backwards compatibility
export async function resolveApproval(
  approvalId: string,
  runId: string,
  request: ApprovalResolutionRequest,
): Promise<void> {
  switch (request.decision) {
    case 'Approved':
      return approveToolCall(approvalId, runId, request.reason);
    case 'Rejected':
      return rejectToolCall(approvalId, runId, request.reason);
    case 'EditedAndApproved':
      return editAndApproveToolCall(approvalId, runId, request.editedArguments, request.reason);
    default:
      throw new Error(`Unknown approval decision: ${request.decision}`);
  }
}

// Knowledge API
export async function listKnowledgeItems(params?: {
  type?: KnowledgeItemType;
  category?: string;
  subcategory?: string;
  keyword?: string;
  skip?: number;
  take?: number;
}): Promise<KnowledgeSearchResponse> {
  const searchParams = new URLSearchParams();
  if (params?.type) searchParams.append('type', params.type);
  if (params?.category) searchParams.append('category', params.category);
  if (params?.subcategory) searchParams.append('subcategory', params.subcategory);
  if (params?.keyword) searchParams.append('keyword', params.keyword);
  if (params?.skip !== undefined) searchParams.append('skip', params.skip.toString());
  if (params?.take !== undefined) searchParams.append('take', params.take.toString());

  const queryString = searchParams.toString();
  const url = `${API_BASE}/knowledge${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, {
    headers: getHeaders(),
  });
  return handleResponse<KnowledgeSearchResponse>(response);
}

export async function getKnowledgeItem(
  type: KnowledgeItemType,
  id: string,
): Promise<KnowledgeItemDto> {
  const response = await fetch(`${API_BASE}/knowledge/${type}/${id}`, {
    headers: getHeaders(),
  });
  return handleResponse<KnowledgeItemDto>(response);
}

export async function getKnowledgeMetadata(): Promise<KnowledgeMetadataDto> {
  const response = await fetch(`${API_BASE}/knowledge/metadata`, {
    headers: getHeaders(),
  });
  return handleResponse<KnowledgeMetadataDto>(response);
}
