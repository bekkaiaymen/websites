const fs = require("fs");
const path = require("path");
const filePath = path.join(__dirname, "client", "src", "pages", "AdminHintSettings.jsx");
let content = fs.readFileSync(filePath, "utf8");
const newStr = `                    <div className="md:col-span-2">
                      <label className="block text-sm text-brand-gold mb-1">صورة البوكس (اختياري)</label>
                      <div className="flex gap-4 items-center">
                        {box.image && (
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-brand-gold/30 shrink-0 bg-black/50">
                            <img src={box.image} alt="box" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleReadyBoxImage(index, e)}
                          className="w-full bg-black/50 border border-brand-gold/20 rounded-lg px-4 py-2 focus:outline-none focus:border-brand-gold text-white"
                        />
                      </div>
                    </div>`;

let fileLines = content.split("\n");
for (let i = 0; i < fileLines.length; i++) {
   if (fileLines[i].includes("placeholder=\"https://example.com/image.jpg\"")) {
       let startIdx = i;
       while (startIdx > 0 && !fileLines[startIdx].includes("<div className=\"md:col-span-2\">")) {
           startIdx--;
       }
       let endIdx = i;
       while (endIdx < fileLines.length && !fileLines[endIdx].includes("</div>")) {
           endIdx++;
       }
       if (startIdx < i && endIdx > i) {
           fileLines.splice(startIdx, endIdx - startIdx + 1, newStr);
           content = fileLines.join("\n");
           
           // Also add handleReadyBoxImage function
           const updateFunc = /const updateReadyBox = \([^)]*\) => {[\s\S]*?setSettings.*?;[\s]*};/;
           const handleFileStr = `\n\n    const handleReadyBoxImage = (index, e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          updateReadyBox(index, "image", reader.result);
        };
        reader.readAsDataURL(file);
      }
    };`;
           
           if (!content.includes("handleReadyBoxImage")) {
               content = content.replace(updateFunc, match => match + handleFileStr);
           }
           
           fs.writeFileSync(filePath, content, "utf8");
           console.log("Updated correctly!");
           break;
       }
   }
}
