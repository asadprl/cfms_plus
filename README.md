# CFMS Plus

**CFMS Plus** is a Tampermonkey userscript designed to improve workflow efficiency inside **CFMS (Case Flow Management System)**.
It introduces productivity-boosting features such as custom keyboard shortcuts, auto-navigation, and a secure auto-login system using encrypted credential storage — all while staying lightweight and non-intrusive.


---

## ✨ Features

### 🔐 Secure Auto‑Login

* Stores username & password encrypted using AES-256.

* Credentials are saved using the browser’s Tampermonkey storage.

* Login fields are auto-filled and submitted safely.

* Error-safe execution:
   ✔ script checks
   ✔ Page readiness
   ✔ Element existence
   ✔ Decryption validity
   ✔ Tampermonkey storage availability


### ⌨️ Keyboard Shortcuts

* Enhance CFMS navigation with custom shortkeys.

* Quickly focus important fields.

* Easily trigger frequently used actions.


### 🛠 Automation & UI Enhancements

* Autofocus form inputs.

* Auto-expand hidden UI sections.

* Highlight important items.

* Smooth, persistent UX improvements.

### 🧭 Quick Navigation Menu

Press ` (backtick) to open a menu where you can jump to common CFMS views:
* Case All List View
* In Progress Cases
* Cause List Views
* Case Bundle
* Exception Views
* Data Migration
* More coming soon…

---

## 📦 Installation

1. Install Tampermonkey

Get it for your browser:
🔗 https://www.tampermonkey.net/

2. Create a New Userscript

Open Tampermonkey dashboard

Click Create New Script

Paste the content of CFMS Plus userscript


3. Save and Enable

Click File → Save, then ensure the script is enabled.


## 🔧 Setup: Save Your Encrypted Credentials

1. In CFMS, press Ctrl + Shift + Z


2. A prompt appears asking for:

Username

Password



3. Script encrypts them using AES-256


4. Credentials are stored securely inside Tampermonkey



You can update credentials anytime using the same shortcut.

---



## 🧩 Settings Include

* Enable / disable auto-login

* Update stored credentials

* Toggle features:

* Keyboard shortcuts

* UI tweaks

* Highlighting improvements




---

## 🛡️ Security Notes

* Credentials are encrypted before saving.

* Decryption happens only in memory, not stored.

* Uses industry-standard AES-256 encryption.

* Tampermonkey storage is domain-isolated.

* No external network requests are made.

* Credentials are never sent anywhere except CFMS during login.

* Script is fully client-side.



---

## 📁 Project Structure

/CFMS-Plus
│── README.md
│── cfms-plus.user.js    (the script)
│── LICENSE              (optional)

---

## 🚀 Usage

Once installed and configured:

Auto-login will trigger automatically when CFMS login page is detected.

Shortcuts work across compatible CFMS pages.

Settings can be accessed through the Tampermonkey script menu.


---

## 🤝 Contributing

If you find a bug or want a new shortcut/view added, feel free to open an issue.


---

## 📜 License

MIT License. You are free to modify and distribute.
