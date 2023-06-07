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

        const inArguments = Boolean(
            data.arguments &&
            data.arguments.execute &&
            data.arguments.execute.inArguments &&
            data.arguments.execute.inArguments.length > 0
        ) ? data.arguments.execute.inArguments : [];

    });

    connection.on('clickedNext', () => {
        let packsType = null;
        let attributeKeyWord = null;
        if (document.getElementById('packs-type-upc').checked) {
            packsType = 'upc';
            attributeKeyWord = 'upc';
        }
        if (document.getElementById('packs-type-ms').checked) {
            packsType = 'ms';
            attributeKeyWord = 'segmento';
        }

        payload['arguments'].execute.inArguments = [
            { packsType },
            { cellularNumber: `{{Contact.Attribute."Clientes Cluster Prepago".cellular_number}}` },
            { packFinal: `{{Contact.Attribute."Clientes Cluster Prepago".pack_${attributeKeyWord}_final}}` },
            { mensajeVariables: `{{Contact.Attribute."Clientes Cluster Prepago".pack_${attributeKeyWord}_msj}}` },
        ];
        payload['metaData'].isConfigured = true;
        connection.trigger('updateActivity', payload);
    });

    connection.trigger('requestTriggerEventDefinition');
    connection.on('requestedTriggerEventDefinition', (eventDefinitionModel) => {
        if (eventDefinitionModel) eventDefinitionKey = eventDefinitionModel.eventDefinitionKey;
    });
});
