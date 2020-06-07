/**
 * 消息内容模板
 */
const path = require('path')
const ejs = require('ejs')

const { LocalFS } = require('tms-koa/lib/model/fs/local')

const Base = require('../base')

function getContent(template, body) {
  let content
  if (body.content) content = body.content
  return content
}

async function getImageUrl(template, body) {
  if (body.url) return body.url

  const { image } = template
  if (!image) throw Error('没有提供图片模板消息底图')

  const localFS = new LocalFS(image.domain, image.bucket)

  const imagepath = localFS.fullpath(image.path)

  /* 根据模板信息生成图片，并返回url */
  const newTextWatermark = require('tms-koa-jimp/helper/watermark').newTextWatermark

  const textWatermark = await newTextWatermark(imagepath)

  template.params.forEach((param) => {
    const text = body.data[param.name]
    if (text) {
      const { x, y, color, bgColor, width, fontSize, align } = param
      textWatermark.addText(text, x, y, color, bgColor, width, fontSize, align)
    }
  })

  const path = await textWatermark.save()

  return path.publicPath
}

class BodyTemplate extends Base {
  constructor(...args) {
    super(...args)
  }
  /**
   * 获得模板定义
   *
   * @param {string} code
   */
  async byCode(code) {
    const tpl = await this.clBodyTemplate.findOne({ code }, { $projection: { _id: 0 } })

    return tpl
  }
  /**
   * 生成消息页面
   *
   * @param {string} code
   * @param {object} body
   */
  async render(code, body) {
    const template = await this.byCode(code)
    if (!template) throw Error('消息记录数据错误，任务记录模板不存在')
    if (!template.type) throw Error('消息记录数据错误，任务记录模板数据不完整')

    let html
    switch (template.type) {
      case 'text':
        let content = getContent(template, body)
        html = ejs.renderFile(path.resolve('_template/text.ejs'), { content })
        break
      case 'image':
        let url = await getImageUrl(template, body)
        html = ejs.renderFile(path.resolve('_template/image.ejs'), { url })
        break
      default:
        html = `不支持的消息类型${template.type}`
    }

    return html
  }
}

module.exports = BodyTemplate
