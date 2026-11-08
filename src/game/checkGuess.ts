export function checkGuess(
    secret: string,
    guess: string,
): { bulls: number; cows: number } {
    let bulls = 0;
    let cows = 0;

    for (let i = 0; i < secret.length; i++) {
        const digit = guess[i];

        if (digit === undefined) {
            continue;
        }

        if (secret[i] === digit) {
            bulls++;
        } else if (secret.includes(digit)) {
            cows++;
        }
    }

    return { bulls, cows };
}
