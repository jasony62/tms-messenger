const Base = require('./base')

class Index extends Base {
  constructor(...args) {
    super(...args)
  }
  /**
   * 
   */
  async byName(name) {
    return this.clBucket.findOne({ name })
  }
  /**
   * 
   */
  async create(data) {
    return this.clBucket.insertOne(data)
  }
  /**
   * 
   */
  async update(name, data) {
    return this.clBucket.updateOne({ name }, { $set: data })
  }
}

module.exports = Index