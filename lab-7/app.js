import productsData from './data.json' with { type: 'json' };

import './components/product-list.js';
import './components/shopping-cart.js';

const list = document.querySelector('product-list');
const cart = document.querySelector('shopping-cart');

list.products = productsData;

list.addEventListener('add-to-cart', (e) => {
  cart.addItem(e.detail);
});
