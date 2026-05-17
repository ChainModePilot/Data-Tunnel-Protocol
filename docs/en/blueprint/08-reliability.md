# Chapter 8: Reliability

## 8.1 Resume Mechanism

DTP implements a resume mechanism based on sequence numbers, ensuring complete data transmission in unstable network environments.

Core objective: When transmission resumes after a connection interruption, there is no need to resend data that has already been successfully received.

### How It Works

```
Sender                              Receiver
  │                                   │
  │── Fragment (seq=1) ──────────────▶│ ✓ Received
  │── Fragment (seq=2) ──────────────▶│ ✓ Received
  │── Fragment (seq=3) ──────────────▶│ ✓ Received
  │── Fragment (seq=4) ────── ✗ ──────│ Connection lost
  │                                   │
  │     ... Connection restored ...    │
  │                                   │
  │◀── Report highest received seq (3)│
  │                                   │
  │── Fragment (seq=4) ──────────────▶│ Resume from breakpoint
  │── Fragment (seq=5) ──────────────▶│
  │                                   │
```

### Sender Responsibilities

1. Assign a monotonically increasing sequence number to each Fragment
2. Cache Fragments locally that have not yet been acknowledged by the receiver
3. Upon receiving acknowledgment, remove acknowledged Fragments from the cache
4. After connection recovery, resume transmission starting from the Fragment following the highest sequence number reported by the receiver

### Receiver Responsibilities

1. Track the highest sequence number successfully received
2. Upon connection recovery, report the highest successfully received sequence number to the sender

## 8.2 Cache Management

The sender maintains a local cache of unacknowledged Fragments:

- Every Fragment that has been sent but not yet acknowledged is retained in the cache
- Upon receiving acknowledgment, acknowledged Fragments are removed from the cache
- The cache has a capacity limit

### Cache Full Handling

When the sender's local cache reaches its capacity limit:

1. Pause sending new Fragments
2. Notify the upper-layer application that the cache is full
3. Wait for the receiver's acknowledgment to free cache space before resuming transmission

## 8.3 Session Management

### Session Establishment

After CAP completes identity verification and key exchange, DTP_Engine establishes a DTP session and generates a unique session identifier (Session_ID).

### Session State Maintenance

DTP_Engine maintains bidirectional transmission state within the session:

| State Item | Description |
|------------|-------------|
| currentSequenceNumber | Current sequence number |
| highestAcknowledgedSequenceNumber | Highest acknowledged sequence number |
| unacknowledgedFragmentCache | Unacknowledged Fragment cache |
| activeAgreements | List of active agreements |

Each direction (collection and injection) maintains independent transmission state.

### Session Persistence

When the underlying transport connection is severed, DTP_Engine persists the session state (including all active agreements) to storage to support subsequent connection recovery.

### Session Recovery

After the connection is restored and CAP re-verification passes, DTP_Engine recovers the previous session state (including active agreements) and resumes transmission.

Recovery flow:

1. Underlying connection is re-established
2. CAP re-verifies identity
3. DTP_Engine recovers session state from persistent storage
4. Receiver reports the highest received sequence number
5. Sender resumes transmission from the breakpoint

### Session Timeout

If a session remains idle beyond the protocol-configured timeout threshold, DTP_Engine closes the session and releases associated resources. A new session must be established after timeout.

## 8.4 Retransmission Mechanism

When the sender does not receive acknowledgment from the receiver within the protocol-configured retransmission timeout period, it automatically retransmits unacknowledged Fragments.

Retransmission strategy:

1. Wait for the configured timeout period
2. Retransmit unacknowledged Fragments after timeout
3. If the retransmission count exceeds the threshold, notify the upper-layer application of transmission failure

## 8.5 Typical Scenarios

### Scenario 1: Subway Tunnel

A user's phone loses network connectivity in a subway tunnel, having uploaded 300 out of 500 exercise data records. After exiting the tunnel and restoring connectivity, DTP resumes transmission from record 301 without resending the first 300.

### Scenario 2: Bluetooth Range Exceeded

A user's smartwatch loses its Bluetooth connection to the phone due to excessive distance. When the user returns to proximity, the connection automatically recovers, and the watch continues uploading heart rate data accumulated during the disconnection.

### Scenario 3: Server Restart

The FayGer instance hosting iFay restarts; the DTP session state has been persisted. After restart, the session is recovered and data reception from the terminal continues from the breakpoint.
