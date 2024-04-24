"use strict";
const _ = require("lodash");
const fs = require("fs");
const { MoleculerServerError } = require("moleculer").Errors;
const SwaggerUI = require("../libs/swaggerUi");
const pkg = require("../package.json");
const EnvironmentVariables = require("../business/environment");
const openapiFilePath = EnvironmentVariables.Swagger.SwaggerJsonFilePath + "/openapi.json";

//Implements swagger mixin
class Swagger {
	Swagger(mixinOptions) {
		mixinOptions = _.defaultsDeep(mixinOptions, {
			routeOptions: {
				path: EnvironmentVariables.Swagger.SwaggerJsonFilePath
			},
			schema: null
		});

		let shouldUpdateSchema = true;
		let schema = null;

		return {
			events: {
				"$services.changed": {
					tracing: false,
					handler() {
						this.invalidateOpenApiSchema();
					}
				}
			},

			methods: {
				/**
				 * Invalidate the generated OpenAPI schema
				 */
				invalidateOpenApiSchema() {
					shouldUpdateSchema = true;
				},

				/**
				 * Generate OpenAPI Schema
				 */
				generateOpenAPISchema() {
					try {
						const res = _.defaultsDeep(mixinOptions.schema, {
							openapi: "3.0.3",

							// https://swagger.io/specification/#infoObject
							info: {
								title: `${pkg.name} API Documentation`,
								version: pkg.version
							},

							// https://swagger.io/specification/#serverObject
							servers: [],

							// https://swagger.io/specification/#componentsObject
							components: {},

							// https://swagger.io/specification/#pathsObject
							paths: {},

							// https://swagger.io/specification/#securityRequirementObject
							security: [{ BearerAuth: [] }],

							// https://swagger.io/specification/#tagObject
							tags: []

							// https://swagger.io/specification/#externalDocumentationObject
							//externalDocs: {}
						});

						const services = this.broker.registry.getServiceList({ withActions: true });
						services.forEach(service => {
							// --- COMPILE SERVICE-LEVEL DEFINITIONS ---
							if (service.settings.openapi) {
								_.mergeWith(res, service.settings.openapi, (resValue, svcValue) => {
									if (_.isArray(resValue))
										return resValue.concat(svcValue);
								});
							}

							// --- COMPILE ACTION-LEVEL DEFINITIONS ---
							_.forIn(service.actions, action => {
								if (_.isObject(action.openapi)) {
									let def = _.cloneDeep(action.openapi);
									if (def.$path) {
										let { method, path } = def.$path;
										delete def.$path;
										_.set(res.paths, [path, method.toLowerCase()], def);
									}
								}
							});
						});

						return res;
					} catch (err) {
						throw new MoleculerServerError(
							"Unable to compile OpenAPI schema",
							500,
							"UNABLE_COMPILE_OPENAPI_SCHEMA",
							{ err }
						);
					}
				},

				getOpenAPISchema() {
					if (shouldUpdateSchema || !schema) {
						// Create new server & regenerate GraphQL schema
						// this.logger.info("♻ Regenerate OpenAPI/Swagger schema...");

						schema = this.generateOpenAPISchema();

						shouldUpdateSchema = false;

						// this.logger.debug(schema);
						let directoryPath = "." + EnvironmentVariables.Swagger.SwaggerJsonFilePath;
						if (!fs.existsSync(directoryPath)) {
							fs.mkdirSync(directoryPath, { recursive: true });
						}
						fs.writeFileSync("." + openapiFilePath, JSON.stringify(schema, null, 4), "utf8");
					}
					return schema;
				}
			},

			created() {
				const route = _.defaultsDeep(mixinOptions.routeOptions, {
					use: [
						(req, res, next) => {
							res.set = (key, value) => res.setHeader(key, value);
							res.send = content =>
								this.sendResponse(req, res, content, {
									responseType: res.getHeader("Content-Type") || "text/html"
								});
							req.swaggerDoc = this.getOpenAPISchema();
							next();
						},
						...SwaggerUI.serve,
						SwaggerUI.setup(null, { swaggerUrl: openapiFilePath })
					],

					aliases: {
						"GET /openapi.json"(req, res) {
							// Send back the generated schema
							try {
								const schema = this.getOpenAPISchema();
								const ctx = req.$ctx;
								ctx.meta.responseType = "application/json";
								return this.sendResponse(req, res, schema);
							} catch (err) {
								this.logger.warn(err);
								this.sendError(req, res, err);
							}
						}
					},

					mappingPolicy: "restrict"
				});

				// Add route
				this.settings.routes.unshift(route);
			},

			started() {

			}
		};
	}
}
module.exports = Swagger;
