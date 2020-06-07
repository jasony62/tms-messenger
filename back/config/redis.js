module.exports = {
  master: {
    host: process.env.TMS_MESSENGER_REDIS_HOST,
    port: parseInt(process.env.TMS_MESSENGER_REDIS_PORT),
  },
}
