module.exports = {
  apps: [
    {
      name: "zakaz-site",
      script: "node",
      args: ".next/standalone/server.js",
      cwd: require('path').join(__dirname, '..', '..'),
      env: {
        PORT: 3000,
        NODE_ENV: "production",
        TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
        TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
        GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
        GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_ID: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_ID,
        GOOGLE_SHEETS_ID: process.env.GOOGLE_SHEETS_ID,
        GOOGLE_SHEETS_RANGE: process.env.GOOGLE_SHEETS_RANGE || "Sheet1!A:J",
        NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
        TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
      },
      watch: false,
      autorestart: true,
      max_memory_restart: "300M",
      instances: 1,
      exec_mode: "fork",
      log_file: "./logs/combined.log",
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
  ],
};


