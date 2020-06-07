消息管理服务，支持制作多种形式的模板消息（例如：文字，图片），通过多种通道（例如：微信公众号）发送。

# 操作过程

建立发送通道。

建立封面模板

建立内容模板

建立发送任务

建立发送消息

发送消息

# 数据集合

| 集合           | 说明                                                                               |
| -------------- | ---------------------------------------------------------------------------------- |
| channel        | 消息发送通道，例如：微信公众号或短信，保存连接参数。                               |
| cover_template | 消息封面模板，和消息通道的模板对应，用户接收到消息时看到的内容。必须对应某个通道。 |
| body_template  | 消息内容模板，用户打开接收的消息后看到的内容。                                     |
| task           | 消息发送任务，定义使用的封面模板和内容模板。                                       |
| message        | 消息。填写发送任务需要的参数后生成的消息定义。                                     |
| request        | 消息发送请求。消息可以进行多次发送，每次发送产生 1 个发送请求。                    |

# 环境变量

服务端

| 环境变量                                  | 必填 | 说明                                  |
| ----------------------------------------- | ---- | ------------------------------------- |
| TMS_APP_NAME                              | 否   | 默认值：tms-messenger。               |
| TMS_APP_PORT                              | 否   | 默认值：3000.                         |
| TMS_APP_LOG4JS_LEVEL                      | 否   | 默认值：debug.                        |
| TMS_MESSENGER_MONGODB_HOST                | 是   |                                       |
| TMS_MESSENGER_MONGODB_PORT                | 是   |                                       |
| TMS_MESSENGER_MONGODB_DB                  | 是   | 无                                    |
| TMS_MESSENGER_REQUIRE_BUCKET              |      |                                       |
| TMS_WXPROXY_MONGODB_DB                    | 否   |                                       |
| TMS_WXPROXY_MONGODB_CL_CONFIG             | 否   | 存放微信公众号配置信息的集合          |
| TMS_WXPROXY_MONGODB_CL_TEMPLATE_MESSAGE   | 否   | 记录发送微信模版消息的集合            |
| TMS_MESSENGER_READ_MESSAGE_URL            | 是   | 读取推送消息的地址                    |
| TMS_MESSENGER_MESSAGE_REQUEST_QUEUE_REDIS | 是   | 消息请求发送队列使用的 redis 连接名称 |
| TMS_MESSENGER_MESSAGE_REQUEST_QUEUE_NAME  | 是   | 消息请求发送队列名称                  |
| TMS_KOA_JIMP_FONT_PATH                    | 是   | 图片消息模板对应字库路径              |
| TMS_KOA_JIMP_SAVE_FS_DOMAIN               | 是   | 生成的图片消息的存储位置              |
