let bus = require('./index')

bus("748路",1).then(data => {
    console.log(data.details.stops)
    //获取第5站的到站信息
    data.getStop(10).then(data => {
        if (data.status === 1) {
            console.log(data)
        } else {
            console.log('待发车')
        }
    })
})
