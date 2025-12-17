const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: flex;
      flex-direction: column;

      font-family: system-ui, Arial;
      border: 1px solid #e5e7eb;
      border-radius: 18px;
      background: rgba(255, 255, 255, 0.92);
      box-shadow: 0 12px 30px rgba(15, 23, 42, 0.12);

      width: clamp(320px, 30vw, 460px);

      min-height: 120px;
      max-height: calc(100vh - 200px);

      position: sticky;
      top: 18px;

      padding: 18px;
      box-sizing: border-box;
    }

    .header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 12px;

      padding: 8px 10px 14px;
      border-bottom: 1px dashed #e5e7eb;
      margin-bottom: 6px;
    }

    h2 {
      margin: 0;
      font-size: 1.05rem;
    }

    .count {
      font-size: 0.85rem;
      color: #6b7280;
      white-space: nowrap;
    }

    .body {
      display: flex;
      flex-direction: column;
      gap: 14px;
      flex: 1;
      min-height: 0;
    }

    .empty {
      color: #6b7280;
      font-size: 0.9rem;
      padding: 14px 12px;
      border-radius: 12px;
      background: rgba(249, 250, 251, 0.9);
      border: 1px solid #e5e7eb;
      margin: 0 10px;
    }

    ul {
      list-style: none;
      margin: 0;
      padding: 0 10px;
      display: grid;
      gap: 14px;

      flex: 1;
      min-height: 0;
      overflow: auto;
    }

    li {
      border: 1px solid #e5e7eb;
      border-radius: 14px;
      padding: 14px 14px 14px 16px;
      display: grid;
      gap: 10px;
      background: #fff;
      max-height: 70px;
    }

    .row {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 12px;
    }

    .name {
      font-weight: 600;
      color: #111827;
      font-size: 0.95rem;
      line-height: 1.25;
    }

    .price {
      font-weight: 700;
      color: #0f172a;
      white-space: nowrap;
      font-size: 0.95rem;
      padding-left: 8px;
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 6px;
    }

    button {
      border: 1px solid #e5e7eb;
      background: #fff;
      border-radius: 999px;
      padding: 8px 12px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.85rem;
    }

    button:hover {
      border-color: #cbd5e1;
    }

    .total {
      display: flex;
      justify-content: space-between;
      align-items: baseline;

      border-top: 1px dashed #e5e7eb;
      padding: 14px 10px 6px;
      margin-top: 6px;
      margin-bottom: 6px;

      font-weight: 700;
    }

    .sum {
      font-size: 1.05rem;
      white-space: nowrap;
      padding-left: 8px;
    }

    @media (max-width: 900px) {
      :host {
        width: 100%;
        position: static;
        max-height: none;
        min-height: auto;
      }

      ul {
        overflow: visible;
      }
    }
  </style>

  <div class="header">
    <h2>Koszyk</h2>
    <span class="count"></span>
  </div>

  <div class="body">
    <p class="empty" hidden>Brak produktów w koszyku.</p>
    <ul class="list"></ul>

    <div class="total">
      <span>Suma</span>
      <span class="sum">0,00 zł</span>
    </div>
  </div>
`;

const money = new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
});

export default class ShoppingCart extends HTMLElement {
    #items = [];

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(template.content.cloneNode(true));

        this._list = this.shadowRoot.querySelector('.list');
        this._sum = this.shadowRoot.querySelector('.sum');
        this._empty = this.shadowRoot.querySelector('.empty');
        this._count = this.shadowRoot.querySelector('.count');

        this._list.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-remove]');
            if (!btn) return;
            const index = Number(btn.getAttribute('data-remove'));
            if (!Number.isFinite(index)) return;
            this.removeAt(index);
        });

        this._render();
    }

    addItem(item) {
        if (!item) return;
        this.#items = [...this.#items, item];
        this._render();
    }

    removeAt(index) {
        this.#items = this.#items.filter((_, i) => i !== index);
        this._render();
    }

    _render() {
        this._list.innerHTML = '';

        const count = this.#items.length;
        this._count.textContent = `${count} szt.`;

        this._empty.hidden = count !== 0;

        let sum = 0;
        const frag = document.createDocumentFragment();

        this.#items.forEach((it, idx) => {
            const price =
                typeof it.price === 'number' && Number.isFinite(it.price)
                    ? it.price
                    : 0;
            sum += price;

            const meta = [];
            if (it.selected?.color) meta.push(`Kolor: ${it.selected.color}`);
            if (it.selected?.size) meta.push(`Rozmiar: ${it.selected.size}`);

            const li = document.createElement('li');
            li.innerHTML = `
        <div class="row">
          <span class="name"></span>
          <span class="price">${money.format(price)}</span>
        </div>
        <div class="meta" ${meta.length ? '' : 'hidden'}>
          ${meta.map((x) => `<span>${x}</span>`).join('')}
        </div>
        <div class="actions">
          <button type="button" data-remove="${idx}">Usuń</button>
        </div>
      `;

            li.querySelector('.name').textContent = it.name ?? 'Produkt';
            frag.appendChild(li);
        });

        this._list.appendChild(frag);
        this._sum.textContent = money.format(sum);
    }
}

customElements.define('shopping-cart', ShoppingCart);
