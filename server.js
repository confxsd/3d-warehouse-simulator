const express = require("express");
const path = require("path");
const app = express();
const port = Number(process.env.PORT || 3001);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new RangeError("PORT must be an integer between 1 and 65535");
}

app.use(express.static(path.join(__dirname, "dist")));

app.listen(port, () => {
    console.log(`Serving the app at http://localhost:${port}`);
});
