
export function checkGuess(
    secret: string,
    guess: string
): { bulls: number; cows: number } {
    let bulls = 0;
    let cows = 0;

    for (let i = 0; i < secret.length; i++) {
        if (secret[i] === guess[i]) {
            bulls++;
        }
    }

    return { bulls, cows };
}
