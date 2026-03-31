const fs = require("fs");
let c = fs.readFileSync("src/pages/AdminHintSettings.jsx", "utf8");
c = c.replace("    };\r\n        <Loader", "    };\n\n    const removeReadyBox = (index) => {\n      const newBoxes = settings.readyBoxes.filter((_, i) => i !== index);\n      setSettings(prev => ({ ...prev, readyBoxes: newBoxes }));\n    };\n\n    if (loading) {\n      return (\n        <div className=\"min-h-screen bg-[#1a120f] flex items-center justify-center\">\n          <Loader");
c = c.replace("    };\n        <Loader", "    };\n\n    const removeReadyBox = (index) => {\n      const newBoxes = settings.readyBoxes.filter((_, i) => i !== index);\n      setSettings(prev => ({ ...prev, readyBoxes: newBoxes }));\n    };\n\n    if (loading) {\n      return (\n        <div className=\"min-h-screen bg-[#1a120f] flex items-center justify-center\">\n          <Loader");
fs.writeFileSync("src/pages/AdminHintSettings.jsx", c, "utf8");
console.log("Fixed missing functions");

