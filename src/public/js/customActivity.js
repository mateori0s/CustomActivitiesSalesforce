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


        const dataExtensionMessageColumnArg = inArguments.find(arg => arg.campoMensaje);
        if (dataExtensionMessageColumnArg) {
            document.getElementById('campoMensaje').value = dataExtensionMessageColumnArg.campoMensaje;
        }

    });

    connection.on('clickedNext', () => {

        const dataExtension = document.getElementById('dataExtension').value;

        let mensajeTraducido;
        const deColumn = document.getElementById("campoMensaje").value;
        mensajeTraducido = `{{Contact.Attribute."${dataExtension}".${deColumn}}}`;

        payload['arguments'].execute.inArguments = [
            { dataExtension: dataExtension },
            // { campoMensaje: `{{Contact.Attribute."${dataExtension}".${campoMensaje}}}` },
            {campoMensaje},

        ];
        payload['metaData'].isConfigured = true;
        connection.trigger('updateActivity', payload);
    });

    connection.trigger('requestTriggerEventDefinition');
    connection.on('requestedTriggerEventDefinition', (eventDefinitionModel) => {
        if (eventDefinitionModel) eventDefinitionKey = eventDefinitionModel.eventDefinitionKey;
    });
});
