import { Range, TextEditor, window, workspace } from 'vscode';

export function getActiveEditorText() {
	if (!window.activeTextEditor) {
		console.error('❌ No active text editor');
	}
	return window.activeTextEditor?.document.getText();
}

export async function openInUntitled(content: string, language?: string) {
	const document = await workspace.openTextDocument({
		language,
		content,
	});
	return window.showTextDocument(document);
}

export async function replaceActiveEditorDocumentContent(editor: TextEditor, content: string) {
	const success = await editor.edit(builder => {
		const entireDocumentRange = editor.document.validateRange(new Range(0, 0, editor.document.lineCount, 0));
		builder.replace(entireDocumentRange, content);
	});
}

const delay = async (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

export const waitForEdit = delay.bind(null, 100);
