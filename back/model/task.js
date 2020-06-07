const Base = require('./base')
const CoverTplModel = require('./template/cover')
const BodyTplModel = require('./template/body')

class Task extends Base {
  constructor(...args) {
    super(...args)
  }
  /**
   * 获得任务定义
   *
   * @param {string} code
   * @param {string} bucket
   */
  async byCode(code, bucket) {
    const query = { code }
    if (bucket && typeof bucket === 'string') query.bucket = bucket

    const task = await this.clTask.findOne(query, { $projection: { _id: 0 } })
    if (!task) return false

    if (task.cover && task.cover.templateCode) {
      const coverTplModel = new CoverTplModel(this)
      const coverTpl = await coverTplModel.byCode(task.cover.templateCode)
      if (!coverTpl) throw Error('任务记录关联的消息封面模板记录不存在')
      task.cover.template = coverTpl
      delete task.cover.templateCode
    }

    if (task.body && task.body.templateCode) {
      const bodyTplModel = new BodyTplModel(this)
      const bodyTpl = await bodyTplModel.byCode(task.body.templateCode)
      if (!bodyTpl) throw Error('任务记录关联的消息内容模板记录不存在')
      task.body.template = bodyTpl
      delete task.body.templateCode
    }

    return task
  }
}

module.exports = Task
