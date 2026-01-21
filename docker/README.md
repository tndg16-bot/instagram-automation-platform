# Docker Development Environment

Development environment setup for Instagram Automation Platform using Docker Compose.

## Services

- **PostgreSQL 15** - Primary database
- **Redis 7** - Cache layer
- **Backend API** - Node.js/Express application

## Quick Start

```bash
cd docker
cp .env.example .env
./start.sh
```

## Manual Start

```bash
cd docker
docker-compose up -d
```

## Stop Services

```bash
docker-compose down
```

## Stop and Remove Volumes

```bash
docker-compose down -v
```

## View Logs

```bash
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f postgres
```

## Restart Services

```bash
docker-compose restart
```

## Configuration

### Environment Variables (.env)

| Variable | Description | Default |
|----------|-------------|----------|
| DATABASE_URL | PostgreSQL connection string | postgresql://... |
| REDIS_URL | Redis connection string | redis://localhost:6379 |
| NODE_ENV | Environment | development |
| PORT | Backend port | 8000 |
| JWT_SECRET | JWT signing secret | dev_jwt_secret_change_in_production |

### Volumes

- `postgres-data` - PostgreSQL data persistence
- `redis-data` - Redis data persistence

## Health Checks

Services include health checks and will automatically restart on failure.

- PostgreSQL: `pg_isready`
- Redis: `redis-cli ping`
- Backend: HTTP health endpoint

## Troubleshooting

### Database connection issues
```bash
docker-compose logs postgres
docker-compose exec postgres psql -U instaflow -d instaflow_dev
```

### Redis connection issues
```bash
docker-compose logs redis
docker-compose exec redis redis-cli ping
```

### Backend issues
```bash
docker-compose logs backend
docker-compose exec backend npm install
```

### Clean start
```bash
docker-compose down -v
rm -rf node_modules
docker-compose up -d
```

## Network

Services communicate on `instaflow-dev-network` Docker network.

## Development Workflow

1. Make code changes
2. Backend hot-reloads automatically
3. No need to restart containers for code changes
4. Restart containers only for configuration changes

## Production Deployment

For production, use Kubernetes manifests in `infrastructure/k8s/`.
