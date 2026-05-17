# Chapter 3: Protocol Architecture

## 3.1 Protocol Layering

DTP adopts a layered architecture design, from top to bottom:

```
┌─────────────────────────────────────────────┐
│           Application Layer                  │
│   iFay / coFay / Personal Data Heap          │
│   Terminal Applications (Software / Hardware) │
├─────────────────────────────────────────────┤
│           DTP Protocol Layer                  │
│   DTP_Master Engine / DTP_Slave Engine       │
│   ┌───────────────────────────────────────┐ │
│   │ Agreement Manager                      │ │
│   │ Frame Codec                            │ │
│   │ DAG Manager                            │ │
│   │ Encryption Module                      │ │
│   │ Session Manager                        │ │
│   │ Resume Manager                         │ │
│   └───────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│           Adapter Layer                      │
│   Transport_Adapter                          │
├─────────────────────────────────────────────┤
│           Transport Layer                    │
│   BLE / WebSocket / TCP / RTSP / ...         │
└─────────────────────────────────────────────┘
```

### Design Principles

- **Transport Agnosticism**: Through the Transport_Adapter abstraction, DTP core logic is decoupled from specific transport protocols
- **Negotiation First**: All data transmission must be based on agreements negotiated by both parties — no "bare transmission"
- **Data Sovereignty**: The master has final decision-making authority over data flows; the slave is the data producer or consumer
- **End-to-End Encryption**: Payload is encrypted in transit; the FayGer runtime cannot access plaintext
- **Context Preservation**: Each Fragment carries structured context metadata, ensuring context is not lost during data collection
- **Recoverability**: Sequence-number-based resume mechanism supports seamless recovery after connection interruptions

## 3.2 Core Components

### DTP_Engine

The core processing engine of the DTP protocol, available in two variants:

- **DTP_Master**: Runs on the Fay side; holds the right to initiate data collection and make data injection decisions
- **DTP_Slave**: Runs on the terminal side; responsible for data production and injection requests

Both share foundational capabilities such as frame codec, encryption, and DAG management, but differ in negotiation permissions and data flow direction.

### Transport_Adapter

The abstract interface for underlying transport protocols. DTP_Engine communicates with specific transport protocols through this interface, achieving transport agnosticism. Supported transport protocols include BLE, WebSocket, TCP, RTSP, and others.

When the underlying transport connection is severed, Transport_Adapter reports a connection state change event to DTP_Engine, triggering session suspension and the resume process.

### Agreement Manager

Manages the complete lifecycle of agreements:

1. **Creation**: Initiates a negotiation request
2. **Negotiation**: Processes requests and responses
3. **Activation**: Generates an Agreement_ID once both parties reach consensus
4. **Dynamic Adjustment**: Modifies agreement parameters during transmission
5. **Termination**: Ends an agreement via a stop directive

### Frame Codec

Responsible for Logical_Frame serialization (encoding to binary) and deserialization (decoding from binary), as well as formatted output (Pretty Print). Ensures frames are correctly transmitted across different platforms.

### DAG Manager

Manages directed acyclic graph dependency relationships between Fragments:

- Cycle detection: Prevents circular dependencies from forming
- Dependency resolution: Handles cases where dependency targets have not yet arrived
- Relationship queries: Queries a Fragment's dependencies and dependents

### Encryption Module

Responsible for end-to-end encryption and decryption of Payloads using keys pre-negotiated by CAP. Ensures the FayGer runtime environment cannot access plaintext data.

### Session Manager

Manages the lifecycle of DTP sessions:

- Session creation and closure
- State persistence and recovery
- Timeout detection and resource release

### Resume Manager

Manages the sequence-number-based resume mechanism:

- Fragment cache management
- Sequence number tracking
- Breakpoint recovery coordination

## 3.3 DTP_Engine State Machine

The operational states of DTP_Engine follow this state machine:

```
                    ┌──────────────────────────────────────────┐
                    │                                          │
    ┌───────┐      │  ┌──────────────┐    ┌────────────────┐  │
    │ Idle  │──────┼─▶│WaitingForCAP │───▶│SessionEstablished│ │
    │       │◀─────┼──│              │◀───│                │  │
    └───────┘      │  └──────────────┘    └───────┬────────┘  │
        ▲          │                              │            │
        │          │                              ▼            │
        │          │                     ┌─────────────┐       │
        │          │                     │ Negotiating │       │
        │          │                     └──────┬──────┘       │
        │          │                            │              │
        │          │                            ▼              │
        │          │                    ┌──────────────┐       │
        │          │                    │ Transmitting │       │
        │          │                    └───────┬──────┘       │
        │          │                            │              │
        │          │                            ▼              │
        │          │  ┌──────────┐      ┌─────────────┐       │
        └──────────┼──│ Resuming │◀─────│  Suspended  │       │
                   │  └──────────┘      └─────────────┘       │
                   └──────────────────────────────────────────┘
```

State transition descriptions:

| Current State | Trigger Event | Target State |
|---------------|---------------|--------------|
| Idle | Connection request received | WaitingForCAP |
| WaitingForCAP | CAP verification + key exchange complete | SessionEstablished |
| WaitingForCAP | CAP failure / timeout | Idle |
| SessionEstablished | Request_Frame initiated or received | Negotiating |
| SessionEstablished | Session timeout closure | Idle |
| Negotiating | Agreement reached | Transmitting |
| Negotiating | Negotiation failure / rejection | SessionEstablished |
| Transmitting | Continuous Fragment transmission | Transmitting |
| Transmitting | Dynamic agreement adjustment | Negotiating |
| Transmitting | Connection severed | Suspended |
| Transmitting | Agreement terminated (no other active agreements) | SessionEstablished |
| Suspended | Connection restored + CAP re-verification | Resuming |
| Suspended | Session timeout | Idle |
| Resuming | Resume handshake complete | Transmitting |
| Resuming | Recovery failure | Idle |

## 3.4 Master-Slave Interaction Sequence

A complete DTP interaction consists of five phases:

**Phase 1: CAP Pre-processing**
- CAP completes identity verification and key exchange

**Phase 2: DTP Session Establishment**
- The master initiates session establishment with the slave, generating a Session_ID

**Phase 3a: Data Collection Negotiation (Master-initiated)**
- Master sends a Request_Frame (data collection request)
- Slave replies with a Response_Frame (accepted / rejected / counter-proposal)
- Agreement is reached, generating an Agreement_ID

**Phase 3b: Data Injection Negotiation (Slave-initiated)**
- Slave sends a Request_Frame (data injection request)
- Master replies with a Response_Frame (accepted / rejected / counter-proposal)
- Agreement is reached, generating an Agreement_ID

**Phase 4: Data Transmission**
- Slave → Master: Fragment (data collection, carrying Agreement_ID)
- Master → Slave: Fragment (data injection, carrying Agreement_ID)

**Phase 5: Connection Interruption and Recovery**
- Connection severed → Re-establish connection (CAP re-verification) → Report highest received sequence number → Resume transmission from breakpoint
