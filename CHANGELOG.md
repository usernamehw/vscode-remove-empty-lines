## 1.0.1 `28 Feb 2023`

- ✨ Make **"remove-empty-lines.runOnSave"** setting to be language-overridable

## 1.0.0 `07 Feb 2023`

- ✨ Make extension available on the web
- ✨ Config option to run on save (delay of focus out) **"remove-empty-lines.onSaveReason"**

## 0.0.12 `16 Aug 2022`

- ✨ Option to remove empty lines only in specific languages #12

## 0.0.11 `07 May 2022`

- 🐛 Wrong extension icon

## 0.0.10 `07 May 2022`

- 🔨 Add extension icon

## 0.0.9 `26 Apr 2022`

- ✨ Setting to run on save **"remove-empty-lines.runOnSave": true,**

## 0.0.8 `20 Jul 2021`

- 🔨 Change `extensionKind`

## 0.0.7 `28 Jun 2021`

- 🔨 Refactor?

## 0.0.6 `26 Sep 2019`

- 🔨 Remove gifs from the extension
- 🔨 Use webpack

## 0.0.5 `04 Mar 2019`

- 📚 Updated README with the information that extension does not contribute any keybindings
- 📚 Updated README with the link on how to open `keybindings.json`

## 0.0.4 `25 Feb 2019`

- ✨ Ability to pass `allowedNumberOfEmptyLines` as `args` in keybindings:

```javascript
{
	"key": "ctrl+shift+8",
	"command": "remove-empty-lines.inDocument",
	"args": 1
},
```

## 0.0.3 `06 Feb 2019`

- ✨ Remove all adjacent empty lines when executing `remove-empty-lines.inSelection` without selection
- 🔨 Reduce the size of `.gif` and improve their quality **705Kb** => **121Kb**

## 0.0.2 `29 Dec 2018`

- ✨ Added setting `remove-empty-lines.allowedNumberOfEmptyLines`
- 🔨 Refactor

## 0.0.1 `07 Dec 2018`
- Initial release

