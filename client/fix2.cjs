const fs = require('fs');
let p = 'src/pages/AdminProducts.jsx';
let content = fs.readFileSync(p, 'utf8');

content = content.replace(
  /<button\s+type="submit"\s+className="flex-1 bg-brand-gold text-brand-dark px-6 py-3 rounded-lg font-semibold hover:bg-brand-gold-light transition-colors"\s*>\s*إضافة\s*<\/button>/g,
  `<button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-brand-gold text-brand-dark px-6 py-3 rounded-lg font-semibold hover:bg-brand-gold-light transition-colors flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Loader className="w-5 h-5 animate-spin" />
                      جاري الإضافة...
                    </div>
                  ) : (
                    'إضافة'
                  )}
                </button>`
);

// We should also check the save button for editing:
content = content.replace(
  /<button\s+onClick=\{\(\) => handleSave\(product\._id\)\}\s+className="p-2 bg-green-900\/50 text-green-500 rounded hover:bg-green-900 transition-colors"\s+title="حفظ"\s*>\s*<Save className="w-5 h-5" \/>\s*<\/button>/g,
  `<button
                        onClick={() => handleSave(product._id)}
                        disabled={isSubmitting}
                        className="p-2 bg-green-900/50 text-green-500 rounded hover:bg-green-900 transition-colors disabled:opacity-50"
                        title="حفظ"
                      >
                        {isSubmitting ? <Loader className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      </button>`
);

fs.writeFileSync(p, content, 'utf8');
console.log('Success');
