const fs = require('fs');
const file = 'client/src/pages/AdminOrders.jsx';
let content = fs.readFileSync(file, 'utf8');

const oldBlock = `{editData.wilaya === 'غرداية' && (
                                        <select
                                          value={ghardaiaMunicipalities.some(m => m.name === editData.address) ? editData.address : 'custom'}
                                          onChange={(e) => handleMunicipalityChange(e.target.value)}
                                          className="w-full bg-[#0f0a08] border border-brand-gold/30 rounded-lg p-2 text-brand-cream mb-2"
                                        >
                                          <option value="custom" disabled>اختر البلدية...</option>
                                          {ghardaiaMunicipalities.map((m, idx) => (
                                              <option key={idx} value={m.name}>{m.name} ({m.cost} دج)</option>
                                          ))}
                                          <option value="custom">أخرى (كتابة يدوية)</option>
                                        </select>
                                      )}`;

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
                                      ) :`;

content = content.replace(oldBlock, newBlock);

const inputEnd = `                                        className="w-full bg-[#0f0a08] border border-brand-gold/30 rounded-lg p-2 text-brand-cream"
                                      />`;

const newInputEnd = `                                        className="w-full bg-[#0f0a08] border border-brand-gold/30 rounded-lg p-2 text-brand-cream"
                                      />
                                      )}`;

content = content.replace(inputEnd, newInputEnd);

fs.writeFileSync(file, content);
console.log('done');
