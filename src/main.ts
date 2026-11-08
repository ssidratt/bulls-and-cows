import { generateSecret } from './game/generateSecret.js';
import { evaluateGuess } from './game/evaluateGuess.js';
import { isValidGuess } from './game/isValidGuess.js';
import { createDigitValidator } from './game/createDigitValidator.js';
import { countPossibleSecrets } from './game/countPossibleSecrets.js';
import './style.css';

type Attempt = { guess: string; bulls: number; cows: number };
type RecordEntry = {
    length: number;
    base: number;
    attempts: number;
    seconds: number;
};
type GameStatus = 'settings' | 'playing' | 'won';
type SoundName = 'click' | 'error' | 'guess' | 'win';

const bases = [2, 8, 10, 16];
const labels = new Map<number, string>([
    [2, 'Двоичная'],
    [8, 'Восьмеричная'],
    [10, 'Десятичная'],
    [16, 'Шестнадцатеричная'],
]);
const storageKey = 'bulls-and-cows-records';
const soundKey = 'bulls-and-cows-sound';

let length = 4;
let base = 10;
let secret = '';
let startedAt = 0;
let finishedSeconds = 0;
let history: Attempt[] = [];
let status: GameStatus = 'settings';
let soundEnabled = readSoundPreference();
let audioContext: AudioContext | null = null;
let timerId: number | undefined;

function element<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    text?: string,
    className?: string,
): HTMLElementTagNameMap[K] {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
}

function button(
    text: string,
    action: () => void,
    className = 'btn',
): HTMLButtonElement {
    const node = element('button', text, className);
    node.type = 'button';
    node.addEventListener('click', action);
    return node;
}

function readSoundPreference(): boolean {
    try {
        return localStorage.getItem(soundKey) !== 'off';
    } catch {
        return true;
    }
}

function playSound(name: SoundName): void {
    if (!soundEnabled) return;
    try {
        audioContext ??= new AudioContext();
        if (audioContext.state === 'suspended') void audioContext.resume();
        const notes: Record<SoundName, number[]> = {
            click: [520],
            error: [190, 145],
            guess: [430, 640],
            win: [523, 659, 784, 1047],
        };
        notes[name].forEach((frequency, index) => {
            if (!audioContext) return;
            const oscillator = audioContext.createOscillator();
            const gain = audioContext.createGain();
            const start = audioContext.currentTime + index * 0.095;
            const duration = name === 'win' ? 0.22 : 0.105;
            oscillator.type = name === 'error' ? 'triangle' : 'sine';
            oscillator.frequency.setValueAtTime(frequency, start);
            gain.gain.setValueAtTime(0.0001, start);
            gain.gain.exponentialRampToValueAtTime(0.075, start + 0.012);
            gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
            oscillator.connect(gain);
            gain.connect(audioContext.destination);
            oscillator.start(start);
            oscillator.stop(start + duration + 0.01);
        });
    } catch {
        // Звук необязателен: игра работает и без Web Audio API.
    }
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
        // Игра остаётся доступной, если хранилище заблокировано.
    }
}

function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
}

function createStat(label: string, value: string, id?: string): HTMLElement {
    const card = element('div', undefined, 'stat');
    const caption = element('span', label, 'stat-label');
    const number = element('strong', value, 'stat-value');
    if (id) number.id = id;
    card.append(caption, number);
    return card;
}

function renderRecords(container: HTMLElement): void {
    const heading = element('div', undefined, 'panel-heading');
    heading.append(
        element('span', '◈ ЗАЛ СЛАВЫ', 'eyebrow'),
        element('h2', 'Таблица рекордов'),
    );
    container.append(heading);

    const records = readRecords();
    if (records.length === 0) {
        container.append(
            element(
                'p',
                'Пока нет рекордов. Стань первым победителем!',
                'empty-state',
            ),
        );
        return;
    }

    const wrapper = element('div', undefined, 'table-scroll');
    const table = element('table', undefined, 'records-table');
    const thead = element('thead');
    const headerRow = element('tr');
    ['Место', 'Режим', 'Цифры', 'Попытки', 'Время'].forEach((text) => {
        headerRow.append(element('th', text));
    });
    thead.append(headerRow);
    const tbody = element('tbody');
    records.forEach((record, index) => {
        const row = element('tr');
        const place = element('td', String(index + 1).padStart(2, '0'));
        if (index < 3) place.className = 'top-rank';
        row.append(
            place,
            element('td', labels.get(record.base) ?? String(record.base)),
            element('td', String(record.length)),
            element('td', String(record.attempts)),
            element('td', formatTime(record.seconds)),
        );
        tbody.append(row);
    });
    table.append(thead, tbody);
    wrapper.append(table);
    container.append(wrapper);
}

