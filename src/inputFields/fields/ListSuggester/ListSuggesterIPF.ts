import { NewAbstractInputField } from '../../NewAbstractInputField';
import { type MBLiteral, parseUnknownToLiteralArray } from '../../../utils/Utils';
import { type InputFieldMDRC } from '../../../renderChildren/InputFieldMDRC';
import { type SvelteComponent } from 'svelte';
import ListSuggesterComponent from './ListSuggesterComponent.svelte';
import { openSuggesterModalForInputField } from '../Suggester/SuggesterHelper';

export class ListSuggesterIPF extends NewAbstractInputField<MBLiteral[], MBLiteral[]> {
	constructor(renderChild: InputFieldMDRC) {
		super(renderChild);
	}

	protected filterValue(value: unknown): MBLiteral[] | undefined {
		return parseUnknownToLiteralArray(value);
	}

	protected getFallbackDefaultValue(): MBLiteral[] {
		return [];
	}

	protected getSvelteComponent(): typeof SvelteComponent {
		return ListSuggesterComponent;
	}

	protected rawMapValue(value: MBLiteral[]): MBLiteral[] {
		return value;
	}

	protected rawReverseMapValue(value: MBLiteral[]): MBLiteral[] | undefined {
		return value;
	}

	protected getMountArgs(): Record<string, unknown> {
		return {
			showSuggester: () => this.openModal(),
		};
	}

	openModal(): void {
		openSuggesterModalForInputField(this, selected => {
			const value = this.getInternalValue();
			value.push(selected.value);
			this.setInternalValue(value);
		});
	}
}
