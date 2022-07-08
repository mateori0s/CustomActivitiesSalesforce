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
    
        const messageTextArg = inArguments.find(arg => arg.messageText);
        if (messageTextArg) document.getElementById('messageText').value = messageTextArg.messageText;

        const subjectArg = inArguments.find(arg => arg.subject);
        if (subjectArg) document.getElementById('subject').value = subjectArg.subject;

        const urgenteArg = inArguments.find(arg => arg.urgente);
        let urgenteIdSuffix = (urgenteArg && urgenteArg.urgente === true) ? 'true' : 'false';
        document.getElementById(`urgente-${urgenteIdSuffix}`).checked = true;

        const validarArg = inArguments.find(arg => arg.validar);
        let validarIdSuffix = (validarArg && validarArg.urgente === true) ? 'true' : 'false';
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
            { messageText: document.getElementById('messageText').value },
            { subject: document.getElementById('subject').value },
            { urgente },
            { validar },
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

    connection.trigger('requestTriggerEventDefinition');
    connection.on('requestedTriggerEventDefinition', (eventDefinitionModel) => {
        if (eventDefinitionModel) eventDefinitionKey = eventDefinitionModel.eventDefinitionKey;
    });
});