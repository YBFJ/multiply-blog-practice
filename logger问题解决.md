## 知识点：

- require 用于加载代码 循环依赖陷阱
  > require 的循环依赖陷阱 [哪天你发现一个你明明已经 exports 了的方法报 undefined is not a function，我们就该提醒一下自己：哦，也许是它来了。](https://github.com/nswbmw/N-blog/blob/master/book/2.1%20require.md)

* exports 和 module.exports 则用来导出代码

```JavaScript
exports = module.exports = {...}
```

等价于

```JavaScript
module.exports = {...}
exports = module.exports
```

exports 是对 module.exports 的引用，即 module.exports 和 exports 指向同一块内存，

> [原理很简单：module.exports 指向新的对象时，exports 断开了与 module.exports 的引用，那么通过 exports = module.exports 让 exports 重新指向 module.exports。](https://github.com/nswbmw/N-blog/blob/master/book/2.2%20exports%20%E5%92%8C%20module.exports.md)

- promise 用于异步流程控制

> [promise 的各种资料](https://github.com/nswbmw/N-blog/blob/master/book/2.3%20Promise.md)

- npm install
  > [我们通过 npm install 可以安装 npm 上发布的某个版本、某个 tag、某个版本区间的模块，甚至可以安装本地目录、压缩包和 git/github 的库作为依赖。](https://github.com/nswbmw/N-blog/blob/master/book/2.6%20npm%20%E4%BD%BF%E7%94%A8%E6%B3%A8%E6%84%8F%E4%BA%8B%E9%A1%B9.md)

运行以下命令：

```
npm config set save-exact true
```

这样每次 `npm i express --save` 的时候会锁定依赖的版本号，相当于加了 `--save-exact` 参数。安装 express，同时将 "express": "4.14.0" 写入 dependencies

- express.Router 路由挂载
  在入口文件中通过 app.use 方法，将每个路由文件挂载到不同的位置
  [router 讲解和官网链接](https://github.com/nswbmw/N-blog/blob/master/book/3.2%20%E8%B7%AF%E7%94%B1.md)

* 模板引擎 将页面模板和数据结合起来生成 html 的工具

[模板引擎的教程演示](https://github.com/nswbmw/N-blog/blob/master/book/3.3%20%E6%A8%A1%E6%9D%BF%E5%BC%95%E6%93%8E.md)

> 通过调用 `res.render` 函数渲染 ejs 模板，`res.render` **第一个参数是模板的名字，** 这里是 users 则会匹配 views/users.ejs，**第二个参数是传给模板的数据，** 这里传入 name，则在 ejs 模板中可使用 name。res.render 的作用就是将模板和数据结合生成 html，同时设置响应头中的 Content-Type: text/html，告诉浏览器我返回的是 html，不是纯文本，要按 html 展示。

ejs 有 3 种常用标签：

1. `<% code %>` ：运行 JavaScript 代码，不输出
2. `<%= code %>` ：显示转义后的 HTML 内容
3. `<%- code %>` ：显示原始 HTML 内容

- 中间件与 next
  express 中的中间件（middleware）就是用来处理请求的，当一个中间件处理完，可以通过调用 `next()` 传递给下一个中间件，如果没有调用 `next()`，则请求不会往下传递，如内置的 `res.render` 其实就是渲染完 html 直接返回给客户端，没有调用 `next()`，从而没有传递给下一个中间件。

## 开始搭建

- 准备工作

在目标文件夹下`npm init`，再创建空目录

1. `models` 存放操作数据库的文件
2. `public` 存放静态文件，比如样式、图片等
3. `routes` 存放路由文件
4. `views` 存放模板文件
5. `index.js` 程序主文件
6. `package.json` 存储项目名、描述、作者、依赖等等信息（此项 npm init 会自动创建）
   > 遵循的是 MVC（模型(model)－视图(view)－控制器(controller/route)） 的开发模式

- 安装依赖模块
  运行以下命令安装所需模块：

之前记得运行

```
npm config set save-exact true
```

这样--save 的时候会锁定依赖的版本号，相当于加了 --save-exact 参数

```sh
npm i config-lite connect-flash connect-mongo ejs express express-session marked moment mongolass objectid-to-timestamp sha1 winston express-winston --save
npm i https://github.com:utatti/express-formidable.git --save # 从 GitHub 安装 express-formidable 最新版，v1.0.0 有 bug
```

对应模块的用处：

1. `express`: web 框架
2. `express-session`: session 中间件
3. `connect-mongo`: 将 session 存储于 mongodb，结合 express-session 使用
4. `connect-flash`: 页面通知的中间件，基于 session 实现
5. `ejs`: 模板
6. `express-formidable`: 接收表单及文件上传的中间件
7. `config-lite`: 读取配置文件
8. `marked`: markdown 解析
9. `moment`: 时间格式化
10. `mongolass`: mongodb 驱动
11. `objectid-to-timestamp`: 根据 ObjectId 生成时间戳
12. `sha1`: sha1 加密，用于密码加密
13. `winston`: 日志
14. `express-winston`: express 的 winston 日志中间件

- [config-lite](https://github.com/nswbmw/N-blog/blob/master/book/4.3%20%E9%85%8D%E7%BD%AE%E6%96%87%E4%BB%B6.md) 轻量的读取配置文件的模块

config-lite 会根据环境变量（NODE_ENV）的不同加载 config 目录下不同的配置文件。

## 博客功能和路由设计

1. 注册
   1. 注册页：`GET /signup`
   2. 注册（包含上传头像）：`POST /signup`
2. 登录
   1. 登录页：`GET /signin`
   2. 登录：`POST /signin`
3. 登出：`GET /signout`
4. 查看文章
   1. 主页：`GET /posts`
   2. 个人主页：`GET /posts?author=xxx`
   3. 查看一篇文章（包含留言）：`GET /posts/:postId`
5. 发表文章
   1. 发表文章页：`GET /posts/create`
   2. 发表文章：`POST /posts/create`
6. 修改文章
   1. 修改文章页：`GET /posts/:postId/edit`
   2. 修改文章：`POST /posts/:postId/edit`
7. 删除文章：`GET /posts/:postId/remove`
8. 留言
   1. 创建留言：`POST /comments`
   2. 删除留言：`GET /comments/:commentId/remove`

由于我们博客页面是后端渲染的，所以只通过简单的 `<a>(GET)` 和 `<form>(POST)` 与后端进行交互，如果使用 jQuery 或者其他前端框架（如 Angular、Vue、React 等等）可通过 Ajax 与后端交互，则 api 的设计应尽量遵循 [Restful](https://github.com/nswbmw/N-blog/blob/master/book/4.4%20%E5%8A%9F%E8%83%BD%E8%AE%BE%E8%AE%A1.md) 风格。

- session 识别用户机制
- connect-flash 显示通知刷新一次之后消失，需要结合 express-session 使用

*  权限控制
  通过把把用户状态的检查封装成一个[中间件](https://github.com/nswbmw/N-blog/blob/master/book/4.4%20%E5%8A%9F%E8%83%BD%E8%AE%BE%E8%AE%A1.md)，在每个需要权限控制的路由加载该中间件，即可实现页面的权限控制
  通过 session 来实现。

## 问题解决

```
TypeError: winston.Logger is not a constructor
    at new winstonLogger (common\logWinston.js:28:20)
    at Object.<anonymous> (common\gracefulExit.js:8:17)
    at Module._compile (internal/modules/cjs/loader.js:702:30)
    at Object.Module._extensions..js (internal/modules/cjs/loader.js:713:10)
    at Module.load (internal/modules/cjs/loader.js:612:32)
    at tryModuleLoad (internal/modules/cjs/loader.js:551:12)
    at Function.Module._load (internal/modules/cjs/loader.js:543:3)
    at Module.require (internal/modules/cjs/loader.js:650:17)
    at require (internal/modules/cjs/helpers.js:20:18)
```

Solved this by:

```
npm uninstall winston
then:
npm install winston@2.4.3
```

报错

```
(node:9503) DeprecationWarning: current URL string parser is deprecated, and will be removed in a future version. To use the new parser, pass option { useNewUrlParser: true } to MongoClient.connect.
```

```JavaScript
mongolass.connect(
  config.mongodb,
  { useNewUrlParser: true }
);
```

在 connect 的后面跟上{ useNewUrlParser: true }
