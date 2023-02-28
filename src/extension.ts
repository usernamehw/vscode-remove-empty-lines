import { commands, Disposable, ExtensionContext, Range, TextDocument, TextDocumentSaveReason, TextEditor, Uri, window, workspace, WorkspaceEdit } from 'vscode';
import { ExtensionConfig, IRange } from './types';

let documentSaveDisposable: Disposable | undefined;

const enum Constants {
	ExtensionConfigPrefix = 'remove-empty-lines',
}

export const enum CommandId {
	inDocument = 'remove-empty-lines.inDocument',
	inSelection = 'remove-empty-lines.inSelection',
}

const onSaveReasonDefaults: ExtensionConfig['onSaveReason'] = {
	manual: true,
	afterDelay: false,
	focusOut: false,
} as const;

/**
 * Get extension configuration (depending on scope (active editor document language)).
 */
function getExtensionConfig(document?: TextDocument): ExtensionConfig {
	let allowedNumberOfEmptyLines = 0;
	const runOnSave = false;
	const config = workspace.getConfiguration(undefined, document).get(Constants.ExtensionConfigPrefix) as ExtensionConfig;
	if (!config) {
		return {
			runOnSave,
			allowedNumberOfEmptyLines,
			onSaveReason: onSaveReasonDefaults,
		};
	}
	if (config.allowedNumberOfEmptyLines >= 0 && config.allowedNumberOfEmptyLines <= 500) {
		allowedNumberOfEmptyLines = config.allowedNumberOfEmptyLines;
	}

	return {
		allowedNumberOfEmptyLines,
		runOnSave: config.runOnSave,
		onSaveReason: config.onSaveReason,
	};
}

function configWasUpdated() {
	updateRunOnSaveListener();
}

function removeEmptyLines(editor: TextEditor, inSelection: boolean, keybindingsPassedAllowedNumberOfEmptyLines?: unknown) {
	const $config = getExtensionConfig(editor.document);
	if (typeof keybindingsPassedAllowedNumberOfEmptyLines === 'number') {
		$config.allowedNumberOfEmptyLines = keybindingsPassedAllowedNumberOfEmptyLines;
	}

	const { document } = editor;

	if (inSelection) {
		const { selections } = editor;

		if (selections.length === 1 && selections[0].isEmpty) {
			// remove all adjacent empty lines up & down of the cursor
			const activeLine = document.lineAt(selections[0].start.line);
			if (!activeLine.isEmptyOrWhitespace) {
				return;
			} else {
				const closestUp = findUpClosestNonEmptyLine(selections[0].start.line, document);
				const closestDown = findDownClosestNonEmptyLine(selections[0].start.line, document);
				removeEmptyLinesInRange(editor, document, [[closestUp, closestDown]], $config.allowedNumberOfEmptyLines);
			}
		} else {
			const ranges: IRange[] = [];
			for (const selection of selections) {
				ranges.push([selection.start.line, selection.end.line]);
			}
			removeEmptyLinesInRange(editor, document, ranges, $config.allowedNumberOfEmptyLines);
		}
	} else {
		removeEmptyLinesInRange(editor, document, [[0, document.lineCount - 1]], $config.allowedNumberOfEmptyLines);
	}
}

function removeEmptyLinesInRange(editorOrUri: TextEditor | Uri, document: TextDocument, ranges: IRange[], allowedNumberOfEmptyLines: number) {
	const rangesToDelete: Range[] = [];

	for (const range of ranges) {
		let numberOfConsequtiveEmptyLines = 0;
		for (let i = range[0]; i <= range[1]; i++) {
			const line = document.lineAt(i);
			if (line.isEmptyOrWhitespace) {
				numberOfConsequtiveEmptyLines++;
				if (numberOfConsequtiveEmptyLines > allowedNumberOfEmptyLines) {
					rangesToDelete.push(line.rangeIncludingLineBreak);
				}
			} else {
				numberOfConsequtiveEmptyLines = 0;
			}
		}
	}
	if (isEditor(editorOrUri)) {
		editorOrUri.edit(edit => {
			for (const range of rangesToDelete) {
				edit.delete(range);
			}
		});
	} else {
		// When editor is not visible - it seems not possible to find it. But uri can be used with WorkspaceEdit.
		const workspaceEdit = new WorkspaceEdit();
		for (const range of rangesToDelete) {
			workspaceEdit.delete(document.uri, range);
		}
		workspace.applyEdit(workspaceEdit);
	}
}
/**
 * Assume argument is of TextEditor type if it has the `document` property.
 */
function isEditor(arg: any): arg is TextEditor {
	return Boolean(arg.document);
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

	documentSaveDisposable = workspace.onWillSaveTextDocument(saveEvent => {
		const config = getExtensionConfig(saveEvent.document);
		if (!config.runOnSave) {
			return;
		}
		if (!isOnSaveReasonEnabled(saveEvent.reason, getExtensionConfig().onSaveReason)) {
			return;
		}
		if (
			config.onSaveReason.focusOut && saveEvent.reason === TextDocumentSaveReason.FocusOut ||
				config.onSaveReason.afterDelay && saveEvent.reason === TextDocumentSaveReason.AfterDelay
		) {
			removeEmptyLinesInRange(saveEvent.document.uri, saveEvent.document, [[0, saveEvent.document.lineCount - 1]], config.allowedNumberOfEmptyLines);
			return;
		}
		const editor = findEditorByDocument(saveEvent.document);
		if (!editor) {
			return;
		}
		removeEmptyLines(editor, false);
	});
}

function isOnSaveReasonEnabled(reason: TextDocumentSaveReason, configReason: ExtensionConfig['onSaveReason']): boolean {
	if (
		reason === TextDocumentSaveReason.Manual && configReason.manual ||
		reason === TextDocumentSaveReason.AfterDelay && configReason.afterDelay ||
		reason === TextDocumentSaveReason.FocusOut && configReason.focusOut
	) {
		return true;
	}
	return false;
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
	configWasUpdated();

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
		configWasUpdated();
	}));
}

export function deactivate() { }
