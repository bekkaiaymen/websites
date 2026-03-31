const fs = require('fs');
const file = 'client/src/pages/AdminOrders.jsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the municipalities array first.
const oldArray = `  const ghardaiaMunicipalities = [
    { name: 'غرداية', cost: 200 },
    { name: 'بونورة', cost: 200 },
    { name: 'بني يزقن', cost: 200 },
    { name: 'القرارة', cost: 600 },
    { name: 'بريان', cost: 500 },
    { name: 'زلفانة', cost: 500 },
    { name: 'المنيعة', cost: 1000 },
    { name: 'العطف', cost: 350 },
    { name: 'متليلي', cost: 500 },
    { name: 'سبسب', cost: 600 },
    { name: 'الضاية بن ضحوة', cost: 400 },
    { name: 'تغردايت', cost: 200 },
    { name: 'حاسي لفحل', cost: 800 },
    { name: 'منصورة', cost: 800 }
  ];`;

const newArray = `  const ghardaiaMunicipalities = [
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

content = content.replace(oldArray, newArray);


// Replace the specific select block
const startMatch = `                                      {editData.wilaya === 'غرداية' && (
                                        <select`;
                                        
const startIdx = content.indexOf(startMatch);

if (startIdx === -1) {
    console.log("Could not find start match!");
} else {
    // Find the NEXT <input type="text"
    const inputIdx = content.indexOf('<input', startIdx);
    // Find the end of this input
    const endIdx = content.indexOf('/>', inputIdx) + 2;
    
    const chunk = content.substring(startIdx, endIdx);
    
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
    console.log("Patch successfully applied!");
}
