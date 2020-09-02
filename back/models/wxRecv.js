/**
 * 消息封面模板
 */
const Base = require('./base')

class WxRcev extends Base {
  constructor(...args) {
    super(...args)
  }
  /**
   *  记录收到的事件消息
   */
  async receive(msg) {
    const rst = await this.clWxRcev.insertOne(msg)

    return rst.result
  }
}

module.exports = WxRcev
