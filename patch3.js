const fs = require('fs');
const file = 'client/src/pages/AdminOrders.jsx';
let content = fs.readFileSync(file, 'utf8');

const anchor1 = "البلدية / العنوان"; // might not match due to encoding
const anchor2 = "editData.wilaya ===";

const idx = content.indexOf(anchor2);
if (idx === -1) {
  console.log("Could not find anchor2");
  process.exit(1);
}

// Find the start of the line where {editData.wilaya === ... is
let startIdx = content.lastIndexOf('{', idx);

// Find the next </div> which is the end of this field.
// Actually, find the end of the <input ... />
const inputIdx = content.indexOf('<input', startIdx);
const endIdx = content.indexOf('/>', inputIdx) + 2;

const chunk = content.substring(startIdx, endIdx);
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
console.log("Done successfully!");
