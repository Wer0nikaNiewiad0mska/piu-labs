import loadTemplate from '../utils/loadTemplate.js';

let templatePromise = null;
function getTemplate() {
    if (!templatePromise) {
        templatePromise = loadTemplate(
            new URL('./product-card.html', import.meta.url)
        );
    }
    return templatePromise;
}

const money = new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
});

function normalizeOptions(list) {
    if (!Array.isArray(list)) return [];
    return list
        .map((x) => {
            if (typeof x === 'string') return { value: x, label: x };
            if (x && typeof x === 'object') {
                const value = x.value ?? x.id ?? x.label ?? '';
                const label = x.label ?? String(value);
                return { value: String(value), label: String(label) };
            }
            return null;
        })
        .filter(Boolean);
}

function parsePrice(value) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value !== 'string') return null;
    const cleaned = value
        .replace(/\s/g, '')
        .replace('zł', '')
        .replace(',', '.');
    const num = Number(cleaned.replace(/[^0-9.]/g, ''));
    return Number.isFinite(num) ? num : null;
}

export default class ProductCard extends HTMLElement {
    #product = null;

    #id = '';
    #name = '';
    #priceValue = null;
    #image = '';
    #promo = '';
    #colors = [];
    #sizes = [];

    _initialized = false;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['product-id', 'name', 'price', 'image', 'promo'];
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (oldVal === newVal) return;
        if (this.#product) return;

        if (name === 'product-id') this.#id = newVal ?? '';
        if (name === 'name') this.#name = newVal ?? '';
        if (name === 'image') this.#image = newVal ?? '';
        if (name === 'promo') this.#promo = newVal ?? '';
        if (name === 'price') this.#priceValue = parsePrice(newVal);

        this._render();
    }

    async connectedCallback() {
        if (!this.shadowRoot.hasChildNodes()) {
            const template = await getTemplate();
            this.shadowRoot.appendChild(template.content.cloneNode(true));
        }

        if (!this._initialized) {
            this._cache();
            this._wire();
            this._initialized = true;
        }

        if (!this.#product) {
            if (this.hasAttribute('product-id'))
                this.#id = this.getAttribute('product-id') ?? '';
            if (this.hasAttribute('name'))
                this.#name = this.getAttribute('name') ?? '';
            if (this.hasAttribute('image'))
                this.#image = this.getAttribute('image') ?? '';
            if (this.hasAttribute('promo'))
                this.#promo = this.getAttribute('promo') ?? '';
            if (this.hasAttribute('price'))
                this.#priceValue = parsePrice(this.getAttribute('price') ?? '');
        }

        this._render();
    }

    _cache() {
        const s = this.shadowRoot;
        this._badge = s.querySelector('.badge');
        this._img = s.querySelector('.image');
        this._title = s.querySelector('.title');
        this._price = s.querySelector('.price');

        this._colorRow = s.querySelector('.meta-row--colors');
        this._sizeRow = s.querySelector('.meta-row--sizes');
        this._colorSelect = s.querySelector('.select--colors');
        this._sizeSelect = s.querySelector('.select--sizes');

        this._btn = s.querySelector('.add-to-cart');
    }

    _wire() {
        this._btn.addEventListener('click', () => this._emitAddToCart());

        this._colorSelect?.addEventListener('change', () =>
            this._updateValidityUI()
        );
        this._sizeSelect?.addEventListener('change', () =>
            this._updateValidityUI()
        );
    }

    get product() {
        return this.#product;
    }

    set product(value) {
        this.#product = value ?? null;

        if (!value || typeof value !== 'object') {
            this._render();
            return;
        }

        this.#id = String(value.id ?? '');
        this.#name = String(value.name ?? '');
        this.#image = String(value.image ?? '');
        this.#promo = String(value.promo ?? '');

        this.#colors = normalizeOptions(value.colors);
        this.#sizes = normalizeOptions(value.sizes);

        this.#priceValue = parsePrice(value.price);

        this._render();
    }

