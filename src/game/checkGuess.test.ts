
import { describe, expect, it } from 'vitest';
import { checkGuess } from './checkGuess';

describe('checkGuess', () => {
    it('определяет 4 быка при полном совпадении', () => {
        const result = checkGuess('1234', '1234');

        expect(result).toEqual({
            bulls: 4,
            cows: 0,
        });
    });
});