function render(): void {
    if (timerId !== undefined) window.clearInterval(timerId);
    document.body.replaceChildren();

    const app = element('main', undefined, 'app');
    const topbar = element('header', undefined, 'topbar');
    const brand = element('div', undefined, 'brand');
    brand.append(
        element('span', '◈', 'brand-icon'),
        element('span', 'NEON // ARCADE'),
    );
    const soundButton = button(
        '',
        () => {
            soundEnabled = !soundEnabled;
            try {
                localStorage.setItem(soundKey, soundEnabled ? 'on' : 'off');
            } catch {
                // Сохранение настройки звука необязательно.
            }
            soundButton.textContent = soundEnabled
                ? '♫ ЗВУК ВКЛ'
                : '♪ ЗВУК ВЫКЛ';
            soundButton.setAttribute('aria-pressed', String(soundEnabled));
            if (soundEnabled) playSound('click');
        },
        'sound-toggle',
    );
    soundButton.textContent = soundEnabled ? '♫ ЗВУК ВКЛ' : '♪ ЗВУК ВЫКЛ';
    soundButton.setAttribute('aria-pressed', String(soundEnabled));
    soundButton.setAttribute(
        'aria-label',
        'Включить или выключить звуковые эффекты',
    );
    topbar.append(brand, soundButton);

    const hero = element('section', undefined, 'hero');
    hero.append(
        element('p', 'ЛОГИЧЕСКАЯ ИГРА // ДОСТУП К КОДУ', 'eyebrow'),
        element('h1', 'БЫКИ И КОРОВЫ'),
        element(
            'p',
            'Взломай цифровой код. Бык означает точное совпадение, корова означает правильную цифру на другой позиции.',
            'hero-description',
        ),
    );
    app.append(topbar, hero);

    const layout = element('div', undefined, 'layout');
    const primary = element('div', undefined, 'primary-column');
    if (status === 'settings') renderSettings(primary);
    else renderGame(primary);

    const secondary = element('aside', undefined, 'secondary-column');
    const records = element('section', undefined, 'panel leaderboard-panel');
    renderRecords(records);
    const guide = element('section', undefined, 'panel guide-panel');
    guide.append(
        element('span', '◈ ИНСТРУКЦИЯ', 'eyebrow'),
        element('h2', 'Как играть'),
    );
    const guideText = element(
        'p',
        'Введи уникальные цифры и проверь свою догадку. Каждый бык означает правильную цифру на своём месте. Каждая корова означает правильную цифру на другой позиции.',
    );
    guide.append(guideText);
    secondary.append(records, guide);
    layout.append(primary, secondary);
    const footer = element('footer', undefined, 'footer footer-arcade');
    const footerHeading = element('div', undefined, 'footer-arcade-heading');
    footerHeading.append(
        element('span', '🎮', 'footer-arcade-icon'),
        element('strong', 'NEON // ARCADE', 'footer-arcade-title'),
    );

    const technologies = element(
        'div',
        undefined,
        'footer-arcade-technologies',
    );
    ['TYPESCRIPT', 'TDD', 'VITEST'].forEach((technology) => {
        technologies.append(element('span', technology, 'footer-arcade-tag'));
    });

    const footerLinks = element('nav', undefined, 'footer-links');
    footerLinks.setAttribute('aria-label', 'Ссылки проекта');
    const links = [
        { title: 'DEVELOPER', url: 'https://github.com/ssidratt' },
        {
            title: 'SOURCE CODE',
            url: 'https://github.com/ssidratt/bulls-and-cows',
        },
        { title: 'RS SCHOOL', url: 'https://rs.school/' },
    ];

    links.forEach(({ title, url }) => {
        const link = element('a', title);
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        footerLinks.append(link);
    });

    const author = element(
        'p',
        'DESIGNED & DEVELOPED BY SONA · 2026',
        'footer-author',
    );
    footer.append(footerHeading, technologies, footerLinks, author);
    app.append(layout, footer);
    document.body.append(app);
}

