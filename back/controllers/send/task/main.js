const { ResultData, ResultFault, ResultObjectNotFound } = require('tms-koa')

const BaseCtrl = require('../../base')
const TaskModel = requireModel('task')
const CoverTplModel = requireModel('template/cover')
const BodyTplModel = requireModel('template/body')

/**
 * 发送任务
 */
class Task extends BaseCtrl {
  constructor(...args) {
    super(...args)
    this.taskModel = new TaskModel(this)
  }
  /**
   * 添加任务
   */
  async add() {
    const { title, remark, cover, body } = this.request.body
    /* 检查封面模板是否存在 */
    let coverTpl
    if (cover) {
      if (cover.templateCode) {
        const coverTplModel = new CoverTplModel(this)
        coverTpl = await coverTplModel.byCode(cover.templateCode)
        if (!coverTpl) return new ResultFault('指定的消息封面模板不存在')
      }
    }
    /* 检查内容模板是否存在 */
    let bodyUrl, bodyTpl
    if (body) {
      if (body.url) {
        // @todo 检查是否为合规的url
        bodyUrl = body.url
      } else if (body.templateCode) {
        const bodyTplModel = new BodyTplModel(this)
        bodyTpl = await bodyTplModel.byCode(body.templateCode)
        if (!bodyTpl) return new ResultFault('指定的消息内容模板不存在')
      }
    }

    const code = this.taskModel.getNewCode()
    const createAt = this.taskModel.now

    let newTask = { code, title, createAt, remark }

    if (this.bucket) newTask.bucket = this.bucket

    if (this.client) newTask.creator = this.client.id

    /* 消息封面 */
    if (coverTpl) {
      newTask.cover = {
        templateCode: coverTpl.code,
      }
      if (cover.data && Object.keys(cover.data).length) {
        const keys = Object.keys(cover.data)
        const coverData = {}
        keys.forEach((name) => {
          const { value, color } = cover.data[name]
          if (typeof value === 'string') coverData[name] = { value, color: /^#/.test(color) ? color : '#173177' }
        })
        newTask.cover.data = coverData
      }
    }
    /* 消息内容 */
    if (bodyUrl) {
      newTask.body = {
        url: bodyUrl,
      }
    } else if (bodyTpl) {
      newTask.body = {
        templateCode: bodyTpl.code,
      }
    }

    newTask = await this.taskModel.clTask.insertOne(newTask).then((result) => result.ops[0])
    delete newTask._id

    return new ResultData(newTask)
  }
  /**
   * 修改任务
   */
  async modify() {
    const { code } = this.request.query

    const beforeTask = this.taskModel.byCode(code, this.bucket)
    if (!beforeTask) return new ResultObjectNotFound('指定的消息发送任务不存在')
    if (beforeTask.removeAt) return new ResultFault('指定的消息发送任务已经删除，不能重复删除')

    const task = this.request.body

    let { _id, ...updatedTask } = task
    delete updatedTask.code

    updatedTask.latestModifiedAt = this.taskModel.now

    const query = { code }
    if (this.bucket) query.bucket = this.bucket

    await this.taskModel.clTask.updateOne(query, { $set: updatedTask })

    return new ResultData('ok')
  }
  /**
   * 删除任务
   */
  async remove() {
    const { code } = this.request.query

    const beforeTask = this.taskModel.byCode(code, this.bucket)
    if (!beforeTask) return new ResultObjectNotFound('指定的消息发送任务不存在')
    if (beforeTask.removeAt) return new ResultFault('指定的消息发送任务已经删除，不能重复删除')

    const query = { code }
    if (this.bucket) query.bucket = this.bucket
    const cl = this.taskModel.clTask
    if (beforeTask.usedAt) {
      removeAt = this.taskModel.now
      await cl.updateOne(query, { $set: { removeAt } })
    } else {
      await cl.deleteOne(query)
    }

    return new ResultData('ok')
  }
  /**
   * 任务列表
   */
  async list() {
    const query = { removeAt: { $exists: false } }
    if (this.bucket) query.bucket = this.bucket

    const templates = await this.taskModel.clTask.find(query, { projection: { _id: 0 } }).toArray()

    return new ResultData(templates)
  }
  /**
   * 发送任务下的消息
   */
  async push() {
    const { code } = this.request.query

    if (typeof code !== 'string') return new ResultFault('没有指定消息任务编码')

    const beforeTask = this.taskModel.byCode(code, this.bucket)
    if (!beforeTask) return new ResultObjectNotFound('指定的消息发送任务不存在')
    if (beforeTask.removeAt) return new ResultFault('指定的消息发送任务已经删除，不能重复删除')

    /* 任务下所有符合条件的消息 */
    const msgCodes = await this.taskModel.clMessage
      .find(
        { taskCode: code, firstPushAt: { $exists: false }, removeAt: { $exists: false } },
        { projection: { _id: 0, code: 1 } }
      )
      .toArray()

    if (msgCodes.length === 0) return new ResultFault(`指定的任务下没有要发送的消息`)

    const MessageModel = requireModel('message')
    const { MsgRequestQueue } = require('../../../service/queue/sendmsg')

    const msgModel = new MessageModel(this)

    return Promise.all(msgCodes.map(({ code }) => msgModel.byCode(code)))
      .then((messages) => Promise.all(messages.map((message) => MsgRequestQueue.push(message))))
      .then((requests) => {
        return new ResultData(requests.length)
      })
  }
}

module.exports = Task
