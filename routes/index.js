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
	const { applicationExtensionKey, thisServerBaseUrl: baseUrl } = process.env;
	configJsonFile.configurationArguments.applicationExtensionKey = applicationExtensionKey;
	configJsonFile.arguments.execute.url = `${baseUrl}/journeybuilder/execute`;
	configJsonFile.configurationArguments.save.url = `${baseUrl}/journeybuilder/save`;
	configJsonFile.configurationArguments.publish.url = `${baseUrl}/journeybuilder/publish`;
	configJsonFile.configurationArguments.stop.url = `${baseUrl}/journeybuilder/stop`;
	configJsonFile.configurationArguments.validate.url = `${baseUrl}/journeybuilder/validate`;
	res.json(configJsonFile);
};
