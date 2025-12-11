import loadTemplate from '../utils/loadTemplate.js';

let templatePromise = null;

function getTemplate() {
    if (!templatePromise) {
        templatePromise = loadTemplate('components/product-card.html');
    }
    return templatePromise;
}

export default class ProductCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    async connectedCallback() {
        if (!this.shadowRoot.hasChildNodes()) {
            const template = await getTemplate();
            const content = template.content.cloneNode(true);
            this.shadowRoot.appendChild(content);
            this._init();
        }
    }

    _init() {
        const shadow = this.shadowRoot;

        this._colorRow = shadow.querySelector('.meta-row--colors');
        this._sizeRow = shadow.querySelector('.meta-row--sizes');
        this._promoBadge = shadow.querySelector('.badge');

        this._colorSelect = shadow.querySelector('.select--colors');
        this._sizeSelect = shadow.querySelector('.select--sizes');

        this._colorSlot = shadow.querySelector('slot[name="colors"]');
        this._sizeSlot = shadow.querySelector('slot[name="sizes"]');
        this._promoSlot = shadow.querySelector('slot[name="promo"]');

        this._updateColors();
        this._updateSizes();
        this._updatePromo();

        this._colorSlot?.addEventListener('slotchange', () => {
            this._updateColors();
        });

        this._sizeSlot?.addEventListener('slotchange', () => {
            this._updateSizes();
        });

        this._promoSlot?.addEventListener('slotchange', () => {
            this._updatePromo();
        });
    }

    _fillSelectFromSlot(selectEl, slot) {
        if (!selectEl || !slot) return;

        const assigned = slot.assignedElements();
        const hasItems = assigned.length > 0;

        const placeholder = selectEl.querySelector('option[data-placeholder]');
        selectEl.innerHTML = '';
        if (placeholder) {
            selectEl.appendChild(placeholder);
        }

        if (!hasItems) {
            return;
        }

        assigned.forEach((src) => {
            if (!(src instanceof HTMLOptionElement)) return;
            const opt = document.createElement('option');
            opt.value =
                src.value ||
                src.getAttribute('value') ||
                src.textContent.trim();
            opt.textContent = src.textContent;
            selectEl.appendChild(opt);
        });

        if (placeholder) {
            selectEl.value = '';
        }
    }

    _updateColors() {
        this._fillSelectFromSlot(this._colorSelect, this._colorSlot);
        const hasColors = this._colorSlot?.assignedElements().length > 0;
        if (this._colorRow) {
            this._colorRow.hidden = !hasColors;
        }
    }

    _updateSizes() {
        this._fillSelectFromSlot(this._sizeSelect, this._sizeSlot);
        const hasSizes = this._sizeSlot?.assignedElements().length > 0;
        if (this._sizeRow) {
            this._sizeRow.hidden = !hasSizes;
        }
    }

    _updatePromo() {
        if (!this._promoSlot || !this._promoBadge) return;
        const hasText = this._promoSlot
            .assignedNodes()
            .some((node) => node.textContent && node.textContent.trim() !== '');
        this._promoBadge.hidden = !hasText;
    }
}

customElements.define('product-card', ProductCard);
