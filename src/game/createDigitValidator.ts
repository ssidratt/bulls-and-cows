
export function createDigitValidator(
    base: number
): (digit: string) => boolean {
    const allowedBases = [2, 8, 10, 16];

    if (!allowedBases.includes(base)) {
        return () => false;
    }

    const allowedDigits = '0123456789ABCDEF'.slice(0, base);

    return (digit: string): boolean => {
        return (
            digit.length === 1 &&
            allowedDigits.includes(digit.toUpperCase())
        );
    };
}
