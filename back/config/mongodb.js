module.exports = {
  master: {
    user: process.env.TMS_MESSENGER_MONGODB_USER || false,
    password: process.env.TMS_MESSENGER_MONGODB_PASSWORD || false,
    host: process.env.TMS_MESSENGER_MONGODB_HOST,
    port: parseInt(process.env.TMS_MESSENGER_MONGODB_PORT),
  },
}