    get productId() {
        return this.#id;
    }
    set productId(v) {
        this.setAttribute('product-id', v ?? '');
    }

    get name() {
        return this.#name;
    }
    set name(v) {
        this.setAttribute('name', v ?? '');
    }

    get image() {
        return this.#image;
    }
    set image(v) {
        this.setAttribute('image', v ?? '');
    }

    get promo() {
        return this.#promo;
    }
    set promo(v) {
        this.setAttribute('promo', v ?? '');
    }

    get price() {
        return this.#priceValue;
    }
    set price(v) {
        if (typeof v === 'number' && Number.isFinite(v))
            this.setAttribute('price', String(v));
        else this.setAttribute('price', v ?? '');
    }

    _isSelectionValid() {
        const needsColor = this.#colors.length > 0;
        const needsSize = this.#sizes.length > 0;

        const colorOk = !needsColor || !!this._colorSelect?.value;
        const sizeOk = !needsSize || !!this._sizeSelect?.value;

        return colorOk && sizeOk;
    }

    _updateValidityUI() {
        if (!this._initialized) return;

        const needsColor = this.#colors.length > 0;
        const needsSize = this.#sizes.length > 0;

        const colorMissing = needsColor && !this._colorSelect.value;
        const sizeMissing = needsSize && !this._sizeSelect.value;

        if (this._colorSelect) {
            this._colorSelect.classList.toggle('is-invalid', colorMissing);
            this._colorSelect.setAttribute(
                'aria-invalid',
                colorMissing ? 'true' : 'false'
            );
        }
        if (this._sizeSelect) {
            this._sizeSelect.classList.toggle('is-invalid', sizeMissing);
            this._sizeSelect.setAttribute(
                'aria-invalid',
                sizeMissing ? 'true' : 'false'
            );
        }

        this._btn.disabled = !this._isSelectionValid();
    }

    _render() {
        if (!this._initialized) return;

        this._title.textContent = this.#name || 'Produkt';

        this._img.src = this.#image || '';
        this._img.alt = this.#name || 'Produkt';

        this._price.textContent =
            this.#priceValue != null ? money.format(this.#priceValue) : '';

        const promoText = (this.#promo || '').trim();
        this._badge.textContent = promoText;
        this._badge.hidden = promoText.length === 0;

        this._fillSelect(this._colorSelect, this.#colors);
        this._fillSelect(this._sizeSelect, this.#sizes);

        this._colorRow.hidden = this.#colors.length === 0;
        this._sizeRow.hidden = this.#sizes.length === 0;

        this._updateValidityUI();
    }

    _fillSelect(selectEl, options) {
        if (!selectEl) return;

        const placeholder = selectEl.querySelector('option[data-placeholder]');
        selectEl.innerHTML = '';
        if (placeholder) selectEl.appendChild(placeholder);

        if (!options || options.length === 0) return;

        for (const src of options) {
            const opt = document.createElement('option');
            opt.value = src.value;
            opt.textContent = src.label;
            selectEl.appendChild(opt);
        }

        if (placeholder) selectEl.value = '';
    }

    _emitAddToCart() {
        if (!this._isSelectionValid()) {
            this._updateValidityUI();

            const needsColor = this.#colors.length > 0;
            const needsSize = this.#sizes.length > 0;

            if (needsColor && !this._colorSelect.value) {
                this._colorSelect.focus();
            } else if (needsSize && !this._sizeSelect.value) {
                this._sizeSelect.focus();
            }
            return;
        }

        const color = this.#colors.length
            ? this._colorSelect.value || null
            : null;
        const size = this.#sizes.length ? this._sizeSelect.value || null : null;

        const detail = {
            id: this.#id || null,
            name: this.#name,
            price: this.#priceValue ?? 0,
            priceLabel:
                this.#priceValue != null ? money.format(this.#priceValue) : '',
            selected: { color, size },
        };

        this.dispatchEvent(
            new CustomEvent('add-to-cart', {
                detail,
                bubbles: true,
                composed: true,
            })
        );
    }
}

customElements.define('product-card', ProductCard);
