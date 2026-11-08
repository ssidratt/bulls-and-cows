
import { describe, expect, it } from 'vitest';
import { countPossibleSecrets } from './countPossibleSecrets.js';

describe('countPossibleSecrets', () => {
    it('считает варианты для двоичной системы', () => {
        expect(countPossibleSecrets(2, 2)).toBe(2);
    });

    it('считает варианты для четырёх десятичных цифр', () => {
        expect(countPossibleSecrets(4, 10)).toBe(5040);
    });

    it('считает варианты для шести шестнадцатеричных цифр', () => {
        expect(countPossibleSecrets(6, 16)).toBe(5765760);
    });

    it('учитывает ноль в начале', () => {
        expect(countPossibleSecrets(2, 10)).toBe(90);
    });

    it('возвращает единицу для нулевой длины', () => {
        expect(countPossibleSecrets(0, 10)).toBe(1);
    });

    it('отклоняет длину больше количества цифр', () => {
        expect(countPossibleSecrets(3, 2)).toBe(0);
    });
});
