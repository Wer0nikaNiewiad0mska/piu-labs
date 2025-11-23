export function randomHsl() {
    const h = Math.floor(Math.random() * 360);
    return `hsl(${h}, 70%, 75%)`;
}

let fallbackCounter = 0;
export function uid() {
    if (crypto?.randomUUID) return crypto.randomUUID();
    fallbackCounter += 1;
    return `id-${Date.now()}-${fallbackCounter}`;
}
