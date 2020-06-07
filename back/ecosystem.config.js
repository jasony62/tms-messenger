module.exports = {
  apps: [
    {
      name: 'tms-messenger',
      script: './server.js',
      instances: 1,
      autorestart: true,
      watch_delay: 1000,
      watch: ['server.js', 'controllers', 'models', 'service'],
      ignore_watch: ['node_modules', 'config'],
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
      },
    },
  ],
}
