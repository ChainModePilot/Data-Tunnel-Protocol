# Capítulo 8: Fiabilidad

## 8.1 Mecanismo de Reanudación

DTP implementa un mecanismo de reanudación basado en números de secuencia, asegurando la transmisión completa de datos en entornos de red inestables.

Objetivo central: Cuando la transmisión se reanuda después de una interrupción de conexión, no es necesario reenviar datos que ya han sido recibidos exitosamente.

### Cómo Funciona

```
Sender                              Receiver
  │                                   │
  │── Fragment (seq=1) ──────────────▶│ ✓ Received
  │── Fragment (seq=2) ──────────────▶│ ✓ Received
  │── Fragment (seq=3) ──────────────▶│ ✓ Received
  │── Fragment (seq=4) ────── ✗ ──────│ Connection lost
  │                                   │
  │     ... Connection restored ...    │
  │                                   │
  │◀── Report highest received seq (3)│
  │                                   │
  │── Fragment (seq=4) ──────────────▶│ Resume from breakpoint
  │── Fragment (seq=5) ──────────────▶│
  │                                   │
```

### Responsabilidades del Emisor

1. Asignar un número de secuencia monótonamente creciente a cada Fragment
2. Almacenar en caché local los Fragments que aún no han sido confirmados por el receptor
3. Al recibir confirmación, eliminar los Fragments confirmados de la caché
4. Después de la recuperación de conexión, reanudar la transmisión comenzando desde el Fragment siguiente al número de secuencia más alto reportado por el receptor

### Responsabilidades del Receptor

1. Rastrear el número de secuencia más alto recibido exitosamente
2. Al recuperarse la conexión, reportar el número de secuencia más alto recibido exitosamente al emisor

## 8.2 Gestión de Caché

El emisor mantiene una caché local de Fragments no confirmados:

- Cada Fragment que ha sido enviado pero aún no confirmado se retiene en la caché
- Al recibir confirmación, los Fragments confirmados se eliminan de la caché
- La caché tiene un límite de capacidad

### Manejo de Caché Llena

Cuando la caché local del emisor alcanza su límite de capacidad:

1. Pausar el envío de nuevos Fragments
2. Notificar a la aplicación de capa superior que la caché está llena
3. Esperar la confirmación del receptor para liberar espacio en la caché antes de reanudar la transmisión

## 8.3 Gestión de Sesiones

### Establecimiento de Sesión

Después de que CAP completa la verificación de identidad y el intercambio de claves, DTP_Engine establece una sesión DTP y genera un identificador de sesión único (Session_ID).

### Mantenimiento del Estado de Sesión

DTP_Engine mantiene el estado de transmisión bidireccional dentro de la sesión:

| Elemento de Estado | Descripción |
|--------------------|-------------|
| currentSequenceNumber | Número de secuencia actual |
| highestAcknowledgedSequenceNumber | Número de secuencia más alto confirmado |
| unacknowledgedFragmentCache | Caché de Fragments no confirmados |
| activeAgreements | Lista de acuerdos activos |

Cada dirección (recolección e inyección) mantiene un estado de transmisión independiente.

### Persistencia de Sesión

Cuando la conexión de transporte subyacente se interrumpe, DTP_Engine persiste el estado de la sesión (incluyendo todos los acuerdos activos) en almacenamiento para soportar la posterior recuperación de conexión.

### Recuperación de Sesión

Después de que la conexión se restaura y la re-verificación CAP es exitosa, DTP_Engine recupera el estado de sesión anterior (incluyendo los acuerdos activos) y reanuda la transmisión.

Flujo de recuperación:

1. La conexión subyacente se re-establece
2. CAP re-verifica la identidad
3. DTP_Engine recupera el estado de sesión desde el almacenamiento persistente
4. El receptor reporta el número de secuencia más alto recibido
5. El emisor reanuda la transmisión desde el punto de interrupción

### Timeout de Sesión

Si una sesión permanece inactiva más allá del umbral de timeout configurado en el protocolo, DTP_Engine cierra la sesión y libera los recursos asociados. Se debe establecer una nueva sesión después del timeout.

## 8.4 Mecanismo de Retransmisión

Cuando el emisor no recibe confirmación del receptor dentro del período de timeout de retransmisión configurado en el protocolo, retransmite automáticamente los Fragments no confirmados.

Estrategia de retransmisión:

1. Esperar el período de timeout configurado
2. Retransmitir los Fragments no confirmados después del timeout
3. Si el conteo de retransmisiones excede el umbral, notificar a la aplicación de capa superior del fallo de transmisión

## 8.5 Escenarios Típicos

### Escenario 1: Túnel del Metro

El teléfono de un usuario pierde conectividad de red en un túnel del metro, habiendo subido 300 de 500 registros de datos de ejercicio. Después de salir del túnel y restaurar la conectividad, DTP reanuda la transmisión desde el registro 301 sin reenviar los primeros 300.

### Escenario 2: Bluetooth Fuera de Rango

El reloj inteligente de un usuario pierde su conexión Bluetooth con el teléfono debido a una distancia excesiva. Cuando el usuario regresa a la proximidad, la conexión se recupera automáticamente y el reloj continúa subiendo los datos de frecuencia cardíaca acumulados durante la desconexión.

### Escenario 3: Reinicio del Servidor

La instancia FayGer que aloja a iFay se reinicia; el estado de la sesión DTP ha sido persistido. Después del reinicio, la sesión se recupera y la recepción de datos del terminal continúa desde el punto de interrupción.
