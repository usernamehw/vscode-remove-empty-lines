'use strict';
import { ExtensionContext, commands, window } from 'vscode';

export function activate(ctx: ExtensionContext) {
	const removeEmptyLinesInDocument = commands.registerCommand('remove-empty-lines.inDocument', () => {
		const { activeTextEditor } = window;
		if (!activeTextEditor) {
			return;
		}
		const { document } = activeTextEditor;
		activeTextEditor.edit((edit) => {
			for (let i = document.lineCount - 1; i >= 0; i--) {
				const line = document.lineAt(i);
				if (line.isEmptyOrWhitespace) {
					edit.delete(line.rangeIncludingLineBreak);
				}
			}
		});
	});
	const removeEmptyLinesInSelection = commands.registerCommand('remove-empty-lines.inSelection', () => {
		const { activeTextEditor } = window;
		if (!activeTextEditor) {
			return;
		}
		const { document } = activeTextEditor;
		activeTextEditor.edit((edit) => {
			const { selections } = activeTextEditor;
			if (selections.length === 1 && selections[0].isEmpty) {
				const line = document.lineAt(selections[0].start.line);
				if (line.isEmptyOrWhitespace) {
					edit.delete(line.rangeIncludingLineBreak);
				}
			} else {
				selections.forEach((selection) => {
					for (let i = selection.start.line; i <= selection.end.line; i++) {
						const line = document.lineAt(i);
						if (line.isEmptyOrWhitespace) {
							edit.delete(line.rangeIncludingLineBreak);
						}
					}
				});
			}
		});
	});
	ctx.subscriptions.push(removeEmptyLinesInDocument, removeEmptyLinesInSelection);
}

export function deactivate() { }