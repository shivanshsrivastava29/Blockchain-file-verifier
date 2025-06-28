const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const uploadToIPFS = require("./ipfsUploader");

const app = express();
const PORT = 3000;

// Serve frontend
app.use(express.static("public"));
app.use(express.json());

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage: storage });

// Upload endpoint
app.post("/upload", upload.single("document"), async (req, res) => {
  const filePath = req.file.path;

  // Hash the file
  const fileBuffer = fs.readFileSync(filePath);
  const hash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

  // Upload to IPFS
  const ipfsURL = await uploadToIPFS(filePath);
  if (!ipfsURL) return res.status(500).send("Failed to upload to IPFS");

  // Store in data.json
  const record = {
    filename: req.file.originalname,
    ipfsHash: ipfsURL,
    sha256: hash,
    timestamp: new Date().toISOString(),
  };

  const existingData = JSON.parse(fs.readFileSync("data.json", "utf-8"));
  existingData.push(record);
  fs.writeFileSync("data.json", JSON.stringify(existingData, null, 2));

  // Delete uploaded file from local storage
  //fs.unlinkSync(filePath);

  res.send(`✅ Uploaded to IPFS: <a href="${ipfsURL}" target="_blank">${ipfsURL}</a><br>SHA-256: ${hash}`);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
