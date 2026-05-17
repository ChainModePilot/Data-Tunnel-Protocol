# Capítulo 6: Transmisión de Datos

## 6.1 Flujo de Datos Bidireccional

DTP soporta la transmisión de datos en ambas direcciones sin interferencia mutua:

| Dirección | Nombre | Descripción |
|-----------|--------|-------------|
| Terminal → Fay | Recolección de Datos | Almacena de forma persistente los datos producidos por el terminal en el Personal Data Heap |
| Fay → Terminal | Inyección de Datos | Un conjunto de datos minimizado filtrado y evaluado por iFay |

Ambas direcciones utilizan el mismo formato Logical_Frame y flujo de procesamiento, pero mantienen espacios de números de secuencia y estados de reanudación independientes.

## 6.2 Flujo de Recolección de Datos (Terminal → Fay)

El flujo completo de recolección de datos pasa por los siguientes pasos:

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

## 6.3 Flujo de Inyección de Datos (Fay → Terminal)

El flujo completo de inyección de datos pasa por los siguientes pasos:

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

## 6.4 Transmisión Comprimida de Agreement_ID

Para reducir la sobrecarga de transmisión, DTP soporta la transmisión comprimida de Agreement_ID:

- Cuando Fragments consecutivos pertenecen al mismo acuerdo, solo el **primer Fragment** del lote lleva el Agreement_ID completo en su header
- Los Fragments subsiguientes tienen su campo agreementId establecido en null, indicando que heredan el anterior

Reglas de procesamiento del receptor:

1. Fragment recibido con Agreement_ID → Actualizar el Agreement_ID del contexto actual
2. Fragment recibido sin Agreement_ID → Asociar con el Agreement_ID más recientemente declarado en el contexto actual
3. Fragment recibido que referencia un Agreement_ID desconocido → Descartar y enviar notificación de error

Ejemplo:

```
Fragment 1: agreementId = "abc-123"  ← ID completo
Fragment 2: agreementId = null       ← Hereda "abc-123"
Fragment 3: agreementId = null       ← Hereda "abc-123"
Fragment 4: agreementId = "def-456"  ← Nuevo acuerdo, ID completo
Fragment 5: agreementId = null       ← Hereda "def-456"
```

## 6.5 Gestión de Números de Secuencia

### Monótonamente Creciente

Cada Fragment lleva un número de secuencia de transmisión (Sequence_Number) que crece monótonamente dentro de una sola sesión.

### Bidireccionalmente Independiente

La dirección de recolección de datos y la dirección de inyección de datos mantienen espacios de números de secuencia completamente independientes:

```
Dirección de recolección de datos:  seq 1, 2, 3, 4, 5 ...
Dirección de inyección de datos:    seq 1, 2, 3, 4, 5 ...
```

Los cambios en el número de secuencia en una dirección no afectan a la otra dirección.

## 6.6 Preservación de la Marca de Tiempo de Origen

DTP asegura que la marca de tiempo de origen (Origin_Timestamp) de cada Fragment permanezca sin cambios durante todo el proceso de transmisión:

- Registra el momento en que los datos fueron **realmente producidos** en el origen, no el momento de transmisión
- Usa zona horaria UTC con precisión de milisegundos
- Después de la serialización, cifrado, transmisión, descifrado y deserialización, la marca de tiempo permanece idéntica a su valor previo al envío
- El receptor preserva el Origin_Timestamp original sin modificación

Esto asegura que incluso cuando los datos se suben con retraso (ej., en escenarios sin conexión), iFay pueda reconstruir la línea temporal verdadera.

## 6.7 Validación de Dependencias DAG

El receptor realiza la validación de dependencias DAG al recibir Fragments:

1. **Detección de ciclos**: Valida que las relaciones de dependencia del nuevo Fragment no formen un ciclo en el DAG. Si se detecta un ciclo, el Fragment es rechazado
2. **Resolución de dependencias**: Si el Fragment objetivo de la dependencia aún no ha llegado, el Fragment actual se marca como "dependencia pendiente de resolución" y se almacena en caché
3. **Resolución diferida**: Cuando el Fragment del que se depende llega, los Fragments previamente almacenados en caché se resuelven automáticamente
