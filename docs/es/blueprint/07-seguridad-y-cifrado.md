# Capítulo 7: Seguridad y Cifrado

## 7.1 Diseño de Cifrado de Extremo a Extremo

DTP implementa cifrado de extremo a extremo, asegurando que los datos no puedan ser robados ni alterados durante la transmisión, incluso cuando pasan a través de entornos intermedios no confiables (como el entorno de ejecución FayGer).

Garantía central: **Solo la instancia iFay objetivo puede descifrar los datos del payload recibido; el entorno de ejecución FayGer no puede acceder al texto plano.**

Incluso cuando iFay se ejecuta en una instancia FayGer en la nube pública, el proveedor de servicios en la nube no puede leer los datos de salud del usuario, información de ubicación ni registros de consumo.

## 7.2 Alcance del Cifrado

```
┌─────────────────────────────────────┐
│           Logical_Frame              │
├─────────────────────────────────────┤
│  Header — Transmitido en texto plano │
│  ┌─────────────────────────────────┐│
│  │ ...                             ││
│  │ encryptionMetadata — Texto plano││
│  │   algorithm: "AES-256-GCM"     ││
│  │   keyVersion: 3                ││
│  └─────────────────────────────────┘│
├─────────────────────────────────────┤
│  Payload — Transmitido cifrado       │
│  ┌─────────────────────────────────┐│
│  │ ████████████████████████████    ││
│  │ ████████ Encrypted Data ██████  ││
│  │ ████████████████████████████    ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

- **Header**: Transmitido en texto plano; contiene meta-información necesaria para el enrutamiento y procesamiento
- **Metadatos de cifrado**: Transmitidos en texto plano; contienen el identificador del algoritmo de cifrado y el número de versión de la clave para que el receptor pueda determinar el método de descifrado
- **Payload**: Transmitido cifrado; contiene el contenido de datos real

## 7.3 Gestión de Claves

DTP no gestiona claves por sí mismo; en su lugar, depende de claves pre-negociadas por CAP (Control Authorization Protocol):

1. CAP completa la verificación de identidad y el intercambio de claves durante la fase de establecimiento de conexión
2. DTP utiliza las claves proporcionadas por CAP para el cifrado/descifrado del Payload
3. El número de versión de la clave (keyVersion) identifica la clave actualmente en uso

### Prerrequisito de CAP

Antes de comenzar la transmisión de datos, DTP **debe** verificar que CAP ha completado el proceso de verificación de identidad e intercambio de claves. Si el intercambio de claves de CAP aún no se ha completado, DTP_Engine rechaza enviar datos y devuelve un error "clave no lista" (KEY_NOT_READY).

## 7.4 Metadatos de Cifrado

El header de cada Logical_Frame lleva metadatos de cifrado:

| Campo | Descripción |
|-------|-------------|
| algorithm | Identificador del algoritmo de cifrado, ej., "AES-256-GCM" |
| keyVersion | Número de versión de la clave, identificando qué versión de la clave se utiliza |

Los metadatos de cifrado en sí no están cifrados, asegurando que el receptor pueda determinar los parámetros de descifrado antes del descifrado.

## 7.5 Consistencia de Ida y Vuelta del Cifrado

DTP garantiza la consistencia de ida y vuelta del cifrado:

- Cifrar y luego descifrar con la **clave correcta** debe producir un Payload equivalente a los datos originales
- Descifrar con una **clave incorrecta** debe fallar y devolver un error DECRYPTION_FAILED

## 7.6 Descifrado en el Lado del Terminal

Cuando el terminal es el receptor (escenario de inyección de datos), DTP_Engine utiliza la clave enviada por el terminal durante la fase de establecimiento de conexión CAP para el descifrado.

## 7.7 Protección contra Amenazas de Seguridad

| Amenaza | Medida de Protección DTP |
|---------|--------------------------|
| Espionaje de intermediario | Cifrado de extremo a extremo del Payload; los nodos intermedios no pueden leer el texto plano |
| Espionaje de FayGer | FayGer solo puede ver el Payload cifrado y no puede descifrarlo |
| Compromiso de clave | El mecanismo de número de versión de clave soporta la rotación de claves |
| Suplantación de identidad | Depende del mecanismo de verificación de identidad de CAP |
| Ataques de repetición | Números de secuencia monótonamente crecientes + vinculación de sesión |
