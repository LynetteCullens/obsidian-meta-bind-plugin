import { NewAbstractInputField } from '../../NewAbstractInputField';
import { optClamp, parseUnknownToFloat } from '../../../../utils/Utils';
import { type InputFieldMDRC } from '../../../../renderChildren/InputFieldMDRC';
import { type SvelteComponent } from 'svelte';
import SliderComponent from './SliderComponent.svelte';
import { InputFieldArgumentType } from '../../../../parsers/inputFieldParser/InputFieldConfigs';

export class SliderIPF extends NewAbstractInputField<number, number> {
	minValue: number;
	maxValue: number;
	stepSize: number;

	constructor(renderChild: InputFieldMDRC) {
		super(renderChild);

		// FIXME: Check that minvalue < maxvalue.
		this.minValue = this.renderChild.getArgument(InputFieldArgumentType.MIN_VALUE)?.value ?? 0;
		this.maxValue = this.renderChild.getArgument(InputFieldArgumentType.MAX_VALUE)?.value ?? 100;
		this.stepSize = this.renderChild.getArgument(InputFieldArgumentType.STEP_SIZE)?.value ?? 1;
	}

	protected filterValue(value: unknown): number | undefined {
		return optClamp(parseUnknownToFloat(value), this.minValue, this.maxValue);
	}

	protected getFallbackDefaultValue(): number {
		return this.minValue;
	}

	protected getSvelteComponent(): typeof SvelteComponent {
		return SliderComponent;
	}

	protected rawReverseMapValue(value: number): number | undefined {
		return value;
	}

	protected rawMapValue(value: number): number {
		return value;
	}

	protected getMountArgs(): Record<string, unknown> {
		return {
			minValue: this.minValue,
			maxValue: this.maxValue,
			stepSize: this.stepSize,
			addLabels: this.renderChild.getArgument(InputFieldArgumentType.ADD_LABELS)?.value === true,
		};
	}
}
