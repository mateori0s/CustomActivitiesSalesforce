"use strict";
const activity = require("./activity");
const configJsonFile = require("../public/config.json");

/*
 * GET home page.
 */
exports.index = (req, res) => {
	if (!req.session.token) {
		res.render("index", {
			title: "Unauthenticated",
			errorMessage: "This app may only be loaded via Salesforce Marketing Cloud."
		});
	} else {
		res.render("index", {
			title: "Journey Builder Activity",
			results: activity.logExecuteData
		});
	}
};

exports.login = (req, res) => {
	console.log("req.body: ", req.body);
	res.redirect("/");
};

exports.logout = (req, res) => {
	req.session.token = "";
};

exports.configJson = async (req, res) => {
	const { applicationExtensionKey, thisServerBaseUrl: baseUrl, apigeeServerNamebackend: namebackend, apigeeServerUserKey: user_key } = process.env;
	configJsonFile.configurationArguments.applicationExtensionKey = applicationExtensionKey;
	configJsonFile.arguments.execute.url = `${baseUrl}/journeybuilder/execute?namebackend=${namebackend}&user_key=${user_key}`;
	configJsonFile.configurationArguments.save.url = `${baseUrl}/journeybuilder/save?namebackend=${namebackend}&user_key=${user_key}`;
	configJsonFile.configurationArguments.publish.url = `${baseUrl}/journeybuilder/publish?namebackend=${namebackend}&user_key=${user_key}`;
	configJsonFile.configurationArguments.stop.url = `${baseUrl}/journeybuilder/stop?namebackend=${namebackend}&user_key=${user_key}`;
	configJsonFile.configurationArguments.validate.url = `${baseUrl}/journeybuilder/validate?namebackend=${namebackend}&user_key=${user_key}`;
	res.json(configJsonFile);
};
