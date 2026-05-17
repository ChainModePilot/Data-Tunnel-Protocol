# Chapter 1: Overview and Motivation

## 1.1 What Is the Data Tunnel Protocol

The Data Tunnel Protocol (DTP) is one of the six core protocols in the iFay ecosystem. It is a **negotiation-based data transmission channel protocol** responsible for bidirectional data collection and injection between terminal devices and Fay.

As an application-layer protocol, DTP is built on top of existing transport protocols (BLE, RTSP, WebSocket, TCP, etc.). It is agnostic to the underlying transport mechanism and only defines "what to transmit, how to organize it, how to negotiate, and how to guarantee delivery."

## 1.2 Protocol Motivation: Data Sovereignty

In the traditional model, applications independently collect user behavioral data for features such as recommendations, and the data is owned by the platform. Users have no control over their own data and cannot decide which data can be used by whom.

DTP's core value proposition is **data sovereignty**: in the AI era, personal data should belong to the individual (managed by iFay within the Personal Data Heap), rather than being scattered across various application vendors.

Data flow under the DTP model:

1. All terminal data is collected via DTP into iFay's Personal Data Heap
2. When a terminal application needs personalized data, it submits a request to iFay
3. iFay judges—like a human would—which information it is willing to provide and how much, returning a filtered, minimized dataset
4. Data sovereignty always remains with the user (Human Prime)

## 1.3 Two Core Data Flows

DTP implements two core data flows:

- **Data Collection (Terminal → Fay)**: Persistently stores data produced by the terminal into iFay's Personal Data Heap, achieving data stewardship
- **Data Injection (Fay → Terminal)**: iFay temporarily provides a filtered and judged minimized dataset to the terminal application, enabling personalized services without compromising privacy

## 1.4 Contextualized Data

Data may lose its meaning when separated from its original context. For example:

- A user orders an iced mung bean soup on a food delivery app. If the ambient temperature of 32°C is recorded simultaneously, it indicates the user chose a cold drink because of the heat
- If the temperature is 12°C, it indicates the user has a preference for cold drinks

DTP carries contextual metadata at the protocol level, ensuring that context is captured at the time of data collection and avoiding the difficulty of reconstructing it after the fact. Each data Fragment carries structured context metadata, including data type, source identifier, collection environment, and other information.

## 1.5 Coordination with CAP

DTP works in coordination with the Control Authorization Protocol (CAP):

- **CAP** handles connection authorization, identity verification, and key exchange
- **DTP** handles the actual negotiation-based data stream transmission

Together, they enable the "direct client takeover" capability without requiring UI-based interaction. DTP begins data transmission only after CAP has completed identity verification and key exchange, ensuring that both communicating parties have trusted identities and usable keys.
