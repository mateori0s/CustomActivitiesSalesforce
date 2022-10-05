define(['postmonger'], (Postmonger) => {
    'use strict';

    let connection = new Postmonger.Session();
    let activity;

    // Configuration variables
    let eventDefinitionKey;

    $(window).ready(() => {
        // JB will respond the first time 'ready' is called with 'initActivity'
        connection.trigger('ready');
        connection.trigger('requestTokens');
        connection.trigger('requestEndpoints');
        connection.trigger("requestTriggerEventDefinition");
        connection.trigger("requestInteraction");
    });

    connection.on('initActivity', (data) => {
        if (data) activity = data;

        const inArguments = Boolean(
            data.arguments &&
            data.arguments.execute &&
            data.arguments.execute.inArguments &&
            data.arguments.execute.inArguments.length > 0
        ) ? data.arguments.execute.inArguments : [];

        const remitenteArg = inArguments.find(arg => arg.Remitente);

        if (remitenteArg) document.getElementById('remitente').value = remitenteArg.Remitente;
    });

    connection.on('requestedInteraction', (payload) => {
        console.log("-------- requestedInteraction --------");
        console.log("inArguments --> ", activity.arguments.execute.inArguments[0]);

        console.log("-------- payload --------");
        console.log(payload);

        console.log("-------- activity --------");
        console.log(activity);

        let selectedValue;

        // determine the selected item (if there is one)
        if (activity.arguments.execute.inArguments) {
            const existingSelection =
                activity.arguments.execute.inArguments[0].mensajeTraducido ??
                activity.arguments.execute.inArguments[0].mensajeTraducido;
            if (existingSelection.split(".").length == 3) selectedValue = existingSelection.split(".")[1];
        }

        // Populate the select dropdown.
        const selectElement = document.getElementById("messageActivity");

        payload.activities.forEach((a) => {
            if (
              a.schema &&
              a.schema.arguments &&
              a.schema.arguments.execute &&
              a.schema.arguments.execute.outArguments &&
              a.schema.arguments.execute.outArguments.length > 0
            ) {
              a.schema.arguments.execute.outArguments.forEach((inArg) => {
                if (inArg.mensajeTraducido) {
                  let option = document.createElement("option");
                  option.text = `${a.name} - (${a.key})`;
                  option.value = a.key;
                  selectElement.add(option);
                }
              });
            }
        });

        if (selectElement.childElementCount > 0) {
            // If we have a previously selected value, repopulate that value.
            if (selectedValue) {
              const selectOption = selectElement.querySelector(`[value='${selectedValue}']`);
              if (selectOption) selectOption.selected = true;
              else console.log("Could not select value from list", `[value='${selectedValue}]'`);
            }
            // Let Journey Builder know the activity has changes.
            connection.trigger("setActivityDirtyState", true);
        }
    });

    connection.on('clickedNext', () => { // Save function within MC.
        const select = document.getElementById("messageActivity");

        activity['arguments'].execute.inArguments = [
            { Remitente: document.getElementById('remitente').value },
            { mensajeTraducido: `{{Interaction.${select.options[select.selectedIndex].value}.mensajeTraducido}}` },
            { Cellular_number: `{{Contact.Attribute."Clientes Cluster Prepago".cellular_number}}` }
        ];

        activity['metaData'].isConfigured = true;
        connection.trigger('updateActivity', activity);
    });

    /**
     * This function is to pull out the event definition within journey builder.
     * With the eventDefinitionKey, you are able to pull out values that passes through the journey
     */
    connection.on('requestedTriggerEventDefinition', (eventDefinitionModel) => {
        console.log("Requested TriggerEventDefinition", eventDefinitionModel.eventDefinitionKey);
        if (eventDefinitionModel) eventDefinitionKey = eventDefinitionModel.eventDefinitionKey;
    });
});