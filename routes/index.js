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
	configJsonFile.configurationArguments.applicationExtensionKey = process.env.applicationExtensionKey;
	configJsonFile.arguments.execute.url = `${process.env.thisServerBaseUrl}/journeybuilder/execute`;
	configJsonFile.configurationArguments.save.url = `${process.env.thisServerBaseUrl}/journeybuilder/save`;
	configJsonFile.configurationArguments.publish.url = `${process.env.thisServerBaseUrl}/journeybuilder/publish`;
	configJsonFile.configurationArguments.stop.url = `${process.env.thisServerBaseUrl}/journeybuilder/stop`;
	configJsonFile.configurationArguments.validate.url = `${process.env.thisServerBaseUrl}/journeybuilder/validate`;
	res.json(configJsonFile);
};
