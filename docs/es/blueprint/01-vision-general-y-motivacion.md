# Capítulo 1: Visión General y Motivación

## 1.1 Qué es el Data Tunnel Protocol

El Data Tunnel Protocol (DTP) es uno de los seis protocolos centrales del ecosistema iFay. Es un **protocolo de canal de transmisión de datos basado en negociación**, responsable de la recolección e inyección bidireccional de datos entre dispositivos terminales y Fay.

Como protocolo de capa de aplicación, DTP se construye sobre protocolos de transporte existentes (BLE, RTSP, WebSocket, TCP, etc.). Es agnóstico al mecanismo de transporte subyacente y solo define "qué transmitir, cómo organizarlo, cómo negociar y cómo garantizar la entrega."

## 1.2 Motivación del Protocolo: Soberanía de Datos

En el modelo tradicional, las aplicaciones recopilan de forma independiente datos de comportamiento del usuario para funciones como recomendaciones, y los datos son propiedad de la plataforma. Los usuarios no tienen control sobre sus propios datos y no pueden decidir qué datos pueden ser utilizados por quién.

La propuesta de valor central de DTP es la **soberanía de datos**: en la era de la IA, los datos personales deben pertenecer al individuo (gestionados por iFay dentro del Personal Data Heap), en lugar de estar dispersos entre diversos proveedores de aplicaciones.

Flujo de datos bajo el modelo DTP:

1. Todos los datos del terminal se recopilan a través de DTP en el Personal Data Heap de iFay
2. Cuando una aplicación terminal necesita datos personalizados, envía una solicitud a iFay
3. iFay juzga —como lo haría un humano— qué información está dispuesto a proporcionar y en qué medida, devolviendo un conjunto de datos filtrado y minimizado
4. La soberanía de los datos siempre permanece con el usuario (Human Prime)

## 1.3 Dos Flujos de Datos Centrales

DTP implementa dos flujos de datos centrales:

- **Recolección de Datos (Terminal → Fay)**: Almacena de forma persistente los datos producidos por el terminal en el Personal Data Heap de iFay, logrando la custodia de datos
- **Inyección de Datos (Fay → Terminal)**: iFay proporciona temporalmente un conjunto de datos minimizado, filtrado y evaluado, a la aplicación terminal, habilitando servicios personalizados sin comprometer la privacidad

## 1.4 Datos Contextualizados

Los datos pueden perder su significado cuando se separan de su contexto original. Por ejemplo:

- Un usuario pide una sopa fría de frijol mungo en una aplicación de delivery. Si la temperatura ambiente de 32°C se registra simultáneamente, indica que el usuario eligió una bebida fría debido al calor
- Si la temperatura es de 12°C, indica que el usuario tiene preferencia por las bebidas frías

DTP transporta metadatos contextuales a nivel de protocolo, asegurando que el contexto se capture en el momento de la recolección de datos y evitando la dificultad de reconstruirlo después del hecho. Cada Fragment de datos lleva metadatos de contexto estructurados, incluyendo tipo de datos, identificador de origen, entorno de recolección y otra información.

## 1.5 Coordinación con CAP

DTP trabaja en coordinación con el Control Authorization Protocol (CAP):

- **CAP** maneja la autorización de conexión, verificación de identidad e intercambio de claves
- **DTP** maneja la transmisión real del flujo de datos basada en negociación

Juntos, habilitan la capacidad de "toma de control directo del cliente" sin requerir interacción basada en UI. DTP comienza la transmisión de datos solo después de que CAP ha completado la verificación de identidad y el intercambio de claves, asegurando que ambas partes comunicantes tengan identidades confiables y claves utilizables.
