const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
require('dotenv').config();

async function uploadToPinata(filePath) {
  try {
    const data = new FormData();
    data.append('file', fs.createReadStream(filePath));

    const res = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', data, {
      maxBodyLength: Infinity,
      headers: {
        'Authorization': `Bearer ${process.env.PINATA_JWT}`,
        ...data.getHeaders()
      }
    });

    console.log('✅ File uploaded successfully. IPFS CID:', res.data.IpfsHash);
    return res.data;
  } catch (err) {
    console.error('❌ IPFS Upload Error:', err.message);
  }
}

module.exports = uploadToPinata;
