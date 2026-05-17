# Capítulo 3: Arquitectura del Protocolo

## 3.1 Capas del Protocolo

DTP adopta un diseño de arquitectura por capas, de arriba hacia abajo:

```
┌─────────────────────────────────────────────┐
│           Capa de Aplicación                 │
│   iFay / coFay / Personal Data Heap          │
│   Aplicaciones Terminales (Software / Hardware) │
├─────────────────────────────────────────────┤
│           Capa del Protocolo DTP              │
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
│           Capa de Adaptación                 │
│   Transport_Adapter                          │
├─────────────────────────────────────────────┤
│           Capa de Transporte                 │
│   BLE / WebSocket / TCP / RTSP / ...         │
└─────────────────────────────────────────────┘
```

### Principios de Diseño

- **Agnosticismo de Transporte**: A través de la abstracción Transport_Adapter, la lógica central de DTP se desacopla de los protocolos de transporte específicos
- **Negociación Primero**: Toda transmisión de datos debe basarse en acuerdos negociados por ambas partes — no existe la "transmisión desnuda"
- **Soberanía de Datos**: El maestro tiene la autoridad final de decisión sobre los flujos de datos; el esclavo es el productor o consumidor de datos
- **Cifrado de Extremo a Extremo**: El Payload se cifra en tránsito; el entorno de ejecución FayGer no puede acceder al texto plano
- **Preservación de Contexto**: Cada Fragment lleva metadatos de contexto estructurados, asegurando que el contexto no se pierda durante la recolección de datos
- **Recuperabilidad**: El mecanismo de reanudación basado en números de secuencia soporta la recuperación sin interrupciones después de cortes de conexión

## 3.2 Componentes Centrales

### DTP_Engine

El motor de procesamiento central del protocolo DTP, disponible en dos variantes:

- **DTP_Master**: Se ejecuta en el lado de Fay; posee el derecho de iniciar la recolección de datos y tomar decisiones sobre la inyección de datos
- **DTP_Slave**: Se ejecuta en el lado del terminal; responsable de la producción de datos y solicitudes de inyección

Ambos comparten capacidades fundamentales como codec de marcos, cifrado y gestión de DAG, pero difieren en permisos de negociación y dirección del flujo de datos.

### Transport_Adapter

La interfaz abstracta para los protocolos de transporte subyacentes. DTP_Engine se comunica con protocolos de transporte específicos a través de esta interfaz, logrando el agnosticismo de transporte. Los protocolos de transporte soportados incluyen BLE, WebSocket, TCP, RTSP y otros.

Cuando la conexión de transporte subyacente se interrumpe, Transport_Adapter reporta un evento de cambio de estado de conexión a DTP_Engine, activando la suspensión de sesión y el proceso de reanudación.

### Agreement Manager

Gestiona el ciclo de vida completo de los acuerdos:

1. **Creación**: Inicia una solicitud de negociación
2. **Negociación**: Procesa solicitudes y respuestas
3. **Activación**: Genera un Agreement_ID una vez que ambas partes alcanzan consenso
4. **Ajuste Dinámico**: Modifica los parámetros del acuerdo durante la transmisión
5. **Terminación**: Finaliza un acuerdo mediante una directiva de detención

### Frame Codec

Responsable de la serialización de Logical_Frame (codificación a binario) y deserialización (decodificación desde binario), así como de la salida formateada (Pretty Print). Asegura que los marcos se transmitan correctamente entre diferentes plataformas.

### DAG Manager

Gestiona las relaciones de dependencia del grafo acíclico dirigido entre Fragments:

- Detección de ciclos: Previene la formación de dependencias circulares
- Resolución de dependencias: Maneja casos donde los objetivos de dependencia aún no han llegado
- Consultas de relaciones: Consulta las dependencias y dependientes de un Fragment

### Encryption Module

Responsable del cifrado y descifrado de extremo a extremo de los Payloads utilizando claves pre-negociadas por CAP. Asegura que el entorno de ejecución FayGer no pueda acceder a datos en texto plano.

### Session Manager

Gestiona el ciclo de vida de las sesiones DTP:

- Creación y cierre de sesiones
- Persistencia y recuperación de estado
- Detección de timeout y liberación de recursos

### Resume Manager

Gestiona el mecanismo de reanudación basado en números de secuencia:

- Gestión de caché de Fragments
- Seguimiento de números de secuencia
- Coordinación de recuperación desde punto de interrupción

## 3.3 Máquina de Estados de DTP_Engine

Los estados operacionales de DTP_Engine siguen esta máquina de estados:

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

Descripción de las transiciones de estado:

| Estado Actual | Evento Disparador | Estado Destino |
|---------------|-------------------|----------------|
| Idle | Solicitud de conexión recibida | WaitingForCAP |
| WaitingForCAP | Verificación CAP + intercambio de claves completado | SessionEstablished |
| WaitingForCAP | Fallo / timeout de CAP | Idle |
| SessionEstablished | Request_Frame iniciado o recibido | Negotiating |
| SessionEstablished | Cierre de sesión por timeout | Idle |
| Negotiating | Acuerdo alcanzado | Transmitting |
| Negotiating | Fallo / rechazo de negociación | SessionEstablished |
| Transmitting | Transmisión continua de Fragments | Transmitting |
| Transmitting | Ajuste dinámico del acuerdo | Negotiating |
| Transmitting | Conexión interrumpida | Suspended |
| Transmitting | Acuerdo terminado (sin otros acuerdos activos) | SessionEstablished |
| Suspended | Conexión restaurada + re-verificación CAP | Resuming |
| Suspended | Timeout de sesión | Idle |
| Resuming | Handshake de reanudación completado | Transmitting |
| Resuming | Fallo de recuperación | Idle |

## 3.4 Secuencia de Interacción Maestro-Esclavo

Una interacción DTP completa consta de cinco fases:

**Fase 1: Pre-procesamiento CAP**
- CAP completa la verificación de identidad y el intercambio de claves

**Fase 2: Establecimiento de Sesión DTP**
- El maestro inicia el establecimiento de sesión con el esclavo, generando un Session_ID

**Fase 3a: Negociación de Recolección de Datos (iniciada por el Maestro)**
- El maestro envía un Request_Frame (solicitud de recolección de datos)
- El esclavo responde con un Response_Frame (aceptado / rechazado / contrapropuesta)
- Se alcanza un acuerdo, generando un Agreement_ID

**Fase 3b: Negociación de Inyección de Datos (iniciada por el Esclavo)**
- El esclavo envía un Request_Frame (solicitud de inyección de datos)
- El maestro responde con un Response_Frame (aceptado / rechazado / contrapropuesta)
- Se alcanza un acuerdo, generando un Agreement_ID

**Fase 4: Transmisión de Datos**
- Esclavo → Maestro: Fragment (recolección de datos, portando Agreement_ID)
- Maestro → Esclavo: Fragment (inyección de datos, portando Agreement_ID)

**Fase 5: Interrupción y Recuperación de Conexión**
- Conexión interrumpida → Re-establecer conexión (re-verificación CAP) → Reportar el número de secuencia más alto recibido → Reanudar transmisión desde el punto de interrupción
