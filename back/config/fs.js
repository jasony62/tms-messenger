module.exports = {
  local: {
    rootDir: process.env.TMS_MESSENGER_FS_ROOTDIR || '/Users/yangyue/project/tms-messenger/files',
    domains: { upload: {}, output: {} },
    defaultDomain: 'upload',
  },
}
