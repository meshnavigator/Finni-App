import { readFile } from 'node:fs/promises';

const fixtures = JSON.parse(
  await readFile(new URL('../fixtures/launch-scenarios.json', import.meta.url), 'utf8'),
);

const api26Scenario = fixtures.find((fixture) => fixture.id === 'android-api-26-release');
if (!api26Scenario?.required || !api26Scenario.description.includes('без Metro')) {
  throw new Error('Не зафиксирован обязательный сценарий запуска API 26 без Metro.');
}

console.log('Fixtures bootstrap валидны.');
