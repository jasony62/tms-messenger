let appConfig = {
  router: {
    auth: {
      prefix: 'messenger/auth', // 鉴权接口调用url的前缀
    },
    controllers: {
      prefix: 'messenger/api', // 接口调用url的前缀
    },
    fsdomain: {
      prefix: 'messenger/fs', // 文件下载服务的前缀
    },
  },
  auth: {
    disabled: true,
    jwt: {
      privateKey: 'tms-messenger',
      expiresIn: 3600,
    },
    captcha: {
      code: '1234',
    },
    //
    client: {
      accounts: [
        // 默认用户组
        {
          id: 1,
          username: 'root',
          password: 'root',
        },
      ],
    },
  },
  tmConfig: {
    axios_proxy: process.env.TMS_APP_AXIOS_PROXY ? JSON.parse(process.env.TMS_APP_AXIOS_PROXY) : false // { "host": "127.0.0.1", "port": 9000, "auth": { "username": "admin", "password": "admin" } }
  }
}

module.exports = appConfig
