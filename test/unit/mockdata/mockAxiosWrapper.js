"use strict";
class MockAxiosWrapper {
	constructor(serviceContext) {
		this.serviceContext = serviceContext;
	}

	//axiosWrapper function execute(requestOptions)
	async execute(options) {
		if (!options.method) {
			let err = new Error({ name: "AxiosError", message: "Axios Error" });
			err.name = "AxiosError";
			err.message = "Axios Error";
			throw err;
		}
		if (options.url === "http://localhost/api/v1/book") {
			return {
				data:
				{
					"langCode": "en-us",
					"title": "MALLET MADNESS INTERACTIVE - P"
				}
			};
		}
		if (options.url.indexOf("oidc/token/introspection") > 0) {
			return {
				status: 200,
				data: {
					active: true
				}
			};
		}
		return {
			data: true
		};
	}
}
module.exports = MockAxiosWrapper;