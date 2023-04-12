let connection;

define(['postmonger'], (Postmonger) => {
    'use strict';

    connection = new Postmonger.Session();
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

        // const remitenteArg = inArguments.find(arg => arg.remitente);

        // if (remitenteArg) document.getElementById('remitente').value = remitenteArg.remitente;

        // const caModeArg = inArguments.find(arg => arg.caMode);
        // if (caModeArg && caModeArg.caMode && ['independent', 'dependent'].includes(caModeArg.caMode)) {
        //     document.getElementById(`mode-${caModeArg.caMode}`).checked = true;
        //     if (caModeArg.caMode === 'independent') setIndependentMode();
        //     else if (caModeArg.caMode === 'dependent') setDependentMode();
        // }

        // let caMode = getCaMode();
        // if (caMode === 'independent') {
        //     const mensajeTraducidoArg = inArguments.find(arg => arg.mensajeTraducido);
        //     if (mensajeTraducidoArg) {
        //         document.getElementById('mensajeIndependiente').value = mensajeTraducidoArg.mensajeTraducido;
        //     }
        // }
    });

    connection.on('requestedInteraction', (payload) => {
        /* console.log("-------- requestedInteraction --------");
        console.log("AAAAAAAAAAAAAAAAAAA", activity.arguments.execute.inArguments[0]);
        console.log("BBBBBBBBBBBBBBBBBBB", payload); */

        let caMode = getCaMode();

        // console.log('CCCCCCCCCCCCCCCCCCC', caMode);

        if (caMode === 'dependent') {
            let selectedValue;

            // determine the selected item (if there is one)
            if (activity.arguments.execute.inArguments) {
                let existingSelection;
                for (const inArgument of activity.arguments.execute.inArguments) {
                    if (inArgument.mensajeTraducido) {
                        existingSelection = inArgument.mensajeTraducido;
                        break;
                    }
                }
                if (existingSelection && existingSelection.split(".").length == 3) selectedValue = existingSelection.split(".")[1];
            }

            // const selectElement = document.getElementById("messageActivity");

            payload.activities.forEach((a) => {
                if (
                    a.schema &&
                    a.schema.arguments &&
                    a.schema.arguments.execute &&
                    a.schema.arguments.execute.outArguments &&
                    a.schema.arguments.execute.outArguments.length > 0
                ) 
                
                {
                    // a.schema.arguments.execute.outArguments.forEach((inArg) => {
                    //     if (inArg.mensajeTraducido) {
                    //     let option = document.createElement("option");
                    //     option.text = `${a.name} - (${a.key})`;
                    //     option.value = a.key;
                    //     selectElement.add(option);
                    //     }
                    // });
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
        }
    });

    connection.on('clickedNext', () => { // Save function within MC.
        let caMode = getCaMode();
        // let mensajeTraducido;
        // if (caMode === 'dependent') {
        //     const select = document.getElementById("messageActivity");
        //     mensajeTraducido = `{{Interaction.${select.options[select.selectedIndex].value}.mensajeTraducido}}`;
        // } else if (caMode === 'independent') {
        //     mensajeTraducido = document.getElementById("mensajeIndependiente").value;
        // }
        
        payload['arguments'].execute.inArguments = [
            { cellularNumber: `{{Contact.Attribute."Clientes Cluster Prepago".cellular_number}}` },
            { caMode },
        ];
        payload['metaData'].isConfigured = true;
        connection.trigger('updateActivity',payload);

        // activity['metaData'].isConfigured = true;
        // connection.trigger('updateActivity', activity);
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

function getCaMode() {
    let caMode;
    // for (const mode of ['independent', 'dependent']) {
    //     if (document.getElementById(`mode-${mode}`).checked) caMode = mode;
    // }
    return caMode;
}