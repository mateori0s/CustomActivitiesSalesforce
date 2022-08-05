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

        const packsTypeArg = inArguments.find(arg => arg.packsType);
        let packsTypeIdSuffix = (packsTypeArg && packsTypeArg.packsType === 'upc') ? 'upc' : 'ms';
        document.getElementById(`packs-type-${packsTypeIdSuffix}`).checked = true;
    });

    connection.on('clickedNext', () => {
        let packsType = null;
        let packsAdditionalData_AttributeName = null;
        if (document.getElementById('packs-type-upc').checked) {
            packsType = 'upc';
            packsAdditionalData_AttributeName = 'PACK_UPC_FINAL';
        }
        if (document.getElementById('packs-type-ms').checked) {
            packsType = 'ms';
            packsAdditionalData_AttributeName = 'PACK_SEGMENTO_FINAL';
        }

        payload['arguments'].execute.inArguments = [
            { packsType },
            { cellularnumber: `{{Event.${eventDefinitionKey}.cellularnumber}}` },
            { packFinal: `{{Contact.Attribute.PACKS_ADDITIONAL_DATA.${packsAdditionalData_AttributeName}}}` },
            /* { age: `{{Event.${eventDefinitionKey}.age}}` },
            { email: `{{Event.${eventDefinitionKey}.email}}` },
            { firstname: `{{Event.${eventDefinitionKey}.firstname}}` },
            { id: `{{Event.${eventDefinitionKey}.id}}` },
            { lastname: `{{Event.${eventDefinitionKey}.lastname}}` },
            { phone: `{{Event.${eventDefinitionKey}.phone}}` },
            { claveSuscriptor: `{{Event.${eventDefinitionKey}.claveSuscriptor}}` } */
        ];
        payload['metaData'].isConfigured = true;
        connection.trigger('updateActivity', payload);
    });

    connection.trigger('requestTriggerEventDefinition');
    connection.on('requestedTriggerEventDefinition', (eventDefinitionModel) => {
        if (eventDefinitionModel) eventDefinitionKey = eventDefinitionModel.eventDefinitionKey;
    });
});