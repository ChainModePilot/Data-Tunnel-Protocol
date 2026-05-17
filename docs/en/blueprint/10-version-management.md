# Chapter 10: Version Management

## 10.1 Version Number Format

DTP uses semantic versioning with a major version number and a minor version number:

```
{ major: number, minor: number }
```

Every Logical_Frame's header includes a protocol version number field that identifies the protocol version used by that frame.

## 10.2 Version Compatibility Rules

DTP_Engine supports simultaneously processing Logical_Frame formats from both the **current version** and the **previous major version**.

| Received Frame Version | Handling |
|------------------------|----------|
| Current version | Normal processing |
| Previous major version | Compatible processing (backward compatible) |
| Higher version | Send version incompatibility notification |
| Lower version (beyond compatibility range) | Send version incompatibility notification |

## 10.3 Version Incompatibility Handling

When the receiver receives a Logical_Frame whose header protocol version number is higher than its supported version:

1. Do not process the frame
2. Send a version incompatibility notification (VERSION_INCOMPATIBLE, 7001) to the sender
3. Include the receiver's highest supported version number in the notification

Upon receiving a version incompatibility notification, the sender can:
- Downgrade to the receiver's supported version and resend
- Or notify the upper-layer application of the version mismatch

## 10.4 Protocol Evolution Strategy

DTP's version management ensures backward compatibility as the protocol evolves:

- **Minor version upgrade**: Adds new fields or features without breaking the parsing of existing frame formats
- **Major version upgrade**: May change the frame format, but maintains compatibility with the previous major version

This means terminal devices and Fay do not need to upgrade simultaneously — as long as the version difference is within one major version, both parties can communicate normally.
