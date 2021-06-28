import { commands, TextDocument, TextEditor, workspace } from 'vscode';
import { IConfig, IRange } from './types';

let allowedNumberActive = 0;

const enum Constants {
	EXTENSION_NAME = 'remove-empty-lines',
}

const enum CommandIds {
	inDocument = 'remove-empty-lines.inDocument',
	inSelection = 'remove-empty-lines.inSelection',
}

function updateConfig() {
	const config = workspace.getConfiguration().get<IConfig>(Constants.EXTENSION_NAME);
	if (!config) {
		allowedNumberActive = 0;
		return;
	}
	if (config.allowedNumberOfEmptyLines < 0 || config.allowedNumberOfEmptyLines >= 500) {
		allowedNumberActive = 0;
	} else {
		allowedNumberActive = config.allowedNumberOfEmptyLines;
	}
}
function removeEmptyLines(editor: TextEditor, inSelection: boolean, keybindingsPassedAllowedNumberOfEmptyLines?: unknown) {
	updateConfig();
	if (typeof keybindingsPassedAllowedNumberOfEmptyLines === 'number') {
		allowedNumberActive = keybindingsPassedAllowedNumberOfEmptyLines;
	}

	const { document } = editor;

	if (inSelection) {
		const { selections } = editor;

		if (selections.length === 1 && selections[0].isEmpty) {
			// remove all adjacent empty lines up & down of the cursor
			const tempAllowedNumberOfEmptyLines = allowedNumberActive;
			allowedNumberActive = 0;
			const activeLine = document.lineAt(selections[0].start.line);
			if (!activeLine.isEmptyOrWhitespace) {
				return;
			} else {
				const closestUp = findUpClosestNonEmptyLine(selections[0].start.line, document);
				const closestDown = findDownClosestNonEmptyLine(selections[0].start.line, document);
				removeEmptyLinesInRange(editor, document, [[closestUp, closestDown]]);
			}
			allowedNumberActive = tempAllowedNumberOfEmptyLines;
		} else {
			const ranges: IRange[] = [];
			for (const selection of selections) {
				ranges.push([selection.start.line, selection.end.line]);
			}
			removeEmptyLinesInRange(editor, document, ranges);
		}
	} else {
		removeEmptyLinesInRange(editor, document, [[0, document.lineCount - 1]]);
	}
}
function removeEmptyLinesInRange(editor: TextEditor, document: TextDocument, ranges: IRange[]) {
	editor.edit(edit => {
		for (const range of ranges) {
			let numberOfConsequtiveEmptyLines = 0;
			for (let i = range[0]; i <= range[1]; i++) {
				const line = document.lineAt(i);
				if (line.isEmptyOrWhitespace) {
					numberOfConsequtiveEmptyLines++;
					if (numberOfConsequtiveEmptyLines > allowedNumberActive) {
						edit.delete(line.rangeIncludingLineBreak);
					}
				} else {
					numberOfConsequtiveEmptyLines = 0;
				}
			}
		}
	});
}
function findUpClosestNonEmptyLine(ln: number, document: TextDocument) {
	for (let i = ln; i > 0; i--) {
		const lineAt = document.lineAt(i);
		if (lineAt.isEmptyOrWhitespace) {
			continue;
		}
		return i;
	}
	return 0;
}
function findDownClosestNonEmptyLine(ln: number, document: TextDocument) {
	for (let i = ln; i < document.lineCount; i++) {
		const lineAt = document.lineAt(i);
		if (lineAt.isEmptyOrWhitespace) {
			continue;
		}
		return i;
	}
	return document.lineCount - 1;
}

export function activate() {
	commands.registerTextEditorCommand(CommandIds.inDocument, (editor, edit, keybinding?: number) => {
		removeEmptyLines(editor, false, keybinding);
	});
	commands.registerTextEditorCommand(CommandIds.inSelection, (editor, edit, keybinding?: number) => {
		removeEmptyLines(editor, true, keybinding);
	});
}

export function deactivate() { }
