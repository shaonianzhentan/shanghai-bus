const parser = require('xml2json')
let request = require('request')
const iconv = require('iconv-lite')

const host = `http://mbst.shdzyb.com:36115/`

class Bus {
	constructor() {

	}

	http(options) {
		return new Promise((resolve, reject) => {
			request(options, (err, res, body) => {
				if (err) {
					reject(err)
				} else {
					resolve(body)
				}
			})

		})
	}

	// 获取线路信息
	async queryInfo(busName, direction) {
		let body = await this.http({
			url: `${host}interface/getBase.ashx?sign=&name=${escape(busName)}`,
			encoding: null
		})
		let result = JSON.parse(parser.toJson(iconv.decode(body, 'gbk')))

		let { line_id, start_stop, end_stop, start_earlytime, start_latetime, end_earlytime, end_latetime } = result.linedetail
		let from, to, start_at, end_at;
		if (direction === 1) {
			from = end_stop
			to = start_stop
			start_at = end_earlytime
			end_at = end_latetime
		} else {
			from = start_stop
			to = end_stop
			start_at = start_earlytime
			end_at = start_latetime
		}

		return {
			line_id, from, to, start_at, end_at
		}
	}

	//查询公交详情（direction为方向）
	async query_details(busName, direction = 0) {

		// 获取线路信息
		let { line_id, from, to, start_at, end_at } = await this.queryInfo(busName, direction)

		//请求线路
		let body = await this.http({
			url: `${host}interface/getStopList.ashx?name=${escape(busName)}&lineid=${line_id}&dir=${direction}`,
			encoding: null
		})
		let result = JSON.parse(iconv.decode(body, 'gbk'))
		let stops = []
		result.data.forEach(ele => {
			stops.push({
				stop_id: ele.id,
				stop_name: ele.name
			})
		})
		return {
			'sid': line_id,
			'from': from,
			'to': to,
			'start_at': start_at,
			'end_at': end_at,
			'direction': direction,
			'stops': stops
		}
	}

	async query_stop(busName, sid, direction, stop_id) {
		// 获取到站信息
		let body = await this.http({
			url: `${host}interface/getCarmonitor.ashx?name=${escape(busName)}&lineid=${sid}&stopid=${stop_id}&dir=${direction}`,
			encoding: null
		})
		let result = JSON.parse(iconv.decode(body, 'gbk'))
		let { terminal, stopdis, distance, time } = result.data
		if (terminal !== 'null' && time !== 'null') {
			return {
				"terminal": terminal,
				"stopdis": stopdis,
				"distance": distance,
				"time": time,
				status: 1
			}
		} else {
			return {
				status: 0
			}
		}
	}
}

let bus = new Bus()

module.exports = async function (busName, direction = 0) {
	let details = await bus.query_details(busName, direction)
	return {
		details: details,
		getStop: async stop_id => await bus.query_stop(busName, details.sid, direction, stop_id)
	}
}