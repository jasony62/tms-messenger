const { ResultData, ResultFault, ResultObjectNotFound } = require('tms-koa')

const BaseCtrl = require('../../../base')
const ChannelModel = requireModel('channel')

/**
 * 微信模板消息模板
 */
class main extends BaseCtrl {
  constructor(...args) {
    super(...args)
  }
  /**
   * 
   */
  async getUserInfo() {
    const { channelCode, openid } = this.request.query
    const getGroup = (this.request.query.getGroup === true || this.request.query.getGroup === "true") ? true : false

    const chanModel = new ChannelModel(this)
    const chan = await chanModel.byCode(channelCode)
    if (!chan || chan.removeAt) return new ResultFault('消息通道不存在或不可用')

    const { appid, appsecret, _id } = chan
    const wxConfig = { appid, appsecret, _id }
    const wxproxy = this.getWXProxyObj(wxConfig)
    const userInfo = await wxproxy.userInfo(openid, getGroup)

    return new ResultData(userInfo)
  }
}

module.exports = main
