module.exports = {
  master: {
    host: process.env.TMS_MESSENGER_MONGODB_HOST,
    port: parseInt(process.env.TMS_MESSENGER_MONGODB_PORT),
  },
}
