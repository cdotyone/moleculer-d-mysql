"use strict";
const AxiosWrapper = require("./dependencies/axiosWrapper");
// class LoggerHandler - implements logger methods to inject transaction Id if for update Logger messages if required
class LoggerHandler {
	constructor(service, ServiceContext) {
		this.service = service;
		this.ServiceContext = ServiceContext;
	}
	trace(...args) {
		this.service.logger.trace(...this.getUpdateLoggerArgs(args));
	}
	debug(...args) {
		this.service.logger.debug(...this.getUpdateLoggerArgs(args));
	}

	info(...args) {
		this.service.logger.info(...this.getUpdateLoggerArgs(args));
	}

	warn(...args) {
		this.service.logger.warn(...this.getUpdateLoggerArgs(args));
	}

	error(...args) {
		this.service.logger.error(...this.getUpdateLoggerArgs(args));
	}

	fatal(...args) {
		this.service.logger.fatal(...this.getUpdateLoggerArgs(args));
	}

	getUpdateLoggerArgs(...args) {
		let logMessage = args;
		if (Array.isArray(logMessage)) {
			logMessage[0].splice(0, 0);
		}
		return logMessage[0];
	}
}
class ServiceContext {
	constructor(service) {
		this.service = service;
		this.logger = new LoggerHandler(service, this);
		this.broker = service.broker;
	}

	getAxiosWrapperInstance() {
		return new AxiosWrapper(this);
	}

	raiseError(errorMessage, errorCode) {
		let error = new Error(errorMessage);
		error.code = errorCode;
		throw error;
	}

	async initializeServiceContext(ctx) {
		if (this.service.broker.cacher) this.service.broker.cacher.prefix = `${process.env.NODE_ENV}:`;
	}
}
module.exports = ServiceContext;
