define(['postmonger'], (Postmonger) => {
    'use strict';

    let connection = new Postmonger.Session();
    let payload = {};
    let eventDefinitionKey;
    let offerActivityCustomerKey;

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

        const subjectArg = inArguments.find(arg => arg.subject);
        if (subjectArg) document.getElementById('subject').value = subjectArg.subject;

        const urgenteArg = inArguments.find(arg => arg.urgente);
        let urgenteIdSuffix = (urgenteArg && urgenteArg.urgente === true) ? 'true' : 'false';
        document.getElementById(`urgente-${urgenteIdSuffix}`).checked = true;

        const validarArg = inArguments.find(arg => arg.validar);
        let validarIdSuffix = (validarArg && validarArg.validar === true) ? 'true' : 'false';
        document.getElementById(`validar-${validarIdSuffix}`).checked = true;
    });

    connection.on('clickedNext', () => {
        let urgente = null;
        if (document.getElementById('urgente-true').checked) urgente = true;
        if (document.getElementById('urgente-false').checked) urgente = false;

        let validar = null;
        if (document.getElementById('validar-true').checked) validar = true;
        if (document.getElementById('validar-false').checked) validar = false;

        payload['arguments'].execute.inArguments = [
            { subject: document.getElementById('subject').value },
            { urgente },
            { validar },
            { phone: `{{Contact.Attribute.PACKS_ADDITIONAL_DATA.CELLULAR_NUMBER}}` }
        ];

        if (offerActivityCustomerKey) {
            payload['arguments'].execute.inArguments.push(
                { messageText: `{{Interaction.${offerActivityCustomerKey}.messageToSend}}` },
            );
        }

        payload['metaData'].isConfigured = true;
        connection.trigger('updateActivity', payload);
    });

    connection.trigger('requestTriggerEventDefinition');
    connection.on('requestedTriggerEventDefinition', (eventDefinitionModel) => {
        if (eventDefinitionModel) eventDefinitionKey = eventDefinitionModel.eventDefinitionKey;
    });

    connection.trigger('requestInteraction');
    connection.on('requestedInteraction', (interaction) => {
        for (const a of interaction.activities) {
            if (
                a.schema &&
                a.schema.arguments &&
                a.schema.arguments.execute &&
                a.schema.arguments.execute.outArguments &&
                a.schema.arguments.execute.outArguments.length > 0
            ) {
                a.schema.arguments.execute.outArguments.forEach(inArg => {
                    if (inArg.messageToSend) offerActivityCustomerKey = a.key;
                });
            }
        }
    });
});