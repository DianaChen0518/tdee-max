const dateStr = "2023-01-01";
const d = new Date(dateStr);
d.setUTCDate(d.getUTCDate() + 1);
const local = d.toISOString().split('T')[0];
console.log("Original:", dateStr);
console.log("Expected: 2023-01-02");
console.log("Actual:", local);
