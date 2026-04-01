const fs = require('fs');

async function fix() {
  const pages = ['src/pages/AdminProducts.jsx', 'src/pages/AdminCategories.jsx', 'src/pages/AdminHintSettings.jsx'];
  
  for (let p of pages) {
    if (!fs.existsSync(p)) continue;
    let text = fs.readFileSync(p, 'utf8');
    
    // Add logic to check for 401/403
    text = text.replace(/if \(!response\.ok\)\s*(?:\{\s*)?throw new Error\(([^)]+)\);?(?:\s*\})?/g, (match, errorMsg) => {
      // Don't replace if we already added it
      if (match.includes('response.status === 401')) return match;
      
      return `if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = '/admin/login';
        return;
      }
      if (!response.ok) throw new Error(${errorMsg});`;
    });
    
    fs.writeFileSync(p, text, 'utf8');
  }
}

fix();
