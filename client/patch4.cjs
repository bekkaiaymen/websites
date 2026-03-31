const fs = require("fs");
let c = fs.readFileSync("src/pages/AdminHintSettings.jsx", "utf8");

// Print line 100-115 to debug
let lines = c.split("\n");
for(let i = 100; i < 115; i++) {
    if(lines[i]) console.log(`${i+1}: ${lines[i]}`);
}

