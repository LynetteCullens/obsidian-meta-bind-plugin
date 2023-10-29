import { type OptionInputFieldArgument } from '../../../../fieldArguments/inputFieldArguments/arguments/OptionInputFieldArgument';
import { type OptionQueryInputFieldArgument } from '../../../../fieldArguments/inputFieldArguments/arguments/OptionQueryInputFieldArgument';
import { type MBLiteral } from '../../../../utils/Utils';
import { type DataArray, type DataviewApi, getAPI, type Literal } from 'obsidian-dataview';
import { Notice } from 'obsidian';
import { InputFieldArgumentType } from '../../../../parsers/inputFieldParser/InputFieldConfigs';
import { SuggesterInputModal } from './SuggesterInputModal';
import { type SuggesterIPF } from './SuggesterIPF';
import { ListSuggesterIPF } from '../ListSuggester/ListSuggesterIPF';

export class SuggesterOption<T> {
	value: T;
	displayValue: string;

	constructor(value: T, displayValue: string) {
		this.value = value;
		this.displayValue = displayValue;
	}

	valueAsString(): string {
		return this.value?.toString() ?? 'null';
	}
}

export function getSuggesterOptions(
	dv: DataviewApi | undefined,
	filePath: string,
	optionArgs: OptionInputFieldArgument[],
	optionQueryArgs: OptionQueryInputFieldArgument[],
	useLinks: boolean,
): SuggesterOption<MBLiteral>[] {
	const options: SuggesterOption<MBLiteral>[] = [];

	for (const suggestOptionsArgument of optionArgs) {
		options.push(new SuggesterOption<MBLiteral>(suggestOptionsArgument.value, suggestOptionsArgument.name));
	}

	if (optionQueryArgs.length > 0) {
		if (!dv) {
			new Notice('meta-bind | dataview needs to be installed and enabled to use suggest option queries');
			return options;
		}

		for (const suggestOptionsQueryArgument of optionQueryArgs) {
			const result: DataArray<Record<string, Literal>> = dv.pages(suggestOptionsQueryArgument.value, filePath);

			result.forEach((file: Record<string, Literal>) => {
				try {
					// FIXME: this is unsafe, maybe add validation
					const dvFile = file.file as { name: string; path: string };

					if (useLinks) {
						options.push(new SuggesterOption<MBLiteral>(`[[${dvFile.path}|${dvFile.name}]]`, `file-link: ${dvFile.name}`));
					} else {
						// console.log(tFile);
						options.push(new SuggesterOption<MBLiteral>(dvFile.name, `file: ${dvFile.name}`));
					}
				} catch (e) {
					console.warn('meta-bind | error while computing suggest options', e);
				}
			});
		}
	}

	return options;
}

export function getSuggesterOptionsForInputField(inputField: SuggesterIPF | ListSuggesterIPF): SuggesterOption<MBLiteral>[] {
	const app = inputField.renderChild.plugin.app;
	const dv = getAPI(app);
	const optionArgs = inputField.renderChild.getArguments(InputFieldArgumentType.OPTION);
	const optionQueryArgs = inputField.renderChild.getArguments(InputFieldArgumentType.OPTION_QUERY);
	const useLinksArgs = inputField.renderChild.getArgument(InputFieldArgumentType.USE_LINKS);
	// in not present, we treat the use links argument as true
	return getSuggesterOptions(dv, inputField.renderChild.filePath, optionArgs, optionQueryArgs, useLinksArgs === undefined || useLinksArgs.value);
}

export function openSuggesterModalForInputField(
	inputField: SuggesterIPF | ListSuggesterIPF,
	selectCallback: (selected: SuggesterOption<MBLiteral>) => void,
): void {
	new SuggesterInputModal(inputField.renderChild.plugin.app, getSuggesterOptionsForInputField(inputField), selectCallback).open();
}
