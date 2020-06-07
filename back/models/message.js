const Base = require('./base')

class Message extends Base {
  constructor(...args) {
    super(...args)
  }
  /**
   * 返回指定的消息记录
   *
   * @param {*} code
   */
  async byCode(code) {
    const match = { code }
    const messages = await this.clMessage
      .aggregate([
        { $match: match },
        { $lookup: { from: 'task', localField: 'taskCode', foreignField: 'code', as: 'task' } },
      ])
      .toArray()

    /* 消息记录的code应该保持唯一 */
    if (messages.length === 0) throw Error(`没有找到匹配的消息记录[${code}]`)
    else if (messages.length > 1) throw Error(`没有匹配唯一的消息记录[${code}]`)

    const message = messages[0]

    /* 1条消息记录只能对应1条任务记录 */
    if (message.task.length === 0) delete message.task
    else if (message.task.length > 1) throw Error(`消息记录[${code}]匹配了多条任务记录`)
    else message.task = message.task[0]

    return message
  }
}

module.exports = Message
