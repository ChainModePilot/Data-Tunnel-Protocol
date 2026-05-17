# Capítulo 5: Mecanismo de Negociación

## 5.1 Principios de Negociación

Uno de los principios de diseño centrales de DTP es "negociación primero": toda transmisión de datos debe basarse en acuerdos negociados por ambas partes — no existe la "transmisión desnuda." El mecanismo de negociación asegura:

- El maestro y el esclavo alcanzan un consenso explícito sobre los parámetros de transmisión antes de que comience la transferencia de datos
- Los parámetros del acuerdo pueden ajustarse dinámicamente durante la transmisión
- Cualquiera de las partes puede terminar proactivamente un acuerdo

## 5.2 Tipos de Marco de Negociación

DTP utiliza dos tipos de marco para completar la negociación:

### Marco de Solicitud (Request_Frame)

Utilizado para iniciar solicitudes de datos o ajustar acuerdos de transmisión, conteniendo los siguientes elementos:

| Campo | Descripción |
|-------|-------------|
| requestId | Identificador único de solicitud |
| requestorRole | Rol del solicitante (master / slave) |
| requestType | Tipo de solicitud: collection / injection / adjustment / termination |
| targetAgreementId | ID del Agreement referenciado durante ajuste/terminación |
| proposedParams | Parámetros de acuerdo propuestos |

### Marco de Respuesta (Response_Frame)

Utilizado para responder a solicitudes de datos, conteniendo los siguientes elementos:

| Campo | Descripción |
|-------|-------------|
| requestId | ID de solicitud correspondiente |
| result | Resultado de negociación: accepted / rejected / counter_proposal |
| agreedParams | Parámetros finales cuando se acepta o se contrapropone |
| agreementId | ID del Agreement generado tras la aceptación |
| rejectionReason | Razón del rechazo |

## 5.3 Flujo de Negociación

### Negociación de Recolección de Datos (iniciada por el Maestro)

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

1. El maestro envía una solicitud de recolección de datos al esclavo, especificando tipo de datos, modo de transferencia, frecuencia y otros parámetros
2. El esclavo responde mediante Response_Frame:
   - **Aceptado**: Acepta transmitir datos según los parámetros solicitados
   - **Rechazado**: Limitado a restricciones de cumplimiento (ej., políticas DLP de prevención de pérdida de datos); debe incluir una razón de cumplimiento
   - **Contrapropuesta**: Propone parámetros modificados

### Negociación de Inyección de Datos (iniciada por el Esclavo)

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

1. El esclavo envía una solicitud de inyección de datos al maestro, describiendo qué datos necesita
2. El maestro responde mediante Response_Frame:
   - **Aceptado**: Incluye el rango de datos filtrado (conjunto de datos minimizado)
   - **Rechazado**: Los datos no serán proporcionados
   - **Contrapropuesta**: Ofrece datos en un rango o formato diferente

## 5.4 Parámetros del Agreement

Una vez que ambas partes alcanzan consenso, se genera un Agreement_ID único. El contenido del acuerdo incluye:

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| dataType | string | Identificador de tipo de datos |
| dataRange | string | Descripción del rango de datos |
| transferMode | enum | Modo de transferencia: one_time / periodic / streaming |
| frequency | number \| null | Frecuencia de transferencia (Hz); null para modo one_time |
| validityPeriod | number | Período de validez (milisegundos) |
| priority | enum | Prioridad: low / normal / high / critical |

## 5.5 Ciclo de Vida del Agreement

Un acuerdo pasa por los siguientes estados:

```
negotiating ──▶ active ──▶ terminated
                  │
                  ▼
              suspended
```

- **negotiating**: Negociación en progreso
- **active**: El acuerdo está en vigor; la transmisión de datos está en curso
- **suspended**: Conexión interrumpida; el acuerdo está pausado
- **terminated**: El acuerdo ha finalizado

## 5.6 Ajuste Dinámico

DTP soporta el ajuste dinámico de los parámetros de un acuerdo existente durante la transmisión enviando un nuevo Request_Frame (con requestType establecido en `adjustment`).

Escenario típico: iFay inicialmente solicita a un reloj inteligente que reporte la frecuencia cardíaca una vez por minuto, pero al detectar que el usuario ha comenzado a correr, ajusta dinámicamente el acuerdo para reportar una vez por segundo.

## 5.7 Terminación del Agreement

Un acuerdo se termina explícitamente enviando un Request_Frame (con requestType establecido en `termination`). Después de la terminación, la transmisión de datos bajo ese acuerdo se detiene inmediatamente.

## 5.8 Múltiples Acuerdos Concurrentes

DTP soporta mantener múltiples acuerdos activos simultáneamente dentro de una sola sesión. Si los múltiples acuerdos se transmiten en serie o en paralelo depende de las capacidades del protocolo de transporte subyacente.

Ejemplo: iFay mantiene simultáneamente un acuerdo de recolección de datos de frecuencia cardíaca (una vez por segundo) y un acuerdo de recolección de datos de conteo de pasos (una vez por minuto) con un reloj inteligente; los dos acuerdos operan de forma independiente.
