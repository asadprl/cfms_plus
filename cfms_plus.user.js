// ==UserScript==
// @name         CFMS Plus
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  CFMS shortcuts + encrypted auto-login + safe error handling.
// @author       Asad Ullah
// @match        *://cfms*
// @include      *://cfms*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @require      https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js
// ==/UserScript==

(function () {
    'use strict';

    /*************************************************
     * CONFIGURATION
     *************************************************/
    const SHORTCUT_PROMPT = '`';   // open navigation box
    const SHORTCUT_LOGIN = '0';    // Ctrl + 0 triggers auto-login

    const STORAGE_KEY = "CFMSPlusCredentials";
    const SECRET_KEY   = "CFMS-Plus-Encryption-Key"; // internal AES key


    /*************************************************
     * UTILITY: Encrypt / Decrypt
     *************************************************/
    function encrypt(text) {
        return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
    }

    function decrypt(cipherText) {
        try {
            const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
            return bytes.toString(CryptoJS.enc.Utf8);
        } catch (e) {
            console.error("Decryption failed:", e);
            return "";
        }
    }


    /*************************************************
     * CREDENTIAL STORAGE
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
        alert("Credentials saved (encrypted). Auto-login is now enabled.");
    }

    function getCredentials() {
        return GM_getValue(STORAGE_KEY, null);
    }


    /*************************************************
     * REGISTER MENU COMMANDS
     *************************************************/
    GM_registerMenuCommand("Set Login Credentials", saveCredentials);
    GM_registerMenuCommand("Clear Saved Credentials", function () {
        GM_setValue(STORAGE_KEY, null);
        alert("Credentials cleared.");
    });


    /*************************************************
     * MAIN OBJECT
     *************************************************/
    const CFMSPlus = {

        gotoView(viewName) {
            try {
                SiebelApp.S_App.GotoView(
                    "",
                    "",
                    `/epublicsector_enu/start.swe?SWECmd=GotoView&SWEView=${encodeURIComponent(viewName)}`,
                    "_sweclient._swecontent._sweview"
                );
            } catch (err) {
                console.warn("GotoView not available yet.", err);
            }
        },

        autoLogin() {
            const creds = getCredentials();

            if (!creds) {
                alert("No credentials saved. Use Tampermonkey menu → 'Set Login Credentials'.");
                return;
            }

            const username = decrypt(creds.u);
            const password = decrypt(creds.p);

            if (!username || !password) {
                alert("Failed to decrypt saved credentials.");
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

            // Attempt login safely
            try {
                if (typeof SWEExecuteLogin === "function") {
                    SWEExecuteLogin(
                        document.SWEEntryForm,
                        "/epublicsector_enu/start.swe",
                        ""
                    );
                } else {
                    alert("Login function not available on this page.");
                }
            } catch (e) {
                alert("Login failed unexpectedly. Check console.");
                console.error("Login error:", e);
            }
        },

        handleNavigation(code) {
            const map = {
                c: "GHQ Case All List View",
                d: "GHQ In Progress Cases View",
                h: "LHC All Hearings View",
                b: "LHC+Case+Bundle+View",
                cl: "LHC+Cause+List+-+List+View",
                rcl: "LHC+Regular+Cause+List+View",
                scl: "LHC+Supplementry+Cause+List+View",
                dm: "LHC+Case+Data+Migration+Main+View",
                x: "LHC+Lawyer+Case+Exceptions+View",
            };

            if (map[code]) {
                CFMSPlus.gotoView(map[code]);
            }
        }

    };


    /*************************************************
     * KEYBOARD SHORTCUT HANDLER
     *************************************************/
    document.addEventListener('keyup', (e) => {

        // Auto-login
        if (e.ctrlKey && e.key === SHORTCUT_LOGIN) {
            CFMSPlus.autoLogin();
            return;
        }

        // Navigation prompt
        if (!e.shiftKey && e.key === SHORTCUT_PROMPT) {
            const msg = [
                "Enter Page Code:",
                "  c   = Case All List View",
                "  d   = In Progress Cases",
                "  h   = All Hearings",
                "  b   = Case Bundle View",
                "  cl  = Cause List",
                "  rcl = Regular Cause List",
                "  scl = Supplementary Cause List",
                "  dm  = Data Migration Main View",
                "  x   = Lawyer Case Exceptions View"
            ].join("\n");

            const input = prompt(msg, "");
            if (input) CFMSPlus.handleNavigation(input.trim().toLowerCase());
        }
    });

})();