"use strict";
const axios = require("axios");
class AxiosWrapper {
	constructor(serviceContext) {
		this.serviceContext = serviceContext;
	}

	//axiosWrapper function execute(requestOptions)
	async execute(options) {
		try {
			let response = await axios(options);
			return response;
		} catch (err) {
			this.serviceContext.logger.error(`Error calling url ${options.url} with method ${options.method} and parameter ${JSON.stringify(options.data)}. Error: ${err.response?.data?.message}.`);
			err.name = "Axios-" + err.name;
			err.message = err?.response?.data?.message;
			err.code = err?.response?.data?.code;
			throw err;
		}
	}
}
module.exports = AxiosWrapper;