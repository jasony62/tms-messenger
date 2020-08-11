/**
 * 消息封面模板
 */
const Base = require('./base')

class WxQrcode extends Base {
  constructor(...args) {
    super(...args)
  }
  /**
   * 获得模板定义
   *
   * @param {string} code
   */
  async byCode(scene_id) {
    const qrcode = await this.clWxQrcode.findOne({ scene_id }, { $projection: { _id: 0 } })

    return qrcode
  }
}

module.exports = WxQrcode
