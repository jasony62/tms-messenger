const { ResultData, ResultFault, ResultObjectNotFound } = require('tms-koa')
const FsBaseCtrl = require('tms-koa/lib/controller/fs/base').BaseCtrl

const { LocalFS } = require('tms-koa/lib/model/fs/local')

const BaseCtrl = require('../../../../base')
const BodyTplModel = require('../../../../../model/template/body')

/**
 * 图片模板
 */
class ImageTemplate extends BaseCtrl {
  constructor(...args) {
    super(...args)
    this.tplModel = new BodyTplModel(this)
    this.fsBaseCtrl = new FsBaseCtrl(...args)
  }
  async tmsBeforeEach() {
    super.tmsBeforeEach()
    this.fsBaseCtrl.tmsBeforeEach.apply(this)
  }
  /**
   * 添加图片消息模板定义
   */
  async add() {
    const { image } = this.request.query

    const localFS = new LocalFS(this.domain, this.bucket)

    if (!image || !localFS.existsSync(image)) return new ResultFault('指定的文件不存在')

    const { title, params, remark } = this.request.body

    const code = this.tplModel.getNewCode()
    const createAt = this.tplModel.now
    const newTpl = {
      code,
      title,
      createAt,
      type: 'image',
      image: { domain: this.domain.name, bucket: this.bucket, path: image },
      params,
      remark,
    }

    if (this.bucket) newTpl.bucket = this.bucket

    if (this.client) newTpl.creator = this.client.id

    const newTemplate = await this.tplModel.clBodyTemplate.insertOne(newTpl).then((result) => result.ops[0])

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

    const cl = this.tplModel.clBodyTemplate

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

    const cl = this.tplModel.clBodyTemplate

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

    const templates = await this.tplModel.clBodyTemplate.find(query, { projection: { _id: 0 } }).toArray()

    return new ResultData(templates)
  }
}

module.exports = ImageTemplate
