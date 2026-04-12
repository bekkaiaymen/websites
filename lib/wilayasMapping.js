/**
 * WILAYA CODES MAPPING - الولايات الجزائرية الـ 58
 * 
 * الحقول الإلزامية في Ecotrack:
 * ✋ nom et prenom du destinataire* (اسم العميل)
 * ✋ telephone* (الهاتف - بصيغة: 0xxxxxxxxx)
 * ✋ code wilaya* (كود الولاية من 1-58)
 * ✋ commune de livraison* (البلدية)
 * ✋ adresse de livraison* (العنوان)
 * ✋ produit* (اسم المنتج)
 * ✋ montant du colis* (المبلغ نهائي مع التوصيل)
 */

// ============================================================================
// الولايات الجزائرية - Mapping كود → اسم بالعربية → اسم بالفرنسية
// ============================================================================
const wilayasData = {
  1: { nameAr: 'أدرار', nameFr: 'Adrar' },
  2: { nameAr: 'الشلف', nameFr: 'Chlef' },
  3: { nameAr: 'الأغواط', nameFr: 'Laghouat' },
  4: { nameAr: 'أم البواقي', nameFr: 'Oum El Bouaghi' },
  5: { nameAr: 'باتنة', nameFr: 'Batna' },
  6: { nameAr: 'بجاية', nameFr: 'Béjaïa' },
  7: { nameAr: 'بسكرة', nameFr: 'Biskra' },
  8: { nameAr: 'بشار', nameFr: 'Béchar' },
  9: { nameAr: 'البليدة', nameFr: 'Blida' },
  10: { nameAr: 'بويرة', nameFr: 'Bouira' },
  11: { nameAr: 'تمنراست', nameFr: 'Tamanrasset' },
  12: { nameAr: 'تبسة', nameFr: 'Tébessa' },
  13: { nameAr: 'تلمسان', nameFr: 'Tlemcen' },
  14: { nameAr: 'تيارت', nameFr: 'Tiaret' },
  15: { nameAr: 'تيزي وزو', nameFr: 'Tizi Ouzou' },
  16: { nameAr: 'الجزائر', nameFr: 'Alger' },
  17: { nameAr: 'الجلفة', nameFr: 'Djelfa' },
  18: { nameAr: 'جيجل', nameFr: 'Jijel' },
  19: { nameAr: 'سطيف', nameFr: 'Sétif' },
  20: { nameAr: 'سعيدة', nameFr: 'Saïda' },
  21: { nameAr: 'سكيكدة', nameFr: 'Skikda' },
  22: { nameAr: 'سيدي بلعباس', nameFr: 'Sidi Bel Abbès' },
  23: { nameAr: 'عنابة', nameFr: 'Annaba' },
  24: { nameAr: 'قالمة', nameFr: 'Guelma' },
  25: { nameAr: 'قسنطينة', nameFr: 'Constantine' },
  26: { nameAr: 'المدية', nameFr: 'Médéa' },
  27: { nameAr: 'مستغانم', nameFr: 'Mostaganem' },
  28: { nameAr: 'م\'سيلة', nameFr: 'M\'sila' },
  29: { nameAr: 'معسكر', nameFr: 'Mascara' },
  30: { nameAr: 'ورقلة', nameFr: 'Ouargla' },
  31: { nameAr: 'وهران', nameFr: 'Oran' },
  32: { nameAr: 'البيض', nameFr: 'El Bayadh' },
  33: { nameAr: 'إليزي', nameFr: 'Illizi' },
  34: { nameAr: 'برج بوعريريج', nameFr: 'Bordj Bou Arreridj' },
  35: { nameAr: 'بومرداس', nameFr: 'Boumerdès' },
  36: { nameAr: 'التارف', nameFr: 'El Tarf' },
  37: { nameAr: 'تندوف', nameFr: 'Tindouf' },
  38: { nameAr: 'تيسمسيلت', nameFr: 'Tissemsilt' },
  39: { nameAr: 'الوادي', nameFr: 'El Oued' },
  40: { nameAr: 'خنشلة', nameFr: 'Khenchela' },
  41: { nameAr: 'سوق أهراس', nameFr: 'Souk Ahras' },
  42: { nameAr: 'تيبازة', nameFr: 'Tipaza' },
  43: { nameAr: 'ميلة', nameFr: 'Mila' },
  44: { nameAr: 'عين الدفلة', nameFr: 'Aïn Defla' },
  45: { nameAr: 'النعامة', nameFr: 'Naâma' },
  46: { nameAr: 'عين تموشنت', nameFr: 'Aïn Temouchent' },
  47: { nameAr: 'غرداية', nameFr: 'Ghardaïa' },
  48: { nameAr: 'رليزان', nameFr: 'Relizane' },
  49: { nameAr: 'تيمومون', nameFr: 'Timimoun' },
  50: { nameAr: 'برج باجي مختار', nameFr: 'Bordj Badji Mokhtar' },
  51: { nameAr: 'أولاد جلال', nameFr: 'Ouled Djellal' },
  52: { nameAr: 'بني عباس', nameFr: 'Beni Abbès' },
  53: { nameAr: 'إن صالح', nameFr: 'In Salah' },
  54: { nameAr: 'إن قزام', nameFr: 'In Guezzam' },
  55: { nameAr: 'توقورت', nameFr: 'Touggourt' },
  56: { nameAr: 'جانت', nameFr: 'Djanet' },
  57: { nameAr: 'المغير', nameFr: 'El Mghair' },
  58: { nameAr: 'المنيعة', nameFr: 'El Meniaa' }
};

/**
 * دالة للحصول على كود الولاية من الاسم
 * تقبل: اسم بالعربية أو الفرنسية أو رقم مباشرة
 */
