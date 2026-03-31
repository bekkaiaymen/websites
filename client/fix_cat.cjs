const fs = require('fs');

async function fixCategories() {
  let p = 'src/pages/AdminCategories.jsx';
  let content = fs.readFileSync(p, 'utf8');

  const resizeLogic = `
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.6); // Adjust quality here if needed
`;

  content = content.replace(
    /const handleImageChange\s*=\s*\(e\)\s*=>\s*\{[\s\S]*?reader\.readAsDataURL\(file\);\s*\n\s*\};\s*\n/g,
    `const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');${resizeLogic}
          setImagePreview(dataUrl);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };
`
  );

  fs.writeFileSync(p, content, 'utf8');
}

fixCategories();
