const fs = require("fs");
const crypto = require("crypto");
const path = require("path");

// Change the path to your data.json file
const databasePath = path.join(__dirname, "data.json");

function getFileHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash("sha256");
  hashSum.update(fileBuffer);
  return hashSum.digest("hex");
}

function verifyFile(filePath) {
  const hash = getFileHash(filePath);
  console.log("🔍 Calculated SHA-256 hash:", hash);

  const records = JSON.parse(fs.readFileSync(databasePath, "utf8"));

  const match = records.find((record) => record.sha256 === hash);

  if (match) {
    console.log("✅ File already exists in database.");
    console.log("Stored CID:", match.ipfsHash.IpfsHash);
  } else {
    console.log("❌ No match found. File is new or altered.");
  }
}

// Replace with the exact uploaded filename
verifyFile("uploads/1751097067136-Resume.pdf");
