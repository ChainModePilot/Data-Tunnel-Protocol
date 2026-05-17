# Chapter 9: Error Handling

## 9.1 Error Handling Model

DTP's error handling follows a three-phase "Detect-Notify-Recover" model:

1. **Detect**: Identify abnormal conditions
2. **Notify**: Send error information to the remote peer or upper layer
3. **Recover**: Take recovery measures based on the error type

## 9.2 Error Code System

DTP defines a unique error code for each error type, divided into eight ranges by functional module:

| Error Category | Code Range | Handling Strategy |
|----------------|------------|-------------------|
| Frame Processing Errors | 1xxx | Discard frame + notify sender + log |
| Encryption Errors | 2xxx | Discard frame + notify sender + may trigger key renegotiation |
| Agreement Errors | 3xxx | Discard Fragment + notify sender + may trigger renegotiation |
| DAG Errors | 4xxx | Reject Fragment + notify sender, or cache and wait |
| Session Errors | 5xxx | Attempt session recovery + if failed, close and notify upper layer |
| Resume Errors | 6xxx | Pause sending + notify upper-layer application |
| Version Errors | 7xxx | Send version incompatibility notification + attempt downgrade |
| Permission Errors | 8xxx | Reject operation + notify requestor |

## 9.3 Error Code Reference

### Frame Processing Errors (1xxx)

| Error Code | Name | Description |
|------------|------|-------------|
| 1001 | FRAME_DESERIALIZATION_FAILED | Frame deserialization failed |
| 1002 | FRAME_INVALID_FORMAT | Invalid frame format |

### Encryption Errors (2xxx)

| Error Code | Name | Description |
|------------|------|-------------|
| 2001 | DECRYPTION_FAILED | Payload decryption failed |
| 2002 | KEY_NOT_READY | Key not ready (CAP not completed) |

### Agreement Errors (3xxx)

| Error Code | Name | Description |
|------------|------|-------------|
| 3001 | AGREEMENT_NOT_FOUND | Agreement not found |
| 3002 | AGREEMENT_EXPIRED | Agreement expired |
| 3003 | AGREEMENT_NEGOTIATION_FAILED | Agreement negotiation failed |

### DAG Errors (4xxx)

| Error Code | Name | Description |
|------------|------|-------------|
| 4001 | DAG_CYCLE_DETECTED | DAG cycle detected |
| 4002 | DAG_DEPENDENCY_UNRESOLVED | DAG dependency unresolved |

### Session Errors (5xxx)

| Error Code | Name | Description |
|------------|------|-------------|
| 5001 | SESSION_NOT_FOUND | Session not found |
| 5002 | SESSION_TIMEOUT | Session timeout |
| 5003 | SESSION_RESTORE_FAILED | Session restore failed |

### Resume Errors (6xxx)

| Error Code | Name | Description |
|------------|------|-------------|
| 6001 | BUFFER_FULL | Buffer full |
| 6002 | RETRANSMISSION_TIMEOUT | Retransmission timeout |

### Version Errors (7xxx)

| Error Code | Name | Description |
|------------|------|-------------|
| 7001 | VERSION_INCOMPATIBLE | Version incompatible |

### Permission Errors (8xxx)

| Error Code | Name | Description |
|------------|------|-------------|
| 8001 | PERMISSION_DENIED | Permission denied |
| 8002 | OBSERVER_WRITE_DENIED | Observer write operation denied |

## 9.4 Error Notification Mechanism

Error notifications are conveyed via Control Frames, containing the following information:

| Field | Description |
|-------|-------------|
| errorCode | Error code |
| errorMessage | Error description message |
| relatedFrameId | ID of the frame that triggered the error (optional) |
| relatedAgreementId | Related Agreement ID (optional) |
| details | Additional details (optional) |

## 9.5 Key Error Scenarios

### Deserialization Failure

When a received Logical_Frame cannot be correctly deserialized:
1. Discard the frame
2. Send a FRAME_DESERIALIZATION_FAILED (1001) error notification to the sender

### Decryption Failure

When a received Logical_Frame's payload cannot be correctly decrypted:
1. Discard the frame
2. Send a DECRYPTION_FAILED (2001) error notification to the sender
3. If consecutive failures exceed the threshold, trigger CAP key renegotiation

### DAG Cycle Detection

When a Fragment's declared dependency relationships would form a cycle in the DAG:
1. Reject the Fragment
2. Return a DAG_CYCLE_DETECTED (4001) error

### Unknown Agreement

When a Fragment references an Agreement_ID that does not exist on the receiver:
1. Discard the Fragment
2. Return an AGREEMENT_NOT_FOUND (3001) error

### Key Not Ready

When an attempt is made to send data but CAP key exchange has not yet completed:
1. Refuse to send
2. Return a KEY_NOT_READY (2002) error to the upper-layer caller

### Buffer Full

When the sender's unacknowledged Fragment cache reaches its capacity limit:
1. Pause sending new Fragments
2. Send a BUFFER_FULL (6001) notification to the upper-layer application

### Observer Privilege Violation

When an Observer attempts to initiate a request or modify an agreement:
1. Reject the operation
2. Return an OBSERVER_WRITE_DENIED (8002) error
