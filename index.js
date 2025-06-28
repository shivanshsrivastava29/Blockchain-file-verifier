const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const uploadToIPFS = require("./ipfsUploader");

const app = express();
const PORT = 3000;

// Serve static frontend files
app.use(express.static("public"));
app.use(express.json());

// Multer config for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage: storage });

// 🔼 Upload Route
app.post("/upload", upload.single("document"), async (req, res) => {
  const filePath = req.file.path;

  // Generate SHA-256 hash
  const fileBuffer = fs.readFileSync(filePath);
  const hash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

  // Upload to IPFS
  const ipfsURL = await uploadToIPFS(filePath);
  if (!ipfsURL) return res.status(500).send("Failed to upload to IPFS");

  // Prepare record
  const record = {
    filename: req.file.originalname,
    ipfsHash: ipfsURL,
    sha256: hash,
    timestamp: new Date().toISOString(),
  };

  // Append to data.json
  const dataPath = path.join(__dirname, "data.json");
  const existingData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  existingData.push(record);
  fs.writeFileSync(dataPath, JSON.stringify(existingData, null, 2));

  // Optionally delete local file
  // fs.unlinkSync(filePath);

  // Send response
  res.send(`✅ Uploaded to IPFS: <a href="${ipfsURL.IpfsHash ? `https://gateway.pinata.cloud/ipfs/${ipfsURL.IpfsHash}` : ipfsURL}" target="_blank">${ipfsURL.IpfsHash || ipfsURL}</a><br>SHA-256: ${hash}`);
});

// 🧐 Verify Route
app.post("/verify", upload.single("document"), (req, res) => {
  const filePath = req.file.path;

  // Calculate file hash
  const fileBuffer = fs.readFileSync(filePath);
  const hash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

  // Load records
  const dataPath = path.join(__dirname, "data.json");
  const existingData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  const match = existingData.find((record) => record.sha256 === hash);

  // Delete uploaded file
  fs.unlinkSync(filePath);

  // Send verification result
  if (match) {
    res.send(`
      ✅ <strong>File is verified!</strong><br>
      SHA-256: <code>${hash}</code><br>
      IPFS CID: <a href="https://gateway.pinata.cloud/ipfs/${match.ipfsHash.IpfsHash || match.ipfsHash}" target="_blank">${match.ipfsHash.IpfsHash || match.ipfsHash}</a>
    `);
  } else {
    res.send(`
      ❌ <strong>File not found or has been altered.</strong><br>
      SHA-256: <code>${hash}</code>
    `);
  }
});

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
