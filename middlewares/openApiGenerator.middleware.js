"use strict";
const pluralize = require("pluralize");
const OpenApiGenerator = require("../libs/openApiGenerator");

//Implements open API generator middleware
module.exports = {
	name: "OpenApiGenerator",

	serviceCreating(svc, schema) {
		const name = schema.name;
		if (![].includes(name)) return;
		const entityName = pluralize(name, 1);
		let openApiGenerator = new OpenApiGenerator();
		openApiGenerator.generateOpenAPISchema(entityName, schema);
	}
};