
import { describe, expect, it } from 'vitest';
import { evaluateGuess } from './evaluateGuess.js';

describe('evaluateGuess', () => {
    it('определяет 4 быка при полном совпадении', () => {
        expect(evaluateGuess('1234', '1234')).toEqual({
            bulls: 4,
            cows: 0,
        });
    });

    it('определяет 4 коровы при несовпадении позиций', () => {
        expect(evaluateGuess('1234', '4321')).toEqual({
            bulls: 0,
            cows: 4,
        });
    });

    it('определяет 2 быка и 2 коровы', () => {
        expect(evaluateGuess('1234', '1243')).toEqual({
            bulls: 2,
            cows: 2,
        });
    });

    it('определяет отсутствие совпадений', () => {
        expect(evaluateGuess('1234', '5678')).toEqual({
            bulls: 0,
            cows: 0,
        });
    });

    it('не учитывает регистр шестнадцатеричных цифр', () => {
        expect(evaluateGuess('a1b2', 'A1B2')).toEqual({
            bulls: 4,
            cows: 0,
        });
    });

    it('считает коров без учёта регистра', () => {
        expect(evaluateGuess('a1b2', '1A2B')).toEqual({
            bulls: 0,
            cows: 4,
        });
    });
});
