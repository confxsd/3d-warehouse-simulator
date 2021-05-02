const layoutSorter = (a, b) => {
    if (a.LocId[1] < b.LocId[1]) return -1;
    if ((a.LocId[1] == b.LocId[1]) && (parseInt(a.LocId.slice(2, 5)) < parseInt(b.LocId.slice(2, 5)))) return -1;
    else return 0;
}

const corridorNames = (layout) => {
    const names = new Set()
    layout.forEach(loc => {
        names.add(loc.id[1]);
    });
    return Array.from(names).sort();
}

const locToGridPoint = (locId) => {
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

const markEmptyLocs = (layout) => {

}

const toGridLayout = (layout) => {
    // layoutSorted = layout.sort(layoutSorter)
    return layout.map(loc => {
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
    })
}

const colorMap = [
    'hsl(30, 60%, X%)',
    'hsl(60, 60%, X%)',
    'hsl(90, 60%, X%)',
    'hsl(120, 60%, X%)',
    'hsl(150, 60%, X%)',
]

const getColorValue = (id, stockRatio) => {
    let color = colorMap[id - 1];
    let colorRatio = map(1 - stockRatio, 0, 1, 30, 66);
    return color.replace('X', Math.floor(colorRatio));
}

const map = (value, x1, y1, x2, y2) =>
    ((value - x1) * (y2 - x2)) / (y1 - x1) + x2;


module.exports = {
    corridorNames,
    toGridLayout,
    getColorValue,
    map
}