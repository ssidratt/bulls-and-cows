
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
});
