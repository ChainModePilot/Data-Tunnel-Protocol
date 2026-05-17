# Chapter 6: Data Transmission

## 6.1 Bidirectional Data Flow

DTP supports data transmission in both directions without mutual interference:

| Direction | Name | Description |
|-----------|------|-------------|
| Terminal → Fay | Data Collection | Persistently stores data produced by the terminal into the Personal Data Heap |
| Fay → Terminal | Data Injection | A minimized dataset filtered and judged by iFay |

Both directions use the same Logical_Frame format and processing flow, but maintain independent sequence number spaces and resume states.

## 6.2 Data Collection Flow (Terminal → Fay)

The complete data collection flow goes through the following steps:

```
Terminal Application
  │
  ▼ Submit data
DTP_Slave Engine
  │ 1. Attach context metadata
  │ 2. Build LogicalFrame (Header + Payload)
  │ 3. Encrypt Payload
  │ 4. Serialize LogicalFrame
  │
  ▼ send(binary_data)
Transport_Adapter
  │
  ▼ onReceive(binary_data)
DTP_Master Engine
  │ 1. Deserialize LogicalFrame
  │ 2. Validate Agreement_ID
  │ 3. Decrypt Payload
  │ 4. Validate DAG dependencies
  │ 5. Update sequence number + send acknowledgment
  │
  ▼ Store
Personal Data Heap
```

## 6.3 Data Injection Flow (Fay → Terminal)

The complete data injection flow goes through the following steps:

```
Personal Data Heap
  │
  ▼ Query and filter data
DTP_Master Engine
  │ 1. Build Fragment + context metadata
  │ 2. Build LogicalFrame
  │ 3. Encrypt Payload
  │ 4. Serialize LogicalFrame
  │
  ▼ send(binary_data)
Transport_Adapter
  │
  ▼ onReceive(binary_data)
DTP_Slave Engine
  │ 1. Deserialize LogicalFrame
  │ 2. Validate Agreement_ID
  │ 3. Decrypt Payload
  │ 4. Update sequence number + send acknowledgment
  │
  ▼ Deliver data
Terminal Application
```

## 6.4 Agreement_ID Compressed Transmission

To reduce transmission overhead, DTP supports compressed transmission of Agreement_ID:

- When consecutive Fragments belong to the same agreement, only the **first Fragment** in the batch carries the full Agreement_ID in its header
- Subsequent Fragments have their agreementId field set to null, indicating they inherit the previous one

Receiver processing rules:

1. Fragment received with Agreement_ID → Update the current context's Agreement_ID
2. Fragment received without Agreement_ID → Associate with the most recently declared Agreement_ID in the current context
3. Fragment received referencing an unknown Agreement_ID → Discard and send an error notification

Example:

```
Fragment 1: agreementId = "abc-123"  ← Full ID
Fragment 2: agreementId = null       ← Inherits "abc-123"
Fragment 3: agreementId = null       ← Inherits "abc-123"
Fragment 4: agreementId = "def-456"  ← New agreement, full ID
Fragment 5: agreementId = null       ← Inherits "def-456"
```

## 6.5 Sequence Number Management

### Monotonically Increasing

Each Fragment carries a transmission sequence number (Sequence_Number) that monotonically increases within a single session.

### Bidirectionally Independent

The data collection direction and data injection direction maintain completely independent sequence number spaces:

```
Data collection direction:  seq 1, 2, 3, 4, 5 ...
Data injection direction:   seq 1, 2, 3, 4, 5 ...
```

Sequence number changes in one direction do not affect the other direction.

## 6.6 Origin Timestamp Preservation

DTP ensures that each Fragment's origin timestamp (Origin_Timestamp) remains unchanged throughout the entire transmission process:

- Records the moment data was **actually produced** at the source, not the transmission moment
- Uses UTC timezone with millisecond precision
- After serialization, encryption, transmission, decryption, and deserialization, the timestamp remains identical to its pre-send value
- The receiver preserves the original Origin_Timestamp without modification

This ensures that even when data is uploaded with a delay (e.g., in offline scenarios), iFay can reconstruct the true timeline.

## 6.7 DAG Dependency Validation

The receiver performs DAG dependency validation when receiving Fragments:

1. **Cycle detection**: Validates that the new Fragment's dependency relationships do not form a cycle in the DAG. If a cycle is detected, the Fragment is rejected
2. **Dependency resolution**: If the dependency target Fragment has not yet arrived, the current Fragment is marked as "dependency pending resolution" and cached
3. **Deferred resolution**: When the depended-upon Fragment arrives, previously cached Fragments are automatically resolved
