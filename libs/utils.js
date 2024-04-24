"use strict";
//Implements Utils
class Utils {
	capitalize(str) {
		return str[0].toUpperCase() + str.slice(1);
	}

	uncapitalize(str) {
		return str[0].toLowerCase() + str.slice(1);
	}
}
module.exports = Utils;