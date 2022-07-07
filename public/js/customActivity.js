define(['postmonger'], (Postmonger) => {
    'use strict';

    let connection = new Postmonger.Session();
    let payload = {};

    let eventDefinitionKey;

    $(window).ready(() => {
        connection.trigger('ready');
        connection.trigger('requestTokens');
        connection.trigger('requestEndpoints');
    });
    connection.on('initActivity', (data) => {
        if (data) payload = data;
    });

    /**
     * Fired off upon clicking of "Done" in Marketing Cloud
     * The config.json will be updated here if there are any updates to be done via Front End UI
     */
    connection.on('clickedNext', () => {
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
    });

    /**
     * This function is to pull out the event definition within journey builder.
     * With the eventDefinitionKey, you are able to pull out values that passes through the journey
     */
    connection.trigger('requestTriggerEventDefinition');
    connection.on('requestedTriggerEventDefinition', (eventDefinitionModel) => {
        if (eventDefinitionModel) eventDefinitionKey = eventDefinitionModel.eventDefinitionKey;
    });
});
