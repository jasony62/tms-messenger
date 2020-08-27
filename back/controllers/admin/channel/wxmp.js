const { ResultData, ResultFault, ResultObjectNotFound } = require('tms-koa')

const BaseCtrl = require('../../base')
const ChannelModel = requireModel('channel')

/**
 * 消息通道——微信公众号
 */
class WxmpCtrl extends BaseCtrl {
  constructor(...args) {
    super(...args)
    this.model = new ChannelModel(this)
  }
  /**
   * 添加微信公众号消息通道
   */
  async add() {
    const { title, appid, appsecret, remark } = this.request.body

    const code = this.model.getNewCode()
    const createAt = this.model.now
    const created = {
      code,
      title,
      createAt,
      type: 'wxmp',
      appid,
      appsecret,
      remark,
    }

    if (this.bucket) created.bucket = this.bucket

    if (this.client) created.creator = this.client.id

    const newChan = await this.model.clChannel.insertOne(created).then((result) => result.ops[0])

    delete newChan._id

    return new ResultData(newChan)
  }
  /**
   * 删除微信公众号通道
   * 如果通道没有使用就删除，否则添加removeAt字段标记为删除。
   */
  async remove() {
    const { code } = this.request.query

    const query = { code }
    if (this.bucket) query.bucket = this.bucket

    const cl = this.model.clChannel

    const beforeChannel = await cl.findOne(query)
    if (!beforeChannel) return new ResultObjectNotFound('指定的通道不存在')
    if (beforeChannel.removeAt) return new ResultFault('指定的通道已经删除，不能重复删除')

    if (beforeChannel.usedAt) {
      removeAt = this.model.now
      await cl.updateOne(query, { $set: { removeAt } })
    } else {
      await cl.deleteOne(query)
    }

    return new ResultData('ok')
  }
  /**
   * 修改通道
   */
  async modify() {
    const { code } = this.request.query

    const channel = this.request.body

    const query = { code }
    if (this.bucket) query.bucket = this.bucket

    const cl = this.model.clChannel

    const beforeChannel = await cl.findOne(query)
    if (!beforeChannel) return new ResultObjectNotFound('指定的微信模板消息推送通道不存在')
    if (beforeChannel.removeAt) return new ResultFault('指定的微信模板消息推送通道已经删除，不能修改')

    let { _id, ...updatedChannel } = channel
    delete updatedChannel.code

    updatedChannel.latestModifiedAt = this.model.now

    await cl.updateOne(query, { $set: updatedChannel })

    return new ResultData('ok')
  }
  /**
   * 微信公众号通道列表
   */
  async list() {
    const query = { type: 'wxmp', removeAt: { $exists: false } }
    if (this.bucket) query.bucket = this.bucket

    const channels = await this.model.clChannel
      .find(query, { projection: { _id: 0, appid: 0, appsecret: 0, accessToken: 0 } })
      .toArray()

    return new ResultData(channels)
  }
  /**
   * 获取通道
   */
  async get() {
    const { code } = this.request.query

    return this
      .model
      .byCode(code)
      .then(r => {
        if (r) return new ResultData(r)
        else return new ResultFault("未找到该通道")
      })
  }
}

module.exports = WxmpCtrl
