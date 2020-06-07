/**
 * 消息发送请求
 */
const Base = require('./base')

const READ_MESSAGE_URL = process.env.TMS_MESSENGER_READ_MESSAGE_URL

class RequestModel extends Base {
  constructor(...args) {
    super(...args)
  }
  /**
   * 获得消息发送请求
   *
   * @param {string} code
   */
  async byCode(code) {
    const req = await this.clRequest.findOne({ code }, { $projection: { _id: 0 } })

    return req
  }
  /**
   *
   * @param {object} message
   */
  async newRequest(message) {
    const { receiver, task, cover } = message

    if (typeof receiver !== 'string') throw Error('没有指定消息的接收人，无法发送')

    if (!task || typeof task !== 'object') throw Error('没有指定消息所属任务，无法发送')

    const data = {} // 消息封面模板参数
    if (task.cover && task.cover.data && Object.keys(task.cover.data).length) Object.assign(data, task.cover.data)
    if (cover && cover.data && Object.keys(cover.data).length) Object.assign(data, cover.data)

    const code = this.getNewCode()
    const createAt = this.now
    const newReq = {
      code,
      messageCode: message.code,
      templateCode: task.cover.templateCode,
      createAt,
      receiver,
      data,
    }
    if (message.bucket) newReq.bucket = message.bucket

    /* 生成读取消息内容的url */
    if (task.body && READ_MESSAGE_URL) {
      newReq.url = `${READ_MESSAGE_URL}?code=${code}`
    }

    const createdReq = await this.clRequest.insertOne(newReq).then((result) => result.ops[0])
    delete createdReq._id

    return createdReq
  }
}

module.exports = RequestModel
