import { randomHsl, uid } from './helpers.js';

const STORAGE_KEY = 'lab5-shapes-state';

class Store {
    #state = {
        shapes: [],
    };

    #subscribers = new Set();

    constructor() {
        this.#load();
    }

    getState() {
        return {
            shapes: this.#state.shapes.map((s) => ({ ...s })),
        };
    }

    get squaresCount() {
        return this.#state.shapes.filter((s) => s.type === 'square').length;
    }

    get circlesCount() {
        return this.#state.shapes.filter((s) => s.type === 'circle').length;
    }

    addShape(type) {
        if (type !== 'square' && type !== 'circle') return;

        const shape = {
            id: uid(),
            type,
            color: randomHsl(),
        };

        this.#state.shapes.push(shape);
        this.#notify();
    }

    removeShape(id) {
        const before = this.#state.shapes.length;
        this.#state.shapes = this.#state.shapes.filter((s) => s.id !== id);
        if (this.#state.shapes.length !== before) {
            this.#notify();
        }
    }

    recolor(type) {
        for (const s of this.#state.shapes) {
            if (s.type === type) s.color = randomHsl();
        }
        this.#notify();
    }

    subscribe(callback) {
        this.#subscribers.add(callback);
        callback(this.getState());
        return () => this.#subscribers.delete(callback);
    }

    #notify() {
        this.#save();
        const snapshot = this.getState();
        for (const cb of this.#subscribers) cb(snapshot);
    }
    #load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (!parsed?.shapes || !Array.isArray(parsed.shapes)) return;
            this.#state.shapes = parsed.shapes
                .filter(
                    (s) =>
                        s?.id &&
                        (s.type === 'square' || s.type === 'circle') &&
                        s.color
                )
                .map((s) => ({
                    id: String(s.id),
                    type: s.type,
                    color: String(s.color),
                }));
        } catch {
            this.#state.shapes = [];
        }
    }

    #save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.#state));
    }
}
export const store = new Store();
