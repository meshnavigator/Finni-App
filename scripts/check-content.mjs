import { readFile } from 'node:fs/promises';

const content = JSON.parse(
  await readFile(new URL('../content/bootstrap-content.json', import.meta.url), 'utf8'),
);

if (content.productName !== 'Питомец Финни') {
  throw new Error('content.productName должен совпадать с именем продукта.');
}

if (content.audienceAge?.minimum !== 7 || content.audienceAge?.maximum !== 11) {
  throw new Error('Контент bootstrap должен описывать аудиторию 7–11 лет.');
}

if (typeof content.intro !== 'string' || content.intro.trim().length === 0) {
  throw new Error('В bootstrap-контенте отсутствует непустой вводный текст.');
}

console.log('Контент bootstrap валиден.');
