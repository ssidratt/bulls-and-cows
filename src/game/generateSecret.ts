
export function generateSecret(
    length: number,
    base: number
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

    const availableDigits = [
        ...'0123456789ABCDEF'.slice(0, base),
    ];

    const selectedDigits: string[] = [];

    while (selectedDigits.length < length) {
        const randomIndex = Math.floor(
            Math.random() * availableDigits.length
        );

        const [digit] = availableDigits.splice(randomIndex, 1);

        if (digit !== undefined) {
            selectedDigits.push(digit);
        }
    }

    return selectedDigits.join('');
}

