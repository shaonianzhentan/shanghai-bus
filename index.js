const axios = require('axios')
const parser = require('xml2json')
axios.defaults.baseURL = 'http://www.shjt.org.cn:8005/bus/TrafficLineXML.aspx'

class Bus {
	constructor() {

	}

	//查询公交详情（direction为方向）
	async query_details(busName, direction = 0) {
		let res = await axios.get(`?TypeID=1&name=${encodeURIComponent(busName)}`)
		let result = JSON.parse(parser.toJson(res.data))
		let { line_id, start_stop, end_stop, start_earlytime, start_latetime, end_earlytime, end_latetime } = result.linedetail
		let from, to, start_at, end_at, stops = [];
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
		//请求线路
		res = await axios.get(`?TypeID=2&lineid=${line_id}&name=${encodeURIComponent(busName)}`)
		result = JSON.parse(parser.toJson(res.data))
		result.lineInfoDetails[`lineResults${direction}`].stop.forEach(ele => {
			stops.push({
				stop_id: ele.id,
				stop_name: ele.zdmc
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
		let res = await axios.get(`?TypeID=3&lineid=${sid}&stopid=${stop_id}&direction=${direction}&name=${encodeURIComponent(busName)}`)
		if (res.data) {
			let result = JSON.parse(parser.toJson(res.data))
			let { terminal, stopdis, distance, time } = result.result.cars.car
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