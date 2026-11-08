
import { describe, expect, it } from 'vitest';
import { createDigitValidator } from './createDigitValidator.js';

describe('createDigitValidator', () => {
    it('принимает цифры двоичной системы', () => {
        const validate = createDigitValidator(2);

        expect(validate('0')).toBe(true);
        expect(validate('1')).toBe(true);
        expect(validate('2')).toBe(false);
    });

    it('проверяет восьмеричные цифры', () => {
        const validate = createDigitValidator(8);

        expect(validate('7')).toBe(true);
        expect(validate('8')).toBe(false);
    });

    it('проверяет десятичные цифры', () => {
        const validate = createDigitValidator(10);

        expect(validate('9')).toBe(true);
        expect(validate('A')).toBe(false);
    });

    it('принимает шестнадцатеричные буквы любого регистра', () => {
        const validate = createDigitValidator(16);

        expect(validate('a')).toBe(true);
        expect(validate('F')).toBe(true);
        expect(validate('G')).toBe(false);
    });

    it('отклоняет пустые строки и несколько символов', () => {
        const validate = createDigitValidator(16);

        expect(validate('')).toBe(false);
        expect(validate('12')).toBe(false);
        expect(validate(' ')).toBe(false);
    });

    it('отклоняет неподдерживаемую систему счисления', () => {
        const validate = createDigitValidator(3);

        expect(validate('1')).toBe(false);
    });
});

