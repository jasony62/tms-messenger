/**
 * 消息通道
 */
const Base = require('./base')

class Channel extends Base {
  constructor(...args) {
    super(...args)
  }
  /**
   * 获得通道定义
   *
   * @param {string} code
   */
  async byCode(code) {
    return this
      .clChannel
      .findOne({ code }, { $projection: { _id: 0 } })
  }
}

module.exports = Channel
