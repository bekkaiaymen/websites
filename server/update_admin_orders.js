const fs = require('fs');
const file = '../client/src/pages/AdminOrders.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /wilaya: order\.wilaya \|\| '',\s*address: order\.address \|\| '',/,
  "wilaya: order.wilaya || '',\n        address: order.address || '',\n        notes: order.notes || '',"
);

content = content.replace(
  /<td className="p-3 text-gray-400 text-xs max-w-xs truncate">\s*\{order\.wilaya \? \\$\{order\.wilaya\} - \ : ''\}\{order\.address \|\| 'غير محدد'\}\s*<\/td>/,
  "<td className=\"p-3 text-sm max-w-xs whitespace-normal breaks-words\">\n" +
  "  <div className=\"text-gray-300 mb-1\">\n" +
  "    {order.wilaya ? ${order.wilaya} -  : ''}{order.address || 'غير محدد'}\n" +
  "  </div>\n" +
  "  {order.notes && (\n" +
  "    <div className=\"text-xs bg-yellow-500/20 text-yellow-300 p-2 rounded-md border border-yellow-500/30\">\n" +
  "      <strong>📍 معلومات إضافية للتوصيل:</strong><br/>\n" +
  "      {order.notes}\n" +
  "    </div>\n" +
  "  )}\n" +
  "</td>"
);

content = content.replace(
  /<div>\s*<label className="text-sm text-gray-400 mb-2 block">\s*المجموع/g,
  "<div className=\"col-span-1 md:col-span-4\">\n" +
  "  <label className=\"text-sm text-yellow-500/80 mb-2 block font-bold\">\n" +
  "    📍 معلومات إضافية للموصل (عنوان دقيق أو توجيهات)\n" +
  "  </label>\n" +
  "  <textarea\n" +
  "    value={editData.notes}\n" +
  "    onChange={(e) => setEditData({ ...editData, notes: e.target.value })}\n" +
  "    className=\"w-full bg-[#0f0a08] border border-yellow-500/30 rounded-lg p-2 text-brand-cream min-h-[80px]\"\n" +
  "    placeholder=\"مثال: بجانب الصيدلية، الطابق الثاني، الاتصال قبل نصف ساعة...\"\n" +
  "  />\n" +
  "</div>\n" +
  "<div>\n" +
  "  <label className=\"text-sm text-gray-400 mb-2 block\">\n" +
  "    المجموع"
);

fs.writeFileSync(file, content);
