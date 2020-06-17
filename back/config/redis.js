module.exports = {
  master: {
    prefix: process.env.TMS_MESSENGER_REDIS_PREFIX,
    host: process.env.TMS_MESSENGER_REDIS_HOST,
    port: parseInt(process.env.TMS_MESSENGER_REDIS_PORT),
  },
}
