export function initUI(store) {
    const addSquareBtn = document.getElementById('addSquare');
    const addCircleBtn = document.getElementById('addCircle');
    const recolorSquaresBtn = document.getElementById('recolorSquares');
    const recolorCirclesBtn = document.getElementById('recolorCircles');
    const cntSquaresEl = document.getElementById('cntSquares');
    const cntCirclesEl = document.getElementById('cntCircles');
    const board = document.getElementById('board');
    board.addEventListener('click', (e) => {
        const el = e.target;
        if (!el.classList.contains('shape')) return;

        const id = el.dataset.id;
        if (id) store.removeShape(id);
    });
    addSquareBtn.addEventListener('click', () => store.addShape('square'));
    addCircleBtn.addEventListener('click', () => store.addShape('circle'));
    recolorSquaresBtn.addEventListener('click', () => store.recolor('square'));
    recolorCirclesBtn.addEventListener('click', () => store.recolor('circle'));
    let prevById = new Map();

    store.subscribe((state) => {
        const nextById = new Map(state.shapes.map((s) => [s.id, s]));
        for (const [id] of prevById) {
            if (!nextById.has(id)) {
                const el = board.querySelector(`.shape[data-id="${id}"]`);
                if (el) el.remove();
            }
        }

        for (const shape of state.shapes) {
            const prev = prevById.get(shape.id);

            if (!prev) {
                board.appendChild(createShapeEl(shape));
            } else if (prev.color !== shape.color) {
                const el = board.querySelector(`.shape[data-id="${shape.id}"]`);
                if (el) el.style.backgroundColor = shape.color;
            }
        }
        cntSquaresEl.textContent = store.squaresCount;
        cntCirclesEl.textContent = store.circlesCount;

        prevById = nextById;
    });
}

function createShapeEl(shape) {
    const el = document.createElement('div');
    el.className = `shape ${shape.type}`;
    el.style.backgroundColor = shape.color;
    el.dataset.id = shape.id;
    el.dataset.type = shape.type;
    return el;
}
