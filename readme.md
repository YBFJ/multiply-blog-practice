[多人博客教程项目源码]("https://github.com/nswbmw/N-blog.git")

##亮点

1. 后台交互
2. Semantic UI
3. ejs
4. Mongolass 对 MongoDB 的增删改查操作

写各个界面的总的流程就是首先在 model 里面写操作数据的方法（类似与数据库操作方法；
其次，在 routes 文件夹下面的 js 文件引入这个 model，并且使用里里面的方法后，搭建好 ejs 模板，把用 model 操作数据库方法 return 得到的结果传递到 ejs 模板里面去。

### ejs 常用标签

- <% code %>：运行 JavaScript 代码，不输出
- <%= code %>：显示转义后的 HTML 内容
- <%- code %>：显示原始 HTML 内容

### 后台数据交互

`<a>(GET)` 和 `<form>(POST)` 与后端进行交互，
GET 方法发送一个请求来取得服务器上的某一资源,
POST 方法向 URL 指定的资源提交数据或附加新的数据
tips:如果使用 jQuery 或者其他前端框架（如 Angular、Vue、React 等等）可通过 Ajax 与后端交互，

### 回话(session)

用于记录用户的状态

> cookie 与 session 的区别
>
> 1. cookie 存储在浏览器（有大小限制），session 存储在服务端（没有大小限制）
> 2. 通常 session 的实现是基于 cookie 的，session id 存储于 cookie 中
> 3. session 更安全，cookie 可以直接在浏览器查看甚至编辑

### 页面通知(connect-flash)

通知只显示一次，刷新后消失，我们可以通过 connect-flash 中间件实现这个功能

### 权限控制

我们可以把用户状态的检查封装成一个中间件，在每个需要权限控制的路由加载该中间件，即可实现页面的权限控制。

### session 存到 MongoDB

在入口文件的 session 中进行和数据库的连接并且储存，通过“connect-mongo”模块进行引入

```JS
store: new MongonStore({
      // 将 session 存储到 mongodb
      url: config.mongodb // mongodb 地址
    })
```

### 入口文件 inde.js 中加载中间件的顺序很重要

> 注意：中间件的加载顺序很重要。如上面设置静态文件目录的中间件应该放到 routes(app) 之前加载，这样静态文件的请求就不会落到业务逻辑的路由里；flash 中间件应该放到 session 中间件之后加载，因为 flash 是基于 session 实现的。

### Semantic UI 使用要点

> 上面 `<script></script>` 是 semantic-ui 操控页面控件的代码，一定要放到 footer.ejs 的 </body> 的前面，因为只有页面加载完后才能通过 JQuery 获取 DOM 元素。

### ejs 模板中变量的挂载

通过调用 res.render 函数渲染 ejs 模板，res.render 第一个参数是模板的名字，这里是 users 则会匹配 views/users.ejs，第二个参数是传给模板的数据，这里传入 name，则在 ejs 模板中可使用 name。

[源解释]("https://github.com/nswbmw/N-blog/blob/master/book/4.5%20%E9%A1%B5%E9%9D%A2%E8%AE%BE%E8%AE%A1.md")
我们用到了 blog、user、success、error 变量

> 在调用 `res.render` 的时候，express 合并（merge）了 3 处的结果后传入要渲染的模板，优先级：res.render 传入的对象> res.locals 对象 > app.locals 对象，所以 `app.locals` 和 `res.locals` 几乎没有区别，都用来渲染模板，使用上的区别在于：`app.locals` 上通常挂载常量信息（如博客名、描述、作者这种不会变的信息），`res.locals` 上通常挂载变量信息，即每次请求可能的值都不一样（如请求者信息，`res.locals.user = req.session.user`）。
> 所以通用变量的挂载在入口文件中：

```JS
// 设置模板全局常量
app.locals.blog = {
  title: pkg.name,
  description: pkg.description
};
// 添加模板必需的三个变量
app.use(function(req, res, next) {
  res.locals.user = req.session.user;
  res.locals.success = req.flash('success').toString();
  res.locals.error = req.flash('error').toString();
  next();
});
```

### 表单中的文件上传

代码地址：/myblog/views/signup.ejs

> 当我们上传的含有非文本内容，即含有文件（txt、MP3 等）的时候，需要将 form 的 enctype 设置为 multipart/form-

### 用户信息写入数据可以

代码地址：/myblog/routes/signup.js
明文密码要在用 sha1 加密之后存入数据库，存入数据库之后要删除密码这种敏感信息，然后才能将用户信息存入 session

```JS
// 用户信息写入数据库
  UserModel.create(user)
    .then(function (result) {
      // 此 user 是插入 mongodb 后的值，包含 _id
      user = result.ops[0]
      // 删除密码这种敏感信息，将用户信息存入 session
      delete user.password
      req.session.user = user
      // 写入 flash
      req.flash('success', '注册成功')
      // 跳转到首页
      res.redirect('/posts')
    })
    .catch(function (e) {
      // 注册失败，异步删除上传的头像
      fs.unlink(req.files.avatar.path)
      // 用户名被占用则跳回注册页，而不是错误页
      if (e.message.match('duplicate key')) {
        req.flash('error', '用户名已被占用')
        return res.redirect('/signup')
      }
      next(e)
    })
})
```

### 登录密码校验

代码地址：/myblog/routes/signin.js
在 UserModel.getUserByName 中少写了

> 这里我们在 POST /signin 的路由处理函数中，通过传上来的 name 去数据库中找到对应用户，校验传上来的密码是否跟数据库中的一致。不一致则返回上一页（即登录页）并显示『用户名或密码错误』的通知，一致则将用户信息写入 session，跳转到主页并显示『登录成功』的通知。

```JS
 // 检查密码是否正确
      if (sha1(password) !== user.password) {
        req.flash('error', '用户名或密码错误');
        return res.redirect('back');
      }
```

### MongoDB 使用

经过打印后，这里的 result 形式如下：所以要获得 user 对象，需要使用 `result.ops[0]`。使用 mongoose 就不会有这个问题。
所以每次用 model 存入数据库数据之后，取出来使用都需要用`result.ops[0]`,例如`post = result.ops[0];`

#### 存储文章操作相关代码就是用 MongoDB 对数据进行处理

代码地址：myblog/models/posts.js

### 关于 req.fields

在 routes/posts.js 的 POST /posts/create 发表一篇文章这个逻辑点的疑惑，
加了一个处理表单 express-formidable 中间件，它会把 form 表单里的字段放到 req.fields 中。express-formidable 对 form 做了解析，将请求内容挂载到了 req.fields 上。
在入口文件 index.js 中 require 了一下'express-formidable'

```JS
// 处理表单及文件上传的中间件
app.use(require('express-formidable')({
  uploadDir: path.join(__dirname, 'public/img'), // 上传文件目录
```

### mongoglass 内置插件 plugins.js

afterFind 的 reuslts 取得的是当前所有文章的数据，
afterFindOne 的 result 是取得当前用户的数据
自定义插件必须是按照

```JS
Mongolass.plugin("插件名字"，{ after(before)Find：function(args){ return somrthing } })
```
