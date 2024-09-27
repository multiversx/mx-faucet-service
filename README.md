Faucet microservice for MultiversX

## Quick start

1. Run `npm install` in the project directory
2. Optionally make edits to `config/config.yaml` and/or `.env` files

## Dependencies

1. Redis Server is required to be installed [docs](https://redis.io/)

You can run `docker-compose up` (or `docker-compose up -d` as detached) in a separate terminal to use a local Docker container for all these dependencies.

After running the sample, you can stop the Docker container with `docker-compose down`

## Available Features / Modules

### `Public API`

Endpoints that can be used by anyone (public endpoints).

### `Grafana dashboard`

You can find a predefined Grafana dashboard with basic metrics at [http://localhost:3010](http://localhost:3010)

Use `admin` for user and password fields. Then navigate to `Dashboards` -> `Template Service`

## Available Scripts

This is a MultiversX project built on Nest.js framework.

### Environment variables

In order to simplify the scripts, the templates will use the following environment variables:

- `NODE_ENV`

**Description**: Defines the environment in which the application runs. This influences various configuration settings.

**Possible Values**: `mainnet`, `testnet`, `devnet`, `infra`

**Usage**: Determines the environment-specific configurations and behaviors of the application.

- `NODE_APP`

**Description**: Specifies which part of the application to start.

**Possible Values**: `faucet`

**Usage**: Selects the specific application module to run.

- `NODE_DEBUG`

**Description**: Enables or disables development debug mode.

**Possible Values**: `true`, `false`

**Usage**: When set to true, the application starts in debug mode, useful for development.

- `NODE_WATCH`

**Description**: Enables or disables development watch mode.

**Possible Values**: `true`, `false`

**Usage**: When set to true, the application starts in watch mode, which automatically reloads the app on code changes.


### `npm run start`

Runs the app in the production mode.
Make requests to [http://localhost:3001](http://localhost:3001).

Redis Server is required to be installed.

## Running the faucet

```bash
# development watch mode on devnet
$ NODE_ENV=devnet NODE_APP=faucet NODE_WATCH=true npm run start
or
$ NODE_ENV=devnet NODE_WATCH=true npm run start:faucet

# development debug mode on devnet
$ NODE_ENV=devnet NODE_APP=faucet NODE_DEBUG=true npm run start
or
$ NODE_ENV=devnet NODE_DEBUG=true npm run start:faucet

# development mode
$ NODE_ENV=devnet NODE_APP=faucet npm run start
or
$ NODE_ENV=devnet npm run start:faucet

# production mode
$ NODE_ENV=mainnet NODE_APP=faucet npm run start
or
$ NODE_ENV=mainnet npm run start:faucet
```

### `npm run test`

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
