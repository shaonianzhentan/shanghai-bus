# shanghai-bus
上海公交

项目地址：https://github.com/shaonianzhentan/shanghai-bus

使用例子：

    let bus = require('shanghai-bus')

    bus("748路").then(data => {
        //获取第5站的到站信息
        data.getStop(5).then(data => {
            if (data.status === 1) {
                console.log(data)
            } else {
                console.log('待发车')
            }
        })
    })


## 注意该项目还在开发期间，接口可能会有变动，请升级前确定是否能正常使用