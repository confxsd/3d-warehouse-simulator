const { color } = require("d3-color");
const LAYOUT_CORRIDOR_MAP = require("./layoutCorridorMap");

const layoutSorter = (a, b) => {
    if (a.LocId[1] < b.LocId[1]) return -1;
    if ((a.LocId[1] == b.LocId[1]) && (parseInt(a.LocId.slice(2, 5)) < parseInt(b.LocId.slice(2, 5)))) return -1;
    else return 0;
}

const allCorridorNames = () => {
    return ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]
}

const corridorNames = (layout) => {
    const names = new Set()
    layout.forEach(loc => {
        names.add(loc.id[1]);
    });
    return Array.from(names).sort();
}

const locToGridPoint2 = (locId) => {
    const firstCorridor = 'B'
    const corridorLength = 38
    const corridorName = locId[1];
    const index = parseInt(locId.slice(2, 5));

    const corridorDist = corridorName.charCodeAt(0) - firstCorridor.charCodeAt(0);
    let x = corridorDist * 4 + (index > corridorLength ? 3 : 0);
    let y = index > corridorLength ? index - corridorLength - 1 : index;

    if (corridorDist == 0) {
        x = (index > corridorLength ? 3 : 0);
    }

    return {
        x, y
    }
}

const getCorridorDist = (name) => {
    const firstCorridor = 'A';
    return name.charCodeAt(0) - firstCorridor.charCodeAt(0);
}



const locToGridPoint = (locId) => {
    const corridorName = locId[1];
    const order = parseInt(locId.slice(2, 5));

    let corridorLength;
    let x, y;

    const corridorDist = getCorridorDist(corridorName);
    const left = LAYOUT_CORRIDOR_MAP[corridorName].left;
    const right = LAYOUT_CORRIDOR_MAP[corridorName].right;

    if (left) {
        corridorLength = left.range[1];
    } else {
        corridorLength = right.range[0] - 1;
    }

    const isLocAtLeft = order <= corridorLength;

    x = corridorDist * 4 + (order > corridorLength ? 3 : 0);

    if (isLocAtLeft) {
        y = order;
        if (left.blocks) {
            if (order >= left.blocks[0])
                y += 1;
            if (order >= left.blocks[1])
                y += 1;
        }
    } else {
        y = order - corridorLength;
        if (right.blocks) {
            if (order >= right.blocks[0])
                y += 1;
            if (order >= right.blocks[1])
                y += 1;
        }
    }

    return {
        x, y
    }
}

const fillRestOfLayout = (layout) => {
    const corrNames = corridorNames(layout);

    corrNames.forEach((name) => {
        const left = LAYOUT_CORRIDOR_MAP[name].left;
        const right = LAYOUT_CORRIDOR_MAP[name].right;

        if (left && left.blocks) {
            const corridorDist = getCorridorDist(name);
            for (let i = 0; i < left.blocks.length; i++) {
                const order = left.blocks[i];
                const block = {
                    id: 'block',
                    x: corridorDist * 4,
                    z: order + i
                }
                layout.push(block)   
            }
        }

        if (right && right.blocks) {
            const corridorDist = getCorridorDist(name);
            const corridorLength = right.range[0] - 1;

            for (let i = 0; i < right.blocks.length; i++) {
                const order = right.blocks[i];
                const block = {
                    id: 'block',
                    x: corridorDist * 4 + 3,
                    z: order - corridorLength + i
                }
                layout.push(block)
            }
        }
    });

    return layout;
}

const toGridLayout = (layout) => {
    // layoutSorted = layout.sort(layoutSorter)
    const layoutMapped = layout.map(loc => {
        const point = locToGridPoint(loc.LocId);
        return {
            id: loc.LocId,
            x: point.x,
            z: point.y,
            stock: loc.Stok,
            locWeight: loc.LocWeight,
            proWeight: loc.ProWeight,
            maxQuan: loc.MaxQuan,
            stock: loc.Stok,
            insertedAt: loc.InsertedAt,
            proId: loc.ProId
        }
    });

    return fillRestOfLayout(layoutMapped);
}

const colorMap = [
    'hsl(30, 60%, X%)',
    'hsl(60, 60%, X%)',
    'hsl(90, 60%, X%)',
    'hsl(120, 60%, X%)',
    'hsl(150, 60%, X%)',
]

const getColorValue = (id, stockRatio, type) => {
    if (type === "block") {
        return 'rgb(100,100,100)';
    } else {
        let color = colorMap[id - 1];
        let colorRatio = map(1 - stockRatio, 0, 1, 30, 66);
        return color.replace('X', Math.floor(colorRatio));
    }
}

const map = (value, x1, y1, x2, y2) =>
    ((value - x1) * (y2 - x2)) / (y1 - x1) + x2;


module.exports = {
    corridorNames,
    toGridLayout,
    getColorValue,
    map,
    allCorridorNames
}