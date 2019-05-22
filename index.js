
/*
|--------------------------------------------------------------------------
| Tier 3 - Pro Tracker
|--------------------------------------------------------------------------
|
| Used By Tier 3 Agents To Capture Call Data.
*/
; (PACT3 = ($, DOMPurify, UIkit) => {
    // Whole-script strict mode syntax
    'use strict';

    //setup uikit container
    UIkit.container = '.uk-scope';

    // API URLS HERE. Do Not Commit.
   
    // const slackApiUrl = "EXAMPLEAPIHERE";
    // const feedbackApiUrl = "EXAMPLEAPIHERE";

    // Contains the final form values that will be used to send to slack.
    let finalFormValuesToSlack;

    const successSlack = "Submitted To Slack!";
    //set domains N/A checkbox change checks

    // declare the form elements to minimize dom calls.
    const H2Title = $('#ChangableFormH2');
    // Input Boxes
    const PROCustomerBox = $('#PROCustomerBox');
    const PRONameBox = $('#PRONameBox');
    const PROSituationBox = $('#PROSituationBox');
    const nameDifferntCheckbox = $('#PRONameNA');
    const PROEscalationNumber = $('#PROEscalationNumber');
    // comments area.
    const PROCommentsBox = $("#PROCommentsBox")
    const hiddenCommentsDiv = $('#hiddenComments')

    // Topics 
    const PRODomains = $('#PRODomains');
    const PROHosting = $('#PROHosting');
    const PROEmail = $('#PROEmail');
    const PROWebsites = $('#PROWebsites');
    const PROSecurity = $('#PROSecurity');
    const PROBusinessTools = $('#PROBusinessTools');
    const PROOther = $('#PROOther');
    const inputNameProductsCalledAbout = $("input[name='productsCalledAbout']");

    // Resolutions
    const PROResolvedCheckbox = $('#PROResolvedCheckbox');
    // const PROScopeCheckbox = $('#PROScopeCheckbox');
    const PROTicketCheckbox = $('#PROTicketCheckbox');
    const inputNameResolutionCheckboxes = $("input[name='resolutionCheckboxes']");

    // Buttons
    const parseButton = $('#parseButton');
    const resetButton = $('#resetButton');
    const SubmitSlack = $('#SubmitSlack');

    // Output
    const resultsOutput = $('#resultsOutput');
    const hiddenResultsArea = $('#hiddenResultsArea');
    const slackIconUrl = "https://s3-us-west-2.amazonaws.com/slack-files2/bot_icons/2019-03-27/591799331895_48.png";

    // Pro Feeback Elements
    const experiencePositive = $('#experiencePositive');
    const experienceNegative = $('#experienceNegative');
    const feedbackComments = $('#feedbackComments');
    const proFeedbackSubmit = $('#proFeedbackSubmit');
    const feedbackTagsCheckboxes = $("input[name='tagChecks']");
    const feedbackAccordion = $("#feedbackAccordion");
    const buttonProvideFeedback = $('#buttonProvideFeedback');

    /*
    |--------------------------------------------------------------------------
    | Click listener on the parse button handles form inputs logic
    | Sanitize the inputs and perform error checking then format values for slack
    |--------------------------------------------------------------------------
    */
    function setTitles(text) {
        H2Title.html(text)
    }

    parseButton.click(function () {
        if (areThereFormErrors() === false) {
            processOutput();
        } else {
            handleError(areThereFormErrors())
        }

        /*
        |--------------------------------------------------------------------------
        | Function Declaration Block. 
        |--------------------------------------------------------------------------
        *///Check for errors before enabling slack submission
        function areThereFormErrors() {
            if (DOMPurify.sanitize(PROCustomerBox.val().trim()) === "") { return "Enter a valid customer number"; }
            if (nameDifferntCheckbox.is(':checked') && DOMPurify.sanitize(PRONameBox.val().trim()) === "") { return "Must enter caller name or alias"; }
            if (DOMPurify.sanitize(PROSituationBox.val().trim()) === "" || PROSituationBox.val().length <= 7) { return "Describe the situation. At least a sentence or two."; }
            if (PROOther.is(':checked') && DOMPurify.sanitize(PROCommentsBox.val().trim()) === "") { return "Enter comments about the topic."; }
            if (PROTicketCheckbox.is(':checked') && DOMPurify.sanitize(PROEscalationNumber.val().trim()) === "") { return "Enter ticket number." }
            let elementsCheck = 0;
            if (inputNameProductsCalledAbout.is(':checked')) { elementsCheck++; }
            if (elementsCheck === 0) { return "Must select a topic"; }
            return false;
        }

        //When errrs occur then areThereFormErrors is passed to handleError.
        function handleError(error) {
            UIkit.notification({ message: error, status: 'danger', pos: 'top-center' })
        }

        //Parse from inputs and show note template
        function processOutput() {
            resultsOutput.val(resultsFormatter())
            SubmitSlack.prop('disabled', false)
        }

        //Format the results from the from into a clean output for notes section. 
        function resultsFormatter() {
            let results;
            let formValues = {
                customerNumber: DOMPurify.sanitize(PROCustomerBox.val().trim()),
                callerName: DOMPurify.sanitize(PRONameBox.val().trim()),
                products: [],
                situation: DOMPurify.sanitize(PROSituationBox.val().trim()),
                resolved: false,
                oos: false,
                escalationCreated: false,
                ticketNumber: '',
                comments: '',
            }
            //loop through topics checkboxes for values.
            inputNameProductsCalledAbout.each(function (index, item) {
                if ($(item).is(':checked')) { formValues.products.push(` ${$(item).prop('id')}`); }
                if ($(item).is(':checked') && $(item).prop('id') === 'PROOther') { formValues.comments = DOMPurify.sanitize(PROCommentsBox.val().trim()); }
            })
            //Loop through the resolution checkboxes. 
            inputNameResolutionCheckboxes.each(function (index, item) {
                if ($(item).is(':checked') && $(item).prop('id') === 'PROResolvedCheckbox') { formValues.resolved = true; }
                if ($(item).is(':checked') && $(item).prop('id') === 'PROScopeCheckbox') { formValues.oos = true; }
                if ($(item).is(':checked') && $(item).prop('id') === 'PROTicketCheckbox') { formValues.escalationCreated = true; formValues.ticketNumber = DOMPurify.sanitize(PROEscalationNumber.val().trim()); }
            })

            // Catching if no name provided.
            if (formValues.callerName === '') { formValues.callerName = 'Same as account name'; }

            // Formatting values.
            results = `Customer #: ${formValues.customerNumber}\nCaller: ${formValues.callerName}\n\nProducts Related To Inquiry:${formValues.products.toString()}\n\nSituation: ${formValues.situation}\nResolved: ${formValues.resolved ? 'True' : 'False'}\nOut of Scope: ${formValues.oos ? 'True' : 'False'}\nEscalation Created: ${formValues.escalationCreated ? `True - Ticket ${formValues.ticketNumber}` : 'False'}\nComments: ${formValues.comments === '' ? 'N/A' : formValues.comments}`;
            finalFormValuesToSlack = formValues;
            hiddenResultsArea.removeAttr("hidden");
            return results;
        }
    })

    /*
    |--------------------------------------------------------------------------
    | Submit To Slack function Handled with click event. 
    |--------------------------------------------------------------------------
    | For slack configuration please view the API documentation for Incoming Webhooks
    | https://godaddy.slack.com/apps/A0F7XDUAZ-incoming-webhooks?page=1
    */
    SubmitSlack.on('click', function () {
        console.log(`here is the object to work with in slack function. ${JSON.stringify(finalFormValuesToSlack)}`)
        SubmitSlack.prop('disabled', true);
        parseButton.prop('disabled', true);

        let text = `#### Pro Pilot Call Tracker ####\nCaller Name: \`${finalFormValuesToSlack.callerName}\`\nProducts Related To Inquiry: \`${finalFormValuesToSlack.products.toString()}\`\nSituation: \`\`\`${finalFormValuesToSlack.situation}\`\`\`\n\nResolved: \`${finalFormValuesToSlack.resolved ? 'True' : 'False'}\`\nOut of Scope: \`${finalFormValuesToSlack.oos ? 'True' : 'False'}\`\nEscalation Created: \`${finalFormValuesToSlack.escalationCreated ? `True - Ticket ${finalFormValuesToSlack.ticketNumber}` : 'False'}\`\nComments: \`${finalFormValuesToSlack.comments === '' ? 'N/A' : finalFormValuesToSlack.comments}\``;
        $.ajax({ data: 'payload=' + JSON.stringify({ "text": text, "icon_url": slackIconUrl }), dataType: 'json', processData: false, type: 'POST', 'url': slackApiUrl });
        UIkit.notification({ message: successSlack, status: 'success' });
    })

    /*
    |--------------------------------------------------------------------------
    | Event Handlers and form reset function
    |--------------------------------------------------------------------------
    */

    //reset form values and variables
    resetButton.on('click', function () {
        inputNameProductsCalledAbout.each(function (index, item) { $(item).prop('checked', false).prop('disabled', false); })
        
        //Handling setting the toggle buttons.
        inputNameResolutionCheckboxes.each(function (index, item) { 
            $(item).prop('checked', false).prop('disabled', false);
            let elemId = $(item).attr('id');
            if($(`[data-attr='${elemId}']`).hasClass('toggle-on') && !$(item).prop('checked')) {$(`[data-attr='${elemId}']`).toggleClass('toggle-on');}
        })
        PROResolvedCheckbox.prop('checked', true); 
        if (!$(`[data-attr='PROResolvedCheckbox']`).hasClass('toggle-on')) {$(`[data-attr='PROResolvedCheckbox']`).toggleClass('toggle-on');}

        //Handling the checkboxes
        nameDifferntCheckbox.prop('checked', false);
        PROCustomerBox.val('');
        PRONameBox.val('').prop('disabled', true);
        PROCommentsBox.prop('disabled', true).val('');
        PROEscalationNumber.prop('disabled', true).val('').attr('hidden', 'hidden');
        hiddenCommentsDiv.attr('hidden', 'hidden');
        PROSituationBox.val('');
        PROResolvedCheckbox.checked = true;

        finalFormValuesToSlack = '';
        SubmitSlack.prop('disabled', true)
        hiddenResultsArea.attr('hidden', 'hidden')
        resultsOutput.val('');
        parseButton.prop('disabled', false);

        //feedback elements
        if (feedbackAccordion.hasClass('uk-open')) {
            UIkit.accordion('#jsaccordion').toggle(0, true);
        }
        UIkit.notification.closeAll()
        proFeedbackSubmit.removeAttr('disabled');
        experiencePositive.prop('checked', true);
        experienceNegative.prop('checked', false);
        feedbackComments.val('');
        feedbackTagsCheckboxes.each(function (index, item) { $(item).prop('checked', false) })
    })

    // This listener will fire if the user chooses to enter a caller name manually.
    nameDifferntCheckbox.on('change', function () {
        if (nameDifferntCheckbox.is(':checked')) {
            PRONameBox.prop('disabled', false).prop('placeholder', 'Enter Caller Name.');
        } else if (!nameDifferntCheckbox.is(':checked')) {
            PRONameBox.prop('disabled', true).prop('placeholder', 'Same As Account Name.');
        }
    })

    // This listener will fire when user clicks a call topic.
    inputNameProductsCalledAbout.on('change', function () {
        if ($(this).prop('id') !== 'PROOther') { PROOther.prop('disabled', true).prop('checked', false); }
        if (PROOther.is(':checked')) {
            //Enable/disable comments area.
            PROCommentsBox.prop('disabled', false).val('');
            hiddenCommentsDiv.removeAttr('hidden');
            //Enable/disable call topics.
            PRODomains.prop('disabled', true).prop('checked', false);
            PROHosting.prop('disabled', true).prop('checked', false);
            PROEmail.prop('disabled', true).prop('checked', false);
            PROWebsites.prop('disabled', true).prop('checked', false);
            PROSecurity.prop('disabled', true).prop('checked', false);
            PROBusinessTools.prop('disabled', true).prop('checked', false);
        } else if (!PROOther.is(':checked')) {
            //Enable/disable comments area.
            PROCommentsBox.prop('disabled', true).val('');
            hiddenCommentsDiv.attr('hidden', 'hidden');
            //Enable/disable call topics.
            PRODomains.prop('disabled', false);
            PROHosting.prop('disabled', false);
            PROEmail.prop('disabled', false);
            PROWebsites.prop('disabled', false);
            PROSecurity.prop('disabled', false);
            PROBusinessTools.prop('disabled', false);
        }
        if (!inputNameProductsCalledAbout.is(':checked')) {
            PROOther.prop('disabled', false);
        }
    })

    /*
    |--------------------------------------------------------------------------
    | Click listener on the proFeedbackSubmit button. Will process inputs and send to DB API.
    | API stored in variable.
    | Also handles the regular button buttonProvideFeedback
    |--------------------------------------------------------------------------
    */
    proFeedbackSubmit.on('click', function () {
        let feedbackFormValues = {
            tags: [],
            text: '',
            positive: false
        };
        feedbackTagsCheckboxes.each(function (index, item) {
            if ($(item).is(':checked')) { feedbackFormValues.tags.push($(item).attr('data-attr')); }
        })
        feedbackFormValues.text = DOMPurify.sanitize(feedbackComments.val().trim())
        if (feedbackFormValues.text === '') { feedbackFormValues.text = "N/A" }
        if (experiencePositive.is(":checked")) {
            feedbackFormValues.positive = true;
        } else if (experienceNegative.is(":checked")) {
            feedbackFormValues.positive = false;
        }
        sendToFeedbackApi(feedbackFormValues);
        proFeedbackSubmit.attr('disabled', 'disabled');
        function sendToFeedbackApi(feedback) {
            let parsedData = JSON.stringify({ text: feedback.text, tags: feedback.tags, isPositive: feedbackFormValues.positive })
            fetch(feedbackApiUrl, {
                credentials: 'include',
                method: 'POST',
                mode: 'cors',
                body: parsedData,
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(handleFetchErrors)
                .catch(error => console.error('Error:', error))
        }
    })

    buttonProvideFeedback.on('click', function () {
        UIkit.accordion('#jsaccordion').toggle(0, true);
    })

    function handleFetchErrors(response) {
        if (!response.ok) {
            UIkit.notification({ message: "Feedback API Response is not OK", status: 'danger' });
            console.log(JSON.stringify(response))
        } else {
            UIkit.notification({ message: "Feedback is submitted!", status: 'success' });
        }
        return response;
    }

    //Setting for the CSS toggle buttons
    $('.toggle').click(function (e) {
        e.preventDefault(); // The flicker is a codepen thing
        $(this).toggleClass('toggle-on');
        let checkboxToggle = $(this).attr('data-attr');
        if (checkboxToggle === "PROResolvedCheckbox") {$('#' + checkboxToggle).prop("checked", !$('#' + checkboxToggle).prop("checked")); console.log($('#' + checkboxToggle).prop("checked")) }
        if (checkboxToggle === "PROTicketCheckbox") {$('#' + checkboxToggle).prop("checked", !$('#' + checkboxToggle).prop("checked")); console.log($('#' + checkboxToggle).prop("checked")) }
        if (checkboxToggle === "PROScopeCheckbox") {$('#' + checkboxToggle).prop("checked", !$('#' + checkboxToggle).prop("checked")); console.log($('#' + checkboxToggle).prop("checked")) }
        if (PROTicketCheckbox.prop('checked')) {
            PROEscalationNumber.prop('disabled', false).removeAttr('hidden');
        } else {
            PROEscalationNumber.prop('disabled', true).val('').attr('hidden', 'hidden');
        }
    })
    //Also for CSS toggle boxes. Sets a listener to match boxes with css switches
    

})($, DOMPurify, UIkit);// Dom purify should be used to sanitize all fields. Passing Jquery in with $.
