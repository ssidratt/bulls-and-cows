import { describe, expect, it } from 'vitest';
import { isValidGuess } from './isValidGuess.js';

describe('isValidGuess', () => {
    it('принимает корректное число', () => {
        expect(isValidGuess('1234', 4, 10)).toBe(true);
    });

    it('отклоняет повторяющиеся цифры', () => {
        expect(isValidGuess('1123', 4, 10)).toBe(false);
    });

    it('отклоняет слишком короткое число', () => {
        expect(isValidGuess('123', 4, 10)).toBe(false);
    });

    it('отклоняет слишком длинное число', () => {
        expect(isValidGuess('12345', 4, 10)).toBe(false);
    });

    it('отклоняет буквы в десятичной системе', () => {
        expect(isValidGuess('12A4', 4, 10)).toBe(false);
    });

    it('принимает буквы в шестнадцатеричной системе', () => {
        expect(isValidGuess('A1bF', 4, 16)).toBe(true);
    });

    it('отклоняет повторения независимо от регистра', () => {
        expect(isValidGuess('aA12', 4, 16)).toBe(false);
    });

    it('отклоняет цифры вне двоичной системы', () => {
        expect(isValidGuess('102', 3, 2)).toBe(false);
    });

    it('принимает корректное восьмеричное число', () => {
        expect(isValidGuess('1270', 4, 8)).toBe(true);
    });

    it('отклоняет пробелы', () => {
        expect(isValidGuess('12 4', 4, 10)).toBe(false);
    });
});
