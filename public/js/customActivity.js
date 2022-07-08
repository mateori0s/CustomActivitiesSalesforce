define(['postmonger'], (Postmonger) => {
    'use strict';
    // This function is called when 'postmonger.js' is loaded.

    let connection = new Postmonger.Session();
    let authTokens = {};
    let payload = {};

    // Configuration variables
    // let eventSchema = ''; // variable is used in parseEventSchema()
    // let lastnameSchema = ''; // variable is used in parseEventSchema()
    let eventDefinitionKey;

    $(window).ready(onRender);
    connection.on('initActivity', initialize);
    connection.on('clickedNext', save); // Save function within MC

    function onRender() {
        // JB will respond the first time 'ready' is called with 'initActivity'
        connection.trigger('ready');
        connection.trigger('requestTokens');
        connection.trigger('requestEndpoints');
    }

    /**
     * This function is to pull out the event definition within journey builder.
     * With the eventDefinitionKey, you are able to pull out values that passes through the journey
     */
    connection.trigger('requestTriggerEventDefinition');
    connection.on('requestedTriggerEventDefinition', function (eventDefinitionModel) {
        if (eventDefinitionModel) {
            eventDefinitionKey = eventDefinitionModel.eventDefinitionKey;
            // console.log('Request Trigger >>>', JSON.stringify(eventDefinitionModel));
        }
    });

    function initialize(data) {
        if (data) {
            payload = data;
        }
        initialLoad(data);
        // parseEventSchema();
    }

    /**
     * Save function is fired off upon clicking of "Done" in Marketing Cloud
     * The config.json will be updated here if there are any updates to be done via Front End UI
     */
    function save() {
        payload['arguments'].execute.inArguments = [
            { age: `{{Event.${eventDefinitionKey}.age}}` },
            { email: `{{Event.${eventDefinitionKey}.email}}` },
            { firstname: `{{Event.${eventDefinitionKey}.firstname}}` },
            { id: `{{Event.${eventDefinitionKey}.id}}` },
            { lastname: `{{Event.${eventDefinitionKey}.lastname}}` },
            { phone: `{{Event.${eventDefinitionKey}.phone}}` },
            { claveSuscriptor: `{{Event.${eventDefinitionKey}.claveSuscriptor}}` }
        ];
        payload['metaData'].isConfigured = true;
        connection.trigger('updateActivity', payload);
    }

    /**
     * 
     * @param {*} data
     * 
     * This data param is the config json payload that needs to be loaded back into the UI upon opening the custom application within journey builder 
     * This function is invoked when the user clicks on the custom activity in Marketing Cloud. 
     * If there are information present, it should be loaded back into the appropriate places. 
     * e.g. input fields, select lists
     */
    function initialLoad(data) {
        const hasInArguments = Boolean(
            data.arguments &&
            data.arguments.execute &&
            data.arguments.execute.inArguments &&
            data.arguments.execute.inArguments.length > 0
        );

        const inArguments = hasInArguments ? data.arguments.execute.inArguments : [];

        console.log('Message Argument', inArguments);
    };
});