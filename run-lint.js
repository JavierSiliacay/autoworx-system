const { execSync } = require('child_process');
const fs = require('fs');

try {
  execSync('pnpm eslint .', { encoding: 'utf8', stdio: 'pipe' });
  fs.writeFileSync('lint_report_final.txt', 'No errors!', 'utf8');
} catch (error) {
  fs.writeFileSync('lint_report_final.txt', error.stdout, 'utf8');
}
