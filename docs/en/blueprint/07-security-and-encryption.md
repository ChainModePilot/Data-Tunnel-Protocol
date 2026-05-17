# Chapter 7: Security and Encryption

## 7.1 End-to-End Encryption Design

DTP implements end-to-end encryption, ensuring that data cannot be stolen or tampered with during transmission, even when passing through untrusted intermediate environments (such as the FayGer runtime).

Core guarantee: **Only the target iFay instance can decrypt the received payload data; the FayGer runtime environment cannot access plaintext.**

Even when iFay runs on a public cloud FayGer instance, the cloud service provider cannot read the user's health data, location information, or consumption records.

## 7.2 Encryption Scope

```
┌─────────────────────────────────────┐
│           Logical_Frame              │
├─────────────────────────────────────┤
│  Header — Transmitted in plaintext   │
│  ┌─────────────────────────────────┐│
│  │ ...                             ││
│  │ encryptionMetadata — Plaintext  ││
│  │   algorithm: "AES-256-GCM"     ││
│  │   keyVersion: 3                ││
│  └─────────────────────────────────┘│
├─────────────────────────────────────┤
│  Payload — Transmitted encrypted     │
│  ┌─────────────────────────────────┐│
│  │ ████████████████████████████    ││
│  │ ████████ Encrypted Data ██████  ││
│  │ ████████████████████████████    ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

- **Header**: Transmitted in plaintext; contains meta-information needed for routing and processing
- **Encryption metadata**: Transmitted in plaintext; contains the encryption algorithm identifier and key version number so the receiver can determine the decryption method
- **Payload**: Transmitted encrypted; contains the actual data content

## 7.3 Key Management

DTP does not manage keys itself; instead, it relies on keys pre-negotiated by CAP (Control Authorization Protocol):

1. CAP completes identity verification and key exchange during the connection establishment phase
2. DTP uses the keys provided by CAP for Payload encryption/decryption
3. The key version number (keyVersion) identifies the currently used key

### CAP Prerequisite

Before beginning data transmission, DTP **must** verify that CAP has completed the identity verification and key exchange process. If CAP key exchange has not yet completed, DTP_Engine refuses to send data and returns a "key not ready" (KEY_NOT_READY) error.

## 7.4 Encryption Metadata

Each Logical_Frame's header carries encryption metadata:

| Field | Description |
|-------|-------------|
| algorithm | Encryption algorithm identifier, e.g., "AES-256-GCM" |
| keyVersion | Key version number, identifying which version of the key is used |

The encryption metadata itself is not encrypted, ensuring the receiver can determine decryption parameters before decryption.

## 7.5 Encryption Round-Trip Consistency

DTP guarantees encryption round-trip consistency:

- Encrypting and then decrypting with the **correct key** should produce a Payload equivalent to the original data
- Decrypting with an **incorrect key** should fail and return a DECRYPTION_FAILED error

## 7.6 Terminal-Side Decryption

When the terminal is the receiver (data injection scenario), DTP_Engine uses the key submitted by the terminal during the CAP connection establishment phase for decryption.

## 7.7 Security Threat Protection

| Threat | DTP Protection Measure |
|--------|------------------------|
| Man-in-the-middle eavesdropping | Payload end-to-end encryption; intermediate nodes cannot read plaintext |
| FayGer snooping | FayGer can only see the encrypted Payload and cannot decrypt it |
| Key compromise | Key version number mechanism supports key rotation |
| Identity spoofing | Relies on CAP's identity verification mechanism |
| Replay attacks | Monotonically increasing sequence numbers + session binding |
