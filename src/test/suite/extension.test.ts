import { assert } from 'chai';
import { before, describe, it } from 'mocha';
import { commands, ConfigurationTarget, Selection, window, workspace } from 'vscode';
import { CommandId } from '../../extension';
import { getActiveEditorText, openInUntitled, replaceActiveEditorDocumentContent, waitForEdit } from './testUtils';

const simplestDocument =
`
one

two
`.trim();
const simplestDocumentSelection = new Selection(0, 0, 2, 0);
// ────────────────────────────────────────────────────────────
const twoEmptyLinesDocument =
`
one


two
`.trim();
const twoEmptyLinesSelection = new Selection(0, 0, 3, 0);
// ────────────────────────────────────────────────────────────
const multipleSelectionsDocument =
`
one

two

three

four
`.trim();
const multipleSelections = [
	new Selection(0, 0, 2, 0),
	new Selection(4, 0, 6, 0),
];
// ────────────────────────────────────────────────────────────

describe('Basic test', () => {
	before(async () => {
		await commands.executeCommand('workbench.action.closeEditorsInGroup');
		await openInUntitled(simplestDocument, 'plaintext');
	});

	it('Remove 1 empty line', async () => {
		window.activeTextEditor!.selection = simplestDocumentSelection;
		await commands.executeCommand(CommandId.inSelection);
		await waitForEdit();
		assert.equal(getActiveEditorText(), 'one\ntwo');
	});
});

describe('Basic test2', () => {
	before(async () => {
		await replaceActiveEditorDocumentContent(window.activeTextEditor!, twoEmptyLinesDocument);
	});

	it('Remove 2 empty lines', async () => {
		window.activeTextEditor!.selection = twoEmptyLinesSelection;
		await commands.executeCommand(CommandId.inSelection);
		await waitForEdit();
		assert.equal(getActiveEditorText(), 'one\ntwo');
	});
});

describe('Multiple selections', () => {
	before(async () => {
		await replaceActiveEditorDocumentContent(window.activeTextEditor!, multipleSelectionsDocument);
	});

	it('Work on multiple selections', async () => {
		window.activeTextEditor!.selections = multipleSelections;
		await commands.executeCommand(CommandId.inSelection);
		await waitForEdit();
		assert.equal(getActiveEditorText(), 'one\ntwo\n\nthree\nfour');
	});
});

describe('Remove all empty lines', () => {
	before(async () => {
		await replaceActiveEditorDocumentContent(window.activeTextEditor!, multipleSelectionsDocument);
	});

	it('Remove in entire document', async () => {
		window.activeTextEditor!.selection = new Selection(0, 0, 0, 0);
		await commands.executeCommand(CommandId.inDocument);
		await waitForEdit();
		assert.equal(getActiveEditorText(), 'one\ntwo\nthree\nfour');
	});
});

describe('Use "remove-empty-lines.allowedNumberOfEmptyLines" setting', () => {
	before(async () => {
		await replaceActiveEditorDocumentContent(window.activeTextEditor!, multipleSelectionsDocument);
	});

	it('Remove in entire document', async () => {
		window.activeTextEditor!.selection = new Selection(0, 0, 0, 0);
		const settings = workspace.getConfiguration('remove-empty-lines');
		await settings.update('allowedNumberOfEmptyLines', 1, ConfigurationTarget.Global);
		await commands.executeCommand(CommandId.inDocument);
		await waitForEdit();
		assert.equal(getActiveEditorText(), 'one\n\ntwo\n\nthree\n\nfour');
		await settings.update('allowedNumberOfEmptyLines', 0, ConfigurationTarget.Global);
	});
});

