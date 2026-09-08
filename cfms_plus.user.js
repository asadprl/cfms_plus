// ==UserScript==
// @name         CFMS Plus
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  adding productivity enhancements to CFMS, including custom shortkeys, auto-login, and quality-of-life automation tools.
// @author       Asad Ullah
// @match        *://cfms*
// @include      *://cfms*
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @require      https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js
// ==/UserScript==


(function() {
    'use strict';

    /*************************************************
     * CONFIGURATION
     *************************************************/
    const SHORTCUT_PROMPT = '`';    // open command palette
    const SHORTCUT_LOGIN = ';';    // Ctrl + ; triggers auto-login

    const STORAGE_KEY = "CFMSPlusCredentials";
    const SECRET_KEY    = "CFMS-Plus-Encryption-Key";

    // View Mapping for the Navigation Command Prompt
    const NAVIGATION_MAP = {
        'c': "GHQ+Case+All+List+View",
        'd': "GHQ+In+Progress+Cases+View",
        'h': "LHC+All+Hearings+View",
        'b': "LHC+Case+Bundle+View",
        'cl': "LHC+Cause+List+-+List+View",
        'tcl': "LHC+Urgent+Today+Cause+List+View",
        'ucl': "LHC+Urgent+Cause+List+View",
        'rcl': "LHC+Regular+Cause+List+View",
        'scl': "LHC+Supplementry+Cause+List+View",
        'dm': "LHC+Case+Data+Migration+Main+View",
        'x': "LHC+Lawyer+Case+Exceptions+View",
        'p': "GHQ+All+Party+List+View",
        'l': "LHC Lawyers View",
        // Additional commands
        'help': 'help'
    };

    /*************************************************
     * UTILITY: Encrypt / Decrypt
     *************************************************/
    function encrypt(text) {
        return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
    }

    function decrypt(cipherText) {
        try {
            const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
            if (bytes.sigBytes === 0) return "";
            return bytes.toString(CryptoJS.enc.Utf8);
        } catch (e) {
            console.error("Decryption failed:", e);
            return "";
        }
    }

    /*************************************************
     * CREDENTIAL STORAGE & MENU SETUP
     *************************************************/
    function saveCredentials() {
        const username = prompt("Enter CFMS Username:", "");
        if (username === null) return;

        const password = prompt("Enter CFMS Password:", "");
        if (password === null) return;

        const data = {
            u: encrypt(username.trim()),
            p: encrypt(password.trim())
        };

        GM_setValue(STORAGE_KEY, data);
        alert("Credentials saved (encrypted). Auto-login is now enabled (Ctrl + ;).");
    }

    function getCredentials() {
        return GM_getValue(STORAGE_KEY, null);
    }

    GM_registerMenuCommand("Set Login Credentials", saveCredentials);
    GM_registerMenuCommand("Clear Saved Credentials", function () {
        GM_setValue(STORAGE_KEY, null);
        alert("Credentials cleared.");
    });


    /*************************************************
     * CFMSPlus LOGIC
     *************************************************/
    const CFMSPlus = {

        gotoView(viewName) {
            if (typeof SiebelApp === 'undefined' || !SiebelApp.S_App || typeof SiebelApp.S_App.GotoView !== 'function') {
                console.warn("SiebelApp or GotoView method not available.");
                return false;
            }
            try {
                SiebelApp.S_App.GotoView(
                    "",
                    "",
                    `/epublicsector_enu/start.swe?SWECmd=GotoView&SWEView=${viewName}`,
                    "_sweclient._swecontent._sweview"
                );
                return true;
            } catch (err) {
                console.error("Error executing GotoView:", err);
                return false;
            }
        },

        autoLogin() {
            const creds = getCredentials();
            // ... (rest of autoLogin logic remains the same)
            if (!creds) {
                alert("No credentials saved. Use Tampermonkey menu → 'Set Login Credentials'.");
                return;
            }

            const username = decrypt(creds.u);
            const password = decrypt(creds.p);

            if (!username || !password) {
                alert("Failed to decrypt saved credentials. Please clear and re-save them.");
                return;
            }

            const uField = document.getElementById("s_swepi_1");
            const pField = document.getElementById("s_swepi_2");

            if (!uField || !pField) {
                alert("Login fields not found on this page.");
                return;
            }

            uField.value = username;
            pField.value = password;

            try {
                if (typeof SWEExecuteLogin === "function") {
                    SWEExecuteLogin(
                        document.SWEEntryForm,
                        "/epublicsector_enu/start.swe",
                        ""
                    );
                } else {
                    console.warn("SWEExecuteLogin function not available.");
                    if (document.SWEEntryForm) {
                       document.SWEEntryForm.submit();
                    }
                }
            } catch (e) {
                alert("Login failed unexpectedly. Check console.");
                console.error("Login error:", e);
            }
        },

        handleNavigationCommand(code) {
            const viewName = NAVIGATION_MAP[code];
            if (viewName && viewName !== 'help') {
                return this.gotoView(viewName);
            }
            return false;
        },

        // Generates the content (HTML) for the help dialog
        getHelpHTML() {
            let html = `
                <h3>Navigation & Commands</h3>
                <table>
                    <thead>
                        <tr><th>Code</th><th>Destination</th></tr>
                    </thead>
                    <tbody>
            `;

            for (const [key, value] of Object.entries(NAVIGATION_MAP)) {
                let description;
                if (key === 'help') {
                    description = 'Show this dialog';
                } else if (key === 'login') {
                    description = 'Execute auto-login (if credentials saved)';
                } else {
                    description = value.replace(/\+/g, ' ').replace('View', '').trim();
                }

                html += `<tr><td><strong>${key}</strong></td><td>${description}</td></tr>`;
            }

            html += `
                    </tbody>
                </table>
                <p class="footer-note">Press ESC or click outside to close.</p>
            `;
            return html;
        }
    };


    /*************************************************
     * CUSTOM HELP DIALOG CLASS (NEW)
     *************************************************/
    const HELP_DIALOG_CSS = `
        #cfms-help-modal {
            position: fixed;
            overflow: auto;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            z-index: 10001;
            display: flex;
            justify-content: center;
            align-items: center;
            opacity: 0;
            transition: opacity 0.2s ease-in-out;
            visibility: hidden;
        }
        #cfms-help-modal.visible {
            opacity: 1;
            visibility: visible;
        }
        #cfms-help-content {
            background-color: white;
            color: #333;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
            max-width: 400px;
            width: 90%;
            transform: translateY(-50px);
            transition: transform 0.3s ease-out;

        }
        #cfms-help-modal.visible #cfms-help-content {
            transform: translateY(0);
        }
        #cfms-help-content table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            font-size: 14px;
        }
        #cfms-help-content th, #cfms-help-content td {
            padding: 8px 0;
            text-align: left;
        }
        #cfms-help-content th {
            border-bottom: 2px solid #ccc;
        }
        #cfms-help-content tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .footer-note {
            font-size: 11px;
            color: #777;
            margin-top: 10px;
            text-align: right;
        }
    `;

    class HelpDialog {
        #modal;
        #content;
        #isVisible = false;

        constructor() {
            GM_addStyle(HELP_DIALOG_CSS);
            this.#setupDOM();
            this.#setupListeners();
        }

        #setupDOM() {
            this.#modal = document.createElement('div');
            this.#modal.id = 'cfms-help-modal';

            this.#content = document.createElement('div');
            this.#content.id = 'cfms-help-content';

            this.#modal.appendChild(this.#content);
            document.body.appendChild(this.#modal);
        }

        #setupListeners() {
            this.#modal.addEventListener('click', this.#handleModalClick);
            document.addEventListener('keydown', this.#handleEscape);
        }

        #handleModalClick = (e) => {
            // Close the dialog only if the click is directly on the modal backdrop
            if (e.target.id === 'cfms-help-modal') {
                this.hide();
            }
        }

        #handleEscape = (e) => {
            if (e.key === 'Escape' && this.#isVisible) {
                e.preventDefault();
                this.hide();
            }
        }

        show() {
            if (this.#isVisible) return;

            // Populate content before showing
            this.#content.innerHTML = CFMSPlus.getHelpHTML();

            this.#modal.classList.add('visible');
            this.#isVisible = true;
        }

        hide() {
            if (!this.#isVisible) return;
            this.#modal.classList.remove('visible');
            this.#isVisible = false;
        }
    }


    /*************************************************
     * COMMAND PROMPT CLASS (UPDATED)
     *************************************************/
    const COMMAND_PALETTE_CSS = `
        /* ... (CSS for command-prompt-container and input remains the same) ... */
        #command-prompt-container {
            position: fixed;
            bottom: 20px;
            right: 0;
            transform: translateX(100%);
            transition: transform 0.3s ease-out;
            background-color: #333;
            padding: 4px;
            border-radius: 20px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            font-family: Arial, sans-serif;
            box-sizing: border-box;
        }
        #command-prompt-input {
            width: 700px;
            padding: 16px 10px;
            border: none;
            border-radius: 20px;
            background-color: #444;
            color: white;
            font-size: 14px;
            outline: none;
        }
        #command-prompt-input::placeholder {
            color: #aaa;
        }
        #command-prompt-container.visible {
            transform: translateX(-20px);
        }
        #command-prompt-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 9999;
            display: none;
        }
    `;

    class CommandPrompt {
        #isVisible = false;
        #container;
        #input;
        #backdrop;
        #helpDialog; // Reference to the new HelpDialog instance

        constructor(helpDialogInstance) {
            this.#helpDialog = helpDialogInstance;

            GM_addStyle(COMMAND_PALETTE_CSS);
            this.#setupDOM();
            this.#setupListeners();
        }

        #setupDOM() {
            this.#container = document.createElement('div');
            this.#container.id = 'command-prompt-container';

            this.#input = document.createElement('input');
            this.#input.id = 'command-prompt-input';
            this.#input.type = 'text';
            this.#input.placeholder = 'Enter navigation code or type "help"...';

            this.#backdrop = document.createElement('div');
            this.#backdrop.id = 'command-prompt-backdrop';

            this.#container.appendChild(this.#input);
            document.body.appendChild(this.#container);
            document.body.appendChild(this.#backdrop);
        }

        #setupListeners() {
            document.addEventListener('keyup', this.#handleGlobalKeys);
            this.#input.addEventListener('keyup', this.#handleInputKeydown);
            this.#backdrop.addEventListener('click', this.#handleBackdropClick);
        }

        #handleGlobalKeys = (e) => {
            // Handle Toggle ('`')
            if (e.key === SHORTCUT_PROMPT && !e.shiftKey) {
                e.preventDefault();
                this.togglePrompt();
            }
            // Handle Close ('Escape') - Only the prompt, the help dialog has its own handler
            else if (e.key === 'Escape' && this.#isVisible) {
                e.preventDefault();
                this.hidePrompt();
            }
            // Handle Auto-Login (Ctrl + ';')
            else if (e.ctrlKey && e.key === SHORTCUT_LOGIN) {
                e.preventDefault();
                CFMSPlus.autoLogin();
            }
        }

        #handleInputKeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const command = this.#input.value.replace(/\s+/g, ' ').trim().toLowerCase();

                if (command) {
                    this.#processCommand(command);
                }

                // Hide the prompt after processing the command
                this.hidePrompt();
            }
        }

        #handleBackdropClick = () => {
            if (this.#isVisible) {
                this.hidePrompt();
            }
        }

        #processCommand(command) {
            console.log('Attempting command:', command);

            if (command === 'help') {
                this.#helpDialog.show(); // <--- NEW: Display the custom dialog
                return;
            }

            const success = CFMSPlus.handleNavigationCommand(command);

            if (!success && command.length > 0) {
                 console.warn(`Unknown navigation code or command: ${command}`);
            }
        }

        showPrompt() {
            if (this.#isVisible || this.#helpDialog.isVisible) return; // Prevent prompt opening if help dialog is open
            this.#container.classList.add('visible');
            this.#backdrop.style.display = 'block';
            this.#input.focus();
            this.#isVisible = true;
        }

        hidePrompt() {
            if (!this.#isVisible) return;
            this.#container.classList.remove('visible');
            this.#backdrop.style.display = 'none';
            this.#input.value = '';
            this.#input.blur();
            this.#isVisible = false;
        }

        togglePrompt() {
            if (this.#isVisible) {
                this.hidePrompt();
            } else {
                this.showPrompt();
            }
        }
    }

    // --- INITIALIZATION ---
    const helpDialog = new HelpDialog(); // Instantiate the help dialog first
    new CommandPrompt(helpDialog); // Pass the help dialog instance to the command prompt

})();
