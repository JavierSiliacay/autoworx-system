import * as xlsx from 'xlsx';
import * as fs from 'fs';

try {
    const filePath = 'C:/Users/User/Downloads/RELEASE-MONITORING-BLANK.xlsx';
    const workbook = xlsx.readFile(filePath);

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Extract to JSON with empty cells included
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1, blankrows: false });

    let output = `SHEET NAME: ${sheetName}\nFIRST 30 ROWS:\n`;

    for (let i = 0; i < Math.min(30, data.length); i++) {
        output += `ROW ${i + 1}: ${JSON.stringify(data[i])}\n`;
    }

    fs.writeFileSync('output-utf8.txt', output, 'utf8');
} catch (e) {
    console.error("Error reading file:", e);
}
