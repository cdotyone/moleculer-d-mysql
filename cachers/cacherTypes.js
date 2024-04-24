"use strict";
require("dotenv").config();
const EnvironmentVariables = require("../business/environment");
// class to store cache configuration and apply in Moleculer Config
class CacherTypes {
	static RedisCache = {
		type: "Redis",
		options: {
			// Prefix for keys
			//prefix: "",  -- blank prefix doesn't work and adds MOL-
			// set Time-to-live to 4 hours.
			ttl: EnvironmentVariables.Cacher.DefaultCacheExpiryTime,
			// Turns Redis client monitoring on.
			monitor: false,
			// Redis settings
			redis: {
				host: EnvironmentVariables.Cacher.RedisHost,
				port: EnvironmentVariables.Cacher.RedisPort
			},
			lock: {
				ttl: 15, //the maximum amount of time you want the resource locked in seconds
				staleTime: 10, // If the TTL is less than this number, means that the resources are staled
			},
			// Redlock settings
			redlock: {
				// Redis clients. Support node-redis or ioredis. By default will use the local client.
				clients: [], //clients can be set
				// the expected clock drift; for more details
				// see http://redis.io/topics/distlock
				driftFactor: 0.01, // time in ms

				// the max number of times Redlock will attempt
				// to lock a resource before erroring
				retryCount: 10,

				// the time in ms between attempts
				retryDelay: 200, // time in ms

				// the max time in ms randomly added to retries
				// to improve performance under high contention
				// see https://www.awsarchitectureblog.com/2015/03/backoff.html
				retryJitter: 200 // time in ms
			}
		}
	};
	static MemoryCache = {
		type: "Memory",
		options: {
			// set Time-to-live to 4 hours.
			ttl: EnvironmentVariables.Cacher.DefaultCacheExpiryTime
		}
	};

}
module.exports = CacherTypes;
