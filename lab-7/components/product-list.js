import './product-card.js';

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host { display: block; }

    .grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 26px;
      justify-items: center;
      align-items: stretch;
      padding-top: 8px;
    }

    @media (max-width: 1340px) {
      .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 22px; }
    }

    @media (max-width: 1100px) {
      .grid { grid-template-columns: minmax(0, 1fr); }
    }
  </style>

  <section class="grid"></section>
`;

export default class ProductList extends HTMLElement {
    #products = [];

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this._grid = this.shadowRoot.querySelector('.grid');
    }

    get products() {
        return this.#products;
    }

    set products(value) {
        this.#products = Array.isArray(value) ? value : [];
        this._render();
    }

    _render() {
        this._grid.innerHTML = '';
        const frag = document.createDocumentFragment();

        for (const p of this.#products) {
            const card = document.createElement('product-card');
            card.product = p;
            frag.appendChild(card);
        }

        this._grid.appendChild(frag);
    }
}

customElements.define('product-list', ProductList);
