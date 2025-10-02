module.exports = {
  apps: [
    {
      name: "it-service-site",
      script: "node",
      args: "server.js",
      cwd: require('path').join(__dirname, '..', '..', '.next', 'standalone'),
      env: {
        PORT: 3000,
        NODE_ENV: "production",
        TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
        TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
        GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
        GOOGLE_SHEETS_ID: process.env.GOOGLE_SHEETS_ID,
        GOOGLE_SHEETS_RANGE: process.env.GOOGLE_SHEETS_RANGE || "Sheet1!A:J",
        NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
        TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
      },
      watch: false,
      autorestart: true,
      max_memory_restart: "300M",
    },
  ],
};


