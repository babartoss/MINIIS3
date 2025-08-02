require('dotenv').config();
const key = process.env.OWNER_PRIVATE_KEY;
if (!key) {
  console.log('Key undefined - check .env.local');
} else if (key.length !== 66 || !key.startsWith('0x')) {
  console.log('Key length sai: ' + key.length);
} else if (!/^[0x][0-9a-fA-F]{64}$/.test(key)) {
  console.log('Key không hex valid');
} else {
  console.log('Key ok, length: ' + key.length);
}