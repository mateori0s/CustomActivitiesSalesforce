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
        let attributeKeyWord = null;
        if (document.getElementById('packs-type-upc').checked) {
            packsType = 'upc';
            attributeKeyWord = 'UPC';
        }
        if (document.getElementById('packs-type-ms').checked) {
            packsType = 'ms';
            attributeKeyWord = 'SEGMENTO';
        }

        payload['arguments'].execute.inArguments = [
            { packsType },
            { cellularnumber: `{{Contact.Attribute.PACKS_ADDITIONAL_DATA.CELLULAR_NUMBER}}` },
            { packFinal: `{{Contact.Attribute.PACKS_ADDITIONAL_DATA.PACK_${attributeKeyWord}_FINAL}}` },
            { packPrice: `{{Contact.Attribute.PACKS_ADDITIONAL_DATA.PACK_${attributeKeyWord}_PRICE}}` },
            { packMsj: `{{Contact.Attribute.PACKS_ADDITIONAL_DATA.PACK_${attributeKeyWord}_MSJ}}` },
        ];
        payload['metaData'].isConfigured = true;
        connection.trigger('updateActivity', payload);
    });

    connection.trigger('requestTriggerEventDefinition');
    connection.on('requestedTriggerEventDefinition', (eventDefinitionModel) => {
        if (eventDefinitionModel) eventDefinitionKey = eventDefinitionModel.eventDefinitionKey;
    });
});