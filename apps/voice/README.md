# Voice Service

LiveKit SFU server for voice communication.

## Configuration

The LiveKit server is configured via `livekit.yaml`. For production, configure:
- TURN/STUN servers
- Redis for distributed signaling
- TLS certificates

## Development

The server runs in Docker via `infra/docker-compose.yml`. For local development:

```bash
livekit-server --config livekit.yaml
```
