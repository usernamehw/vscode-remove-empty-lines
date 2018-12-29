'use strict';
import { ExtensionContext, commands, window, workspace, TextEditor, TextDocument } from 'vscode';
// import * as vscode from 'vscode';
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
	function removeEmptyLines(inSelection: boolean): void {
		updateConfig();

		const { activeTextEditor } = window;
		if (!activeTextEditor) {
			return;
		}
		const { document } = activeTextEditor;

		if (inSelection) {
			const { selections } = activeTextEditor;
			if (selections.length === 1 && selections[0].isEmpty) {
				const tempAllowedNumberOfEmptyLines = config.allowedNumberOfEmptyLines;
				config.allowedNumberOfEmptyLines = 0;
				removeEmptyLinesInRange(activeTextEditor, document, [[selections[0].start.line, selections[0].start.line + 1]]);
				config.allowedNumberOfEmptyLines = tempAllowedNumberOfEmptyLines;
			} else {
				const ranges: IRange[] = [];
				selections.forEach((selection) => {
					ranges.push([selection.start.line, selection.end.line]);
				});
				removeEmptyLinesInRange(activeTextEditor, document, ranges);
			}
		} else {
			removeEmptyLinesInRange(activeTextEditor, document, [[0, document.lineCount - 1]]);
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

	const removeEmptyLinesInDocument = commands.registerCommand(`${extName}.inDocument`, () => {
		removeEmptyLines(false);
	});
	const removeEmptyLinesInSelection = commands.registerCommand(`${extName}.inSelection`, () => {
		removeEmptyLines(true);
	});
	ctx.subscriptions.push(removeEmptyLinesInDocument, removeEmptyLinesInSelection);
}

export function deactivate() { }