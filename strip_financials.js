const fs = require('fs');
let code = fs.readFileSync('components/admin/active-repairs-monitoring.tsx', 'utf8');

// 1. Rename component
code = code.replace(/export function SalesMonitoring/g, 'export function ActiveRepairsMonitoring');

// 2. Titles
code = code.replace(/"SALES MONITORING"/g, '"ACTIVE ON-GOING REPAIRS"');
code = code.replace(/>Sales Monitoring<\/h3>/g, '>Active On-Going Repairs</h3>');
code = code.replace(/Sales Monitoring/g, 'Active On-Going Repairs'); // Be careful, but usually fine here.
// Revert the import of generateReleaseMonitoringDoc to include generateActiveRepairsDoc
code = code.replace(/generateReleaseMonitoringDoc/g, 'generateActiveRepairsDoc');

// 3. Remove Recharts import
code = code.replace(/import \{ BarChart[\s\S]*?from 'recharts'.*?\n/g, '');

// 4. Remove getCategorizedCosts, yearlyChartData, tableTotals
code = code.replace(/const getCategorizedCosts = \([\s\S]*?return result\n\s*\}/g, '');
code = code.replace(/const yearlyChartData = useMemo\(\(\) => \{[\s\S]*?\}\, \[tableRecords, reportPeriod, selectedYear, availableYears\]\)/g, '');
code = code.replace(/const tableTotals = useMemo\(\(\) => \{[\s\S]*?\}, \{ brpad: 0, aircon: 0, electrical: 0, mechanical: 0, total: 0 \}\)\n\s*\}, \[tableRecords, editedData\]\)/g, '');

// 5. Remove charts section from JSX
code = code.replace(/\{\/\* Charts section similar to ReleaseMonitoring but for Entry Data \*\/\}[\s\S]*?\{\/\* The table \*\/\}|\{\/\* Charts section similar to ReleaseMonitoring but for Entry Data \*\/\}[\s\S]*?(?=<div className="p-2 overflow-x-auto">)/g, '');

// 6. Remove Breakdown section in manual entry
code = code.replace(/\{\/\* Breakdown section same as ReleaseMonitoring \*\/\}[\s\S]*?(?=<div className="grid grid-cols-4 items-center gap-4 pt-2">)/g, '');

// 7. Remove costing from manualData submit
code = code.replace(/costing: \{[\s\S]*?\}[\s\S]*?(?=\}\n\s*\})\n/g, '');

// 8. Remove the update logic for brpad/aircon/etc in handle save
code = code.replace(/\/\/ Handle nested costing updates[\s\S]*?\/\/ Map camelCase to snake_case if needed/g, '// Map camelCase to snake_case if needed');

// 9. Remove financial table headers
code = code.replace(/<th[^>]*>BRPAD<\/th>/i, '');
code = code.replace(/<th[^>]*>AIRCON<\/th>/i, '');
code = code.replace(/<th[^>]*>ELECTRICAL<\/th>/i, '');
code = code.replace(/<th[^>]*>MECHANICAL<\/th>/i, '');
code = code.replace(/<th[^>]*>TOTAL<br \/><span[^>]*>\(w\/ VAT\/DISCOUNT\)<\/span><\/th>/i, '');
// Change colSpan for the header row
code = code.replace(/colSpan=\{10\}/g, 'colSpan={6}');
code = code.replace(/colSpan=\{8\}/g, 'colSpan={8}'); // might need tuning, keep it for now

// 10. Remove financial table cells (these are the ones with costs.brpad, costs.aircon, etc.)
// We can use a regex to match the 5 td elements.
// The tds for finances usually look like: <td ... font-mono>{isEditing ? ... (costs.brpad > 0 ? costs.brpad.toLocaleString() : "-")}</td>
// It's 5 consecutive <td ... >... costs.XXX ... </td>
code = code.replace(/<td[^>]*className="[^"]*font-mono[^"]*"[^>]*>[\s\S]*?costs\.brpad[\s\S]*?<\/td>\s*<td[^>]*className="[^"]*font-mono[^"]*"[^>]*>[\s\S]*?costs\.aircon[\s\S]*?<\/td>\s*<td[^>]*className="[^"]*font-mono[^"]*"[^>]*>[\s\S]*?costs\.electrical[\s\S]*?<\/td>\s*<td[^>]*className="[^"]*font-mono[^"]*"[^>]*>[\s\S]*?costs\.mechanical[\s\S]*?<\/td>\s*<td[^>]*className="[^"]*font-mono[^"]*"[^>]*>[\s\S]*?costs\.total[\s\S]*?<\/td>/g, '');

// 11. Remove tfoot
code = code.replace(/\{tableRecords\.length > 0 && \([\s\S]*?<tfoot>[\s\S]*?<\/tfoot>[\s\S]*?\)\}/g, '');

// 12. Fix costs assignment in map
code = code.replace(/const costs = getCategorizedCosts\(r\)\n/g, '');

// 13. Remove print Filter logic for different titles since it's just one title
code = code.replace(/let dynamicTitle = "ACTIVE ON-GOING REPAIRS"[\s\S]*?\} else if \(printFilter === "released"\) \{[\s\S]*?\}/g, 'let dynamicTitle = "ACTIVE ON-GOING REPAIRS"');

// Write back
fs.writeFileSync('components/admin/active-repairs-monitoring.tsx', code);
console.log('done');
