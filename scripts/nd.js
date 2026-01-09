const { spawnSync } = require('child_process');

const args = process.argv.slice(2);
const fixIndex = args.indexOf('--fix');
const isFix = fixIndex !== -1;

// We remove the flag to prevent it from being interpreted as a command or service.
if (isFix) {
  args.splice(fixIndex, 1);
}

const command = args[0];
const service = args[1];

const SERVICES = ['api', 'web', 'realtime'];

const COMMANDS = {
  test: {
    // We keep dependencies active to ensure stability, as tests might require the database.
    api: 'docker compose run --rm nextdesk-api ./mvnw test --no-transfer-progress', 
    web: 'docker compose run --rm nextdesk-web npm test',
    realtime: 'docker compose run --rm nextdesk-realtime npm test',
  },
  lint: {
    api: isFix 
      ? 'docker compose run --rm --no-deps nextdesk-api ./mvnw spotless:apply --no-transfer-progress'
      : 'docker compose run --rm --no-deps nextdesk-api ./mvnw spotless:check --no-transfer-progress',
    web: isFix
      ? 'docker compose run --rm --no-deps nextdesk-web sh -c "npm run lint -- --fix && npm run format:fix"'
      : 'docker compose run --rm --no-deps nextdesk-web sh -c "npm run lint && npm run format"',
    realtime: isFix
      ? 'docker compose run --rm --no-deps nextdesk-realtime sh -c "npm run lint:fix && npm run format:fix"'
      : 'docker compose run --rm --no-deps nextdesk-realtime sh -c "npm run lint && npm run format"',
  },
  format: {
    api: 'docker compose run --rm --no-deps nextdesk-api ./mvnw spotless:apply --no-transfer-progress',
    web: 'docker compose run --rm --no-deps nextdesk-web npm run format:fix',
    realtime: 'docker compose run --rm --no-deps nextdesk-realtime npm run format:fix',
  },
  build: {
    api: 'docker compose run --rm --no-deps nextdesk-api ./mvnw package -DskipTests --no-transfer-progress',
    web: 'docker compose run --rm nextdesk-web npm run build -- --webpack',
    realtime: 'docker compose run --rm nextdesk-realtime npm run build',
  },
  'build-image': {
    api: 'docker compose build nextdesk-api',
    web: 'docker compose build nextdesk-web',
    realtime: 'docker compose build nextdesk-realtime',
  },
  restart: (svc) => `docker compose restart ${svc || ''}`,
  logs: (svc) => `docker compose logs -f ${svc || ''}`,
  shell: {
    api: 'docker compose exec nextdesk-api /bin/bash',
    web: 'docker compose exec nextdesk-web /bin/sh',
    realtime: 'docker compose exec nextdesk-realtime /bin/sh',
    postgres: 'docker compose exec postgres /bin/bash',
  },
  db: 'docker compose exec postgres psql -U nextdesk -d nextdesk',
  up: 'docker compose up -d',
  down: 'docker compose down',
};

function runCommand(cmd, exitOnError = true) {
  if (!cmd) return 0;
  console.log(`\x1b[34m> ${cmd}\x1b[0m`);
  // We use shell: true to support command chaining with &&.
  const result = spawnSync(cmd, { stdio: 'inherit', shell: true });
  if (exitOnError && result.status !== 0) {
    process.exit(result.status);
  }
  return result.status;
}

if (!command) {
  console.log('Usage: ./nd <command> [service] [--fix]');
  console.log('Commands: test, lint, format, build, build-image, restart, logs, shell, db, up, down');
  process.exit(1);
}


if (['up', 'down', 'db'].includes(command)) {
  runCommand(COMMANDS[command]);
  process.exit(0);
}

if (['restart', 'logs'].includes(command)) {
  runCommand(COMMANDS[command](service));
  process.exit(0);
}


const selectedCommand = COMMANDS[command];
if (!selectedCommand) {
  console.error(`Unknown command: ${command}`);
  process.exit(1);
}

if (service) {
  if (selectedCommand[service]) {
    runCommand(selectedCommand[service]);
  } else if (typeof selectedCommand === 'function') {
      runCommand(selectedCommand(service));
  } else {
    console.error(`Service '${service}' not supported for command '${command}'`);
  }
} else {
  
  console.log(`Running '${command}'${isFix ? ' (with fix)' : ''} for all services...`);
  let exitCode = 0;
  SERVICES.forEach(s => {
    if (selectedCommand[s]) {
      console.log(`\n--- ${s.toUpperCase()} ---`);
      const status = runCommand(selectedCommand[s], false);
      if (status !== 0) exitCode = 1;
    }
  });
  process.exit(exitCode);
}
