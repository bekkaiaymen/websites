const fs = require('fs');
const file = 'client/src/pages/AdminOrders.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add pricing map inside component or outside
const pricingMapCode = "\n  const ghardaiaMunicipalities = [\n    { name: 'غرداية', price: 200 },\n    { name: 'مليكة', price: 200 },\n    { name: 'بن يزقن', price: 200 },\n    { name: 'بنورة', price: 200 },\n    { name: 'لشبور', price: 300 },\n    { name: 'التوزوز', price: 300 },\n    { name: 'تافيلالت', price: 300 },\n    { name: 'العطف', price: 350 },\n    { name: 'بوهراوة', price: 350 },\n    { name: 'الضاية', price: 350 },\n    { name: 'لازون', price: 400 },\n    { name: 'بريان', price: 500 },\n    { name: 'متليلي', price: 500 },\n    { name: 'القرارة', price: 500 }\n  ];\n\n  const handleMunicipalityChange = (municipalityName) => {\n    const selected = ghardaiaMunicipalities.find(m => m.name === municipalityName);\n    const basePrice = selected ? selected.price : 0;\n    const newCost = calculateDeliveryCost(editData.status || 'Pending', basePrice);\n    setEditData({ ...editData, address: municipalityName, deliveryCost: newCost });\n  };\n\n  ";

content = content.replace(
  /const startEdit = \(order\) => \{/g,
  pricingMapCode + "const startEdit = (order) => {"
);

// Update startEdit to default wilaya to Ghardaia if empty
content = content.replace(
  /wilaya: order\.wilaya \|\| '',/g,
  "wilaya: order.wilaya || 'غرداية',"
);

// Also need to fix calculateDeliveryCost because currently 'Pending' returns 0, so if they select while Pending it might become 0 in UI, but we want the UI cost input to show the base cost if they haven't shipped it yet. Actually, let's look at calculateDeliveryCost:
// const calculateDeliveryCost = (status, originalCost) => {
//   if (status === 'Delivered') return originalCost;
//   if (status === 'Returned') return originalCost * 0.5;
//   if (status === 'Pending') return 0; // Wait, if it's pending it returns 0. If they select a municipality while pending, it sets cost to 0!
// We should change calculateDeliveryCost's effect. If 'Pending' it returns 0 for *analytics*, but for the order itself the deliveryCost field SHOULD store the full expected price, or we handle it visually. Wait, if it returns 0 for Pending, it saves 0 to DB, so we lose the original cost! This is bad.
