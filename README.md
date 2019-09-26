### Provides 2 commands

* `remove-empty-lines.inDocument`
* `remove-empty-lines.inSelection` - can be used without selection (will remove all adjacent empty lines)


![demo](https://raw.githubusercontent.com/usernamehw/vscode-remove-empty-lines/master/img/demo.gif)

### Settings

* `remove-empty-lines.allowedNumberOfEmptyLines`

Example: `"remove-empty-lines.allowedNumberOfEmptyLines": 1,`

![demo_allowed_lines](https://raw.githubusercontent.com/usernamehw/vscode-remove-empty-lines/master/img/demo_allowed_lines.gif)

# ⚠⚠⚠ Extension doesn't define any keyboard shortcuts

[📚 How to open keybindings.json =======>](https://stackoverflow.com/a/45384050/5590193)

### DEMO: Pass allowed number of empty lines as arguments in `keybindings.json`

```javascript
{
	"key": "ctrl+shift+9",
	"command": "remove-empty-lines.inDocument",
	"args": 0
},
{
	"key": "ctrl+shift+9",
	"command": "remove-empty-lines.inSelection",
	"when": "editorHasSelection",
	"args": 0
},
{
	"key": "ctrl+shift+8",
	"command": "remove-empty-lines.inDocument",
	"args": 1
},
{
	"key": "ctrl+shift+8",
	"command": "remove-empty-lines.inSelection",
	"when": "editorHasSelection",
	"args": 1
},
```