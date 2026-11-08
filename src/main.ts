import { generateSecret } from './game/generateSecret.js';
import { evaluateGuess } from './game/evaluateGuess.js';
import { isValidGuess } from './game/isValidGuess.js';
import { createDigitValidator } from './game/createDigitValidator.js';
import { countPossibleSecrets } from './game/countPossibleSecrets.js';
import './style.css';

type Attempt = {
    guess: string;
    bulls: number;
    cows: number;
};

type RecordEntry = {
    length: number;
    base: number;
    attempts: number;
    seconds: number;
};

const bases = [2, 8, 10, 16];
const labels = new Map([
    [2, 'Двоичная'],
    [8, 'Восьмеричная'],
    [10, 'Десятичная'],
    [16, 'Шестнадцатеричная'],
]);

const storageKey = 'bulls-and-cows-records';

let length = 4;
let base = 10;
let secret = '';
let startedAt = 0;
let history: Attempt[] = [];
let status: 'settings' | 'playing' | 'won' = 'settings';

function element<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    text?: string,
): HTMLElementTagNameMap[K] {
    const node = document.createElement(tag);

    if (text !== undefined) {
        node.textContent = text;
    }

    return node;
}

function button(text: string, action: () => void): HTMLButtonElement {
    const node = element('button', text);
    node.type = 'button';
    node.addEventListener('click', action);
    return node;
}

function readRecords(): RecordEntry[] {
    try {
        const saved = localStorage.getItem(storageKey);
        if (!saved) return [];

        const parsed: unknown = JSON.parse(saved);
        if (!Array.isArray(parsed)) return [];

        return parsed.filter((entry): entry is RecordEntry => {
            if (typeof entry !== 'object' || entry === null) return false;

            const value = entry as Partial<RecordEntry>;

            return (
                typeof value.length === 'number' &&
                typeof value.base === 'number' &&
                typeof value.attempts === 'number' &&
                typeof value.seconds === 'number'
            );
        });
    } catch {
        return [];
    }
}

function saveRecord(entry: RecordEntry): void {
    const records = [...readRecords(), entry]
        .sort((a, b) => a.attempts - b.attempts || a.seconds - b.seconds)
        .slice(0, 10);

    try {
        localStorage.setItem(storageKey, JSON.stringify(records));
    } catch {
        // Игра остаётся доступной, даже если хранилище заблокировано.
    }
}

function renderRecords(container: HTMLElement): void {
    container.append(element('h2', 'Таблица рекордов'));

    const records = readRecords();

    if (records.length === 0) {
        container.append(element('p', 'Пока нет результатов.'));
        return;
    }

    const list = element('ol');

    records.forEach((record) => {
        list.append(
            element(
                'li',
                `${labels.get(record.base) ?? record.base}, ` +
                    `${record.length} цифры: ` +
                    `${record.attempts} попыток, ${record.seconds} сек.`,
            ),
        );
    });

    container.append(list);
}

function render(): void {
    document.body.replaceChildren();

    const app = element('main');
    app.className = 'app';

    app.append(element('h1', 'Быки и коровы'));
    app.append(
        element(
            'p',
            'Угадай секретное число. Бык означает цифру на своём месте, ' +
                'корова означает правильную цифру на другой позиции.',
        ),
    );

    if (status === 'settings') {
        renderSettings(app);
    } else {
        renderGame(app);
    }

    const records = element('section');
    records.className = 'panel';
    renderRecords(records);
    app.append(records);

    document.body.append(app);
}

function renderSettings(app: HTMLElement): void {
    const panel = element('section');
    panel.className = 'panel';

    panel.append(element('h2', 'Настройки игры'));

    const baseLabel = element('label', 'Система счисления');
    const baseSelect = element('select');

    bases.forEach((value) => {
        const option = element('option', labels.get(value));
        option.value = String(value);
        option.selected = value === base;
        baseSelect.append(option);
    });

    const lengthLabel = element('label', 'Количество цифр');
    const lengthSelect = element('select');

    function updateLengths(): void {
        lengthSelect.replaceChildren();

        for (let value = 2; value <= 6; value += 1) {
            if (value > base) continue;

            const option = element('option', String(value));
            option.value = String(value);
            option.selected = value === length;
            lengthSelect.append(option);
        }

        if (length > base) {
            length = 2;
            lengthSelect.value = '2';
        }
    }

    baseSelect.addEventListener('change', () => {
        base = Number(baseSelect.value);
        updateLengths();
        combinations.textContent = `Возможных секретов: ${countPossibleSecrets(length, base)}`;
    });

    lengthSelect.addEventListener('change', () => {
        length = Number(lengthSelect.value);
        combinations.textContent = `Возможных секретов: ${countPossibleSecrets(length, base)}`;
    });

    updateLengths();

    const combinations = element(
        'p',
        `Возможных секретов: ${countPossibleSecrets(length, base)}`,
    );

    panel.append(
        baseLabel,
        baseSelect,
        lengthLabel,
        lengthSelect,
        combinations,
        button('Начать игру', () => {
            secret = generateSecret(length, base);
            history = [];
            startedAt = Date.now();
            status = 'playing';
            render();
        }),
    );

    app.append(panel);
}

function renderGame(app: HTMLElement): void {
    const panel = element('section');
    panel.className = 'panel';

    panel.append(
        element('h2', status === 'won' ? 'Победа!' : 'Игра началась'),
        element('p', `${labels.get(base)} система, ${length} цифры`),
    );

    if (status === 'playing') {
        const form = element('form');
        const input = element('input');
        const message = element('p');

        input.maxLength = length;
        input.autocomplete = 'off';
        input.spellcheck = false;
        input.placeholder = `Введите ${length} цифры`;
        input.setAttribute('aria-label', 'Ваше число');

        const validateDigit = createDigitValidator(base);

        input.addEventListener('input', () => {
            input.value = [...input.value]
                .filter(validateDigit)
                .join('')
                .slice(0, length)
                .toUpperCase();
        });

        form.addEventListener('submit', (event) => {
            event.preventDefault();

            const guess = input.value.toUpperCase();

            if (!isValidGuess(guess, length, base)) {
                message.textContent =
                    'Введите допустимые цифры без повторений.';
                return;
            }

            if (history.some((entry) => entry.guess === guess)) {
                message.textContent = 'Это число уже проверялось.';
                return;
            }

            const result = evaluateGuess(secret, guess);

            history = [...history, { guess, ...result }];

            if (result.bulls === length) {
                status = 'won';
                const seconds = Math.floor((Date.now() - startedAt) / 1000);

                saveRecord({
                    length,
                    base,
                    attempts: history.length,
                    seconds,
                });
            }

            render();
        });

        const submit = element('button', 'Проверить');
        submit.type = 'submit';

        form.append(input, submit);
        panel.append(form, message);
    } else {
        panel.append(
            element('p', `Секрет: ${secret}`),
            element('p', `Попыток: ${history.length}`),
        );
    }

    const list = element('ol');

    history.forEach((entry) => {
        list.append(
            element(
                'li',
                `${entry.guess}: ${entry.bulls} быков, ${entry.cows} коров`,
            ),
        );
    });

    panel.append(
        element('h3', 'История попыток'),
        list,
        button('Новая игра', () => {
            status = 'settings';
            history = [];
            render();
        }),
    );

    app.append(panel);
}

render();
