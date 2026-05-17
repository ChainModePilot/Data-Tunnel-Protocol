# Chapter 4: Logical Frame Structure

## 4.1 Frame Composition

A Logical_Frame is DTP's application-layer frame structure, composed of two parts:

```
┌─────────────────────────────────────────┐
│              Logical_Frame               │
├─────────────────────────────────────────┤
│  Header                                  │
│  ┌─────────────────────────────────────┐│
│  │ protocolVersion   Protocol version   ││
│  │ frameType         Frame type ID      ││
│  │ fragmentId        Fragment unique ID ││
│  │ agreementId       Agreement ID       ││
│  │                   (compressible)     ││
│  │ originTimestamp   Origin timestamp   ││
│  │ dagDependencies   DAG dependency list││
│  │ encryptionMetadata Encryption meta   ││
│  │ sequenceNumber    Sequence number    ││
│  └─────────────────────────────────────┘│
├─────────────────────────────────────────┤
│  Payload                                 │
│  ┌─────────────────────────────────────┐│
│  │ Encrypted actual data content        ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

Key design decisions:

- The encryption metadata in the header is **not encrypted**, so the receiver can determine the decryption method
- Logical_Frame uses the **same frame structure definition** in both the Terminal→Fay and Fay→Terminal directions
- When physical transport requires fragmentation, the fragmentation operation is delegated to the underlying Transport_Adapter; the Logical_Frame maintains its integrity

## 4.2 Frame Types

DTP defines four frame types:

| Frame Type | Identifier | Purpose |
|------------|------------|---------|
| Data Frame | `data` | Carries actual Fragment data |
| Request Frame | `request` | Initiates data requests or adjusts transmission agreements |
| Response Frame | `response` | Replies to data requests, containing acceptance, rejection, or negotiation results |
| Control Frame | `control` | Conveys error notifications, agreement termination, and other control information |

## 4.3 Header Field Details

### Protocol Version (protocolVersion)

```
{ major: number, minor: number }
```

Identifies the protocol version used by the current frame. The receiver uses this to determine compatibility.

### Frame Type Identifier (frameType)

Identifies the type of the frame, determining how the payload should be parsed.

### Fragment Unique Identifier (fragmentId)

A globally unique UUID v4 identifier used for referencing and tracking within the DAG.

### Agreement ID (agreementId)

Identifies the agreement to which this Fragment belongs. Supports compressed transmission: when consecutive Fragments belong to the same agreement, only the first Fragment in the batch carries the full Agreement_ID in its header; subsequent Fragments may omit it (set to null).

Receiver rules:
- When a Fragment without an Agreement_ID is received, it is associated with the most recently declared Agreement_ID in the current context
- When a Fragment referencing an unknown Agreement_ID is received, the Fragment is discarded and an "agreement not found" error notification is sent

### Origin Timestamp (originTimestamp)

The moment the data was actually produced at the source, using UTC timezone with millisecond precision. Stored separately from the transmission timestamp and unaffected by transmission delays.

Example: A user records 30 minutes of heart rate data while offline in a subway. After exiting the station, the data is uploaded in bulk — each record retains the timestamp of the actual measurement moment, not the upload moment.

### DAG Dependency List (dagDependencies)

Declares dependency relationships with other Fragments. Each dependency includes:
- Target Fragment_ID
- Relationship type (`derived_from` / `annotates` / `supersedes`)

Supports declaring zero or more dependency relationships.

### Encryption Metadata (encryptionMetadata)

```
{ algorithm: string, keyVersion: number }
```

- `algorithm`: Encryption algorithm identifier (e.g., "AES-256-GCM")
- `keyVersion`: Key version number

The encryption metadata itself is not encrypted, so the receiver can determine decryption parameters.

### Sequence Number (sequenceNumber)

The transmission sequence number, monotonically increasing within a single session, used for the resume mechanism. Each transmission direction maintains an independent sequence number space.

## 4.4 Serialization and Deserialization

DTP_Engine serializes Logical_Frame objects into binary format for transmission; the receiver deserializes binary data back into Logical_Frame objects.

Core guarantee — **round-trip consistency**: For any valid Logical_Frame object, serializing and then deserializing it should produce a Logical_Frame equivalent to the original object.

DTP_Engine also provides a formatted output function (Pretty Printer) that converts Logical_Frame objects into a human-readable text format for debugging and logging purposes.

## 4.5 Context Metadata

Each Fragment carries structured context metadata (ContextMetadata), including:

- **Data type identifier** (dataType): Describes the type of data
- **Data source** (source): Distinguishes between hardware sources and software sources
- **Custom fields** (customFields): An extensible key-value pair structure

### Hardware Source

When data originates from a hardware sensor, the metadata includes:
- Sensor type (sensorType)
- Sensor precision (precision)
- Sampling rate (samplingRate, in Hz)

### Software Source

When data originates from software sharing, the metadata includes:
- Source application identifier (appIdentifier)
- Sharing method description (sharingMethod)
