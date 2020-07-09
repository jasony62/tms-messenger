module.exports = {
  local: {
    rootDir: process.env.TMS_MESSENGER_FS_ROOTDIR || 'storage',
    domains: { upload: {}, output: {} },
    defaultDomain: 'upload',
  },
}
