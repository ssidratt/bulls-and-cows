
export function countPossibleSecrets(
    length: number,
    base: number
): number {
    if (
        !Number.isInteger(length) ||
        !Number.isInteger(base) ||
        length < 0 ||
        base < 0 ||
        length > base
    ) {
        return 0;
    }

    if (length === 0) {
        return 1;
    }

    return (
        base *
        countPossibleSecrets(length - 1, base - 1)
    );
}
