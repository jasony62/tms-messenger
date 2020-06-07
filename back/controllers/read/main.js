const { Ctrl } = require('tms-koa')

const RequestModel = requireModel('request')
const MessageModel = requireModel('message')
const BodyTplModel = requireModel('template/body')

class Main extends Ctrl {
  constructor(...args) {
    super(...args)
  }
  /**
   * 读取消息内容
   */
  async message() {
    const { code } = this.request.query

    const reqModel = new RequestModel(this)
    const request = await reqModel.byCode(code)

    const msgModel = new MessageModel(this)
    const message = await msgModel.byCode(request.messageCode)
    if (!message) return '消息记录数据不存在'

    const { task, body } = message

    if (!task) return '消息记录数据错误，缺乏任务记录数据'
    if (!task.body || !task.body.templateCode || !body) return '消息记录数据错误，任务记录模板数据不完整'

    const msgUpdated = {} // 需要更新的数据

    /* 生成消息内容页面 */
    if (!body.html) {
      const bodyTplModel = new BodyTplModel(this)
      body.html = await bodyTplModel.render(task.body.templateCode, body)
      msgUpdated['body.html'] = body.html
    }
    const html = body.html

    /* 记录消息读取时间 */
    const latestReadAt = msgModel.now
    msgUpdated.latestReadAt = latestReadAt
    if (!message.firstReadAt) msgUpdated.firstReadAt = latestReadAt

    if (!request.readAt) await reqModel.clRequest.updateOne({ code }, { $set: { readAt: latestReadAt } })

    await msgModel.clMessage.updateOne({ code: message.code }, { $set: msgUpdated, $inc: { readCount: 1 } })

    return html
  }
}

module.exports = Main
