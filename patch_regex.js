const fs = require('fs');
const file = 'client/src/pages/AdminOrders.jsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /\{editData\.wilaya === 'غرداية' && \([\s\S]*?\n\s*\}\)\n\s*<input\s*type="text"[\s\S]*?\/>/;

if (regex.test(content)) {
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
  content = content.replace(regex, newBlock);
  fs.writeFileSync(file, content);
  console.log('Regex match found and replaced!');
} else {
  console.log("Regex match not found!");
}
