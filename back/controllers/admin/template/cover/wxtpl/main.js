const log4js = require('log4js')
const logger = log4js.getLogger('tms-messenger')

const { ResultData, ResultFault, ResultObjectNotFound } = require('tms-koa')

const BaseCtrl = require('../../../../base')
const CoverTplModel = requireModel('template/cover')
const ChannelModel = requireModel('channel')

const { WXProxy } = require('tms-wxproxy')

/**
 * 微信模板消息模板
 */
class WxtplTemplate extends BaseCtrl {
  constructor(...args) {
    super(...args)
    this.tplModel = new CoverTplModel(this)
  }
  /**
   * 从微信公众号通道同步可用的消息模板
   */
  async sync() {
    const { channelCode } = this.request.query
    const chanModel = new ChannelModel(this)
    const chan = await chanModel.byCode(channelCode)
    if (!chan || chan.removeAt) {
      let msg = `消息通道不存在或不可用`
      logger.debug(msg, `channelCode=${channelCode}`)
      return ResultObjectNotFound(msg)
    }

    const { appid, appsecret, _id } = chan
    const wxConfig = { appid, appsecret, _id }
    const wxproxy = new WXProxy(wxConfig, this.mongoClient, TmsMesgLockPromise)

    const templates = await wxproxy.templateList()

    const createAt = this.tplModel.now

    return Promise.all(
      templates.map(async (tpl) => {
        const { template_id, title, params, content, example } = tpl
        const query = { wxTemplateId: tpl.template_id }
        if (this.bucket) query.bucket = this.bucket
        let beforeTpl = await this.tplModel.clCoverTemplate.findOne(query)

        if (beforeTpl) {
          this.tplModel.clCoverTemplate.updateOne(query, {
            $set: {
              title,
              params,
              content,
              example,
            },
          })
          Object.assign(beforeTpl, { title, params, content, example })
          return beforeTpl
        } else {
          const code = this.tplModel.getNewCode()
          const newTpl = {
            code,
            title,
            createAt,
            type: 'wxtpl',
            wxTemplateId: template_id,
            params,
            content,
            example,
            channelCode,
          }
          if (this.bucket) newTpl.bucket = this.bucket
          if (this.client) newTpl.creator = this.client.id

          return await this.tplModel.clCoverTemplate.insertOne(newTpl).then((result) => result.ops[0])
        }
      })
    ).then((newTpls) => new ResultData(newTpls))
  }
  /**
   * 添加微信模板消息模板定义
   */
  async add() {
    const { channelCode, wxTemplateId } = this.request.query

    /* 检查所属消息通道 */
    const chanModel = new ChannelModel(this)
    const channel = await chanModel.byCode(channelCode)
    if (!channel || channel.removeAt) return new ResultObjectNotFound('指定的消息通道不存在或不可用')

    const { title, params, remark } = this.request.body

    const code = this.tplModel.getNewCode()
    const createAt = this.tplModel.now
    const newTpl = {
      code,
      title,
      createAt,
      type: 'wxtpl',
      wxTemplateId,
      params,
      channelCode: channel.code,
      remark,
    }

    if (this.bucket) newTpl.bucket = this.bucket

    if (this.client) newTpl.creator = this.client.id

    const newTemplate = await this.tplModel.clCoverTemplate.insertOne(newTpl).then((result) => result.ops[0])

    delete newTemplate._id

    return new ResultData(newTemplate)
  }
  /**
   * 删除模板
   * 如果模板没有使用就删除，否则添加removeAt字段标记为删除。
   */
  async remove() {
    const { code } = this.request.query

    const query = { code }
    if (this.bucket) query.bucket = this.bucket

    const cl = this.tplModel.clCoverTemplate

    const beforeTemplate = await cl.findOne(query)
    if (!beforeTemplate) return new ResultObjectNotFound('指定的模板不存在')
    if (beforeTemplate.removeAt) return new ResultFault('指定的模板已经删除，不能重复删除')

    if (beforeTemplate.usedAt) {
      removeAt = this.tplModel.now
      await cl.updateOne(query, { $set: { removeAt } })
    } else {
      await cl.deleteOne(query)
    }

    return new ResultData('ok')
  }
  /**
   * 修改模板
   */
  async modify() {
    const { code } = this.request.query

    const template = this.request.body

    const query = { code }
    if (this.bucket) query.bucket = this.bucket

    const cl = this.tplModel.clCoverTemplate

    const beforeTemplate = await cl.findOne(query)
    if (!beforeTemplate) return new ResultObjectNotFound('指定的模板不存在')
    if (beforeTemplate.removeAt) return new ResultFault('指定的模板已经删除，不能修改')

    let { _id, ...updatedTemplate } = template
    delete updatedTemplate.code

    updatedTemplate.latestModifiedAt = this.tplModel.now

    await cl.updateOne(query, { $set: updatedTemplate })

    return new ResultData('ok')
  }
  /**
   * 模板列表
   */
  async list() {
    const query = { removeAt: { $exists: false } }
    if (this.bucket) query.bucket = this.bucket

    const templates = await this.tplModel.clCoverTemplate
      .find(query, { projection: { _id: 0, wxTemplateId: 0, params: 0, content: 0 } })
      .toArray()

    return new ResultData(templates)
  }
}

module.exports = WxtplTemplate
