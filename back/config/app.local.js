let appConfig = {
  router: {
    auth: {
      prefix: 'messenger/auth', // 鉴权接口调用url的前缀
    },
    controllers: {
      prefix: 'messenger/api', // 接口调用url的前缀
    },
    fsdomain: {
      prefix: 'messenger/fs', // 文件下载服务的前缀
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
}

module.exports = appConfig
