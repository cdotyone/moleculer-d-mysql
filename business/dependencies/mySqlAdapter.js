"use strict";
const { parseBooleans } = require("xml2js/lib/processors");
const SequelizeAdapter = require("sequelize");
const {ConnectionString} = require("connection-string");

const getEnv = function (name, def) {
	if (typeof (def) === "number") return parseInt((process.env[name] || ("" + def)).trim());
	if (typeof (def) === "boolean") return parseBooleans((process.env[name] || ("" + def)).trim());
	return (process.env[name] || def).trim();
};

// class MySQLAdapter - for metadata database
// executeQuery can be called to execute one query
// to remain adapter open for multiple queries - implementation can be done as below:
// getAdapter and adapter.authenticate(),adapter.query() and adapter.close()
class MySQLAdapter {

	static adapters = {};

	constructor(serviceContext, connection) {
		this.service = serviceContext;
		this.name = "unknown";

		if(typeof connection === "string") {
			// convert from split connections strings
			if(connection.indexOf(":")<=0) {
				const name = connection.toUpperCase();
				let cs = process.env[`${name}_MYSQL_CONNECTIONSTRING`];
				if(!cs) {
					cs = {
						Database: getEnv(`${name}_DATABASE`, connection),
						Username: getEnv(`${name}_USERNAME`, "root"),
						Password: getEnv(`${name}_PASSWORD`, "password"),
						Host: getEnv(`${name}_HOSTNAME`, "127.0.0.1")
					};
					cs=`mysql://${cs.Username}:${cs.Password}@${cs.Host}?database=${cs.Database}&pool.max=5&pool.min=1&pool.idle=10000&logging=false`;
				}
				connection = cs;
			}

			let cs = new ConnectionString(connection);
			this._connectionString=cs;

			let option = {
				"protocol": "mysql",
				"user": "root",
				"password": "password",
				"hosts": [
					{
						"name": "localhost",
						"type": "domain"
					}
				],
				"params": {
					"logging": "false",
					"pool.max": "5",
					"pool.min": "1",
					"pool.idle": "10000"
				}
			};
			cs.setDefaults(option);

			this.name = cs.params["database"];
			this.connection = {
				host: cs.hosts?.[0].toString(),
				username: cs.user,
				password: cs.password,
				database: cs.params["database"],
				dialect: cs.protocol,
				logging: parseBooleans(cs.params.logging),
				pool: {
					max:  parseInt(cs.params["pool.max"]),
					min:  parseInt(cs.params["pool.min"]),
					idle: parseInt(cs.params["pool.idle"]),
				},
			};
		} else if(typeof connection === "object") {
			this.name = connection.Database;
			let cs = {
				host: connection.Host||"127.0.0.1",
				username: connection.Username||"root",
				password: connection.Password||"password",
				database: connection.Database,
				dialect: "mysql",
				logging: false,
				pool: {
					max: 5,
					min: 0,
					idle: 10000,
				},
			};
			this.connection = cs;
		} else this.connection = connection;

		this.isConnectionOpen = false;
		this.adapter = null;
	}
	// method getAdapter
	// reads connection parameters from environment file
	async connectAdapter() {
		if (!this.isConnectionOpen) {
			if(MySQLAdapter.adapters[this.name]) this.adapter = MySQLAdapter.adapters[this.name];
			else {
				this.adapter = new SequelizeAdapter(this.connection);
				MySQLAdapter.adapters[this.name] = this.adapter;
			}
			this.isConnectionOpen = true;
		}
	}
	// executeQuery - execute query
	async executeQuery(query, closeConnection) {
		await this.connectAdapter();
		let resp = await this.adapter.query(query);
		if (closeConnection) {
			delete MySQLAdapter.adapters[this.name];
			await this.adapter.close();
			this.isConnectionOpen = false;
		}
		return resp;
	}
	// executeStoredProcedure - execute stored procedure
	async executeStoredProcedure(query, closeConnection) {
		await this.connectAdapter();
		let resp = await this.adapter.query(query.sp, {
			replacements: query.replacements,
			type: this.adapter.QueryTypes.RAW
		});
		if (closeConnection) {
			delete MySQLAdapter.adapters[this.name];
			await this.adapter.close();
			this.isConnectionOpen = false;
		}
		return resp;
	}
}
module.exports = MySQLAdapter;
