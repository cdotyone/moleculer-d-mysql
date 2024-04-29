"use strict";
const fs = require("fs");
const Fs = require("fs-extra");

const path = require("path");
const Service = require("moleculer").Service;
const AppConstants = require("../business/appConstants");
const Environment = require("../business/environment");
const { Sequelize, DataTypes, Op } = require("sequelize");
const {extractSchemas} = require("extract-mysql-schema");
let sequelizeInstance = null;

const model = {};
const schema = {};
const examples = {};

async function touch(file) {
	await Fs.ensureFile(file);
	const now = new Date();
	await Fs.utimes(file, now, now);
}

String.prototype.hashCode = function() {
	let hash = 0,i, chr;
	if (this.length === 0) return hash;
	for (i = 0; i < this.length; i++) {
		chr = this.charCodeAt(i);
		hash = ((hash << 5) - hash) + chr;
		hash |= 0; // Convert to 32bit integer
	}
	return hash;
};

const snakeToCamel = str => str.toLowerCase().replace(/([-_][a-z])/g, group =>
	group
		.toUpperCase()
		.replace("-", "")
		.replace("_", "")
);

const buildModels = function (schemeName) {
	const tables = schema[schemeName].tables;

	tables.forEach((table) => {
		const tableDesc = {};

		table.columns.forEach((c) => {
			let t = DataTypes.STRING;

			switch (c.type) {
				case "bigint":
					t = DataTypes.INTEGER;
					break;
				case "int":
					t = DataTypes.INTEGER;
					break;
				case "datetime":
					t = DataTypes.DATE;
					break;
				case "json":
					t = DataTypes.JSON;
					break;
			}

			let def = { "type": t, allowNull: c.isNullable || c.isAutoNumber || c.defaultValue!=="" };
			if (c.isPrimaryKey) def["primaryKey"] = true;
			tableDesc[snakeToCamel(c.name)] = def;
		});
		model[table.name] = tableDesc;
	});
};

const getOpenAPI = function (table, isList) {
	const response = {
		description: "Successful",
		content: {
			"application/json": {
				schema: {
					"type": isList ? "array" : "object",
				}
			}
		}
	};

	const tableDesc = { "type": "object", properties: {} };

	table.columns.forEach((c) => {
		let t = "string";
		switch (c.type) {
			case "bigint":
				t = "number";
				break;
			case "int":
				t = "number";
				break;
			case "json":
				t = "object";
				break;
		}
		tableDesc.properties[snakeToCamel(c.name)] = { "type": t };
	});

	response.content["application/json"].schema = tableDesc;
	const parameters = isList ? [] : [{
		"name": "id",
		"in": "path",
		"required": true,
		"schema": {
			"type": "string"
		}
	}];

	return {
		responses: {
			200: response
		},
		parameters
	};
};

const postOpenAPI = function (table) {
	const exampleList = examples[table.name];
	let convertedObject;
	if (exampleList && Array.isArray(exampleList)) {
		// Convert the list to an array of objects
		convertedObject = Object.assign({}, ...exampleList);
	}
	return {
		requestBody: {
			required: true,
			content: {
				"application/json": {
					examples: convertedObject
				}
			}
		},
		responses: {
			201: {
				description: "Successful",
				content: {
					"text/plain": {
						schema: {
							"type": "string",
							"enum": ["CREATED", "FAILED"],
							"example": "CREATED"
						}
					}
				}
			}
		}
	};
};

const putOpenAPI = function () {
	return {
		responses: {
			200: {
				description: "Successful",
				content: {
					"text/plain": {
						schema: {
							"type": "string",
							"enum": ["UPDATED", "FAILED"],
							"example": "UPDATED"
						}
					}
				}
			}
		},
		parameters: [{
			"name": "id",
			"in": "path",
			"required": true,
			"schema": {
				"type": "string"
			}
		}]
	};
};

const deleteOpenAPI = function () {
	return {
		responses: {
			200: {
				description: "Successful",
				content: {
					"text/plain": {
						schema: {
							"type": "string",
							"enum": ["OK", "FAILED"],
							"example": "OK"
						}
					}
				}
			}
		},
		parameters: [{
			"name": "id",
			"in": "path",
			"required": true,
			"schema": {
				"type": "string"
			}
		}]
	};
};

async function loadsequelizeInstance(schemeName) {

	const sequelizeInstance = new Sequelize(schemeName, Environment.DB.Username, Environment.DB.Password, {
		host: Environment.DB.Host,
		dialect: "mysql"
	});

	// or `sequelizeInstance.sync()`
	await sequelizeInstance.authenticate();

	return sequelizeInstance;
}


