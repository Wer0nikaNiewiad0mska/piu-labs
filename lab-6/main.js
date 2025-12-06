import { Ajax } from '../ajax-lib/ajax.js';

const api = new Ajax({
    baseURL: 'https://jsonplaceholder.typicode.com',
    timeout: 5000,
});

const btnLoadOk = document.getElementById('btn-load-ok');
const btnLoadError = document.getElementById('btn-load-error');
const btnReset = document.getElementById('btn-reset');
const loader = document.getElementById('loader');
const errorBox = document.getElementById('error');
const list = document.getElementById('list');

function setLoading(isLoading) {
    if (isLoading) {
        loader.classList.remove('hidden');
        btnLoadOk.disabled = true;
        btnLoadError.disabled = true;
    } else {
        loader.classList.add('hidden');
        btnLoadOk.disabled = false;
        btnLoadError.disabled = false;
    }
}

function showError(message) {
    errorBox.textContent = message;
}

function clearError() {
    errorBox.textContent = '';
}

function renderList(items) {
    list.innerHTML = '';
    items.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = `${item.id}: ${item.title}`;
        list.appendChild(li);
    });
}

function clearList() {
    list.innerHTML = '';
}

btnLoadOk.addEventListener('click', async () => {
    setLoading(true);
    clearError();
    try {
        const data = await api.get('/posts?_limit=5');
        renderList(data);
    } catch (err) {
        console.error(err);
        const statusPart = err.status ? ` (status: ${err.status})` : '';
        showError(
            `Błąd podczas pobierania danych${statusPart}: ${err.message}`
        );
    } finally {
        setLoading(false);
    }
});

btnLoadError.addEventListener('click', async () => {
    setLoading(true);
    clearError();
    try {
        const data = await api.get('/wrong-endpoint');
        renderList(data);
    } catch (err) {
        console.error(err);
        const statusPart = err.status ? ` (status: ${err.status})` : '';
        showError(`Oczekiwany błąd: ${statusPart} ${err.message}`);
        clearList();
    } finally {
        setLoading(false);
    }
});

btnReset.addEventListener('click', () => {
    clearList();
    clearError();
});
