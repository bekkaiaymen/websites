const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

/**
 * استخراج بيانات الولايات والبلديات من code_wilayas.xlsx
 * و تحليل صيغة Ecotrack من upload_ecotrack_v31.xlsx
 */

const downloadDir = path.join(process.env.USERPROFILE, 'Downloads');
const deskDir = path.join(process.env.USERPROFILE, 'Desktop');

// البحث عن الملفات
function findFile(filename, searchDirs = [downloadDir, deskDir, 'e:\\delivery']) {
  for (const dir of searchDirs) {
    const filePath = path.join(dir, filename);
    if (fs.existsSync(filePath)) {
      console.log(`✅ وجدت: ${filePath}`);
      return filePath;
    }
  }
  return null;
}

// ================== قراءة Wilaya Codes ==================
console.log('\n📊 استخراج بيانات الولايات والبلديات...\n');

const wilayaFile = findFile('code_wilayas.xlsx');
if (wilayaFile) {
  try {
    const wb = XLSX.readFile(wilayaFile);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws);

    console.log(`📋 الملف: ${wilayaFile}`);
    console.log(`📊 عدد الصفوف: ${data.length}`);
    console.log(`\n📌 أول 5 صفوف:\n`);
    console.table(data.slice(0, 5));

    // إنشاء mapping JSON للأكواد
    const wilayaMapping = {};
    data.forEach(row => {
      const code = Object.values(row)[0]; // أول عمود = الكود
      const nameAr = Object.values(row)[1]; // ثاني عمود = الاسم بالعربية
      const nameFr = Object.values(row)[2]; // ثالث عمود = الاسم بالفرنسية

      if (code && nameAr) {
        wilayaMapping[nameAr.toLowerCase().trim()] = {
          code: code,
          nameAr: nameAr,
          nameFr: nameFr || nameAr
        };
      }
    });

    console.log('\n✅ Mapping الولايات (JSON):\n');
    console.log(JSON.stringify(wilayaMapping, null, 2).substring(0, 1000) + '...\n');

  } catch (err) {
    console.error('❌ خطأ في قراءة code_wilayas.xlsx:', err.message);
  }
} else {
  console.log('❌ لم أجد code_wilayas.xlsx');
}

// ================== قراءة Ecotrack Template ==================
console.log('\n📋 استخراج صيغة Ecotrack المطلوبة...\n');

const ecotrackFile = findFile('upload_ecotrack_v31.xlsx');
if (ecotrackFile) {
  try {
    const wb = XLSX.readFile(ecotrackFile);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const headers = XLSX.utils.sheet_to_json(ws, { header: 1 })[0]; // أول صف = الرؤوس

    console.log(`📋 الملف: ${ecotrackFile}`);
    console.log(`\n🎯 أعمدة Ecotrack (بالترتيب الصحيح):\n`);

    headers.forEach((col, idx) => {
      const isMandatory = col.includes('*') ? '✋ MANDATORY' : '';
      console.log(`${idx + 1}. ${col} ${isMandatory}`);
    });

    console.log('\n✅ JSON Array للأعمدة:\n');
    console.log(JSON.stringify(headers, null, 2));

  } catch (err) {
    console.error('❌ خطأ في قراءة upload_ecotrack_v31.xlsx:', err.message);
  }
} else {
  console.log('❌ لم أجد upload_ecotrack_v31.xlsx');
}

console.log('\n✨ انتهى الاستخراج!\n');
