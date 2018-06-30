var request = require('request');
var cheerio = require('cheerio');

var j = request.jar()
request = request.defaults({
	jar: j,
	headers: {
		'User-Agent': `Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_2 like Mac OS X) AppleWebKit/603.2.4 (KHTML, like Gecko) Mobile/14F89 MicroMessenger/6.5.10 NetType/WIFI Language/zh_CN`
	}
})

class Bus {
	constructor() {
		this.debug = true
		this.homepage_url = 'http://shanghaicity.openservice.kankanews.com/'
		this.query_router_url = 'http://shanghaicity.openservice.kankanews.com/public/bus'
		this.query_sid_url = 'http://shanghaicity.openservice.kankanews.com/public/bus/get'
		this.query_router_details_url = 'http://shanghaicity.openservice.kankanews.com/public/bus/mes/sid/'
		this.query_stop_url = 'http://shanghaicity.openservice.kankanews.com/public/bus/Getstop'

		this.init()
	}

	init() {
		// 第一步：加载首页
		request(this.homepage_url, (error, response, body) => {
			// 第二步：加载查询页面
			request({
				url: this.query_router_url,
				headers: {
					Referer: this.homepage_url
				}
			}, (error, response, body) => {
			})
		})
	}

	//根据公交车名称查询对应的sid
	query_sid(router_name) {
		return new Promise((resolve, reject) => {
			request.post({ url: this.query_sid_url, form: { idnum: router_name } }, (error, response, body) => {
				if (error) {
					reject(error)
				} else {
					let obj = JSON.parse(body)
					resolve(obj.sid)
				}
			})
		})
	}

	//查询公交详情（direction为方向）
	query_details(sid, direction = 0) {
		return new Promise((resolve, reject) => {
			request(this.query_router_details_url + sid + '/stoptype/' + direction, (error, response, body) => {
				if (error) {
					reject(error)
				} else {
					let $ = cheerio.load(body)
					let stations = direction === 0 ? $('div.upgoing.cur') : $('div.downgoing.cur')
					let s = stations.find('span')
					let stops = []
					$('.station').each(function () {
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

	query_stop(sid, direction, stop_id) {
		return new Promise((resolve, reject) => {
			request({
				method: 'POST',
				uri: this.query_stop_url,
				formData: {
					'stoptype': direction, 'stopid': stop_id.toString(), 'sid': sid
				},
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					Referer: this.query_router_details_url + sid + '/stoptype/' + direction,
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
}

let bus = new Bus()

module.exports = async function (busName, direction = 0) {
	let sid = await bus.query_sid(busName)
	let details = await bus.query_details(sid, direction)
	return {
		details: details,
		getStop: async stop_id => await bus.query_stop(sid, direction, `${stop_id}.`)
	}
}