function renderSettings(app: HTMLElement): void {
    const panel = element('section', undefined, 'panel game-panel');
    panel.append(
        element('span', '01 / ПОДГОТОВКА', 'eyebrow'),
        element('h2', 'Настрой миссию'),
    );

    const fields = element('div', undefined, 'settings-grid');
    const baseField = element('div', undefined, 'field');
    const baseLabel = element('label', 'Система счисления');
    const baseSelect = element('select');
    baseSelect.id = 'game-base';
    baseLabel.htmlFor = baseSelect.id;
    bases.forEach((value) => {
        const option = element('option', labels.get(value));
        option.value = String(value);
        option.selected = value === base;
        baseSelect.append(option);
    });
    baseField.append(baseLabel, baseSelect);

    const lengthField = element('div', undefined, 'field');
    const lengthLabel = element('label', 'Длина секрета');
    const lengthSelect = element('select');
    lengthSelect.id = 'game-length';
    lengthLabel.htmlFor = lengthSelect.id;
    lengthField.append(lengthLabel, lengthSelect);

    const combinations = element('p', '', 'combinations');
    function updateCombinations(): void {
        combinations.textContent = `◈ Возможных комбинаций: ${countPossibleSecrets(length, base).toLocaleString('ru-RU')}`;
    }
    function updateLengths(): void {
        lengthSelect.replaceChildren();
        if (length > base) length = 2;
        for (let value = 2; value <= 6; value += 1) {
            if (value > base) continue;
            const option = element('option', String(value));
            option.value = String(value);
            option.selected = value === length;
            lengthSelect.append(option);
        }
        updateCombinations();
    }
    baseSelect.addEventListener('change', () => {
        base = Number(baseSelect.value);
        playSound('click');
        updateLengths();
    });
    lengthSelect.addEventListener('change', () => {
        length = Number(lengthSelect.value);
        playSound('click');
        updateCombinations();
    });
    updateLengths();
    fields.append(baseField, lengthField);

    const secretPreview = element('div', undefined, 'secret-preview');
    secretPreview.setAttribute('aria-label', 'Секретный код скрыт');
    for (let index = 0; index < length; index += 1) {
        secretPreview.append(element('span', '?', 'digit-slot'));
    }
    lengthSelect.addEventListener('change', () => {
        secretPreview.replaceChildren();
        for (let index = 0; index < length; index += 1) {
            secretPreview.append(element('span', '?', 'digit-slot'));
        }
    });
    baseSelect.addEventListener('change', () => {
        secretPreview.replaceChildren();
        for (let index = 0; index < length; index += 1) {
            secretPreview.append(element('span', '?', 'digit-slot'));
        }
    });

    panel.append(
        element(
            'p',
            'Выбери параметры и попробуй разгадать секретный код.',
            'muted',
        ),
        fields,
        combinations,
        secretPreview,
        button(
            'НАЧАТЬ ИГРУ  ↗',
            () => {
                playSound('click');
                secret = generateSecret(length, base);
                history = [];
                finishedSeconds = 0;
                startedAt = Date.now();
                status = 'playing';
                render();
                document
                    .querySelector<HTMLInputElement>('.guess-input')
                    ?.focus();
            },
            'btn btn-primary',
        ),
    );
    app.append(panel);
}

