const Base = require('../base')
const XmlParser = require('fast-xml-parser')
const RawBody = require('raw-body')

const ChannelModel = requireModel('channel')
const WxQrcodeModel = requireModel('qrcode/wx')
const WxRecvModel = requireModel('wxRecv')

const crypto = require('crypto')

class Main extends Base {
  constructor(...args) {
    super(...args)
    this.model = new ChannelModel(this)
  }
  /**
   * 接受消息内容
   */
  async api() {
    const method = this.request.method
    const channelCode = this.request.query.channelCode

    switch (method) {
      case 'GET':
        const data = this.request.query
        const rstGet = await this.join(channelCode, data)

        this.ctx.set('Content-Type', 'text/html; charset=utf-8')
        return rstGet[1]
      case 'POST':
        /* 公众平台事件 */
        const oData = await RawBody(this.ctx.req, { encoding: true }) // 获取原始数据
        const dataPost = XmlParser.parse(oData) // 解析
        //
        const rstPost = await this.handle(channelCode, dataPost, oData)

        return rstPost
    }
  }
  /**
   * 加密/校验流程：
   * 1. 将token、timestamp、nonce三个参数进行字典序排序
   * 2. 将三个参数字符串拼接成一个字符串进行sha1加密
   * 3. 开发者获得加密后的字符串可与signature对比，标识该请求来源于易信
   *
   * 若确认此次GET请求来自易信服务器，请原样返回echostr参数内容，则接入生效，否则接入失败。
   */
  async join(channelCode, data) {
    if (!data || !channelCode || !data.signature || !data.timestamp || !data.nonce || !data.echostr) {
      return [false, 'wx proxy failed-0']
    }

    // 获取chennl配置
    const chanModel = new ChannelModel(this)
    const chan = await chanModel.byCode(channelCode)
    if (!chan || chan.removeAt) return [false, 'wx proxy failed-0']

    let tmpArr = [chan.token, data.timestamp, data.nonce]
    tmpArr.sort()
    let tmpStr = tmpArr.join("")
    tmpStr = crypto.createHash('sha1').update(tmpStr).digest('hex')

    if (tmpStr === data.signature) {
      const cl = this.model.clChannel
      /**
       * 如果存在，断开公众号原有连接
       */
      await cl.updateMany({ appid: chan.appid, appsecret: chan.appsecret }, { $set: { joined: "N" } })
      /**
       * 确认建立连接
       */
      await cl.updateOne({ code: channelCode }, { $set: { joined: "Y" } })

      return [true, data.echostr]
    } else {
      return [false, 'wx proxy failed-1']
    }
  }
  /**
   * 处理收到的消息
   *
   * 当普通易信用户向公众帐号发消息时，易信服务器将POST该消息到填写的URL上。
   * XML编码格式为UTF-8
   */
  async handle(channelCode, call, oData) {
    let msg = call.xml
    msg.channelCode = channelCode
    /**
     * 记录消息日志
     */
    const wxRecvModel = new WxRecvModel(this)
    // /**
    //  * 消息已经收到，不处理
    //  */
    // if ($modelLog->hasReceived($msg)) {
    //   die('');
    // }
    await wxRecvModel.receive(msg)
    /**
     * 处理消息
     */
    let proxyUrl = false
    switch (msg['MsgType']) {
      case 'event':
        proxyUrl = await this._eventCall(msg)
        break;
      case 'text':
      case 'voice':
      case 'location':
      default:
        break
    }

    if (!proxyUrl) proxyUrl = process.env.TMS_APP_WXRECV_DEFAULT_URL
    if (!proxyUrl) return false

    let options = {
      headers: { 'Content-Type': 'application/xml' },
    }
    const rst = await this._httpPost(proxyUrl, oData, options)

    return rst
  }
  /**
   * 
   */
  async _eventCall(msg) {
    let proxyUrl = false

    switch (msg.Event) {
      case "subscribe":
      case "scan":
      case "SCAN":
        let qrcode
        if (msg.Event === "subscribe") {
          if (msg.EventKey) {
            qrcode = msg.EventKey.substring("qrscene_".length)
          }
        } else {
          qrcode = msg.EventKey
        }
        // 
        if (qrcode) {
          const qrcodeModel = new WxQrcodeModel(this)
          let qrcodeObj = await qrcodeModel.clWxQrcode.findOne({ channelCode: msg.channelCode, scene_id: Number(qrcode) })
          if (qrcodeObj && qrcodeObj.bucket) { // 根据bucket查找转发地址
            const bucketObj = await this.getBucketInfo(qrcodeObj.bucket)
            if (bucketObj) proxyUrl = bucketObj.proxyUrl
          }
        }

        break
    }

    return proxyUrl
  }
}

module.exports = Main
