const fs = require('fs');
const path = require('path');
const os = require('os');
const xlsx = require('xlsx');

const searchDirs = [
    path.join(os.homedir(), 'Downloads'),
    path.join(os.homedir(), 'Desktop'),
    __dirname // workspace root
];

function findExcelFile(targetName) {
    for (const dir of searchDirs) {
        if (!fs.existsSync(dir)) continue;
        
        // Exact match
        const exactPath = path.join(dir, targetName);
        if (fs.existsSync(exactPath)) {
            return exactPath;
        }
        
        // If exact match not found for the upload file, fallback to the first .xlsx we find
        if (targetName === 'upload_ecotrack_v31.xlsx') {
            try {
                const files = fs.readdirSync(dir);
                const anyXlsx = files.find(f => f.endsWith('.xlsx') && !f.toLowerCase().includes('code_wilayas'));
                if (anyXlsx) {
                    return path.join(dir, anyXlsx);
                }
            } catch (err) {
                // Ignore directory read errors
            }
        }
    }
    return null;
}

function readHeaders(filePath) {
    try {
        console.log(`Reading: ${filePath}`);
        const workbook = xlsx.readFile(filePath);
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Get headers (first row), header: 1 returns an array of arrays
        const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
        const headers = rows.length > 0 ? rows[0] : [];
        
        console.log(`Headers for ${path.basename(filePath)} (Sheet: ${firstSheetName}):`);
        console.log(headers.length > 0 ? headers : "No headers found or sheet is empty");
        console.log('----------------------------------------------------');
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error.message);
    }
}

function main() {
    console.log('Searching for Excel files...\n');

    // Find and read the main upload data file
    const uploadFile = findExcelFile('upload_ecotrack_v31.xlsx');
    if (uploadFile) {
        readHeaders(uploadFile);
    } else {
        console.log('Could not find upload_ecotrack_v31.xlsx or any fallback .xlsx file.');
        console.log('----------------------------------------------------');
    }

    // Find and read the wilayas code file
    const wilayasFile = findExcelFile('code_wilayas.xlsx');
    if (wilayasFile) {
        readHeaders(wilayasFile);
    } else {
        console.log('Could not find code_wilayas.xlsx.');
        console.log('----------------------------------------------------');
    }
}

main();
