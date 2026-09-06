const crypto = require('crypto');

// Generate RSA 2048 key pair
const { publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'der'
  }
});

const keyBase64 = publicKey.toString('base64');
console.log('KEY_BASE64:', keyBase64);