function renderGame(app: HTMLElement): void {
    const panel = element('section', undefined, 'panel game-panel');
    panel.append(
        element(
            'span',
            status === 'won' ? 'МИССИЯ ВЫПОЛНЕНА' : '02 / РАСШИФРОВКА',
            'eyebrow',
        ),
        element('h2', status === 'won' ? 'Код взломан!' : 'Разгадай секрет'),
        element(
            'p',
            `${labels.get(base)} система счисления · ${length} цифр`,
            'muted',
        ),
    );

    const stats = element('div', undefined, 'stats-grid');
    stats.append(
        createStat('ПОПЫТКИ', String(history.length).padStart(2, '0')),
        createStat(
            'ВРЕМЯ',
            formatTime(
                status === 'won'
                    ? finishedSeconds
                    : Math.floor((Date.now() - startedAt) / 1000),
            ),
            'game-timer',
        ),
        createStat('ДЛИНА КОДА', String(length).padStart(2, '0')),
    );
    panel.append(stats);

    if (status === 'playing') {
        const form = element('form', undefined, 'guess-form');
        const inputLabel = element('label', 'ТВОЯ КОМБИНАЦИЯ');
        const input = element('input', undefined, 'guess-input');
        input.id = 'guess-input';
        inputLabel.htmlFor = input.id;
        input.maxLength = length;
        input.autocomplete = 'off';
        input.spellcheck = false;
        input.placeholder = 'Введи код';
        input.setAttribute('aria-label', 'Ваше число');
        const message = element('p', '', 'feedback');
        message.setAttribute('role', 'status');
        message.setAttribute('aria-live', 'polite');
        const validateDigit = createDigitValidator(base);
        input.addEventListener('input', () => {
            input.value = [...input.value]
                .filter(validateDigit)
                .join('')
                .slice(0, length)
                .toUpperCase();
            message.textContent = '';
            message.classList.remove('feedback-error');
        });
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const guess = input.value.toUpperCase();
            if (!isValidGuess(guess, length, base)) {
                message.textContent =
                    'Используй допустимые цифры без повторений.';
                message.classList.add('feedback-error');
                input.classList.remove('shake');
                void input.offsetWidth;
                input.classList.add('shake');
                playSound('error');
                return;
            }
            if (history.some((entry) => entry.guess === guess)) {
                message.textContent = 'Эта комбинация уже проверялась.';
                message.classList.add('feedback-error');
                playSound('error');
                return;
            }
            const result = evaluateGuess(secret, guess);
            history = [...history, { guess, ...result }];
            if (result.bulls === length) {
                status = 'won';
                finishedSeconds = Math.floor((Date.now() - startedAt) / 1000);
                saveRecord({
                    length,
                    base,
                    attempts: history.length,
                    seconds: finishedSeconds,
                });
                playSound('win');
            } else {
                playSound('guess');
            }
            render();
            document.querySelector<HTMLInputElement>('.guess-input')?.focus();
        });
        const submit = element('button', 'ПРОВЕРИТЬ КОД  ↗', 'btn btn-primary');
        submit.type = 'submit';
        form.append(inputLabel, input, submit, message);
        panel.append(form);
        timerId = window.setInterval(() => {
            const timer = document.getElementById('game-timer');
            if (timer)
                timer.textContent = formatTime(
                    Math.floor((Date.now() - startedAt) / 1000),
                );
        }, 1000);
    } else {
        const win = element('div', undefined, 'victory');
        win.append(
            element('div', '✦', 'victory-symbol'),
            element('p', 'СЕКРЕТ РАСКРЫТ', 'eyebrow'),
            element('div', secret, 'revealed-secret'),
            element(
                'p',
                `Победа за ${history.length} попыток · ${formatTime(finishedSeconds)}`,
                'muted',
            ),
        );
        panel.append(win);
    }

    const historySection = element('section', undefined, 'history-section');
    const historyHeading = element('div', undefined, 'history-heading');
    historyHeading.append(
        element('h3', 'История попыток'),
        element(
            'span',
            `${history.length} / ${countPossibleSecrets(length, base)}`,
            'muted',
        ),
    );
    historySection.append(historyHeading);
    if (history.length === 0) {
        historySection.append(
            element(
                'p',
                'Здесь появятся результаты твоих попыток.',
                'empty-state',
            ),
        );
    } else {
        const list = element('ol', undefined, 'attempt-list');
        [...history].reverse().forEach((entry, index) => {
            const item = element('li', undefined, 'attempt-row');
            item.append(
                element(
                    'span',
                    String(history.length - index).padStart(2, '0'),
                    'attempt-index',
                ),
                element('strong', entry.guess, 'attempt-guess'),
                element('span', `${entry.bulls} БЫК`, 'result-pill bulls'),
                element('span', `${entry.cows} КОР`, 'result-pill cows'),
            );
            list.append(item);
        });
        historySection.append(list);
    }
    panel.append(historySection);
    panel.append(
        button(
            '↻ НОВАЯ ИГРА',
            () => {
                playSound('click');
                status = 'settings';
                history = [];
                render();
            },
            'btn btn-secondary',
        ),
    );
    app.append(panel);
}

render();
