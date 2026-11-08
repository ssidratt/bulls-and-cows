
export function evaluateGuess(
    secret: string,
    guess: string
): { bulls: number; cows: number } {
    const secretDigits = [...secret];
    const guessDigits = [...guess];

    const bulls = guessDigits.filter(
        (digit, index) => digit === secretDigits[index]
    ).length;

    const cows = guessDigits.filter(
        (digit, index) =>
            digit !== secretDigits[index] &&
            secretDigits.includes(digit)
    ).length;

    return { bulls, cows };
}

