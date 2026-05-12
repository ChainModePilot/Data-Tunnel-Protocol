/**
 * Data Tunnel Protocol (DTP) — Schema Definitions
 * Version: 2025-10-25
 *
 * This file contains all self-contained type definitions for the DTP protocol.
 * No external imports — suitable for use as a standalone schema reference.
 */

// ─── Primitive Type Aliases ───

/** Fragment unique identifier (UUID v4) */
export type FragmentID = string;

/** Agreement unique identifier (UUID v4) */
export type AgreementID = string;

/** UTC millisecond timestamp */
export type OriginTimestamp = number;

/** Monotonically increasing integer */
export type SequenceNumber = number;

/** Session unique identifier (UUID v4) */
export type SessionID = string;

/** Connection identifier */
export type ConnectionID = string;

// ─── Protocol Version ───

/** Protocol version number */
export interface ProtocolVersion {
  major: number;
  minor: number;
}

// ─── Frame Types ───

/** Frame type discriminator */
export type FrameType = 'data' | 'request' | 'response' | 'control';

/** Encryption metadata (transmitted in cleartext within the frame header) */
export interface EncryptionMetadata {
  algorithm: string;
  keyVersion: number;
}

/** DAG relation type between fragments */
export type DAGRelationType = 'derived_from' | 'annotates' | 'supersedes';

/** DAG dependency edge */
export interface DAGEdge {
  targetFragmentId: FragmentID;
  relationType: DAGRelationType;
}

/** Frame header */
export interface FrameHeader {
  protocolVersion: ProtocolVersion;
  frameType: FrameType;
  fragmentId: FragmentID;
  agreementId: AgreementID | null;
  originTimestamp: OriginTimestamp;
  dagDependencies: DAGEdge[];
  encryptionMetadata: EncryptionMetadata;
  sequenceNumber: SequenceNumber;
}

/** Logical frame — the primary wire format unit of DTP */
export interface LogicalFrame {
  header: FrameHeader;
  payload: Uint8Array;
}

// ─── Context Metadata ───

/** Hardware sensor data source */
export interface HardwareSource {
  kind: 'hardware';
  sensorType: string;
  precision: string;
  samplingRate: number;
}

/** Software data source */
export interface SoftwareSource {
  kind: 'software';
  appIdentifier: string;
  sharingMethod: string;
}

/** Data source — discriminated union */
export type DataSource = HardwareSource | SoftwareSource;

/** Structured context metadata attached to each fragment */
export interface ContextMetadata {
  dataType: string;
  source: DataSource;
  customFields: Record<string, unknown>;
}

// ─── Fragment ───

/** Data fragment — the fundamental data unit in DTP */
export interface Fragment {
  fragmentId: FragmentID;
  agreementId: AgreementID;
  originTimestamp: OriginTimestamp;
  contextMetadata: ContextMetadata;
  dagDependencies: DAGEdge[];
  data: Uint8Array;
}

// ─── Agreement ───

/** Transfer mode */
export type TransferMode = 'one_time' | 'periodic' | 'streaming';

/** Priority level */
export type Priority = 'low' | 'normal' | 'high' | 'critical';

/** Agreement status */
export type AgreementStatus = 'negotiating' | 'active' | 'suspended' | 'terminated';

/** Data transfer direction */
export type TransferDirection = 'collection' | 'injection';

/** Agreement parameters */
export interface AgreementParams {
  dataType: string;
  dataRange: string;
  transferMode: TransferMode;
  frequency: number | null;
  validityPeriod: number;
  priority: Priority;
}

/** Agreement — a negotiated data transfer contract between master and slave */
export interface Agreement {
  agreementId: AgreementID;
  sessionId: SessionID;
  direction: TransferDirection;
  initiator: 'master' | 'slave';
  params: AgreementParams;
  status: AgreementStatus;
  createdAt: number;
}

// ─── Negotiation Frames ───

/** Negotiation result */
export type NegotiationResult = 'accepted' | 'rejected' | 'counter_proposal';

/** Request frame — used to initiate or adjust agreements */
export interface RequestFrame {
  frameType: 'request';
  requestId: string;
  requestorRole: 'master' | 'slave';
  requestType: 'collection' | 'injection' | 'adjustment' | 'termination';
  targetAgreementId?: AgreementID;
  proposedParams: AgreementParams;
}

