const fs = require('fs');
const file = 'client/src/pages/AdminOrders.jsx';
let content = fs.readFileSync(file, 'utf8');

const ghardaiaCode = "  const ghardaiaMunicipalities = [\n" +
  "    { name: 'غرداية', price: 200 },\n" +
  "    { name: 'مليكة', price: 200 },\n" +
  "    { name: 'بن يزقن', price: 200 },\n" +
  "    { name: 'بنورة', price: 200 },\n" +
  "    { name: 'لشبور', price: 300 },\n" +
  "    { name: 'التوزوز', price: 300 },\n" +
  "    { name: 'تافيلالت', price: 300 },\n" +
  "    { name: 'العطف', price: 350 },\n" +
  "    { name: 'بوهراوة', price: 350 },\n" +
  "    { name: 'الضاية', price: 350 },\n" +
  "    { name: 'لازون', price: 400 },\n" +
  "    { name: 'بريان', price: 500 },\n" +
  "    { name: 'متليلي', price: 500 },\n" +
  "    { name: 'القرارة', price: 500 }\n" +
  "  ];\n" +
  "\n" +
  "  const handleMunicipalityChange = (municipalityName) => {\n" +
  "    if (municipalityName === 'custom') {\n" +
  "      setEditData(prev => ({ ...prev, address: '' }));\n" +
  "      return;\n" +
  "    }\n" +
  "    const selected = ghardaiaMunicipalities.find(m => m.name === municipalityName);\n" +
  "    if (!selected) return;\n" +
  "    const basePrice = selected.price;\n" +
  "    \n" +
  "    let finalCost = basePrice;\n" +
  "    if (editData.status === 'Returned') finalCost = basePrice * 0.5;\n" +
  "    // No cost adjustment for pending, the calculateDeliveryCost handles logic for when status changes.\n" +
  "    \n" +
  "    setEditData(prev => ({ ...prev, address: municipalityName, deliveryCost: finalCost }));\n" +
  "  };\n";

content = content.replace(
  /const startEdit = \(order\) => \{/,
  ghardaiaCode + "\n  const startEdit = (order) => {"
);

content = content.replace(
  /wilaya: order\.wilaya \|\| '',/g,
  "wilaya: order.wilaya || 'غرداية',"
);

content = content.replace(
  /<div>\s*<label className=\"text-sm text-gray-400 mb-2 block\">\s*Ø§Ù„Ø¹Ù†ÙˆØ§Ù†\s*<\/label>\s*<input\s*type=\"text\"\s*value=\{editData\.address\}\s*onChange=\{\(e\) => setEditData\(\{ \.\.\.editData, address: e\.target\.value \}\)\}\s*className=\"w-full bg-\[#0f0a08\] border border-brand-gold\/30 rounded-lg p-2 text-brand-cream\"\s*\/>\s*<\/div>/,
  <div>
     <label className="text-sm text-gray-400 mb-2 block">
       البلدية / العنوان
     </label>
     {editData.wilaya === 'غرداية' && (
       <select
         value={ghardaiaMunicipalities.some(m => m.name === editData.address) ? editData.address : 'custom'}
         onChange={(e) => handleMunicipalityChange(e.target.value)}
         className="w-full bg-[#0f0a08] border border-brand-gold/30 rounded-lg p-2 text-brand-cream mb-2"
       >
         <option value="custom" disabled>اختر البلدية...</option>
         {ghardaiaMunicipalities.map((m, idx) => (
           <option key={idx} value={m.name}>{m.name} ({m.price} دج)</option>
         ))}
         <option value="custom">أخرى (كتابة يدوية)</option>
       </select>
     )}
     <input
       type="text"
       value={editData.address || ''}
       onChange={(e) => setEditData({ ...editData, address: e.target.value })}
       placeholder="أدخل العنوان تفصيليا"
       className="w-full bg-[#0f0a08] border border-brand-gold/30 rounded-lg p-2 text-brand-cream"
     />
   </div>
);

fs.writeFileSync(file, content);
