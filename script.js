const fs = require('fs');
let code = fs.readFileSync('E:/delivery/client/src/components/AdvancedCustomBoxBuilder.jsx', 'utf8');

const oldStr = '<div className="space-y-1 md:space-y-2">\n                    <p className="text-xs md:text-sm text-gray-400">الميزانية المحددة</p>\n                    <p className="text-xl md:text-3xl font-bold text-brand-gold">{budget.toLocaleString()} دج</p>\n                  </div>';

const newStr = '<div className="space-y-1 md:space-y-2 flex flex-col items-center md:items-start">\n                    <p className="text-xs md:text-sm text-gray-400">الميزانية المحددة</p>\n                    <div className="flex items-center gap-2">\n                      <input type="number" min="500" step="100" value={budget || \\'\\'} onChange={(e) => setBudget(parseInt(e.target.value) || 0)} className="w-24 md:w-32 bg-[#1a120f] border-2 border-brand-gold/50 rounded-lg p-1 text-center text-xl md:text-2xl font-bold text-brand-gold focus:outline-none focus:border-brand-gold transition-colors" />\n                      <span className="text-sm md:text-lg text-brand-gold font-bold">دج</span>\n                    </div>\n                  </div>';

if (code.includes(oldStr)) {
    code = code.replace(oldStr, newStr);
    fs.writeFileSync('E:/delivery/client/src/components/AdvancedCustomBoxBuilder.jsx', code, 'utf8');
    console.log('Success');
} else {
    console.log('Not found');
}
