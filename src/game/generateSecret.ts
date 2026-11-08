export function generateSecret(
    length: number,
    base: number,
    random: () => number = Math.random,
): string {
    const allowedBases = [2, 8, 10, 16];

    if (!allowedBases.includes(base)) {
        throw new RangeError('Unsupported base');
    }

    if (
        !Number.isInteger(length) ||
        length < 2 ||
        length > 6 ||
        length > base
    ) {
        throw new RangeError('Invalid secret length');
    }

    const availableDigits = [...'0123456789ABCDEF'.slice(0, base)];

    const selectedDigits: string[] = [];

    while (selectedDigits.length < length) {
        const randomValue = random();

        if (
            !Number.isFinite(randomValue) ||
            randomValue < 0 ||
            randomValue >= 1
        ) {
            throw new RangeError('Invalid random value');
        }

        const randomIndex = Math.floor(randomValue * availableDigits.length);

        const [digit] = availableDigits.splice(randomIndex, 1);

        if (digit !== undefined) {
            selectedDigits.push(digit);
        }
    }

    return selectedDigits.join('');
}
