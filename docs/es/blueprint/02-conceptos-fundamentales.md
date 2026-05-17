# Capítulo 2: Conceptos Fundamentales

## 2.1 Modelo de Relación Maestro-Esclavo

DTP tiene una relación maestro-esclavo claramente definida:

- **Maestro (Master)**: La persona natural (usuario) o Fay (iFay / coFay) — el propietario último de los datos y tomador de decisiones
- **Esclavo (Slave)**: Un terminal de software o hardware — el productor o consumidor de datos

### Restricciones Clave

| Restricción | Descripción | Ejemplo |
|-------------|-------------|---------|
| Controlador Único | En cualquier momento dado, un terminal solo puede tener un Fay "habitándolo" | El reloj inteligente de un usuario solo puede ser controlado por el iFay propio del usuario en un momento dado |
| Mecanismo de Observador | El Fay controlador puede invitar o autorizar a otros Fays a observar (acceso de solo lectura) | El iFay de un usuario controla una cámara inteligente del hogar mientras invita al coFay de un médico familiar a observar el flujo de datos de monitoreo de salud |
| Derecho de Recuperación del Maestro | El maestro tiene el derecho de recuperar datos del esclavo; el esclavo no puede rechazar en la mayoría de los casos | iFay solicita el historial de navegación de un portátil corporativo; el agente DLP del portátil rechaza la solicitud debido a la política de cumplimiento de la empresa |
| Sistema de Solicitud del Esclavo | Cuando el esclavo solicita inyección de datos del maestro, el maestro tiene plena autoridad de decisión | Una aplicación de transporte solicita las direcciones de casa y oficina del usuario a iFay; iFay determina que el usuario está en camino al trabajo y proporciona solo la dirección de la oficina |
| Reutilización Multi-Maestro | Un esclavo puede ser reutilizado por múltiples maestros durante diferentes períodos de tiempo | Un altavoz inteligente familiar compartido es habitado por el iFay de la madre durante el día y el iFay del padre por la noche |

## 2.2 Modos de Participación

DTP soporta dos modos de participación:

- **Controlador (Controller)**: El Fay que actualmente "habita" el terminal, con acceso completo de lectura-escritura
- **Observador (Observer)**: Otro Fay invitado o autorizado por el controlador, con acceso de solo lectura

Los observadores solo pueden recibir copias de solo lectura del flujo de datos y no pueden iniciar solicitudes ni modificar acuerdos.

## 2.3 Agreement

Un Agreement es un contrato de transmisión de datos negociado entre el maestro y el esclavo, que define todos los parámetros de la transferencia de datos:

- **Tipo/rango de datos**: Qué datos transmitir
- **Modo de transferencia**: Una vez (`one_time`), periódico (`periodic`), o streaming (`streaming`)
- **Frecuencia de transferencia**: La frecuencia con la que se envían los datos
- **Período de validez**: La duración durante la cual el acuerdo es válido
- **Prioridad**: Baja (`low`), normal (`normal`), alta (`high`), o crítica (`critical`)

Toda transmisión de datos debe basarse en un acuerdo negociado mutuamente — no existe la "transmisión desnuda."

## 2.4 Data Fragment

Un Fragment es la unidad de datos en DTP, con las siguientes características:

- **Identificador globalmente único** (Fragment_ID)
- **Marca de tiempo de origen** (Origin_Timestamp): El momento en que los datos fueron realmente producidos, no el tiempo de transmisión
- **Dependencias DAG**: Relaciones con otros Fragments
- **Afiliación al acuerdo**: Indica el acuerdo asociado mediante Agreement_ID
- **Metadatos de contexto**: Información contextual estructurada

## 2.5 Dependencias de Grafo Acíclico Dirigido (DAG)

Los Fragments expresan relaciones de dependencia a través de aristas DAG, soportando tres tipos de relación:

| Tipo de Relación | Significado | Ejemplo |
|------------------|-------------|---------|
| `derived_from` | Derivado de | Un Fragment de "resumen diario de pasos" se deriva de los Fragments individuales de registro de pasos a lo largo del día |
| `annotates` | Anota | Un Fragment de datos meteorológicos anota un Fragment de pedido de delivery, explicando por qué el usuario pidió una bebida helada durante altas temperaturas |
| `supersedes` | Reemplaza | Después de que un usuario actualiza su dirección de entrega, el nuevo Fragment de dirección reemplaza al Fragment de dirección anterior |

La estructura DAG asegura que las relaciones se establezcan en el momento de la recolección de datos, ayudando a iFay a comprender el linaje evolutivo y las relaciones causales de los datos.

## 2.6 Glosario

| Término | Definición |
|---------|------------|
| iFay | Individual Fay — un avatar personal de IA (gemelo digital) vinculado a una persona natural específica (Human Prime) |
| coFay | Common Fay — una IA de rol público (similar a un Agent) |
| Fay | Término general para agentes de IA antropomórficos |
| FayGer | El contenedor/entorno de ejecución para Fay (similar a Docker/JRE); considerado un "espacio público" y no debe acceder a datos en texto plano |
| Human Prime | La persona natural a la que un iFay está vinculado |
| Faying | El estado en el que un iFay está conectado/emparejado con su Human Prime |
| Personal Data Heap | Módulo privado de gestión de datos de iFay, que almacena datos en múltiples formatos (el "diario" del Human Prime) |
| Sensor | El "sistema nervioso" de iFay construido sobre CAP + DTP, recibiendo flujos de datos |
| Device Driver Hub | La capa de hub de controladores que integra controladores de dispositivos |
| DTP_Engine | El motor de procesamiento central del protocolo DTP, responsable de la codificación, decodificación, cifrado, descifrado y gestión de transmisión de marcos |
