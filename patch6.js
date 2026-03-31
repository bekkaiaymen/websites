const fs = require('fs');
const file = 'client/src/pages/AdminOrders.jsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the municipalities array first using regex for flexible whitespace
const arrayRegex = /const ghardaiaMunicipalities = \[\s*\{ name: 'غرداية'[\s\S]*?\];/;
const newArray = `const ghardaiaMunicipalities = [
    { name: 'غرداية', cost: 200 },
    { name: 'مليكة', cost: 200 },
    { name: 'بن يزقن', cost: 200 },
    { name: 'بنورة', cost: 200 },
    { name: 'لشبور', cost: 300 },
    { name: 'التوزوز', cost: 300 },
    { name: 'تافيلالت', cost: 300 },
    { name: 'العطف', cost: 350 },
    { name: 'بوهراوة', cost: 350 },
    { name: 'الضاية', cost: 350 },
    { name: 'لازون', cost: 400 },
    { name: 'بريان', cost: 500 },
    { name: 'متليلي', cost: 500 },
    { name: 'القرارة', cost: 500 }
  ];`;

content = content.replace(arrayRegex, newArray);


// Use simple indexOf
const labelEnd = "البلدية / العنوان\n                                      </label>";

const blockRegex = /\{editData\.wilaya === 'غرداية' && \([\s\S]*?<\/select>\s*\}\)\s*<input[\s\S]*?className="w-full bg-\[\#0f0a08\] border border-brand-gold\/30 rounded-lg p-2 text-brand-cream"\s*\/>/;

const match = content.match(blockRegex);
if (!match) {
    console.log("Could not find the block via regex either. Fallback to start/end matching.");
    
    const startStr = "{editData.wilaya === 'غرداية' && (";
    const startIdx = content.indexOf(startStr);
    if(startIdx !== -1) {
         let inputIdx = content.indexOf('<input', startIdx);
         let endIdx = content.indexOf('/>', inputIdx) + 2;
         let chunk = content.substring(startIdx, endIdx);
         console.log("Found chunk:\n" + chunk);
         
         const newChunk = `{editData.wilaya === 'غرداية' ? (
                                        <select
                                          value={editData.address || ''}
                                          onChange={(e) => handleMunicipalityChange(e.target.value)}
                                          className="w-full bg-[#0f0a08] border border-brand-gold/30 rounded-lg p-2 text-brand-cream"
                                        >
                                          <option value="" disabled>اختر البلدية...</option>
                                          {ghardaiaMunicipalities.map((m, idx) => (
                                              <option key={idx} value={m.name}>{m.name} ({m.cost} دج)</option>
                                          ))}
                                        </select>
                                      ) : (
                                        <input
                                          type="text"
                                          value={editData.address || ''}
                                          onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                                          className="w-full bg-[#0f0a08] border border-brand-gold/30 rounded-lg p-2 text-brand-cream"
                                        />
                                      )}`;
         content = content.replace(chunk, newChunk);
         fs.writeFileSync(file, content);
         console.log("Replaced via fallback!");
    }
} else {
    // it was found
    console.log("Replaced via regex!");
}

