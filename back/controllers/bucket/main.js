const { ResultData, ResultFault } = require('tms-koa')
const BaseCtrl = require('../base')
const Bucket = requireModel('bucket')

class Main extends BaseCtrl {
  constructor(...args) {
    super(...args)
  }
  /**
   *  添加一个bucket
   */
  async create() {
    const { bucket: bucketName, proxyUrl } = this.request.body
    if (!bucketName || !proxyUrl) return new ResultFault('参数格式错误')

    const bucketModel = new Bucket(this)
    // 是否已存在同名bucket
    const bucketObj = await bucketModel.byName(bucketName)
    if (bucketObj) return new ResultData('已存在')

    const rst = await bucketModel.create({ name: bucketName, proxyUrl })

    return new ResultData(rst.result)
  }
  /**
   *  添加一个bucket
   */
  async update() {
    const { proxyUrl } = this.request.body
    if (!this.bucket || !proxyUrl) return new ResultFault('参数格式错误')

    const bucketModel = new Bucket(this)
    const rst = await bucketModel.update(this.bucket.name, { proxyUrl })

    return new ResultData(rst.result)
  }
}

module.exports = Main
