var request = require('request');
var cheerio = require('cheerio');

var j = request.jar()
request = request.defaults({
	jar:j,
	headers:{
		'User-Agent': `Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_2 like Mac OS X) AppleWebKit/603.2.4 (KHTML, like Gecko) Mobile/14F89 MicroMessenger/6.5.10 NetType/WIFI Language/zh_CN`		
	}
})

class Bus
{
	constructor() {
		this.homepage_url = 'http://shanghaicity.openservice.kankanews.com/'
        this.query_router_url = 'http://shanghaicity.openservice.kankanews.com/public/bus'
        this.query_sid_url = 'http://shanghaicity.openservice.kankanews.com/public/bus/get'
        this.query_router_details_url = 'http://shanghaicity.openservice.kankanews.com/public/bus/mes/sid/'
        this.query_stop_url = 'http://shanghaicity.openservice.kankanews.com/public/bus/Getstop'	 
    }
	//进入主页
	_homepage(){
		return new Promise((resolve,reject)=>{
			request(this.homepage_url,(error, response, body)=>{
					if(error){						
						reject(error)
					}else{					
						resolve(body)
					}
			})
		})	
	}
	//进入公交查询页
	_query_router_page(){
		return new Promise((resolve,reject)=>{
			request({
				url:this.query_router_url,
				headers:{
					Host: 'shanghaicity.openservice.kankanews.com',
					Referer: 'http://shanghaicity.openservice.kankanews.com/'
				}
			},(error, response, body)=>{
					if(error){
						reject(error)
					}else{
						resolve(body)
					}
			})
		})	
	}
	//根据公交车名称查询对应的sid
	_query_sid(router_name){
		return new Promise((resolve,reject)=>{
			request.post({url:this.query_sid_url, form: {idnum:router_name}},(error, response, body)=>{
					if(error){
						reject(error)
					}else{
						resolve(JSON.parse(body))
					}
			})
		})
	}
	//查询公交详情（direction为方向）
	_query_router_details_page(sid, direction = 0){
		return new Promise((resolve,reject)=>{
			request(this.query_router_details_url + sid + '/stoptype/' + direction,(error, response, body)=>{
					if(error){
						reject(error)
					}else{					
						let $ = cheerio.load(body)
						let stations = direction === 0 ? $('div.upgoing.cur') : $('div.downgoing.cur')
						let s = stations.find('span')
						let stops = []						
						$('.station').each(function(){
							let t = $(this)
							stops.push({
								stop_id: t.find('.num').eq(0).text(),
								stop_name: t.find('.name').eq(0).text()
							})
						})
						resolve({
							'from': s.eq(0).text().trim(),
							'to': s.eq(1).text().trim(),
							'start_at': stations.find('em.s').eq(0).text().trim(),
							'end_at': stations.find('em.m').eq(0).text().trim(),
							'direction': direction,
							'stops': stops
						})
					}
			})
		})	
	}
	
	_query_stop(sid, direction, stop_id){
		return new Promise((resolve,reject)=>{			
			request({
				method: 'POST',
				uri: this.query_stop_url,
				formData:{
					'stoptype': direction, 'stopid': stop_id, 'sid': sid.toString()
				},
				headers:{
					Referer: this.query_router_details_url
				}
			  },
			  (error, response, body) => {				  
				if (error) {
				  reject(error)
				}
				resolve(body)
			  })
		})		
	}
	
	//查询入口
	async query_router(router_name, direction = 0){
		// 第一步：加载首页
		let homepage = await this._homepage()
		// 第二步：加载查询页面
		let query_router_page = await this._query_router_page()
		// 第三步：根据公交车名称查询对应的ID
		let query_sid = await this._query_sid(router_name)
		let sid = query_sid.sid
		// 第四步：查询公交详情
		let bus_details = await this._query_router_details_page(sid)
		// 第五步：查询到站时间		
		let query_stop = await this._query_stop(sid, direction, bus_details.stops[0]['stop_id'])		
		//[{"@attributes":{"cod":"748\u8def"},"terminal":"\u6caaB-82683","stopdis":"1","distance":"0","time":"426"}]
		//console.log(query_stop['@attributes'])		
	}
}

let bus = new Bus()

bus.query_router("748路")