/** Response frame — reply to a request frame */
export interface ResponseFrame {
  frameType: 'response';
  requestId: string;
  result: NegotiationResult;
  agreedParams?: AgreementParams;
  agreementId?: AgreementID;
  rejectionReason?: string;
}

// ─── Session ───

/** Session state */
export type SessionState =
  | 'idle'
  | 'waiting_for_cap'
  | 'established'
  | 'negotiating'
  | 'transmitting'
  | 'suspended'
  | 'resuming';

/** Directional transfer state (one per direction) */
export interface DirectionalTransferState {
  currentSequenceNumber: SequenceNumber;
  highestAcknowledgedSequenceNumber: SequenceNumber;
  unacknowledgedFragmentCache: Map<SequenceNumber, Fragment>;
}

/** DTP session */
export interface Session {
  sessionId: SessionID;
  masterIdentity: string;
  slaveIdentity: string;
  state: SessionState;
  activeAgreements: Map<AgreementID, Agreement>;
  collectionState: DirectionalTransferState;
  injectionState: DirectionalTransferState;
  createdAt: number;
  lastActivityAt: number;
  timeoutThreshold: number;
}

// ─── Transport ───

/** Connection state */
export type ConnectionState = 'connected' | 'disconnected' | 'error';

/** Transport endpoint descriptor */
export interface TransportEndpoint {
  protocol: string;
  address: string;
  port?: number;
}

/** Connection object */
export interface Connection {
  connectionId: ConnectionID;
  state: ConnectionState;
}

// ─── Control Frames ───

/** Control frame — used for agreement termination, error notifications, etc. */
export interface ControlFrame {
  frameType: 'control';
  controlType: string;
  agreementId?: AgreementID;
  details?: Record<string, unknown>;
}

// ─── Error Codes ───

/** DTP error code enumeration */
export enum DTPErrorCode {
  // Frame processing errors (1xxx)
  FRAME_DESERIALIZATION_FAILED = 1001,
  FRAME_INVALID_FORMAT = 1002,

  // Encryption errors (2xxx)
  DECRYPTION_FAILED = 2001,
  KEY_NOT_READY = 2002,

  // Agreement errors (3xxx)
  AGREEMENT_NOT_FOUND = 3001,
  AGREEMENT_EXPIRED = 3002,
  AGREEMENT_NEGOTIATION_FAILED = 3003,

  // DAG errors (4xxx)
  DAG_CYCLE_DETECTED = 4001,
  DAG_DEPENDENCY_UNRESOLVED = 4002,

  // Session errors (5xxx)
  SESSION_NOT_FOUND = 5001,
  SESSION_TIMEOUT = 5002,
  SESSION_RESTORE_FAILED = 5003,

  // Resume errors (6xxx)
  BUFFER_FULL = 6001,
  RETRANSMISSION_TIMEOUT = 6002,

  // Version errors (7xxx)
  VERSION_INCOMPATIBLE = 7001,

  // Permission errors (8xxx)
  PERMISSION_DENIED = 8001,
  OBSERVER_WRITE_DENIED = 8002,
}

/** DTP error */
export interface DTPError {
  code: DTPErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

/** Error notification frame */
export interface ErrorNotificationFrame {
  frameType: 'control';
  controlType: 'error_notification';
  errorCode: DTPErrorCode;
  errorMessage: string;
  relatedFrameId?: FragmentID;
  relatedAgreementId?: AgreementID;
  details?: Record<string, unknown>;
}

// ─── Component Interfaces ───

/** CAP context (provided by the CAP protocol) */
export interface CAPContext {
  identity: string;
  sessionKey: Uint8Array;
  verified: boolean;
}

/** Agreement request (used to initiate negotiation) */
export interface AgreementRequest {
  direction: TransferDirection;
  proposedParams: AgreementParams;
}

/** DAG validation result */
export type DAGValidationResult =
  | { status: 'accepted' }
  | { status: 'pending'; unresolvedDeps: FragmentID[] }
  | { status: 'rejected'; reason: 'cycle_detected' };

/** Dependency resolution result */
export interface DependencyResolutionResult {
  resolved: boolean;
  resolvedDeps: FragmentID[];
  unresolvedDeps: FragmentID[];
}

/** Resume report */
export interface ResumeReport {
  collectionHighest: SequenceNumber;
  injectionHighest: SequenceNumber;
}
