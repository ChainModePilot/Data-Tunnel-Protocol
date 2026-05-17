# Chapter 5: Negotiation Mechanism

## 5.1 Negotiation Principles

One of DTP's core design principles is "negotiation first": all data transmission must be based on agreements negotiated by both parties — there is no "bare transmission." The negotiation mechanism ensures:

- The master and slave reach explicit consensus on transmission parameters before data transfer begins
- Agreement parameters can be dynamically adjusted during transmission
- Either party can proactively terminate an agreement

## 5.2 Negotiation Frame Types

DTP uses two frame types to complete negotiation:

### Request Frame (Request_Frame)

Used to initiate data requests or adjust transmission agreements, containing the following elements:

| Field | Description |
|-------|-------------|
| requestId | Unique request identifier |
| requestorRole | Requestor role (master / slave) |
| requestType | Request type: collection / injection / adjustment / termination |
| targetAgreementId | Agreement ID referenced during adjustment/termination |
| proposedParams | Proposed agreement parameters |

### Response Frame (Response_Frame)

Used to reply to data requests, containing the following elements:

| Field | Description |
|-------|-------------|
| requestId | Corresponding request ID |
| result | Negotiation result: accepted / rejected / counter_proposal |
| agreedParams | Final parameters when accepted or counter-proposed |
| agreementId | Agreement ID generated upon acceptance |
| rejectionReason | Reason for rejection |

## 5.3 Negotiation Flow

### Data Collection Negotiation (Master-initiated)

```
Master                              Slave
  │                                   │
  │── Request_Frame (collection) ────▶│
  │                                   │
  │◀── Response_Frame ────────────────│
  │    (accepted / rejected /         │
  │     counter_proposal)             │
  │                                   │
```

1. Master sends a data collection request to Slave, specifying data type, transfer mode, frequency, and other parameters
2. Slave replies via Response_Frame:
   - **Accepted**: Agrees to transmit data according to the requested parameters
   - **Rejected**: Limited to compliance constraints (e.g., DLP data loss prevention policies); must include a compliance reason
   - **Counter-proposal**: Proposes modified parameters

### Data Injection Negotiation (Slave-initiated)

```
Slave                               Master
  │                                   │
  │── Request_Frame (injection) ─────▶│
  │                                   │
  │◀── Response_Frame ────────────────│
  │    (accepted + filtered data      │
  │     range / rejected /            │
  │     counter_proposal)             │
  │                                   │
```

1. Slave sends a data injection request to Master, describing what data is needed
2. Master replies via Response_Frame:
   - **Accepted**: Includes the filtered data range (minimized dataset)
   - **Rejected**: Data will not be provided
   - **Counter-proposal**: Offers data in a different range or format

## 5.4 Agreement Parameters

Once both parties reach consensus, a unique Agreement_ID is generated. The agreement content includes:

| Parameter | Type | Description |
|-----------|------|-------------|
| dataType | string | Data type identifier |
| dataRange | string | Data range description |
| transferMode | enum | Transfer mode: one_time / periodic / streaming |
| frequency | number \| null | Transfer frequency (Hz); null for one-time mode |
| validityPeriod | number | Validity period (milliseconds) |
| priority | enum | Priority: low / normal / high / critical |

## 5.5 Agreement Lifecycle

An agreement goes through the following states:

```
negotiating ──▶ active ──▶ terminated
                  │
                  ▼
              suspended
```

- **negotiating**: Negotiation in progress
- **active**: Agreement is in effect; data transmission is underway
- **suspended**: Connection interrupted; agreement is paused
- **terminated**: Agreement has ended

## 5.6 Dynamic Adjustment

DTP supports dynamically adjusting the parameters of an existing agreement during transmission by sending a new Request_Frame (with requestType set to `adjustment`).

Typical scenario: iFay initially requests a smartwatch to report heart rate once per minute, but upon detecting that the user has started running, dynamically adjusts the agreement to report once per second.

## 5.7 Agreement Termination

An agreement is explicitly terminated by sending a Request_Frame (with requestType set to `termination`). After termination, data transmission under that agreement stops immediately.

## 5.8 Multiple Concurrent Agreements

DTP supports maintaining multiple active agreements simultaneously within a single session. Whether multiple agreements are transmitted serially or in parallel depends on the capabilities of the underlying transport protocol.

Example: iFay simultaneously maintains a heart rate data collection agreement (once per second) and a step count data collection agreement (once per minute) with a smartwatch; the two agreements operate independently.
