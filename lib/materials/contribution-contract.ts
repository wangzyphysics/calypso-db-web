/** Proposed server contracts only. No authentication, upload service or VASP runner is implemented here. */
export type RequestedVisibility = "private" | "public-after-review";
export interface ContributionRecordInput {
  clientRecordId: string;
  fileId: string; // A finalized file owned by this upload session.
  origin: "experimental" | "theoretical";
  dataType: "structure" | "raman" | "xrd" | "property" | "attachment";
  sampleId: string; // Contributor label scoped to this batch, not a material identity.
  formula: string;
  pressureGPa: number; // Actual submitted condition, including zero.
  temperatureK: number | null;
  phaseLabel: string | null; // A contributor claim, not an approved phase assignment.
  structureClientRecordId: string | null;
  method: string;
  source: string;
  notes: string;
  measurement: {
    processing: "raw" | "processed";
    x: { quantity: string; unit: string; column: number };
    y: { quantity: string; unit: string; column: number };
  } | null;
}
export interface CreateUploadSessionRequest {
  clientBatchId: string;
  title: string;
  files: Array<{
    clientFileId: string;
    path: string;
    size: number;
    sha256: string;
    mediaType: string;
  }>;
}
export interface UploadSessionResponse {
  id: string;
  expiresAt: string;
  maxFileBytes: number;
  maxBatchBytes: number;
  files: Array<{
    clientFileId: string;
    fileId: string;
    uploadUrl: string;
    expiresAt: string;
    requiredHeaders: Record<string, string>;
  }>;
}
export interface SubmitContributionBatchRequest {
  uploadSessionId: string;
  clientBatchId: string;
  title: string;
  requestedVisibility: RequestedVisibility;
  computationRequested: boolean;
  permission: { confirmed: true; policyVersion: string };
  contributor: {
    name: string;
    email: string;
    institution?: string;
    department?: string;
    researchGroup?: string;
    careerStage?: string;
    orcid?: string;
  }; // Explicit attribution snapshot, distinct from server-owned ownerId.
  records: ContributionRecordInput[];
}
export type ReviewStatus =
  "not-submitted" | "pending" | "needs-information" | "approved" | "rejected";
export type PublicationStatus =
  "private" | "pending-publication" | "public" | "withdrawn";
export type WorkflowStatus =
  | "not-requested"
  | "not-applicable"
  | "pending-eligibility"
  | "queued"
  | "running"
  | "failed"
  | "cancelled"
  | "completed";
export type QualityStatus =
  "not-started" | "pending" | "needs-review" | "passed" | "failed";
export type IngestionStatus =
  "not-ingested" | "pending" | "ingested" | "withdrawn";
export interface RecordLifecycle {
  recordId: string;
  review: { status: ReviewStatus; notes: string[]; reviewedAt: string | null };
  publication: {
    status: PublicationStatus;
    publicRecordId: string | null;
    publishedAt: string | null;
  };
  computation: {
    status: WorkflowStatus;
    runId: string | null;
    reason: string | null;
  };
  quality: { status: QualityStatus; notes: string[] };
  ingestion: { status: IngestionStatus; standardizedRecordId: string | null };
}
export interface WorkflowStep {
  id: string;
  label: string;
  dependsOn: string[];
  required: boolean;
  status:
    | "planned"
    | "queued"
    | "running"
    | "succeeded"
    | "failed"
    | "skipped"
    | "cancelled";
  attempt: number;
  startedAt: string | null;
  finishedAt: string | null;
  detail: string | null;
  schedulerJobId: string | null;
  // Optional authoritative per-step metric; omit if the script cannot supply it.
  progress: { percent: number; basis: string } | null;
}
export interface WorkflowRun {
  id: string;
  recordId: string;
  engine: "vasp";
  protocolId: string;
  protocolVersion: string;
  status: WorkflowStatus;
  planFinalized: boolean;
  currentStepId: string | null;
  requestedPressureGPa: number;
  inputStructureId: string;
  outputRecordIds: string[];
  steps: WorkflowStep[];
  lastEventSequence: number;
  updatedAt: string;
}
export interface BatchEvent {
  batchId: string;
  recordId: string | null;
  runId: string | null;
  sequence: number;
  occurredAt: string;
  type:
    | "review.updated"
    | "publication.updated"
    | "workflow.updated"
    | "quality.updated"
    | "ingestion.updated";
}
export interface ContributionBatchResponse {
  id: string;
  ownerId: string;
  title: string;
  requestedVisibility: RequestedVisibility;
  computationRequested: boolean;
  createdAt: string;
  updatedAt: string;
  records: RecordLifecycle[];
}
export interface ContributionBatchDetail extends ContributionBatchResponse {
  inputs: ContributionRecordInput[];
  files: Array<{ id: string; path: string; size: number; sha256: string }>;
  runs: WorkflowRun[];
  lastEventSequence: number;
}
export interface ContributionBatchPage {
  items: ContributionBatchResponse[];
  nextCursor: string | null;
}
export interface ContributionApiError {
  code: string;
  message: string;
  requestId: string;
  issues: Array<{
    recordId: string | null;
    field: string | null;
    message: string;
  }>;
}
/** A step-count metric, never an elapsed-time estimate or percentage derived from SCF iterations. */
export function workflowCompletion(
  run: Pick<WorkflowRun, "steps" | "planFinalized" | "status">,
): number | null {
  const required = run.steps.filter((s) => s.required);
  if (!run.planFinalized || !required.length) return null;
  if (
    run.status === "completed" &&
    required.some((s) => s.status !== "succeeded")
  )
    return null;
  const succeeded = required.filter((s) => s.status === "succeeded").length;
  // A failed/cancelled workflow cannot display a successful 100%.
  if (succeeded === required.length && run.status !== "completed") return null;
  return Math.floor((100 * succeeded) / required.length);
}
export function canPublishRecord(
  requestedVisibility: "private" | "public-after-review",
  review: ReviewStatus,
) {
  return requestedVisibility === "public-after-review" && review === "approved";
}
