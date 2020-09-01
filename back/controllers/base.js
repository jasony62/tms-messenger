const { Ctrl, ResultFault, ResultObjectNotFound } = require('tms-koa')
const modelBase = requireModel('base')

const axios = require('axios')
const adapter = require('axios/lib/adapters/http')
const log4js = require('log4js')
const logger = log4js.getLogger('tms-messenger-base')

function allowAccessBucket(bucket, clientId) {

  return true

  if (bucket.creator === clientId) return true

  const { coworkers } = bucket

  if (!Array.isArray(coworkers)) return false

  return coworkers.some((c) => c.id === clientId)
}

const BUCKET_DB = process.env.TMS_KOA_BUCKET_DB

const BUCKET_COLLECTION = process.env.TMS_KOA_BUCKET_COLLECTION

class Base extends Ctrl {
  constructor(...args) {
    super(...args)
  }
  async tmsBeforeEach() {
    /* 多租户模式下，检查bucket访问权限 */
    if (/yes|true/i.test(process.env.TMS_MSG_REQUIRE_BUCKET)) {
      const bucketName = this.request.query.bucket
      if (!bucketName) {
        // return new ResultFault('没有提供bucket参数')
        return true
      }
      // 检查bucket是否存在
      const client = this.mongoClient
      const clBucket = client.db(BUCKET_DB).collection(BUCKET_COLLECTION)
      const bucket = await clBucket.findOne({ name: bucketName })
      if (!bucket) {
        return new ResultObjectNotFound('指定的bucket不存在')
      }
      // 检查当前用户是否对bucket有权限
      if (!allowAccessBucket(bucket, this.client.id)) {
        // 检查是否做过授权
        return new ResultObjectNotFound('没有访问指定bucket的权限')
      }
      this.bucket = bucket.name
      this.bucketObj = bucket

      return true
    }
  }
  /**
   * 实例化 WXProxy
   */
  getWXProxyObj(wxConfig) {
    const model = new modelBase(this)
    return model.getWXProxyObj(wxConfig)
  }
  /**
   * 
   */
  async _httpPost(cmd, posted, options = {}) {
    let url = cmd
    options.adapter = adapter
    options.timeout = 10000

    return axios.post(url, posted, options)
      .then(rsp => rsp.data)
      .catch(e => {
        logger.error(e)
        return Promise.resolve(false)
      })
  }
}

module.exports = Base
