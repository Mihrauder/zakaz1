const https = require('https');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.argv[2];

if (!BOT_TOKEN) {
  console.error('❌ Please set TELEGRAM_BOT_TOKEN environment variable');
  process.exit(1);
}

if (!WEBHOOK_URL) {
  console.error('❌ Please provide webhook URL as argument');
  console.error('Usage: node scripts/setup-webhook.js https://your-domain.com/api/telegram/webhook');
  process.exit(1);
}

async function setWebhook() {
  const data = JSON.stringify({ url: WEBHOOK_URL });
  
  const options = {
    hostname: 'api.telegram.org',
    port: 443,
    path: `/bot${BOT_TOKEN}/setWebhook`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function getWebhookInfo() {
  return new Promise((resolve, reject) => {
    https.get(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  try {
    console.log('🔧 Setting up webhook...');
    const result = await setWebhook();
    
    if (result.ok) {
      console.log('✅ Webhook set successfully!');
      console.log('📋 Webhook info:');
      const info = await getWebhookInfo();
      console.log(JSON.stringify(info.result, null, 2));
    } else {
      console.error('❌ Failed to set webhook:', result);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();
