const fs = require('fs');
let p = 'src/pages/AdminProducts.jsx';
let content = fs.readFileSync(p, 'utf8');

if (!content.includes('setIsSubmitting(true)') || !content.includes('handleSave')) {
   console.log('Skipping handleSave, verify manually');
}

content = content.replace(
  /const handleSave = async \(id\) => \{[\s\S]*?try \{/g,
  `const handleSave = async (id) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {`
);

content = content.replace(
  /fetchProducts\(\);\s*setError\(''\);\s*\} catch \(err\) \{/g,
  `fetchProducts();
      setError('');
    } catch (err) {`
);

content = content.replace(
  /window\.scrollTo\(\{ top: 0, behavior: 'smooth' \}\);\s*\}/g,
  `window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }`
);

fs.writeFileSync(p, content, 'utf8');
console.log('Done handleSave update');
