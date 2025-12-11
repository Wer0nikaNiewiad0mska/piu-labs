export default async function loadTemplate(url) {
    const template = document.createElement('template');
    const html = await fetch(url).then((r) => r.text());
    template.innerHTML = html;
    return template;
}
