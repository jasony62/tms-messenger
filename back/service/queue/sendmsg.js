const log4js = require('log4js')
const logger = log4js.getLogger()

const QUEUE_REDIS = process.env.TMS_MESSENGER_MESSAGE_REQUEST_QUEUE_REDIS
const QUEUE_NAME = process.env.TMS_MESSENGER_MESSAGE_REQUEST_QUEUE_NAME
const { MongoContext, RedisContext } = require('tms-koa/lib/app').Context

const RequestModel = requireModel('request')
const ChannelModel = requireModel('channel')
const CoverTplModel = requireModel('template/cover')

/**
 * 通过微信公众号发送模板消息
 *
 * @param {Object} request
 */
async function sendByWx(request) {
  const mongoClient = await MongoContext.mongoClient()

  const { WXProxy } = require('tms-wxproxy')

  const tplModel = new CoverTplModel({ mongoClient })
  const tpl = await tplModel.byCode(request.templateCode)
  if (!tpl || tpl.removeAt) throw Error('消息封面模板不存在或不可用')

  const chanModel = new ChannelModel({ mongoClient })
  const chan = await chanModel.byCode(tpl.channelCode)
  if (!chan || chan.removeAt) throw Error('消息通道不存在或不可用')

  const { appid, appsecret, accessToken } = chan
  const config = { appid, appsecret, accessToken }
  const wxproxy = new WXProxy(config, mongoClient)
  const wxTplMsg = { touser: request.receiver, data: request.data, template_id: tpl.wxTemplateId }
  if (request.url) wxTplMsg.url = request.url
  const msgid = await wxproxy.messageTemplateSend(wxTplMsg, { code: request.code })

  return msgid
}
/**
 *
 * @param {*} msgReqCode
 */
async function sendMsgRequest(msgReqCode) {
  const mongoClient = await MongoContext.mongoClient()
  const reqModel = new RequestModel({ mongoClient })
  const msgReq = await reqModel.byCode(msgReqCode)
  if (msgReq) sendByWx(msgReq)
}

class MsgRequestQueue {
  /**
   * 启动消息队列
   */
  static async startup() {
    /* 启动消息请求队列监听 */
    // 独立的连接
    const sub = await RedisContext.redisClient(QUEUE_REDIS, true)
    sub.on('message', (channel, message) => {
      if (channel === QUEUE_NAME) {
        logger.debug(`收到消息发送队列推送消息：${channel} | ${message}`)
        sendMsgRequest(message)
      }
    })
    sub.on('subscribe', (channel) => {
      logger.info(`消息发送队列完成频道[${channel}]订阅`)
    })
    sub.on('error', (err) => {
      logger.error('消息发送队列监听端错误: ', err)
    })
    sub.on('end', () => {
      logger.info(`结束消息发送队列`)
    })
    sub.subscribe(QUEUE_NAME)
  }
  /**
   * 添加任务
   *
   * @param {Object} message 要发送的消息
   */
  static async push(message) {
    const mongoClient = await MongoContext.mongoClient()
    const reqModel = new RequestModel({ mongoClient })

    const newReq = await reqModel.newRequest(message)

    /* 通知发送模块有新发送请求 */
    const pub = await RedisContext.redisClient(QUEUE_REDIS)
    return new Promise((resolve) => {
      pub.publish(QUEUE_NAME, newReq.code, () => {
        resolve(newReq)
        pub.quit()
      })
    })
  }
}

module.exports.MsgRequestQueue = MsgRequestQueue
