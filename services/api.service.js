"use strict";
const ApiGateway = require("moleculer-web");
const Service = require("moleculer").Service;
const SwaggerMixin = require("../mixins/swagger.mixin");
const Helmet = require("helmet");
const AppConstants = require("../business/appConstants");
const EnvironmentVariables = require("../business/environment");
const ServiceContext = require("../business/serviceContext");
//class Api to implement gateway S
class Api extends Service {
	constructor(broker) {
		super(broker);
		this.parseServiceSchema({
			name: AppConstants.ServiceNames.Api,
			mixins: [ApiGateway,
				// Swagger
				new SwaggerMixin().Swagger({ schema: AppConstants.GenerateSwaggerMixinOptions("dynamic").schema })
			],
			settings: {
				// Exposed port
				port: EnvironmentVariables.ApiSetting.Port,
				// Exposed IP
				ip: EnvironmentVariables.ApiSetting.ExposedIP,
				// Global Express middlewares. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Middlewares
				use: [
					Helmet({
						// It needs that GraphQL Playground and OpenAPI UI work
						contentSecurityPolicy: false
					})
				],
				cors: {
					origin: "*",
					methods: [
						"GET",
						"POST",
						"OPTIONS",
						"PUT",
						"DELETE",
					],
					allowedHeaders: ["*"],
					exposedHeaders: [],
					credentials: false,
					maxAge: 3600,
				},
				routes: [{
					path: "/" + AppConstants.ServiceNames.Api,
					whitelist: ["**"],
					use: [],
					// Enable/disable parameter merging method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Disable-merging
					mergeParams: true,
					// Enable authentication. Implement the logic into `authenticate` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authentication
					authentication: false,
					// Enable authorization. Implement the logic into `authorize` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authorization
					authorization: false,
					// The auto-alias feature allows you to declare your route alias directly in your services.
					// The gateway will dynamically build the full routes from service schema.
					autoAliases: true,
					aliases: {},
					// Calling options. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Calling-options
					callingOptions: {},
					bodyParsers: {
						json: {
							strict: false,
							limit: "1MB"
						},
						urlencoded: {
							extended: true,
							limit: "1MB"
						},
						// XML support
						raw: {
							type: () => true
						}
					},
					// Mapping policy setting. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Mapping-policy
					mappingPolicy: "all", // Available values: "all", "restrict"
					// Enable/disable logging
					logging: true,
					onBeforeCall(ctx, route, req) {
						ctx.meta.request = req;
					}
				}],
				// Do not log client side errors (does not log an error response when the error.code is 400<=X<500)
				log4XXResponses: false,
				// Logging the request parameters. Set to any log level to enable it. E.g. "info"
				logRequestParams: null,
				// Logging the response data. Set to any log level to enable it. E.g. "info"
				logResponseData: null,
				// Serve assets from "public" folder. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Serve-static-files
				assets: {
					folder: "public",
					// Options to `server-static` module
					options: {}
				},
			},
			created: this.serviceCreated
		});

	}
	// removed prefix from cacher as it adds default as MOL- if no prefix is defined
	async serviceCreated() {
		if (this.broker.cacher) this.broker.cacher.prefix = `${process.env.NODE_ENV}:`;
		this.broker.logger.info("service created");
	}

	// getServiceContext - returns context instance for life cycle to process end point request
	async getServiceContext(headers) {
		return await ServiceContext.getServiceContextInstance(this, headers);
	}

}
module.exports = Api;
