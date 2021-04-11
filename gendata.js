const fs = require("fs");

function generate(x, y, n) {
    const ret = [];

    const map = {};

    let corridors = [2, 3, 7, 8, 12, 13, 20, 21, 27, 28];
    for (let i = 0; i < n; i++) {
        const x1 = Math.floor(Math.random() * x);
        const y1 = Math.floor(Math.random() * y);
        const size = (1 / 4) * (Math.floor(Math.random() * 4) + 1);
        const title = Math.random().toString(36).substring(7);

        if (corridors.indexOf(x1) == -1 && corridors.indexOf(y1) == -1) {
            // console.log(map[x1 + "/" + y1]);
            // console.log(x1, y1);
            if (!map[x1 + "/" + y1]) {
                let stock = {
                    x: x1,
                    y: 0,
                    z: y1,
                    title,
                    size,
                };
                ret.push(stock);
                map[x1 + "/" + y1] = true;
            }
        } else {
            i--;
        }
    }

    return ret;
}

const data = {
    items: generate(32, 32, 64*32),
};

// for (let i = 0; i < 32; i++) {
//     let xi = data.items[i].x;
//     let yi = data.items[i].z;
//     for (let j = i+1; j < 32; j++) {
//         let xj = data.items[j].x;
//         let yj = data.items[j].z;
//         if (xi == xj && yi == yj) {
//             console.log("dupp", i, j);
//             console.log(data.items[i], data.items[j] );
//         } else {
//             console.log("no dup");
//         }
//     }
// }

fs.writeFile("src/data.json", JSON.stringify(data), "utf8", function (err) {
    if (err) {
        console.log("An error occured while writing JSON Object to File.");
        return console.log(err);
    }

    console.log("JSON file has been saved.");
});
