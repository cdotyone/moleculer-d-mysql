"use strict";

const { parseBooleans } = require("xml2js/lib/processors");

require("dotenv").config();
const getEnv = function (name, def) {
	if (typeof (def) === "number") return parseInt((process.env[name] || ("" + def)).trim());
	if (typeof (def) === "boolean") return parseBooleans((process.env[name] || ("" + def)).trim());
	return (process.env[name] || def).trim();
};

//Implement Environment Variables
class Environment {
	static getEnv = getEnv;

	static Cacher = {
		RedisHost: getEnv("REDIS_HOST", "127.0.0.1"),
		RedisPort: getEnv("REDIS_PORT", 6379),
		DefaultCacheExpiryTime: getEnv("DEFAULT_CACHE_EXPIRY_TIME", 14400)
	};

	static ApiSetting = {
		ExposedIP: this.getEnv("0.0.0.0", "0.0.0.0"),
		Port: this.getEnv("PORT", 3333)
	};

	static Swagger = {
		Url: this.getEnv(process.env.URL, "http://localhost:3333"),
		SwaggerJsonFilePath: this.getEnv("SWAGGER_JSON_FILE_PATH", "/swagger")
	};
}
module.exports = Environment;
