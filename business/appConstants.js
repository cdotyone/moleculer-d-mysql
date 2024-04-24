"use strict";
require("dotenv").config();

//Implement application constants
class AppConstants {

	static ServiceNames = {
		Api: "api",
		Logger: "logger"
	};

	static ContentType = {
		FormUrlEncoded: "application/x-www-form-urlencoded",
		ApplicationJson: "application/json"
	};
	static RequestHeaders = {
		ContentType: "Content-Type",
		Authorization: "authorization"
	};
	static AcceptType = {
		ApplicationJson: "application/json"
	};
	static HttpMethods = {
		Get: "GET",
		Patch: "PATCH",
		Post: "POST",
		Put: "PUT",
		Delete: "DELETE",
	};

	static Authentication = {
		SessionId: "sessionid",
		AuthorizationHeader: "authorization",
		Bearer: "Bearer",
		Token: "token",
		ClientId: "client_id",
		ClientSecret: "client_secret"
	};

  static IgnoreLogErrorsInManager = ["Database", "Axios", "UtilService", "ValidationError"];

	static ResponseMessages = {
		ErrorMessages: {
			InvalidActionMessage: "Invalid Action",
			InvalidActionCouldNotExecuteMessage: "Invalid action could not execute service",
			SessionIdMissingMessage: "Session id is missing",
			AuthorizationHeaderMissingMessage: "Authorization header is missing",
			InvalidTokenMessage: "Invalid Token",
			TokenExpiredMessage: "Token Expired"
		},
		Messages: {
			RegisterAppSuccess: "Application Successfully Registered or Updated",
		}
	};

	static GenerateSwaggerMixinOptions(name, version, url) {
		return {
			schema: {
				info: {
					title: `${name} Documentation`,
					version: version || "v1"
				},
				servers: [{
					url: (url || "http://localhost:3010") + "/api",
					description: `${name} API server`
				}],
				components: {
					securitySchemes: {
						BearerAuth: {
							type: "http",
							scheme: "bearer"
						}
					}
				}
			}
		};
	}

	static LogLevel = {
		Trace: "trace",
		Debug: "debug",
		Info: "info",
		Warn: "warn",
		Error: "error",
		Fatal: "fatal",
	};
}
module.exports = AppConstants;