const getTable = async function (schemeName, table) {
	// re-use the sequelizeInstance instance across invocations to improve performance
	if (!sequelizeInstance) {
		sequelizeInstance = await loadsequelizeInstance(schemeName);
	} else {
		// restart connection pool to ensure connections are not re-used across invocations
		sequelizeInstance.connectionManager.initPools();

		// restore `getConnection()` if it has been overwritten by `close()`
		if ("getConnection" in sequelizeInstance.connectionManager) {
			delete sequelizeInstance.connectionManager.getConnection;
		}
	}

	const sqlTable = sequelizeInstance.define(table.name, model[table.name], {
		underscored: true,
		freezeTableName: true,
		tableName: table.name,

		timestamps: false,
		createdAt: false,
		updatedAt: false,
	});

	return sqlTable;
};

const handleDelete = function (schemeName, table) {
	return async function (ctx) {
		try {
			const sqlTable = await getTable(schemeName, table);
			const primaryKeyColumn = table.columns.find(column => column.isPrimaryKey);

			// Delete the record based on the primary key
			await sqlTable.destroy({
				where: { [primaryKeyColumn.name]: ctx.params.id },
			});

			return "OK";
		} catch (error) {
			return error;
		} finally {
			await sequelizeInstance.connectionManager.close();
		}
	};
};

const handleGet = function (schemeName, table) {
	return async function (ctx) {
		try {
			const sqlTable = await getTable(schemeName, table);
			const primaryKeyColumn = table.columns.find(column => column.isPrimaryKey);
			const whereClause = {};
			whereClause[primaryKeyColumn.name] = { [Op.eq]: ctx.params.id };
			const result = await sqlTable.findAll({
				limit: 1,
				where: whereClause
			});
			return result[0];
		} finally {
			await sequelizeInstance.connectionManager.close();
		}
	};
};

const handleList = function (schemeName, table) {
	return async function () {
		try {
			const sqlTable = await getTable(schemeName, table);
			return await sqlTable.findAll();
		} finally {
			await sequelizeInstance.connectionManager.close();
		}
	};
};

function generateRequestBodySchema(table, tableName) {
	const requestBodySchema = {
		[tableName]: {
			"type": "object",
			"properties": {}
		}
	};

	table.columns.forEach((column) => {
		const { name, type, maxLength, isNullable, isAutoNumber, defaultValue } = column;
		requestBodySchema[tableName].properties[snakeToCamel(name)] = {
			type: getType(type),
			maxLength: maxLength,
			optional: isNullable || isAutoNumber || defaultValue!==""
		};
	});
	return requestBodySchema;
}

function generatePutRequestBodySchema(table, tableName) {
	const requestBodySchema = {
		[tableName]: {
			"type": "object",
			"properties": {}
		}
	};

	table.columns.forEach((column) => {
		const { name, type, maxLength, isNullable, isUpdatable, isPrimaryKey } = column;

		// Only include fields that are marked as editable and non primary key
		if (isUpdatable && !isPrimaryKey) {
			requestBodySchema[tableName].properties[snakeToCamel(name)] = {
				type: getType(type),
				maxLength: maxLength,
				optional: isNullable
			};
		}
	});

	return requestBodySchema;
}

function getType(sqlType) {
	let type;
	switch (sqlType) {
		case "bigint":
			type = "number";
			break;
		case "int":
			type = "number";
			break;
		case "datetime":
			type = "date";
			break;
		case "timestamp":
			type = "date";
			break;
		case "json":
			type = "object";
			break;
		default:
			type = "string";
			break;
	}
	return type;
}

const handlePost = function (schemeName, table, tableName) {
	return async function (ctx) {
		try {
			const sqlTable = await getTable(schemeName, table);
			const requestBodyData = ctx.params[tableName];
			await sqlTable.create(requestBodyData);
			return "CREATED";
		} catch (error) {
			return error;
		} finally {
			await sequelizeInstance.connectionManager.close();
		}
	};
};

const handlePut = function (schemeName, table, tableName) {
	return async function (ctx) {
		try {
			const sqlTable = await getTable(schemeName, table);
			const primaryKeyColumn = table.columns.find(column => column.isPrimaryKey);

			// Retrieve existing data from the database
			const existingRecord = await sqlTable.findByPk(ctx.params.id);

			if (!existingRecord) {
				return "Record not found";
			}

			// Get the request body data for the specified table
			const requestBodyData = ctx.params[tableName];

			// Update only the fields that are present in the request body
			await sqlTable.update(requestBodyData, {
				where: { [primaryKeyColumn.name]: ctx.params.id },
			});
			return "UPDATED";
		} catch (error) {
			return error;
		} finally {
			await sequelizeInstance.connectionManager.close();
		}
	};
};


