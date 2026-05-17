# Capítulo 9: Manejo de Errores

## 9.1 Modelo de Manejo de Errores

El manejo de errores de DTP sigue un modelo de tres fases "Detectar-Notificar-Recuperar":

1. **Detectar**: Identificar condiciones anormales
2. **Notificar**: Enviar información de error al par remoto o a la capa superior
3. **Recuperar**: Tomar medidas de recuperación basadas en el tipo de error

## 9.2 Sistema de Códigos de Error

DTP define un código de error único para cada tipo de error, dividido en ocho rangos por módulo funcional:

| Categoría de Error | Rango de Códigos | Estrategia de Manejo |
|--------------------|------------------|----------------------|
| Errores de Procesamiento de Marco | 1xxx | Descartar marco + notificar emisor + registrar |
| Errores de Cifrado | 2xxx | Descartar marco + notificar emisor + puede activar renegociación de claves |
| Errores de Agreement | 3xxx | Descartar Fragment + notificar emisor + puede activar renegociación |
| Errores de DAG | 4xxx | Rechazar Fragment + notificar emisor, o almacenar en caché y esperar |
| Errores de Sesión | 5xxx | Intentar recuperación de sesión + si falla, cerrar y notificar capa superior |
| Errores de Reanudación | 6xxx | Pausar envío + notificar aplicación de capa superior |
| Errores de Versión | 7xxx | Enviar notificación de incompatibilidad de versión + intentar degradación |
| Errores de Permisos | 8xxx | Rechazar operación + notificar solicitante |

## 9.3 Referencia de Códigos de Error

### Errores de Procesamiento de Marco (1xxx)

| Código de Error | Nombre | Descripción |
|-----------------|--------|-------------|
| 1001 | FRAME_DESERIALIZATION_FAILED | Fallo en la deserialización del marco |
| 1002 | FRAME_INVALID_FORMAT | Formato de marco inválido |

### Errores de Cifrado (2xxx)

| Código de Error | Nombre | Descripción |
|-----------------|--------|-------------|
| 2001 | DECRYPTION_FAILED | Fallo en el descifrado del Payload |
| 2002 | KEY_NOT_READY | Clave no lista (CAP no completado) |

### Errores de Agreement (3xxx)

| Código de Error | Nombre | Descripción |
|-----------------|--------|-------------|
| 3001 | AGREEMENT_NOT_FOUND | Agreement no encontrado |
| 3002 | AGREEMENT_EXPIRED | Agreement expirado |
| 3003 | AGREEMENT_NEGOTIATION_FAILED | Fallo en la negociación del Agreement |

### Errores de DAG (4xxx)

| Código de Error | Nombre | Descripción |
|-----------------|--------|-------------|
| 4001 | DAG_CYCLE_DETECTED | Ciclo detectado en el DAG |
| 4002 | DAG_DEPENDENCY_UNRESOLVED | Dependencia DAG no resuelta |

### Errores de Sesión (5xxx)

| Código de Error | Nombre | Descripción |
|-----------------|--------|-------------|
| 5001 | SESSION_NOT_FOUND | Sesión no encontrada |
| 5002 | SESSION_TIMEOUT | Timeout de sesión |
| 5003 | SESSION_RESTORE_FAILED | Fallo en la restauración de sesión |

### Errores de Reanudación (6xxx)

| Código de Error | Nombre | Descripción |
|-----------------|--------|-------------|
| 6001 | BUFFER_FULL | Buffer lleno |
| 6002 | RETRANSMISSION_TIMEOUT | Timeout de retransmisión |

### Errores de Versión (7xxx)

| Código de Error | Nombre | Descripción |
|-----------------|--------|-------------|
| 7001 | VERSION_INCOMPATIBLE | Versión incompatible |

### Errores de Permisos (8xxx)

| Código de Error | Nombre | Descripción |
|-----------------|--------|-------------|
| 8001 | PERMISSION_DENIED | Permiso denegado |
| 8002 | OBSERVER_WRITE_DENIED | Operación de escritura del Observer denegada |

## 9.4 Mecanismo de Notificación de Errores

Las notificaciones de error se transmiten mediante Control Frames, conteniendo la siguiente información:

| Campo | Descripción |
|-------|-------------|
| errorCode | Código de error |
| errorMessage | Mensaje de descripción del error |
| relatedFrameId | ID del marco que activó el error (opcional) |
| relatedAgreementId | ID del Agreement relacionado (opcional) |
| details | Detalles adicionales (opcional) |

## 9.5 Escenarios Clave de Error

### Fallo de Deserialización

Cuando un Logical_Frame recibido no puede ser correctamente deserializado:
1. Descartar el marco
2. Enviar una notificación de error FRAME_DESERIALIZATION_FAILED (1001) al emisor

### Fallo de Descifrado

Cuando el payload de un Logical_Frame recibido no puede ser correctamente descifrado:
1. Descartar el marco
2. Enviar una notificación de error DECRYPTION_FAILED (2001) al emisor
3. Si los fallos consecutivos exceden el umbral, activar la renegociación de claves CAP

### Detección de Ciclo en DAG

Cuando las relaciones de dependencia declaradas de un Fragment formarían un ciclo en el DAG:
1. Rechazar el Fragment
2. Devolver un error DAG_CYCLE_DETECTED (4001)

### Agreement Desconocido

Cuando un Fragment referencia un Agreement_ID que no existe en el receptor:
1. Descartar el Fragment
2. Devolver un error AGREEMENT_NOT_FOUND (3001)

### Clave No Lista

Cuando se intenta enviar datos pero el intercambio de claves CAP aún no se ha completado:
1. Rechazar el envío
2. Devolver un error KEY_NOT_READY (2002) al llamador de capa superior

### Buffer Lleno

Cuando la caché de Fragments no confirmados del emisor alcanza su límite de capacidad:
1. Pausar el envío de nuevos Fragments
2. Enviar una notificación BUFFER_FULL (6001) a la aplicación de capa superior

### Violación de Privilegios del Observer

Cuando un Observer intenta iniciar una solicitud o modificar un acuerdo:
1. Rechazar la operación
2. Devolver un error OBSERVER_WRITE_DENIED (8002)
