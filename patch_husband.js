const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'client', 'src', 'pages', 'HusbandCheckout.jsx');

let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes('const isReadyBox')) {
  // Insert isReadyBox after searchParams
  content = content.replace(
    /const flavors = searchParams\.get\('flavors'\) \|\| 'غير محدد';/g,
    `const flavors = searchParams.get('flavors') || 'غير محدد';\n  const isReadyBox = searchParams.get('isReadyBox') === 'true';`
  );
  
  // Make input readonly
  content = content.replace(
    /onChange=\{\(e\) => setEditedBudget\(e.target.value\)\}/g,
    `onChange={(e) => setEditedBudget(e.target.value)}\n                  readOnly={isReadyBox}\n                  disabled={isReadyBox}`
  );
  
  // Change text of input label
  content = content.replace(
    /الميزانية المطلوبة \(تستطيع تعديلها\):/g,
    `الميزانية المطلوبة {isReadyBox ? '(ثابتة)' : '(تستطيع تعديلها)'}:`
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Patched');
} else {
  console.log('Already patched');
}
