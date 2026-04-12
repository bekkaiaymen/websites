/**
 * Wilaya Mapping - Algeria (1-58)
 * Maps Wilaya names to their official codes
 */

const WILAYA_MAPPING = {
  // Code => Name
  1: 'Adrar',
  2: 'Chlef',
  3: 'Laghouat',
  4: 'Oum El Bouaghi',
  5: 'Batna',
  6: 'Béjaïa',
  7: 'Biskra',
  8: 'Béchar',
  9: 'Blida',
  10: 'Bouira',
  11: 'Tamanrasset',
  12: 'Tébessa',
  13: 'Tlemcen',
  14: 'Tiaret',
  15: 'Tizi Ouzou',
  16: 'Alger',
  17: 'Djelfa',
  18: 'Jijel',
  19: 'Sétif',
  20: 'Saïda',
  21: 'Skikda',
  22: 'Sidi Bel Abbès',
  23: 'Annaba',
  24: 'Guelma',
  25: 'Constantine',
  26: 'Médéa',
  27: 'Mostaganem',
  28: 'M\'Sila',
  29: 'Mascara',
  30: 'Ouargla',
  31: 'Oran',
  32: 'El Bayadh',
  33: 'Illizi',
  34: 'Bordj Baji Mokhtar',
  35: 'Boumerdès',
  36: 'El Tarf',
  37: 'Tindouf',
  38: 'Tissemsilt',
  39: 'El Oued',
  40: 'Khenchela',
  41: 'Souk Ahras',
  42: 'Tipaza',
  43: 'Mila',
  44: 'Aïn Defla',
  45: 'Naama',
  46: 'Aïn Témouchent',
  47: 'Ghardaïa',
  48: 'Relizane',
  49: 'Draa, El Mizia', // Added in 2019
  50: 'Laghouat Sud', // Administrative division
  51: 'El Mengab', // Administrative division
  52: 'Touggourt',
  53: 'Temassek',
  54: 'Djanet',
  55: 'In Guezzam',
  56: 'Beni Abès',
  57: 'In Salah',
  58: 'Timimoun'
};

// Create reverse mapping: Name => Code
const NAME_TO_CODE = {};
Object.entries(WILAYA_MAPPING).forEach(([code, name]) => {
  NAME_TO_CODE[name.toLowerCase().trim()] = parseInt(code);
  NAME_TO_CODE[name] = parseInt(code);
});

// Handle common variations and alternative names
const WILAYA_ALIASES = {
  'algiers': 16,
  'algier': 16,
  'alger': 16,
  'tiaret': 14,
  'tlemcen': 13,
  'tiaret': 14,
  'bejaia': 6,
  'bejaya': 6,
  'bejaïa': 6,
  'tizi ouzou': 15,
  'constantine': 25,
  'oran': 31,
  'annaba': 23,
  'ouargla': 30,
  'ghardaia': 47,
  'tamanrasset': 11,
  'tebessa': 12,
  'sidi bel abes': 22,
  'sidi bel abbès': 22,
  'setif': 19,
  'sétif': 19,
  'skikda': 21,
  'jijel': 18,
  'blida': 9,
  'bouira': 10,
  'medea': 26,
  'médéa': 26,
  'mascara': 29,
  'mostaganem': 27,
  'relizane': 48,
  'aïn defla': 44,
  'ain defla': 44,
  'tipaza': 42,
  'boumerdes': 35,
  'boumerdès': 35,
  'el tarf': 36,
  'guelma': 24,
  'mila': 43,
  'constantine': 25,
  'khenchela': 40,
  'batna': 5,
  'oum el bouaghi': 4,
  'oum elbouaghi': 4,
  'biskra': 7,
  'laghouat': 3,
  'saida': 20,
  'saïda': 20,
  'tiaret': 14,
  'djelfa': 17,
  'chlef': 2,
  'adrar': 1,
  'bechar': 8,
  'béchar': 8,
  'msila': 28,
  'm\'sila': 28,
  'el bayadh': 32,
  'naama': 45,
  'ain temouchent': 46,
  'aïn témouchent': 46,
  'illizi': 33,
  'bordj baji mokhtar': 34,
  'tindouf': 37,
  'tissemsilt': 38,
  'el oued': 39,
  'souk ahras': 41,
  'touggourt': 52,
  'temassek': 53,
  'djanet': 54,
  'in guezzam': 55,
  'beni abes': 56,
  'in salah': 57,
  'timimoun': 58
};

// Merge aliases into NAME_TO_CODE
Object.entries(WILAYA_ALIASES).forEach(([alias, code]) => {
  NAME_TO_CODE[alias.toLowerCase()] = code;
});

/**
 * Get Wilaya Code from Name
 * @param {string} wilayaName - Name of the Wilaya
 * @returns {number|null} - Wilaya code (1-58) or null if not found
 */
function getWilayaCode(wilayaName) {
  if (!wilayaName) return null;
  
  const normalized = wilayaName.toLowerCase().trim();
  const code = NAME_TO_CODE[normalized];
  
  return code || null;
}

/**
 * Get Wilaya Name from Code
 * @param {number} code - Wilaya code (1-58)
 * @returns {string|null} - Wilaya name or null if not found
 */
function getWilayaName(code) {
  return WILAYA_MAPPING[code] || null;
}

module.exports = {
  WILAYA_MAPPING,
  NAME_TO_CODE,
  WILAYA_ALIASES,
  getWilayaCode,
  getWilayaName
};
