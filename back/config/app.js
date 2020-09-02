let appConfig = {
  name: process.env.TMS_APP_NAME || 'tms-messenger', // 如需自定义可在项目根目录下创建/back/.env文件配置成环境变量
  port: process.env.TMS_APP_PORT || 3000, // 如需自定义可在项目根目录下创建/back/.env文件配置成环境变量
  router: {
    auth: {
      prefix: '', // 鉴权接口调用url的前缀
    },
    controllers: {
      prefix: '', // 接口调用url的前缀
    },
    fsdomain: {
      prefix: 'fs', // 文件下载服务的前缀
    },
  },
  auth: {
    disabled: true,
  },
  tmConfig: {
    axios_proxy: process.env.TMS_APP_AXIOS_PROXY ? JSON.parse(process.env.TMS_APP_AXIOS_PROXY) : false // { "host": "127.0.0.1", "port": 9000, "auth": { "username": "admin", "password": "admin" } }
  }
}

module.exports = appConfig
