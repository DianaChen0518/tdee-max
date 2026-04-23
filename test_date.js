const dateStr = "2023-01-01";
const d = new Date(dateStr);
d.setDate(d.getDate() + 1);
const tzOffset = d.getTimezoneOffset() * 60000;
const local = new Date(d.getTime() - tzOffset).toISOString().split('T')[0];
console.log("Original:", dateStr);
console.log("Expected: 2023-01-02");
console.log("Actual:", local);
