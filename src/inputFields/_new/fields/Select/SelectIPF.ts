import { NewAbstractInputField } from '../../NewAbstractInputField';
import { isLiteral, type MBLiteral } from '../../../../utils/Utils';
import { type InputFieldMDRC } from '../../../../renderChildren/InputFieldMDRC';
import { type SvelteComponent } from 'svelte';
import SelectComponent from './SelectComponent.svelte';
import { type OptionInputFieldArgument } from '../../../../fieldArguments/inputFieldArguments/arguments/OptionInputFieldArgument';
import { InputFieldArgumentType } from '../../../../parsers/inputFieldParser/InputFieldConfigs';

export class SelectIPF extends NewAbstractInputField<MBLiteral, MBLiteral> {
	options: OptionInputFieldArgument[];

	constructor(renderChild: InputFieldMDRC) {
		super(renderChild);

		this.options = this.renderChild.getArguments(InputFieldArgumentType.OPTION);
	}

	protected filterValue(value: unknown): MBLiteral | undefined {
		return isLiteral(value) ? value : undefined;
	}

	protected getFallbackDefaultValue(): MBLiteral {
		return null;
	}

	protected getSvelteComponent(): typeof SvelteComponent {
		return SelectComponent;
	}

	protected rawMapValue(value: MBLiteral): MBLiteral {
		return value;
	}

	protected rawReverseMapValue(value: MBLiteral): MBLiteral | undefined {
		return value;
	}

	protected getMountArgs(): Record<string, unknown> {
		return {
			options: this.options,
		};
	}
}
