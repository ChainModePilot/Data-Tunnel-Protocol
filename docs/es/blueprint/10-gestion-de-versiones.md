# Capítulo 10: Gestión de Versiones

## 10.1 Formato del Número de Versión

DTP utiliza versionado semántico con un número de versión mayor y un número de versión menor:

```
{ major: number, minor: number }
```

El header de cada Logical_Frame incluye un campo de número de versión del protocolo que identifica la versión del protocolo utilizada por ese marco.

## 10.2 Reglas de Compatibilidad de Versiones

DTP_Engine soporta el procesamiento simultáneo de formatos de Logical_Frame tanto de la **versión actual** como de la **versión mayor anterior**.

| Versión del Marco Recibido | Manejo |
|----------------------------|--------|
| Versión actual | Procesamiento normal |
| Versión mayor anterior | Procesamiento compatible (retrocompatible) |
| Versión superior | Enviar notificación de incompatibilidad de versión |
| Versión inferior (fuera del rango de compatibilidad) | Enviar notificación de incompatibilidad de versión |

## 10.3 Manejo de Incompatibilidad de Versiones

Cuando el receptor recibe un Logical_Frame cuyo número de versión del protocolo en el header es superior a su versión soportada:

1. No procesar el marco
2. Enviar una notificación de incompatibilidad de versión (VERSION_INCOMPATIBLE, 7001) al emisor
3. Incluir el número de versión más alto soportado por el receptor en la notificación

Al recibir una notificación de incompatibilidad de versión, el emisor puede:
- Degradar a la versión soportada por el receptor y reenviar
- O notificar a la aplicación de capa superior sobre la discrepancia de versiones

## 10.4 Estrategia de Evolución del Protocolo

La gestión de versiones de DTP asegura la retrocompatibilidad a medida que el protocolo evoluciona:

- **Actualización de versión menor**: Agrega nuevos campos o funcionalidades sin romper el parseo de los formatos de marco existentes
- **Actualización de versión mayor**: Puede cambiar el formato del marco, pero mantiene compatibilidad con la versión mayor anterior

Esto significa que los dispositivos terminales y Fay no necesitan actualizarse simultáneamente — siempre que la diferencia de versión esté dentro de una versión mayor, ambas partes pueden comunicarse normalmente.
