const layout = require("./layout.json")
const layoutSorter = (a, b) => {
    if (a.LocId[1] < b.LocId[1]) return -1;
    if ((a.LocId[1] == b.LocId[1]) && (parseInt(a.LocId.slice(2, 5)) < parseInt(b.LocId.slice(2, 5)))) return -1;
    else return 0;
}

const corridorNames = (layout) => {
    const names = new Set()
    layout.forEach(loc => {
        names.add(loc.LocId[1]);
    });
    return names;
}

console.log(corridorNames(layout.info))

const locToGridPoint = (locId) => {
    const firstCorridor = 'B'
    const corridorLength = 38
    const corridorName = locId[1];
    const index = parseInt(locId.slice(2, 5));

    const corridorDist = corridorName.charCodeAt(0) - firstCorridor.charCodeAt(0);
    let x = corridorDist * 2 + (index > corridorLength ? 2 : 5);
    let y = index > corridorLength ? index - corridorLength - 1 : index;

    if (corridorDist == 0) {
        x = (index > corridorLength ? 3 : 0);
    }

    return {
        x, y
    }
}

layout.info.sort(layoutSorter)



const toGridLayout = (layout, sorter) => {
    layoutSorted = layout.sort(sorter)
    return layout.map(loc => {
        const point = locToGridPoint(loc.LocId);
        return {
            id: loc.LocId,
            x: point.x,
            y: point.y,
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

const gridLayout = toGridLayout(layout.info, layoutSorter);
// console.log(locToGridPoint(layout.info[0].LocId));

gridLayout.forEach(loc => {
    console.log(loc.id, loc.x, loc.y);
})