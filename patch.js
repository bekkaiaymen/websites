const fs = require('fs');
const file = 'client/src/pages/AdminOrders.jsx';
let content = fs.readFileSync(file, 'utf8');

const startMatch = "                                      {editData.wilaya === 'غرداية' && (";
const endMatch = `                                        className="w-full bg-[#0f0a08] border border-brand-gold/30 rounded-lg p-2 text-brand-cream"\n                                      />`;

const startIdx = content.indexOf(startMatch);
if (startIdx === -1) {
  console.log("Start match not found");
  process.exit(1);
}

// Find the input field end
const inputIdx = content.indexOf('<input', startIdx);
const endIdx = content.indexOf('/>', inputIdx) + 2;

const blockToReplace = content.substring(startIdx, endIdx);

const newBlock = `{editData.wilaya === 'غرداية' ? (
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

content = content.replace(blockToReplace, newBlock);

fs.writeFileSync(file, content);
console.log('Done!');
