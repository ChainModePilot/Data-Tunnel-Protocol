# Capítulo 4: Estructura del Marco Lógico

## 4.1 Composición del Marco

Un LogicalFrame es la estructura de marco de capa de aplicación de DTP, compuesta por dos partes:

```
┌─────────────────────────────────────────┐
│              Logical_Frame               │
├─────────────────────────────────────────┤
│  Header                                  │
│  ┌─────────────────────────────────────┐│
│  │ protocolVersion   Versión protocolo  ││
│  │ frameType         ID tipo de marco   ││
│  │ fragmentId        ID único Fragment  ││
│  │ agreementId       ID del Agreement   ││
│  │                   (comprimible)      ││
│  │ originTimestamp   Marca tiempo origen││
│  │ dagDependencies   Lista dep. DAG     ││
│  │ encryptionMetadata Meta de cifrado   ││
│  │ sequenceNumber    Número secuencia   ││
│  └─────────────────────────────────────┘│
├─────────────────────────────────────────┤
│  Payload                                 │
│  ┌─────────────────────────────────────┐│
│  │ Contenido de datos reales cifrado    ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

Decisiones clave de diseño:

- Los metadatos de cifrado en el header **no están cifrados**, para que el receptor pueda determinar el método de descifrado
- Logical_Frame utiliza la **misma definición de estructura de marco** en ambas direcciones: Terminal→Fay y Fay→Terminal
- Cuando el transporte físico requiere fragmentación, la operación de fragmentación se delega al Transport_Adapter subyacente; el Logical_Frame mantiene su integridad

## 4.2 Tipos de Marco

DTP define cuatro tipos de marco:

| Tipo de Marco | Identificador | Propósito |
|---------------|---------------|-----------|
| Data Frame | `data` | Transporta datos reales del Fragment |
| Request Frame | `request` | Inicia solicitudes de datos o ajusta acuerdos de transmisión |
| Response Frame | `response` | Responde a solicitudes de datos, conteniendo aceptación, rechazo o resultados de negociación |
| Control Frame | `control` | Transmite notificaciones de error, terminación de acuerdos y otra información de control |

## 4.3 Detalle de los Campos del Header

### Versión del Protocolo (protocolVersion)

```
{ major: number, minor: number }
```

Identifica la versión del protocolo utilizada por el marco actual. El receptor la usa para determinar la compatibilidad.

### Identificador de Tipo de Marco (frameType)

Identifica el tipo del marco, determinando cómo debe parsearse el payload.

### Identificador Único de Fragment (fragmentId)

Un identificador UUID v4 globalmente único utilizado para referencia y seguimiento dentro del DAG.

### ID del Agreement (agreementId)

Identifica el acuerdo al que pertenece este Fragment. Soporta transmisión comprimida: cuando Fragments consecutivos pertenecen al mismo acuerdo, solo el primer Fragment del lote lleva el Agreement_ID completo en su header; los Fragments subsiguientes pueden omitirlo (establecido como null).

Reglas del receptor:
- Cuando se recibe un Fragment sin Agreement_ID, se asocia con el Agreement_ID más recientemente declarado en el contexto actual
- Cuando se recibe un Fragment que referencia un Agreement_ID desconocido, el Fragment se descarta y se envía una notificación de error "acuerdo no encontrado"

### Marca de Tiempo de Origen (originTimestamp)

El momento en que los datos fueron realmente producidos en el origen, usando zona horaria UTC con precisión de milisegundos. Se almacena por separado de la marca de tiempo de transmisión y no se ve afectada por los retrasos de transmisión.

Ejemplo: Un usuario registra 30 minutos de datos de frecuencia cardíaca mientras está sin conexión en el metro. Después de salir de la estación, los datos se suben en bloque — cada registro retiene la marca de tiempo del momento real de medición, no el momento de subida.

### Lista de Dependencias DAG (dagDependencies)

Declara relaciones de dependencia con otros Fragments. Cada dependencia incluye:
- Fragment_ID objetivo
- Tipo de relación (`derived_from` / `annotates` / `supersedes`)

Soporta declarar cero o más relaciones de dependencia.

### Metadatos de Cifrado (encryptionMetadata)

```
{ algorithm: string, keyVersion: number }
```

- `algorithm`: Identificador del algoritmo de cifrado (ej., "AES-256-GCM")
- `keyVersion`: Número de versión de la clave

Los metadatos de cifrado en sí no están cifrados, para que el receptor pueda determinar los parámetros de descifrado.

### Número de Secuencia (sequenceNumber)

El número de secuencia de transmisión, monótonamente creciente dentro de una sola sesión, utilizado para el mecanismo de reanudación. Cada dirección de transmisión mantiene un espacio de números de secuencia independiente.

## 4.4 Serialización y Deserialización

DTP_Engine serializa objetos Logical_Frame en formato binario para transmisión; el receptor deserializa los datos binarios de vuelta a objetos Logical_Frame.

Garantía central — **consistencia de ida y vuelta**: Para cualquier objeto Logical_Frame válido, serializarlo y luego deserializarlo debe producir un Logical_Frame equivalente al objeto original.

DTP_Engine también proporciona una función de salida formateada (Pretty Printer) que convierte objetos Logical_Frame en un formato de texto legible por humanos para propósitos de depuración y registro.

## 4.5 Metadatos de Contexto

Cada Fragment lleva metadatos de contexto estructurados (ContextMetadata), incluyendo:

- **Identificador de tipo de datos** (dataType): Describe el tipo de datos
- **Fuente de datos** (source): Distingue entre fuentes de hardware y fuentes de software
- **Campos personalizados** (customFields): Una estructura extensible de pares clave-valor

### Fuente de Hardware

Cuando los datos provienen de un sensor de hardware, los metadatos incluyen:
- Tipo de sensor (sensorType)
- Precisión del sensor (precision)
- Tasa de muestreo (samplingRate, en Hz)

### Fuente de Software

Cuando los datos provienen de compartición de software, los metadatos incluyen:
- Identificador de la aplicación fuente (appIdentifier)
- Descripción del método de compartición (sharingMethod)
