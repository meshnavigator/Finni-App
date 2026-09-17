export const PET_SHAPES = Object.freeze([
  Object.freeze({ id: 'round', label: 'Круглые ушки' }),
  Object.freeze({ id: 'pointy', label: 'Острые ушки' }),
  Object.freeze({ id: 'floppy', label: 'Мягкие ушки' }),
] as const);

export const PET_PATTERNS = Object.freeze([
  Object.freeze({ id: 'plain', label: 'Без узора' }),
  Object.freeze({ id: 'spots', label: 'Пятнышки' }),
  Object.freeze({ id: 'stripes', label: 'Полоски' }),
] as const);

export type PetShapeId = (typeof PET_SHAPES)[number]['id'];
export type PetPatternId = (typeof PET_PATTERNS)[number]['id'];

export type PetAppearance = Readonly<{
  name: string;
  shapeId: PetShapeId;
  patternId: PetPatternId;
}>;

export const PET_COMBINATIONS = Object.freeze(
  PET_SHAPES.flatMap((shape) =>
    PET_PATTERNS.map((pattern) =>
      Object.freeze({ shapeId: shape.id, patternId: pattern.id }),
    ),
  ),
);

const ALLOWED_NAME = /^[A-Za-zА-Яа-яЁё0-9 -]+$/u;
const INVISIBLE_DIRECTIONAL = /[\u200B-\u200F\u202A-\u202E\u2060-\u206F]/u;

export function normalizePetName(value: string): string {
  return value.normalize('NFC').trim().replace(/\s+/gu, ' ');
}

export function petNameError(value: string): string | null {
  const normalized = normalizePetName(value);
  const length = [...normalized].length;
  if (length < 2 || length > 16) return 'Имя должно содержать от 2 до 16 символов';
  if (INVISIBLE_DIRECTIONAL.test(normalized) || !ALLOWED_NAME.test(normalized)) {
    return 'Используй буквы, цифры, пробел или дефис';
  }
  return null;
}

export function petAppearance(input: Readonly<{
  name: string;
  shapeId: string;
  patternId: string;
}>): PetAppearance {
  const name = normalizePetName(input.name);
  const error = petNameError(name);
  if (error) throw new TypeError(error);
  if (!PET_SHAPES.some((shape) => shape.id === input.shapeId)) {
    throw new TypeError('Неизвестная форма питомца');
  }
  if (!PET_PATTERNS.some((pattern) => pattern.id === input.patternId)) {
    throw new TypeError('Неизвестный узор питомца');
  }
  return Object.freeze({
    name,
    shapeId: input.shapeId as PetShapeId,
    patternId: input.patternId as PetPatternId,
  });
}
