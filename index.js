
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
    const customerBox = $('#customerBox');
    const nameBox = $('#nameBox');
    const situationBox = $('#situationBox');
    const nameDifferntCheckbox = $('#nameNA');
    const escalationNumber = $('#escalationNumber');
    // comments area.
    const commentsBox = $("#commentsBox")
    const hiddenCommentsDiv = $('#hiddenComments')

    // Topics 
    const Domains = $('#Domains');
    const Hosting = $('#Hosting');
    const Email = $('#Email');
    const Websites = $('#Websites');
    const Security = $('#Security');
    const BusinessTools = $('#BusinessTools');
    const Other = $('#Other');
    const inputNameProductsCalledAbout = $("input[name='productsCalledAbout']");

    // Resolutions
    const resolvedCheckbox = $('#resolvedCheckbox');
    const scopeCheckbox = $('#scopeCheckbox');
    const ticketCheckbox = $('#ticketCheckbox');
    const inputNameResolutionCheckboxes = $("input[name='resolutionCheckboxes']");

    // Buttons
    const parseButton = $('#parseButton');
    const resetButton = $('#resetButton');
    const SubmitSlack = $('#SubmitSlack');

    // Output
    const resultsOutput = $('#resultsOutput');
    const hiddenResultsArea = $('#hiddenResultsArea');
    const slackIconUrl = "https://s3-us-west-2.amazonaws.com/slack-files2/bot_icons/2019-03-27/591799331895_48.png";
    let timeoutModule;

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
            if (DOMPurify.sanitize(customerBox.val().trim()) === "") { return "Enter a valid customer number"; }
            if (nameDifferntCheckbox.is(':checked') && DOMPurify.sanitize(nameBox.val().trim()) === "") { return "Must enter caller name or alias"; }
            if (DOMPurify.sanitize(situationBox.val().trim()) === "" || situationBox.val().length <= 7) { return "Describe the situation. At least a sentence or two."; }
            if (Other.is(':checked') && DOMPurify.sanitize(commentsBox.val().trim()) === "") { return "Enter comments about the topic."; }
            if (ticketCheckbox.is(':checked') && DOMPurify.sanitize(escalationNumber.val().trim()) === "") { return "Enter ticket number." }
            let elementsCheck = 0;
            if (inputNameProductsCalledAbout.is(':checked')) { elementsCheck++; }
            if (elementsCheck === 0) { return "Must select a topic"; }
            return false;
        }

        //When errrs occur then areThereFormErrors is passed to handleError.
        function handleError(error) {
            UIkit.notification({message: error, status: 'danger'})
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
                customerNumber: DOMPurify.sanitize(customerBox.val().trim()),
                callerName: DOMPurify.sanitize(nameBox.val().trim()),
                products: [],
                situation: DOMPurify.sanitize(situationBox.val().trim()),
                resolved: false,
                oos: false,
                escalationCreated: false,
                ticketNumber: '',
                comments: '',
            }
            //loop through topics checkboxes for values.
            inputNameProductsCalledAbout.each(function (index, item) {
                if ($(item).is(':checked')) { formValues.products.push(` ${$(item).prop('id')}`); }
                if ($(item).is(':checked') && $(item).prop('id') === 'Other') { formValues.comments = DOMPurify.sanitize(commentsBox.val().trim()); }
            })
            //Loop through the resolution checkboxes. 
            inputNameResolutionCheckboxes.each(function (index, item) {
                if ($(item).is(':checked') && $(item).prop('id') === 'resolvedCheckbox') { formValues.resolved = true; }
                if ($(item).is(':checked') && $(item).prop('id') === 'scopeCheckbox') { formValues.oos = true; }
                if ($(item).is(':checked') && $(item).prop('id') === 'ticketCheckbox') { formValues.escalationCreated = true; formValues.ticketNumber = DOMPurify.sanitize(escalationNumber.val().trim()); }
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
        $.ajax({ data: 'payload=' + JSON.stringify({ "text": text, "icon_url": slackIconUrl}), dataType: 'json', processData: false, type: 'POST', 'url': slackApiUrl });
        UIkit.notification({message: successSlack, status: 'success'});
    })

    /*
    |--------------------------------------------------------------------------
    | Event Handlers and form reset function
    |--------------------------------------------------------------------------
    */

    //reset form values and variables
    resetButton.on('click', function () {
        inputNameProductsCalledAbout.each(function (index, item) { $(item).prop('checked', false).prop('disabled', false); })
        inputNameResolutionCheckboxes.each(function (index, item) { $(item).prop('checked', false).prop('disabled', false); })
        nameDifferntCheckbox.prop('checked', false);
        customerBox.val('');
        nameBox.val('').prop('disabled', true);
        commentsBox.prop('disabled', true).val('');
        escalationNumber.prop('disabled', true).val('').attr('hidden', 'hidden');
        hiddenCommentsDiv.attr('hidden', 'hidden');
        situationBox.val('');
        document.getElementById("resolvedCheckbox").checked = true;
        
        finalFormValuesToSlack = '';
        SubmitSlack.prop('disabled', true)
        hiddenResultsArea.attr('hidden', 'hidden')
        resultsOutput.val('');
        parseButton.prop('disabled', false);
        clearTimeout(timeoutModule);

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
            nameBox.prop('disabled', false).prop('placeholder', 'Enter Caller Name.');
        } else if (!nameDifferntCheckbox.is(':checked')) {
            nameBox.prop('disabled', true).prop('placeholder', 'Same As Account Name.');
        }
    })

    //This listener is if a ticket was created. Allows ticket number input.
    ticketCheckbox.on('change', function () {
        if (ticketCheckbox.is(':checked')) {
            escalationNumber.prop('disabled', false).removeAttr('hidden');
        } else {
            escalationNumber.prop('disabled', true).val('').attr('hidden', 'hidden');
        }
    })

    // This listener will fire when user clicks a call topic.
    inputNameProductsCalledAbout.on('change', function () {
        if ($(this).prop('id') !== 'Other') { Other.prop('disabled', true).prop('checked', false); }
        if (Other.is(':checked')) {
            //Enable/disable comments area.
            commentsBox.prop('disabled', false).val('');
            hiddenCommentsDiv.removeAttr('hidden');
            //Enable/disable call topics.
            Domains.prop('disabled', true).prop('checked', false);
            Hosting.prop('disabled', true).prop('checked', false);
            Email.prop('disabled', true).prop('checked', false);
            Websites.prop('disabled', true).prop('checked', false);
            Security.prop('disabled', true).prop('checked', false);
            BusinessTools.prop('disabled', true).prop('checked', false);
        } else if (!Other.is(':checked')) {
            //Enable/disable comments area.
            commentsBox.prop('disabled', true).val('');
            hiddenCommentsDiv.attr('hidden', 'hidden');
            //Enable/disable call topics.
            Domains.prop('disabled', false);
            Hosting.prop('disabled', false);
            Email.prop('disabled', false);
            Websites.prop('disabled', false);
            Security.prop('disabled', false);
            BusinessTools.prop('disabled', false);
        }
        if (!inputNameProductsCalledAbout.is(':checked')) {
            Other.prop('disabled', false);
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
            //console.log({ text: feedback.text, tags: feedback.tags, positive: feedback.positive })
            //console.log(JSON.stringify({ text: feedback.text, tags: feedback.tags, positive: feedbackFormValues.positive }))
            let parsedData = JSON.stringify({ text: feedback.text, tags: feedback.tags, positive: feedbackFormValues.positive })
            fetch(feedbackApiUrl, {
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
            UIkit.notification({message: "Feedback API Response is not OK", status: 'danger'});
            console.log(JSON.stringify(response))
        }
        return response;
    }


})($, DOMPurify, UIkit);// Dom purify should be used to sanitize all fields. Passing Jquery in with $.
