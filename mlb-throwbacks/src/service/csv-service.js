const fs = require("fs");
const csvParser = require("csv-parser");

// Function to parse a CSV file
function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (row) => rows.push(row)) // Push each row to the array
      .on("end", () => resolve(rows)) // Resolve the promise with parsed data
      .on("error", (err) => reject(err)); // Reject the promise on error
  });
}

module.exports = { parseCSV };
