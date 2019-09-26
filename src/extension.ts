'use strict';
import { ExtensionContext, commands, workspace, TextEditor, TextDocument } from 'vscode';
import * as vscode from 'vscode';
import { IConfig, IRange } from './types';

export function activate(ctx: ExtensionContext) {
	const extName = 'remove-empty-lines';
	let config: IConfig;

	function updateConfig(): void {
		config = { ...workspace.getConfiguration(extName) } as any as IConfig;
		if (config.allowedNumberOfEmptyLines < 0 || config.allowedNumberOfEmptyLines > 500) {
			config.allowedNumberOfEmptyLines = 0;
		}
	}

	function removeEmptyLines(inSelection: boolean, editor: vscode.TextEditor, edit: vscode.TextEditorEdit, keybindingsPassedAllowedNumberOfEmptyLines?: any): void {
		updateConfig();
		if (typeof keybindingsPassedAllowedNumberOfEmptyLines === 'number') {
			config.allowedNumberOfEmptyLines = keybindingsPassedAllowedNumberOfEmptyLines;
		}

		const { document } = editor;

		if (inSelection) {
			const { selections } = editor;

			if (selections.length === 1 && selections[0].isEmpty) {
				// remove all adjacent empty lines up & down of the cursor
				const tempAllowedNumberOfEmptyLines = config.allowedNumberOfEmptyLines;
				config.allowedNumberOfEmptyLines = 0;
				const activeLine = document.lineAt(selections[0].start.line);
				if (!activeLine.isEmptyOrWhitespace) {
					return;
				} else {
					const closestUp = findUpClosestNonEmptyLine(selections[0].start.line, document);
					const closestDown = findDownClosestNonEmptyLine(selections[0].start.line, document);
					removeEmptyLinesInRange(editor, document, [[closestUp, closestDown]]);
				}
				config.allowedNumberOfEmptyLines = tempAllowedNumberOfEmptyLines;
			} else {
				const ranges: IRange[] = [];
				selections.forEach((selection) => {
					ranges.push([selection.start.line, selection.end.line]);
				});
				removeEmptyLinesInRange(editor, document, ranges);
			}
		} else {
			removeEmptyLinesInRange(editor, document, [[0, document.lineCount - 1]]);
		}
	}
	function removeEmptyLinesInRange(editor: TextEditor, document: TextDocument, ranges: IRange[]): void {
		editor.edit((edit) => {
			ranges.forEach(range => {
				let numberOfConsequtiveEmptyLines = 0;
				for (let i = range[0]; i <= range[1]; i++) {
					const line = document.lineAt(i);
					if (line.isEmptyOrWhitespace) {
						numberOfConsequtiveEmptyLines++;
						if (numberOfConsequtiveEmptyLines > config.allowedNumberOfEmptyLines) {
							edit.delete(line.rangeIncludingLineBreak);
						}
					} else {
						numberOfConsequtiveEmptyLines = 0;
					}
				}
			});
		});
	}
	function findUpClosestNonEmptyLine(line: number, document: vscode.TextDocument) {
		for (let i = line; i > 0; i--) {
			const line = document.lineAt(i);
			if (line.isEmptyOrWhitespace) { continue; }
			return i;
		}
		return 0;
	}
	function findDownClosestNonEmptyLine(line: number, document: vscode.TextDocument) {
		for (let i = line; i < document.lineCount; i++) {
			const line = document.lineAt(i);
			if (line.isEmptyOrWhitespace) { continue; }
			return i;
		}
		return document.lineCount - 1;
	}

	const removeEmptyLinesInDocument = commands.registerTextEditorCommand(`${extName}.inDocument`, removeEmptyLines.bind(null, false));
	const removeEmptyLinesInSelection = commands.registerTextEditorCommand(`${extName}.inSelection`, removeEmptyLines.bind(null, true));
	ctx.subscriptions.push(removeEmptyLinesInDocument, removeEmptyLinesInSelection);
}

export function deactivate() { }