function getWilayaCode(input) {
  if (!input) return null;

  const inputStr = String(input).toLowerCase().trim();

  // إذا كان رقم مباشرة (1-58)
  if (!isNaN(input) && input >= 1 && input <= 58) {
    return parseInt(input);
  }

  // البحث في الولايات
  for (const [code, data] of Object.entries(wilayasData)) {
    const codeNum = parseInt(code);
    const nameAr = data.nameAr.toLowerCase();
    const nameFr = data.nameFr.toLowerCase();

    // مطابقة دقيقة أو جزئية
    if (nameAr === inputStr || nameFr === inputStr || 
        nameAr.includes(inputStr) || inputStr.includes(nameAr.split(' ')[0]) ||
        nameFr.includes(inputStr) || inputStr.includes(nameFr.split(' ')[0])) {
      return codeNum;
    }
  }

  return null; // لم يُجد الولاية
}

/**
 * دالة للحصول على اسم الولاية من الكود
 */
function getWilayaName(code, language = 'ar') {
  const codNum = parseInt(code);
  if (wilayasData[codNum]) {
    return language === 'fr' ? wilayasData[codNum].nameFr : wilayasData[codNum].nameAr;
  }
  return null;
}

/**
 * دالة لتنسيق رقم الهاتف بالصيغة المقبولة
 * تدخيل: أي صيغة
 * تخرج: 0xxxxxxxxx (10 أرقام بدأً بـ 0)
 */
function formatPhoneNumber(phone) {
  if (!phone) return '';

  let cleaned = String(phone).trim().replace(/\D/g, ''); // احذف كل رمز غير رقمي

  // تحويل من +213 إلى 0
  if (cleaned.startsWith('213')) {
    cleaned = '0' + cleaned.substring(3);
  }

  // تحويل من 00213 إلى 0
  if (cleaned.startsWith('00213')) {
    cleaned = '0' + cleaned.substring(5);
  }

  // تأكد أنه يبدأ بـ 0
  if (!cleaned.startsWith('0')) {
    cleaned = '0' + cleaned;
  }

  // خذ أول 10 أرقام فقط
  return cleaned.substring(0, 10);
}

/**
 * دالة للتحقق من أن الحقول الإلزامية موجودة
 */
function validateMandatoryFields(order) {
  const errors = [];

  // 1. الاسم
  if (!order.customerName || order.customerName.trim() === '') {
    errors.push('❌ اسم العميل مفقود');
  }

  // 2. الهاتف
  if (!order.phone) {
    errors.push('❌ رقم الهاتف مفقود');
  } else {
    const formatted = formatPhoneNumber(order.phone);
    if (!formatted || formatted.length < 10) {
      errors.push(`❌ رقم الهاتف غير صحيح: ${order.phone}`);
    }
  }

  // 3. كود الولاية
  if (!order.wilayaCode) {
    errors.push('❌ كود الولاية مفقود');
  } else if (parseInt(order.wilayaCode) < 1 || parseInt(order.wilayaCode) > 58) {
    errors.push(`❌ كود الولاية غير صحيح: ${order.wilayaCode}`);
  }

  // 4. البلدية
  if (!order.commune || order.commune.trim() === '') {
    errors.push('❌ البلدية مفقودة');
  }

  // 5. العنوان
  if (!order.address || order.address.trim() === '') {
    errors.push('❌ العنوان مفقود');
  }

  // 6. المنتج
  if (!order.product || order.product.trim() === '') {
    errors.push('❌ اسم المنتج مفقود');
  }

  // 7. المبلغ
  if (!order.amount || isNaN(order.amount) || order.amount <= 0) {
    errors.push('❌ المبلغ مفقود أو غير صحيح');
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

// ============================================================================
// Export للاستخدام في ملفات أخرى
// ============================================================================
module.exports = {
  wilayasData,
  getWilayaCode,
  getWilayaName,
  formatPhoneNumber,
  validateMandatoryFields,
  
  // معلومات Ecotrack
  ecotrackHeaders: [
    'reference commande',
    'nom et prenom du destinataire*',
    'telephone*',
    'telephone 2',
    'code wilaya*',
    'wilaya de livraison',
    'commune de livraison*',
    'adresse de livraison*',
    'produit*',
    'poids (kg)',
    'montant du colis*',
    'remarque',
    'FRAGILE\r\n( si oui mettez OUI sinon laissez vide )',
    'ECHANGE\r\n( si oui mettez OUI sinon laissez vide )',
    'PICK UP\r\n( si oui mettez OUI sinon laissez vide )',
    'RECOUVREMENT\r\n( si oui mettez OUI sinon laissez vide )',
    'STOP DESK\r\n( si oui mettez OUI sinon laissez vide )',
    'Lien map'
  ]
};

// ============================================================================
// اختبار سريع
// ============================================================================
if (require.main === module) {
  console.log('\n🧪 اختبارات البيانات:\n');

  console.log('✅ الولايات الكلي:', Object.keys(wilayasData).length);
  console.log('✅ أعمدة Ecotrack:', module.exports.ecotrackHeaders.length);

  console.log('\n📝 اختبار tصيغ الهاتف:');
  console.log('  0661011000 →', formatPhoneNumber('0661011000'));
  console.log('  +213661011000 →', formatPhoneNumber('+213661011000'));
  console.log('  00213661011000 →', formatPhoneNumber('00213661011000'));

  console.log('\n📝 اختبار أكواد الولايات:');
  console.log('  "الجزائر" →', getWilayaCode('الجزائر'));
  console.log('  "Alger" →', getWilayaCode('Alger'));
  console.log('  16 →', getWilayaCode(16), '=', getWilayaName(16));
  console.log('  "غرداية" →', getWilayaCode('غرداية'));

  console.log('\n✅ جاهز للاستخدام!\n');
}
