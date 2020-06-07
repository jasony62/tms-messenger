/**
 * 消息封面模板
 */
const Base = require('../base')

class CoverTemplate extends Base {
  constructor(...args) {
    super(...args)
  }
  /**
   * 获得模板定义
   *
   * @param {string} code
   */
  async byCode(code) {
    const tpl = await this.clCoverTemplate.findOne({ code }, { $projection: { _id: 0 } })

    return tpl
  }
}

module.exports = CoverTemplate
