const log4jsConfig = require('./config/log4js')
const log4js = require('log4js')
log4js.configure(log4jsConfig)
const logger = log4js.getLogger()

process.on('uncatchException', function (e) {
  logger.error('未处理异常', e)
  // eslint-disable-next-line no-process-exit
  process.exit(0)
})

const { TmsKoa } = require('tms-koa')

const tmsKoa = new TmsKoa()

/* 以根目录为起点引入模型 */
global.requireModel = function (relativePath) {
  return require(__dirname + '/models/' + relativePath)
}
/* 引入模型 */
const TmsMesgLockPromise = require('tms-wxproxy/lock-promise')
global.TmsMesgLockPromise = new TmsMesgLockPromise()

tmsKoa.startup({
  afterInit: async function () {
    logger.info('完成启动前初始化')
    const { MsgRequestQueue } = require('./service/queue/sendmsg')
    MsgRequestQueue.startup()
  },
})
