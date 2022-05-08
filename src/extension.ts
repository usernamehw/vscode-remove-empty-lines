import { commands, Disposable, ExtensionContext, TextDocument, TextDocumentSaveReason, TextEditor, window, workspace } from 'vscode';
import { ExtensionConfig, IRange } from './types';

let allowedNumberActive = 0;
let documentSaveDisposable: Disposable | undefined;
let config: ExtensionConfig;

const enum Constants {
	ExtensionConfigPrefix = 'remove-empty-lines',
}

export const enum CommandId {
	inDocument = 'remove-empty-lines.inDocument',
	inSelection = 'remove-empty-lines.inSelection',
}

function updateConfig() {
	config = workspace.getConfiguration().get(Constants.ExtensionConfigPrefix) as ExtensionConfig;
	if (!config) {
		allowedNumberActive = 0;
		return;
	}
	if (config.allowedNumberOfEmptyLines < 0 || config.allowedNumberOfEmptyLines >= 500) {
		allowedNumberActive = 0;
	} else {
		allowedNumberActive = config.allowedNumberOfEmptyLines;
	}

	updateRunOnSaveListener();
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

function updateRunOnSaveListener() {
	documentSaveDisposable?.dispose();

	if (config.runOnSave) {
		documentSaveDisposable = workspace.onWillSaveTextDocument(e => {
			if (e.reason !== TextDocumentSaveReason.Manual) {
				return;
			}

			const editor = findEditorByDocument(e.document);
			if (!editor) {
				return;
			}

			removeEmptyLines(editor, false);
		});
	}
}

function findEditorByDocument(document: TextDocument) {
	for (const editor of window.visibleTextEditors) {
		if (editor.document === document) {
			return editor;
		}
	}
	return undefined;
}

export function activate(context: ExtensionContext) {
	updateConfig();

	context.subscriptions.push(commands.registerTextEditorCommand(CommandId.inDocument, (editor, edit, keybinding?: number) => {
		removeEmptyLines(editor, false, keybinding);
	}));
	context.subscriptions.push(commands.registerTextEditorCommand(CommandId.inSelection, (editor, edit, keybinding?: number) => {
		removeEmptyLines(editor, true, keybinding);
	}));

	context.subscriptions.push(workspace.onDidChangeConfiguration(e => {
		if (!e.affectsConfiguration(Constants.ExtensionConfigPrefix)) {
			return;
		}
		updateConfig();
	}));
}

export function deactivate() { }
