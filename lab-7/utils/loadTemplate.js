export default async function loadTemplate(urlOrPath) {
    const url =
        urlOrPath instanceof URL
            ? urlOrPath
            : new URL(urlOrPath, import.meta.url);

    const template = document.createElement('template');
    const html = await fetch(url).then((r) => r.text());
    template.innerHTML = html;
    return template;
}