const buildActions = function (schemeName, schema) {
	const actions = {};
	const tables = schema[schemeName].tables;

	tables.forEach((table) => {
		if (table.kind !== "table") return;
		const tableName = snakeToCamel(table.name);
		const requestBodySchema = generateRequestBodySchema(table, tableName);
		const putRequestBodySchema = generatePutRequestBodySchema(table, tableName);

		actions[`${tableName}_get`] = {
			description: `${schemeName}.${tableName}`,
			rest: {
				method: AppConstants.HttpMethods.Get,
				path: `/${tableName}/:id`
			},
			params: {},
			headers: {},
			openapi: getOpenAPI(table, false),
			handler: handleGet(schemeName, table)
		};

		actions[`${tableName}_list`] = {
			description: `${schemeName}.${tableName}`,
			rest: {
				method: AppConstants.HttpMethods.Get,
				path: `/${tableName}`
			},
			params: {},
			headers: {},
			openapi: getOpenAPI(table, true),
			handler: handleList(schemeName, table)
		};

		actions[`${tableName}_post`] = {
			description: `${schemeName}.${tableName}`,
			rest: {
				method: AppConstants.HttpMethods.Post,
				path: `/${tableName}`
			},
			params: requestBodySchema,
			headers: {},
			openapi: postOpenAPI(table),
			handler: handlePost(schemeName, table, tableName)
		};

		actions[`${tableName}_put`] = {
			description: `${schemeName}.${tableName}`,
			rest: {
				method: AppConstants.HttpMethods.Put,
				path: `/${tableName}/:id`
			},
			params: putRequestBodySchema,
			headers: {},
			openapi: putOpenAPI(),
			handler: handlePut(schemeName, table, tableName)
		};

		actions[`${tableName}_delete`] = {
			description: `${schemeName}.${tableName}`,
			rest: {
				method: AppConstants.HttpMethods.Delete,
				path: `/${tableName}/:id`
			},
			params: {},
			headers: {},
			openapi: deleteOpenAPI(table),
			handler: handleDelete(schemeName, table)
		};
	});

	return actions;
};



// class LitService - implements moleculer Service
class LitService extends Service {
	constructor(broker) {
		super(broker);

		const schemeName = "example";

		schema[schemeName] = {name:schemeName,tables:[],hash:null};

		const schemaFile = path.join("./", ".dynamic", `${schemeName}.json`);
		if(fs.existsSync(schemaFile)) {
			try {
				let json=fs.readFileSync(schemaFile,{ encoding: "utf8" });
				let loadedSchema = JSON.parse(json);
				loadedSchema[schemeName].hash = json.hashCode();
				schema[schemeName] = loadedSchema[schemeName];
			} catch(_) {
				// ok to fail we will try to reload
			}
		}

		let self = this;
		extractSchemas({
			engine: "mysql",
			host: "127.0.0.1",
			user: "root",
			password: "password",
			database: schemeName,
			charset: "utf8"
		}).then((loadedSchema)=> {
			let json = JSON.stringify(loadedSchema,null,2);
			if(json.hashCode()!==schema[schemeName].hash) {
				// it changed so rewrite it to force reload
				fs.writeFileSync(path.join("./", ".dynamic", `${schemeName}.json`),json,{ encoding: "utf8" });
				touch(path.join("./", "services", "dynamic.service.js"));
			}
		});

		buildModels(schemeName);

		self.parseServiceSchema({
			name: schemeName,
			version: "v1",
			meta: {
				scalable: true
			},
			dependencies: [],
			settings: {
				upperCase: true,
				rest: true,
				fields: {
				}
			},
			actions: buildActions(schemeName, schema),
			created: this.serviceCreated,
			started: this.serviceStarted,
			stopped: this.serviceStopped,
		});
	}

	// service life cycle events
	serviceCreated() {
		this.logger.info("LitService created.");
	}

	// removed prefix from cacher as it adds default as MOL- if no prefix is defined
	serviceStarted() {
		this.broker.cacher.prefix = "";
		this.logger.info("LitService started.");
	}
	serviceStopped() {
		this.logger.info("LitService stopped.");
	}
}
module.exports = LitService;
