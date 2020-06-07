const _ = require('lodash')
const { ResultData, ResultFault, ResultObjectNotFound } = require('tms-koa')

const BaseCtrl = require('../../base')
const TaskModel = requireModel('task')
const MessageModel = requireModel('message')

/**
 * 发送消息
 */
class Message extends BaseCtrl {
  constructor(...args) {
    super(...args)
    this.msgModel = new MessageModel(this)
    this.taskModel = new TaskModel(this)
  }
  /**
   * 添加发送消息
   */
  async add() {
    const { task } = this.request.query

    /* 检查任务是否存在 */
    const msgTask = await this.taskModel.byCode(task)
    if (!msgTask) return new ResultObjectNotFound('指定的任务不存在')

    const { receivers, cover, body } = this.request.body

    if (!Array.isArray(receivers) || receivers.length === 0) return new ResultFault('没有指定消息接收人')

    /* 检查消息封面参数是否可用 */
    let coverData
    if (_.get(msgTask, 'cover.template.params.length')) {
      if (cover && cover.data) {
        if (cover.data.length !== receivers.length) return new ResultFault('消息封面参数和接收消息用户数量不一致')
        const params = msgTask.cover.template.params
        coverData = cover.data.map((row) =>
          params.reduce((newRow, { name }) => {
            if (row.hasOwnProperty(name)) newRow[name] = row[name]
            return newRow
          }, {})
        )
      }
    }

    /* 检查消息内容参数是否可用 */
    let bodyData
    if (_.get(msgTask, 'body.template.params.length')) {
      if (body && body.data) {
        if (body.data.length !== receivers.length) return new ResultFault('消息内容参数和接收消息用户数量不一致')
        if (!body.data.url) {
          const params = msgTask.body.template.params
          bodyData = body.data.map((row) =>
            params.reduce((newRow, { name }) => {
              if (row.hasOwnProperty(name)) newRow[name] = row[name]
              return newRow
            }, {})
          )
        }
      }
    }

    /* 构造消息 */
    const createAt = this.msgModel.now

    const baseMsg = { taskCode: msgTask.code }
    if (this.bucket) baseMsg.bucket = this.bucket
    if (this.client) baseMsg.creator = this.client.id

    const messages = []
    receivers.forEach((receiver, index) => {
      let msg = Object.assign({}, baseMsg, { receiver, createAt })
      msg.code = this.msgModel.getNewCode()
      if (coverData) msg.cover = { data: coverData[index] }
      if (bodyData) msg.body = { data: bodyData[index] }
      messages.push(msg)
    })

    const newMessages = await this.msgModel.clMessage.insertMany(messages).then((result) => result.ops)
    const result = newMessages.map(({ code, receiver }) => ({ code, receiver }))

    return new ResultData(result)
  }
  /**
   * 修改发送消息
   */
  async modify() {
    const { code } = this.request.query

    const message = this.request.body

    const query = { code }
    if (this.bucket) query.bucket = this.bucket

    const cl = this.msgModel.clMessage

    const beforeMsg = await cl.findOne(query)
    if (!beforeMsg) return new ResultObjectNotFound('指定的消息不存在')
    if (beforeMsg.removeAt) return new ResultFault('指定的消息已经删除，不能修改')

    let { _id, ...updatedMsg } = message
    delete updatedMsg.code

    updatedMsg.latestModifiedAt = this.msgModel.now

    await cl.updateOne(query, { $set: updatedMsg })

    return new ResultData('ok')
  }
  /**
   * 删除发送消息
   */
  async remove() {
    const { code } = this.request.query

    const query = { code }
    if (this.bucket) query.bucket = this.bucket

    const cl = this.msgModel.clMessage

    const beforeMsg = await cl.findOne(query)
    if (!beforeMsg) return new ResultObjectNotFound('指定的消息不存在')
    if (beforeMsg.removeAt) return new ResultFault('指定的消息已经删除，不能重复删除')

    if (beforeMsg.usedAt) {
      removeAt = this.msgModel.now
      await cl.updateOne(query, { $set: { removeAt } })
    } else {
      await cl.deleteOne(query)
    }

    return new ResultData('ok')
  }
  /**
   * 消息列表
   */
  async list() {
    const query = { removeAt: { $exists: false } }
    if (this.bucket) query.bucket = this.bucket

    const messages = await this.msgModel.clMessage.find(query, { projection: { _id: 0 } }).toArray()

    return new ResultData(messages)
  }
  /**
   * 生成发送请求
   */
  async push() {
    const { code } = this.request.query

    const message = await this.msgModel.byCode(code)
    if (!message || message.removeAt) return new ResultObjectNotFound('指定的消息不存在或不可用')

    const { MsgRequestQueue } = require('../../../service/queue/sendmsg')
    const newReq = await MsgRequestQueue.push(message)

    return new ResultData(newReq.code)
  }
}

module.exports = Message
