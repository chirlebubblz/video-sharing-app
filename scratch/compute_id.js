const crypto = require('crypto');

const keyBase64 = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAyoJS8V2AL6GmjU9l7fFtwpRTgX7tZqVJs3eZEqdKFJvah0aup92Wt97xFs4s6Y+JUTxh1Gpyk+tgB2qf7qyrP5QYzrSqXeLXIMVOD0jIG/GLzgcXxPnuG+5aqxmFbIkCQavXADgwnlLZ40HwWJADJ10KeYceyHIAh9wWQVZK1s2OelMEk88N2Whmi1Nr6OzakEiYJANPOPbxwxqMlmoq+mNwb+fKzgNPS+lJDgx4fhP8BkstcVfWHk8pvLwWjwRpjkjaSpx10Fc4m7qHUkGN9w38LLpCzkj3q1KN+MTg5V7uTa9bVmuBop+fz0KSITFXMf6s+/mOEFiJaCRJQEow3wIDAQAB';

const keyBuffer = Buffer.from(keyBase64, 'base64');
const hash = crypto.createHash('sha256').update(keyBuffer).digest('hex');

const extensionId = hash.slice(0, 32).split('').map(c => {
  const num = parseInt(c, 16);
  return String.fromCharCode(97 + num);
}).join('');

console.log('DERIVED_EXTENSION_ID:', extensionId);
console.log('REDIRECT_URI:', `https://${extensionId}.chromiumapp.org/`);
