// ==UserScript==
// @name         CFMS Plus
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  This essential extension adds a collection of valuable features to simplify your daily work in CFMS (Case Flow Management System).
// @author       AsadUllah
// @match        *://cfms*
// @include      *://cfms*

// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let inputValue = '';

    var cfms = {};

    cfms.GotoView = function(v){
        SiebelApp.S_App.GotoView("", "", "/epublicsector_enu/start.swe?SWECmd=GotoView&SWEView=" + v, "_sweclient._swecontent._sweview");
    };

    document.onkeyup = function (e) {
        if (e.ctrlKey && e.key == '0') {    // Ctrl + 0 to login: Change as needed
            document.getElementById("s_swepi_1").value = "";	// set username
            document.getElementById("s_swepi_2").value = "";	// set password
            SWEExecuteLogin(document.SWEEntryForm, "/epublicsector_enu/start.swe", "");

        } else if (!e.shiftKey && e.key === '`') {  // Change '`' to your desired key to show prompt
            const promptMessage = [
                "Enter Page Code:",
                "  c: Case All List View",
                "  d: In Progress Cases View",
                "  h: All Hearings View",
                "  b: Case Bundle View",
                "  cl: Cause List - List View",
                "  rcl: Regular Cause List View",
                "  scl: Supplementry Cause List View",
                "  dm: Case Data Migration Main View",
                "  x: Lawyer Case Exceptions View",
                "  stop: Stop Automation",
                "Or enter Case Number starting with 'c' (e.g., c123/2023)"
            ].join('\n');
            let page = prompt(promptMessage, "");
            switch(page) { 
                case "c":
                    cfms.GotoView("GHQ Case All List View");
                    break;
                case "d":
                    cfms.GotoView("GHQ In Progress Cases View");
                    break;
                case "h":
                    cfms.GotoView("LHC All Hearings View");
                    break;
                case "b":
                    cfms.GotoView("LHC+Case+Bundle+View");
                    break;
                case "cl":
                    cfms.GotoView("LHC+Cause+List+-+List+View");
                    break;
                case "rcl":
                    cfms.GotoView("LHC+Regular+Cause+List+View");
                    break;
                case "scl":
                    cfms.GotoView("LHC+Supplementry+Cause+List+View");
                    break;
                case "dm":
                    cfms.GotoView("LHC+Case+Data+Migration+Main+View");
                    break;
                case "x":
                    cfms.GotoView("LHC+Lawyer+Case+Exceptions+View");
                    break;
                case "stop":
                    myStopFunction();
                    break;
            }
            let pattern = /c[0-9\-\/]/;
            if (pattern.test(page)){
                document.getElementsByName('s_1_1_1_0')[0].value = "Case #";
                document.getElementsByName('s_1_1_2_0')[0].value = "*"+ page.substring(1) + "*";
                document.getElementsByName('s_1_1_2_0')[0].select();
            }
        } else if (e.ctrlKey && e.shiftKey && e.key === 'z') { // Change 'A' to your desired key
            promptForInput(); // Prompt for input when the shortcut is pressed
        }
    };

    cfms.highlightFC = function(){
    };

    window.addEventListener("DOMNodeInserted", function() {
        cfms.highlightFC();
    }, false);
//    document.addEventListener('load', function(){
//        SiebelApp.S_App.GotoView("", "", "/epublicsector_enu/start.swe?SWECmd=GotoView&SWEView=LHC+Supplementry+Cause+List+View", "_sweclient._swecontent._sweview");
//             var elements = document.querySelectorAll('[id$="FC_Nominated"]');
//             console.log(elements.length);
//             for (let i=0; i<elements.length; i++)
//             {
//                 if(elements[i].innerText == "FC")
//                 {
//                     //elements[i].parentNode.style.backgroundColor = "#f7c3ee";
//                 }
//             }
//    },false);

    function automateProcess() {
        //const textField = document.querySelector(textFieldSelector);
        const nextButton = document.querySelector(nextButtonSelector);

        // Check if the Next button is disabled
        if (nextButton && nextButton.disabled) {
            console.log('Next button is disabled. Stopping automation.');
            return; // Stop the automation if the button is disabled
        }

        // Fill the text field with the user input
        //if (textField) {
        //    textField.value = inputValue; // Set the value from user input
        //    console.log('Filled text field with:', inputValue);
        //}

        // Click the Next button
        if (nextButton) {
            nextButton.click();
            console.log('Clicked Next button.');
        }

        // Wait for a delay before the next iteration
        mytimeout = setTimeout(automateProcess, delayBetweenActions);
    }

    // Function to prompt for user input
    function promptForInput() {
        inputValue = prompt("Enter the value for the text field (leave blank to clear):", "");
        if (inputValue !== null) { // Check if the user didn't cancel the prompt
            automateProcess();
        }
    }

    function myStopFunction() {
        clearTimeout(mytimeout);
    }
})();
