
import { describe, expect, it } from 'vitest';
import { evaluateGuess } from './evaluateGuess.js';

describe('evaluateGuess', () => {
    it('определяет 4 быка при полном совпадении', () => {
        const result = evaluateGuess('1234', '1234');

        expect(result).toEqual({
            bulls: 4,
            cows: 0,
        });
    });

    it('определяет 4 коровы при несовпадении позиций', () => {
        const result = evaluateGuess('1234', '4321');

        expect(result).toEqual({
            bulls: 0,
            cows: 4,
        });
    });
});
