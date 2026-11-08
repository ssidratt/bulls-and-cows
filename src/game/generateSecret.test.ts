
import { describe, expect, it } from 'vitest';
import { generateSecret } from './generateSecret.js';

describe('generateSecret', () => {
    it('генерирует число заданной длины', () => {
        expect(generateSecret(4, 10)).toHaveLength(4);
    });

    it('генерирует уникальные цифры', () => {
        const secret = generateSecret(6, 10);

        expect(new Set(secret).size).toBe(6);
    });

    it('использует только двоичные цифры', () => {
        const secret = generateSecret(2, 2);

        expect([...secret].every((digit) =>
            '01'.includes(digit)
        )).toBe(true);
    });

    it('поддерживает шестнадцатеричную систему', () => {
        const secret = generateSecret(6, 16);

        expect([...secret].every((digit) =>
            '0123456789ABCDEF'.includes(digit.toUpperCase())
        )).toBe(true);
    });

    it('генерирует корректное восьмеричное число', () => {
        const secret = generateSecret(4, 8);

        expect([...secret].every((digit) =>
            '01234567'.includes(digit)
        )).toBe(true);
    });

    it('использует переданный источник случайности', () => {
        expect(generateSecret(4, 10, () => 0)).toBe('0123');
    });

    it('сохраняет начальный ноль', () => {
        expect(generateSecret(2, 2, () => 0)).toBe('01');
    });

    it('отклоняет недопустимую длину', () => {
        expect(() => generateSecret(3, 2)).toThrow(RangeError);
    });
});
