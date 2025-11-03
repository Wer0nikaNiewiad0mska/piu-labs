(function () {
    const STORAGE_KEY = 'kanban-v1';

    const INITIAL_STATE = {
        columns: [
            { key: 'todo', title: 'Do zrobienia', sortAsc: true, cards: [] },
            { key: 'doing', title: 'W trakcie', sortAsc: true, cards: [] },
            { key: 'done', title: 'Zrobione', sortAsc: true, cards: [] },
        ],
    };

    const uid = () =>
        globalThis.crypto && globalThis.crypto.randomUUID
            ? globalThis.crypto.randomUUID()
            : `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    const clampText = (str, max = 120) =>
        str && str.length > max ? str.slice(0, max) + '…' : str || '';

    const randomPastel = () => {
        const hue = Math.floor(Math.random() * 360);
        const sat = 85;
        const light = 78;
        return `hsl(${hue} ${sat}% ${light}%)`;
    };

    const save = (state) =>
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    const load = () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (!parsed.columns || !Array.isArray(parsed.columns)) return null;
            return parsed;
        } catch {
            return null;
        }
    };

    const el = (tag, opts = {}) => {
        const n = document.createElement(tag);
        if (opts.class) n.className = opts.class;
        if (opts.text) n.textContent = opts.text;
        if (opts.html) n.innerHTML = opts.html;
        if (opts.attrs)
            Object.entries(opts.attrs).forEach(([k, v]) =>
                n.setAttribute(k, v)
            );
        if (opts.dataset)
            Object.entries(opts.dataset).forEach(
                ([k, v]) => (n.dataset[k] = v)
            );
        return n;
    };

    let state = load() || INITIAL_STATE;

    const root = el('div', { class: 'kanban' });
    const columnsWrap = el('div', { class: 'columns' });
    root.appendChild(columnsWrap);
    const footer = el('div', {
        class: 'footer-note',
        text: 'Porada: kliknij 🖌️ na karcie, by nadać jej nowy kolor. Użyj też klawiszy ← / →, by przenosić kartę.',
    });
    root.appendChild(footer);
    document.body.appendChild(root);

    const render = () => {
        columnsWrap.innerHTML = '';
        state.columns.forEach((col) =>
            columnsWrap.appendChild(renderColumn(col))
        );
    };

    const renderColumn = (col) => {
        const column = el('section', {
            class: 'column',
            attrs: { 'data-col': col.key },
        });

        const header = el('div', { class: 'column-header' });
        const title = el('div', { class: 'column-title' });
        const h = el('span', { text: col.title });
        const badge = el('span', {
            class: 'badge',
            text: String(col.cards.length),
        });
        badge.dataset.role = 'counter';
        title.append(h, badge);

        const actions = el('div', { class: 'column-actions' });
        const addBtn = el('button', {
            class: 'btn primary',
            text: 'Dodaj kartę',
        });
        addBtn.dataset.action = 'add-card';
        const colorColBtn = el('button', {
            class: 'btn',
            text: 'Koloruj kolumnę',
        });
        colorColBtn.dataset.action = 'colorize-column';
        const sortBtn = el('button', {
            class: 'btn',
            text: col.sortAsc ? 'Sortowanie: A→Z' : 'Sortowanie: Z→A',
        });
        sortBtn.dataset.action = 'toggle-sort';
        actions.append(addBtn, colorColBtn, sortBtn);

        header.append(title, actions);

        const cards = el('div', { class: 'cards' });

        const cardsSorted = [...col.cards].sort((a, b) => {
            const A = (a.title || '').toLowerCase();
            const B = (b.title || '').toLowerCase();
            return col.sortAsc ? A.localeCompare(B) : B.localeCompare(A);
        });

        cardsSorted.forEach((c) => cards.appendChild(renderCard(c)));

        const toolbar = el('div', { class: 'toolbar' });
        const helper = el('div', {
            class: 'helper',
            text: 'Edycja: kliknij tytuł/treść • Przenoszenie: ← / →',
        });
        toolbar.append(helper);

        column.append(header, cards, toolbar);

        column.addEventListener('click', handleColumnClick);
        column.addEventListener('input', handleEditableInput);

        return column;
    };

    const renderCard = (card) => {
        const c = el('div', {
            class: 'card',
            attrs: { 'data-id': card.id },
        });
        c.style.background = card.color;

        const top = el('div', { class: 'card-top' });

        const title = el('div', {
            class: 'card-title',
            text: card.title || 'Nowa karta',
            attrs: {
                contenteditable: 'true',
                spellcheck: 'false',
                'data-field': 'title',
            },
        });

        const actions = el('div', { class: 'card-actions' });
        const paint = el('button', { class: 'icon-btn', text: '🖌️' });
        paint.title = 'Koloruj kartę';
        paint.dataset.action = 'colorize-card';

        const left = el('button', { class: 'icon-btn', text: '←' });
        left.title = 'Przenieś w lewo';
        left.dataset.action = 'move-left';

        const right = el('button', { class: 'icon-btn', text: '→' });
        right.title = 'Przenieś w prawo';
        right.dataset.action = 'move-right';

        const remove = el('button', { class: 'icon-btn', text: '×' });
        remove.title = 'Usuń kartę';
        remove.dataset.action = 'remove-card';

        actions.append(paint, left, right, remove);
        top.append(title, actions);

        const body = el('div', {
            class: 'card-body',
            text: card.body || 'Kliknij, aby dodać treść…',
            attrs: {
                contenteditable: 'true',
                spellcheck: 'false',
                'data-field': 'body',
            },
        });

        c.append(top, body);
        return c;
    };

    function handleColumnClick(e) {
        const actionBtn = e.target.closest('[data-action]');
        if (!actionBtn) return;

        const colEl = e.currentTarget;
        const colKey = colEl.getAttribute('data-col');
        const action = actionBtn.dataset.action;

        if (action === 'add-card') return addCard(colKey);
        if (action === 'colorize-column') return colorizeColumn(colKey);
        if (action === 'toggle-sort') return toggleSort(colKey);

        const cardEl = e.target.closest('.card');
        if (!cardEl) return;
        const cardId = cardEl.getAttribute('data-id');

        if (action === 'colorize-card') return colorizeCard(colKey, cardId);
        if (action === 'move-left') return moveCard(colKey, cardId, -1);
        if (action === 'move-right') return moveCard(colKey, cardId, +1);
        if (action === 'remove-card') return removeCard(colKey, cardId);
    }

    function handleEditableInput(e) {
        const field = e.target.closest('[data-field]');
        if (!field) return;
        const cardEl = e.target.closest('.card');
        if (!cardEl) return;
        const colEl = e.currentTarget;
        const colKey = colEl.getAttribute('data-col');
        const col = state.columns.find((c) => c.key === colKey);
        const cardId = cardEl.getAttribute('data-id');
        const card = col.cards.find((c) => c.id === cardId);
        if (!card) return;

        const prop = field.dataset.field;
        const val = field.textContent;
        if (prop === 'title') card.title = clampText(val, 120);
        if (prop === 'body') card.body = val;

        save(state);
    }

    function addCard(colKey) {
        const col = state.columns.find((c) => c.key === colKey);
        const newCard = {
            id: uid(),
            title: 'Nowa karta',
            body: 'Kliknij, aby dodać treść…',
            color: randomPastel(),
            createdAt: Date.now(),
        };
        col.cards.push(newCard);
        save(state);
        render();
        queueMicrotask(() => {
            const last = document.querySelector(
                `[data-col="${colKey}"] .cards .card:last-child .card-title`
            );
            if (last) {
                selectAllContent(last);
                last.focus();
            }
        });
    }

    function colorizeColumn(colKey) {
        const col = state.columns.find((c) => c.key === colKey);
        col.cards.forEach((card) => (card.color = randomPastel()));
        save(state);
        render();
    }

    function colorizeCard(colKey, cardId) {
        const col = state.columns.find((c) => c.key === colKey);
        const card = col.cards.find((c) => c.id === cardId);
        if (!card) return;
        card.color = randomPastel();
        save(state);
        const elCard = document.querySelector(
            `[data-col="${colKey}"] .card[data-id="${cardId}"]`
        );
        if (elCard) elCard.style.background = card.color;
    }

    function moveCard(colKey, cardId, dir) {
        const idx = state.columns.findIndex((c) => c.key === colKey);
        const nextIdx = idx + dir;
        if (nextIdx < 0 || nextIdx >= state.columns.length) return;
        const src = state.columns[idx];
        const dst = state.columns[nextIdx];
        const pos = src.cards.findIndex((c) => c.id === cardId);
        if (pos === -1) return;
        const [card] = src.cards.splice(pos, 1);
        dst.cards.push(card);
        save(state);
        render();
    }

    function removeCard(colKey, cardId) {
        const col = state.columns.find((c) => c.key === colKey);
        col.cards = col.cards.filter((c) => c.id !== cardId);
        save(state);
        render();
    }

    function toggleSort(colKey) {
        const col = state.columns.find((c) => c.key === colKey);
        col.sortAsc = !col.sortAsc;
        save(state);
        render();
    }

    function selectAllContent(node) {
        const range = document.createRange();
        range.selectNodeContents(node);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }

    function onKeydownCapture(e) {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        const active = document.activeElement;
        const editable = active && active.closest && active.closest('.card');
        if (!editable) return;
        e.preventDefault();
        const colEl = editable.closest('.column');
        if (!colEl) return;
        const colKey = colEl.getAttribute('data-col');
        const cardId =
            editable.getAttribute('data-id') ||
            editable.closest('.card').getAttribute('data-id');
        moveCard(colKey, cardId, e.key === 'ArrowLeft' ? -1 : +1);
    }

    const highlightOnce = () => {
        const firstHeader = document.querySelector('.column-header');
        if (!firstHeader) return;
        firstHeader.style.boxShadow = '0 0 0 3px rgba(212,163,115,0.45) inset';
        setTimeout(() => {
            firstHeader.style.boxShadow = '';
        }, 900);
    };

    function attachTempListener() {
        document.addEventListener('click', tempClickHandler);
        setTimeout(() => {
            document.removeEventListener('click', tempClickHandler);
        }, 3000);
    }

    function tempClickHandler(e) {
        if (e.target.matches && e.target.matches('.icon-btn')) {
            e.stopPropagation();
        }
    }

    if (!load()) {
        state.columns[0].cards.push({
            id: uid(),
            title: 'Przykładowe zadanie',
            body: 'Edytuj mnie',
            color: randomPastel(),
            createdAt: Date.now(),
        });
        state.columns[1].cards.push({
            id: uid(),
            title: 'W toku: stylowanie — dlaczego przy edycji opis się „odznaczał”?',
            body: 'Bo był render na blur. Teraz zapisujemy na input i nie renderujemy.',
            color: randomPastel(),
            createdAt: Date.now(),
        });
        state.columns[2].cards.push({
            id: uid(),
            title: 'Zrobione: szkielet',
            body: 'Struktura i zapis działają',
            color: randomPastel(),
            createdAt: Date.now(),
        });
        save(state);
    }

    render();
    document.addEventListener('keydown', onKeydownCapture, { capture: true });
    document.addEventListener('DOMContentLoaded', highlightOnce, {
        once: true,
    });
    attachTempListener();
})();
