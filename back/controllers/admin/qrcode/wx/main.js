const { ResultData, ResultFault, ResultObjectNotFound } = require('tms-koa')
const BaseCtrl = require('../../../base')
const WxQrcodeModel = requireModel('qrcode/wx')
const ChannelModel = requireModel('channel')

const log4js = require('log4js')
const logger = log4js.getLogger('tms-messenger-qrcode')

/**
 * 微信模板消息模板
 */
class main extends BaseCtrl {
  constructor(...args) {
    super(...args)
    this.qrcodeModel = new WxQrcodeModel(this)
  }
  /**
   * 
   */
  async getSceneId(oneOff) {
    let scene_id
    if (oneOff) {
      scene_id = Math.floor(Math.random() * (9999999999 - 100000 + 1)) + 100000
    } else {
      scene_id = Math.floor(Math.random() * (100000 - 1 + 1)) + 1
    }

    let query = { scene_id }
    if (this.bucket) query.bucket = this.bucket
    while (true) {
      const qrcodes = await this.qrcodeModel.clWxQrcode.findOne(query)
      if (qrcodes) {
        return this.getSceneId(oneOff)
      } else {
        break
      }
    }

    return scene_id
  }
  /**
   * 添加微信模板消息模板定义
   */
  async create() {
    const { channelCode, name, expire = 86400 } = this.request.query
    let oneOff = this.request.query.oneOff
    if (!oneOff || oneOff === true || oneOff === "true")
      oneOff = true
    else oneOff = false

    // 将请求存入数据表
    let data = { channelCode, name }
    if (this.bucket) data.bucket = this.bucket

    if (oneOff === true) {
      data.type = "QR_SCENE"
      if (expire > 2592000)
        return new ResultFault("二维码有效期格式错误")
    } else {
      data.type = "QR_LIMIT_SCENE"
    }
    const scene_id = await this.getSceneId(oneOff)
    data.scene_id = scene_id

    const chanModel = new ChannelModel(this)
    const chan = await chanModel.byCode(channelCode)
    if (!chan || chan.removeAt) return new ResultFault('消息通道不存在或不可用')

    const { appid, appsecret, _id } = chan
    const wxConfig = { appid, appsecret, _id }
    const wxproxy = this.getWXProxyObj(wxConfig)
    let qrcode
    try {
      qrcode = await wxproxy.qrcodeCreate(scene_id, oneOff, expire)
    } catch (error) {
      console.log(444, error)
      return new ResultFault("获取失败")
    }

    // 存储数据
    const CreateAt = this.qrcodeModel.now
    data.create_at = CreateAt
    data.pic = qrcode.pic
    if (oneOff === true) {
      data.expire = qrcode.expire_seconds
      data.expire_at = new Date().getTime() + (qrcode.expire_seconds * 1000)
      data.expire_time = new Date(this.qrcodeModel.now.getTime() + (qrcode.expire_seconds * 1000))
      qrcode.expire_at = data.expire_at
    }
    await this.qrcodeModel.clWxQrcode.insertOne(data)

    return new ResultData(qrcode)
  }
  /**
   * 列表
   */
  async list() {
    let query = {}
    if (this.bucket) query.bucket = this.bucket

    const qrcodes = await this.qrcodeModel.clWxQrcode
      .find({}, { projection: { _id: 0 } })
      .toArray()

    return new ResultData(qrcodes)
  }
}

module.exports = main
