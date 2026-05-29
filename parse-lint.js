const fs = require('fs');
const data = JSON.parse(fs.readFileSync('lint_report.json', 'utf8'));

data.forEach(file => {
  const errors = file.messages.filter(m => m.severity === 2);
  if (errors.length > 0) {
    console.log(`\n--- ${file.filePath} ---`);
    errors.forEach(err => {
      console.log(`Line ${err.line}: [${err.ruleId}] ${err.message}`);
    });
  }
});
