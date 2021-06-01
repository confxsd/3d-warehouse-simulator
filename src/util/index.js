const { color } = require("d3-color");
const LAYOUT_CORRIDOR_MAP = require("../maps/LAYOUT_CORRIDOR_MAP");

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


const getCorridorDist = (name) => {
    const firstCorridor = 'A';
    return name.charCodeAt(0) - firstCorridor.charCodeAt(0);
}



const locToGridPoint = (locId, size) => {
    if (locId === "start") {
        return {
            x: 8 * 4 + 1,
            y: -5,
            type: "start"
        }
    } else if (locId.includes("Yol") || locId.includes("yol")) {
        const order = parseInt(locId.slice(4, 6));
        if (order <= 8) {
            return {
                x: (order) * 4 + 0.5,
                y: -1.5,
                type: "path",
            }
        }
        else if (order < 18) {
            return {
                x: (order - 8) * 4 + 0.5,
                y: size.y + 1.5,
                type: "path",
            }
        } else if (order === 18) {
            return {
                x: 0.5,
                y: -1.5,
                type: "path",
            }
        } else if (order === 19) {
            return {
                x: 0.5,
                y: size.y + 1.5,
                type: "path",
            }
        }
    }
    else {
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
            x, y, type: isLocAtLeft ? "left" : "right"
        }
    }
}

const determineRoutePaths = (locs, type, size) => {
    let paths = []
    let indent = 0;

    if (type === "orig") {
        indent = 1.2;
    } else if (type == "opt") {
        indent = 1.5;
    }

    for (let i = 0; i < locs.length - 1; i++) {
        const p1 = locToGridPoint(locs[i], size);
        const p2 = locToGridPoint(locs[i + 1], size);

        if (p1.type === "left") {
            p1.x += indent
        } else if (p1.type === "right") {
            p1.x -= indent
        } else if (p1.type === "path") {

        }


        if (p2.type === "left") {
            p2.x += indent
        } else if (p2.type === "right") {
            p2.x -= indent
        } else if (p2.type === "path") {

        }

        paths.push([p1, p2])
    }

    return paths;
}

const fillRestOfLayout = (layout) => {
    const corrNames = allCorridorNames();

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

    return fillEmptySlots(layout);
}

const toGridLayout = (layout, type) => {
    let layoutMapped;
    if (type == "get") {
        layoutMapped = layout.map(loc => {
            const point = locToGridPoint(loc.LocId);
            return {
                id: loc.LocId,
                x: point.x,
                z: point.y,
                stock: loc.Stok,
                locWeight: loc.LocWeight,
                proWeight: loc.ProWeight,
                proCategory: null,
                maxQuan: loc.MaxQuan,
                insertedAt: loc.InsertedAt,
                proId: loc.ProId,
                fromWhichResult: "get"
            }
        });
    } else if (type == "filter") {
        layoutMapped = layout.map(loc => {
            const point = locToGridPoint(loc.Lokasyon);
            return {
                id: loc.Lokasyon,
                x: point.x,
                z: point.y,
                stock: loc["Koli Miktari"],
                locWeight: loc["Lokasyon Agirlik Grubu"],
                proCategory: loc["Kategori"],
                proWeight: loc["Urun Agirlik Grubu"],
                maxQuan: loc["Max Quantity"],
                insertedAt: loc.Inserted_At,
                proId: loc["Product ID"],
                fromWhichResult: "filter"
            }
        });
    } else {
        throw Error("Invalid formatting type (must be get or filter)")
    }

    return fillRestOfLayout(layoutMapped);
}

const isLocEmpty = (layout, corr, order) => {
    const locId = toLocationId(corr, order);
    const point = locToGridPoint(locId);

    for (let i = 0; i < layout.length; i++) {
        const loc = layout[i];
        if (loc.x === point.x && loc.z === point.y) return false;
    }

    return true;
}

const toLocationId = (corr, order) => {
    const orderPadded = String(order).padStart(3, '0');
    return `4${corr}${orderPadded}K1`;
}

const fillEmptySlots = (layout) => {
    let empties = []
    Object.keys(LAYOUT_CORRIDOR_MAP).forEach((corrName) => {
        const corr = LAYOUT_CORRIDOR_MAP[corrName];
        if (corr.left) {
            for (let i = corr.left.range[0]; i <= corr.left.range[1]; i++) {
                if (corr.left.blocks && corr.left.blocks.indexOf(i) !== -1) continue;
                if (isLocEmpty(layout, corrName, i)) {
                    empties.push({
                        corrName,
                        i
                    })
                }
            }
        }
        if (corr.right) {
            for (let i = corr.right.range[0]; i <= corr.right.range[1]; i++) {
                if (corr.right.blocks && corr.right.blocks.indexOf(i) !== -1) continue;
                if (isLocEmpty(layout, corrName, i)) {
                    empties.push({
                        corrName,
                        i
                    })
                }
            }
        }
    })


    empties.forEach((e) => {
        const locId = toLocationId(e.corrName, e.i);
        const point = locToGridPoint(locId);

        layout.push({
            x: point.x,
            z: point.y,
            id: locId,
            stock: 0,
            maxQuan: 9999,
            locWeight: -1,
            proWeight: null,
            insertedAt: null,
            proId: null
        });
    })

    return layout;
}

const colorMap = [
    'hsl(60, 65%, X%)',
    'hsl(120, 65%, X%)',
    'hsl(180, 65%, X%)',
    'hsl(220, 65%, X%)',
    'hsl(350, 65%, X%)',
]

const getColorValue = (id, stockRatio, type) => {
    if (type === "block") {
        return 'rgb(100,100,100)';
    } else if (id === -1) {
        return 'rgb(255, 255, 255)'
    } else {
        let color = colorMap[id - 1];
        let colorRatio = map(1 - stockRatio, 0, 1, 25, 60);
        return color.replace('X', Math.floor(colorRatio));
    }
}

const timeout = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const map = (value, x1, y1, x2, y2) =>
    ((value - x1) * (y2 - x2)) / (y1 - x1) + x2;


const checkDate = (dateStr) => {
    const pattern = /^(\d{4})(\/|-)(\d{1,2})(\/|-)(\d{1,2})$/

    const dateMatch = dateStr.match(pattern);

    if (!dateMatch) {
        return false;
    }
    const date = new Date(dateStr);
    if (date - new Date() >= 0) {
        return false;
    }

    return true;
}

module.exports = {
    corridorNames,
    toGridLayout,
    getColorValue,
    locToGridPoint,
    map,
    allCorridorNames,
    determineRoutePaths,
    timeout,
    checkDate
}