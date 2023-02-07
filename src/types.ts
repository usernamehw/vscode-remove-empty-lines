export interface ExtensionConfig {
	allowedNumberOfEmptyLines: number;
	runOnSave: boolean;
	onSaveReason: {
		manual: boolean;
		afterDelay: boolean;
		focusOut: boolean;
	};
}
/**
 * 2 Line numbers? start and end of the range.
 */
export type IRange = [number, number];
