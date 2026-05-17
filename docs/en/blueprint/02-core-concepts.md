# Chapter 2: Core Concepts

## 2.1 Master-Slave Relationship Model

DTP has a clearly defined master-slave relationship:

- **Master**: The natural person (user) or Fay (iFay / coFay) — the ultimate data owner and decision-maker
- **Slave**: A software or hardware terminal — the data producer or consumer

### Key Constraints

| Constraint | Description | Example |
|------------|-------------|---------|
| Single Controller | At any given moment, a terminal can only have one Fay "inhabiting" it | A user's smartwatch can only be controlled by the user's own iFay at any given time |
| Observer Mechanism | The controlling Fay can invite or authorize other Fays to observe (read-only access) | A user's iFay controls a home smart camera while inviting a family doctor's coFay to observe the health monitoring data stream |
| Master Retrieval Right | The master has the right to retrieve data from the slave; the slave cannot refuse in most cases | iFay requests browsing history from a corporate laptop; the laptop's DLP agent refuses the request due to company compliance policy |
| Slave Request System | When the slave requests data injection from the master, the master has full decision-making authority | A ride-hailing app requests the user's home and office addresses from iFay; iFay determines the user is commuting and provides only the office address |
| Multi-Master Reuse | A slave may be reused by multiple masters during different time periods | A shared family smart speaker is inhabited by the mother's iFay during the day and the father's iFay at night |

## 2.2 Participation Modes

DTP supports two participation modes:

- **Controller**: The Fay currently "inhabiting" the terminal, with full read-write access
- **Observer**: Another Fay invited or authorized by the controller, with read-only access

Observers can only receive read-only copies of the data stream and cannot initiate requests or modify agreements.

## 2.3 Agreement

An Agreement is a data transmission contract negotiated between the master and slave, defining all parameters of the data transfer:

- **Data type/range**: What data to transmit
- **Transfer mode**: One-time (`one_time`), periodic (`periodic`), or streaming (`streaming`)
- **Transfer frequency**: The frequency at which data is sent
- **Validity period**: The duration for which the agreement is valid
- **Priority**: Low (`low`), normal (`normal`), high (`high`), or critical (`critical`)

All data transmission must be based on a mutually negotiated agreement — there is no "bare transmission."

## 2.4 Data Fragment

A Fragment is the data unit in DTP, with the following characteristics:

- **Globally unique identifier** (Fragment_ID)
- **Origin timestamp** (Origin_Timestamp): The moment the data was actually produced, not the transmission time
- **DAG dependencies**: Relationships with other Fragments
- **Agreement affiliation**: Indicates the associated agreement via Agreement_ID
- **Context metadata**: Structured contextual information

## 2.5 Directed Acyclic Graph (DAG) Dependencies

Fragments express dependency relationships through DAG edges, supporting three relationship types:

| Relationship Type | Meaning | Example |
|-------------------|---------|---------|
| `derived_from` | Derived from | A "daily step count summary" Fragment is derived from individual step count record Fragments throughout the day |
| `annotates` | Annotates | A weather data Fragment annotates a food delivery order Fragment, explaining why the user ordered an iced drink during high temperatures |
| `supersedes` | Supersedes | After a user updates their delivery address, the new address Fragment supersedes the old address Fragment |

The DAG structure ensures that relationships are established at the time of data collection, helping iFay understand the evolutionary lineage and causal relationships of the data.

## 2.6 Glossary

| Term | Definition |
|------|------------|
| iFay | Individual Fay — a personal AI avatar (digital twin) bound to a specific natural person (Human Prime) |
| coFay | Common Fay — a public-role AI (similar to an Agent) |
| Fay | General term for anthropomorphic AI agents |
| FayGer | The container/runtime environment for Fay (similar to Docker/JRE); considered a "public space" and should not access plaintext data |
| Human Prime | The natural person to whom an iFay is bound |
| Faying | The state in which an iFay is connected/paired with its Human Prime |
| Personal Data Heap | iFay's private data management module, storing data in multiple formats (the Human Prime's "diary") |
| Sensor | iFay's "nervous system" built on CAP + DTP, receiving data streams |
| Device Driver Hub | The driver hub layer integrating device drivers |
| DTP_Engine | The core processing engine of the DTP protocol, responsible for frame encoding, decoding, encryption, decryption, and transmission management |
