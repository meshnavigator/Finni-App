import assert from 'node:assert/strict';
import test from 'node:test';
import { homeReactionMessage } from '../src/ui/home-reaction-copy.ts';
import { petCatalogText, petNarrativeText } from '../src/ui/pet-copy.ts';

const reaction = (clip, value = 0, objectId = null) => ({
  id: 1, clip, value, objectId, expression: 'happy', skippable: false,
});

test('catalog copy names the saved pet without changing canonical catalog records', () => {
  assert.equal(petCatalogText('Финни сыт', 'Бусинка'), 'Питомец «Бусинка» сыт');
  assert.equal(petCatalogText('Уход за Финни', 'Бусинка'), 'Уход за питомцем «Бусинка»');
  assert.equal(petCatalogText('Домик для Финни', 'Бусинка'), 'Домик для питомца «Бусинка»');
});

test('saved day summaries show the current pet name', () => {
  assert.equal(
    petNarrativeText('Ты позаботился о Финни и сделал новый шаг к мечте.', 'Бусинка'),
    'Ты позаботился о питомце «Бусинка» и сделал новый шаг к мечте.',
  );
  assert.equal(petNarrativeText('Финни в безопасности.', 'Бусинка'), 'Питомец «Бусинка» в безопасности.');
});

test('reaction explains actual action and uses saved pet name', () => {
  const deposit = homeReactionMessage(reaction('AN-012', 15), 'Бусинка');
  assert.equal(deposit.title, 'Бусинка копит на мечту!');
  assert.equal(deposit.detail, 'В копилке +15 монет');

  const withdrawal = homeReactionMessage(reaction('AN-012', -10), 'Бусинка');
  assert.equal(withdrawal.detail, 'В кошельке +10 монет');

  const care = homeReactionMessage(reaction('AN-010', 0, 'IT-03'), 'Бусинка');
  assert.equal(care.title, 'Бусинка радуется уходу!');
  assert.equal(care.detail, 'Выбрано: Щётка для шерсти');

  const goal = homeReactionMessage(reaction('AN-013', 0, 'GL-03'), 'Бусинка');
  assert.equal(goal.detail, 'Домик для питомца «Бусинка»');
});
