
import { createDigitValidator } from './createDigitValidator.js';

export function isValidGuess(
    guess: string,
    length: number,
    base: number
): boolean {
    const allowedBases = [2, 8, 10, 16];

    if (!allowedBases.includes(base)) {
        return false;
    }

    if (
        !Number.isInteger(length) ||
        length < 2 ||
        length > 6 ||
        guess.length !== length
    ) {
        return false;
    }

    const digits = [...guess.toUpperCase()];
    const validateDigit = createDigitValidator(base);

    const hasValidDigits = digits.every(validateDigit);
    const hasUniqueDigits =
        new Set(digits).size === digits.length;

    return hasValidDigits && hasUniqueDigits;
}
