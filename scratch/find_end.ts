import fs from 'fs';

const content = fs.readFileSync('c:\\Users\\User\\Desktop\\websites codebase\\autoworx system\\app\\admin\\dashboard\\page.tsx', 'utf8');
const lines = content.split('\n');

let braceCount = 0;
let dashboardStart = -1;
let dashboardEnd = -1;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('export default function AdminDashboard() {')) {
    dashboardStart = i;
    braceCount = 0;
  }
  
  if (dashboardStart !== -1) {
    for (const char of line) {
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
    }
    
    if (braceCount === 0 && dashboardStart !== -1) {
      dashboardEnd = i;
      console.log(`AdminDashboard ends at line ${i + 1}`);
      break;
    }
  }
}
