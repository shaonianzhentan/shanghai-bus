let bus = require('./index')

bus("748路").then(data=>{
    //获取第5站的到站信息
   data.getStop(5).then(data=>{
       console.log(data)
   })
})