const { nanoid } = require('nanoid')
const { WXProxy } = require('tms-wxproxy')
const axios = require('tms-wxproxy/node_modules/axios-https-proxy-fix')
const adapter = require('tms-wxproxy/node_modules/axios-https-proxy-fix/lib/adapters/http')

const APPCONTEXT = require('tms-koa').Context.AppContext
const TMCONFIG = APPCONTEXT.insSync().appConfig.tmConfig

const DB_NAME = process.env.TMS_MESSENGER_MONGODB_DB || "tms_messenger"

class Base {
  constructor({ mongoClient, bucket }) {
    this.mongoClient = mongoClient
    this.bucket = bucket
    this.tmConfig = TMCONFIG
  }
  /**
   * 返回当前时间
   * 解决mongodb时区问题
   */
  get now() {
    return new Date(new Date().getTime() + 3600 * 8 * 1000)
  }
  /**
   * 可用的新code
   */
  getNewCode() {
    return nanoid()
  }
  get db() {
    return this.mongoClient.db(DB_NAME)
  }
  get clChannel() {
    return this.db.collection('channel')
  }
  get clCoverTemplate() {
    return this.db.collection('cover_template')
  }
  get clBodyTemplate() {
    return this.db.collection('body_template')
  }
  get clTask() {
    return this.db.collection('task')
  }
  get clMessage() {
    return this.db.collection('message')
  }
  get clRequest() {
    return this.db.collection('request')
  }
  get clWxQrcode() {
    return this.db.collection('wx_qrcode')
  }
  get clWxRcev() {
    return this.db.collection('wx_rcev')
  }
  /**
   * 实例化 WXProxy
   */
  getWXProxyObj(wxConfig) {
    let axiosObj = null
    if (this.tmConfig.axios_proxy) {
      const oProxy = this.tmConfig.axios_proxy
      let proxy = {}
      proxy.host = oProxy.host
      proxy.port = oProxy.port
      if (oProxy.auth) proxy.auth = oProxy.auth
      axiosObj = axios.create({ adapter, proxy })
    }

    return new WXProxy(wxConfig, this.mongoClient, TmsMesgLockPromise, axiosObj)
  }
}

module.exports = Base
