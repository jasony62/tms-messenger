const { nanoid } = require('nanoid')

const DB_NAME = process.env.TMS_MESSENGER_MONGODB_DB

class Base {
  constructor({ mongoClient, bucket }) {
    this.mongoClient = mongoClient
    this.bucket = bucket
  }
  /**
   * 返回当前时间
   * 解决mongodb时区问题
   */
  get now() {
    return new Date(new Date().getTime() + 3600 * 8 * 1000)
  }
  /**
   * 可用的新code
   */
  getNewCode() {
    return nanoid()
  }
  get db() {
    return this.mongoClient.db(DB_NAME)
  }
  get clChannel() {
    return this.db.collection('channel')
  }
  get clCoverTemplate() {
    return this.db.collection('cover_template')
  }
  get clBodyTemplate() {
    return this.db.collection('body_template')
  }
  get clTask() {
    return this.db.collection('task')
  }
  get clMessage() {
    return this.db.collection('message')
  }
  get clRequest() {
    return this.db.collection('request')
  }
  get clWxQrcode() {
    return this.db.collection('wx_qrcode')
  }
}

module.exports = Base
