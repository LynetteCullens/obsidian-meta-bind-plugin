import { NewAbstractInputField } from '../../NewAbstractInputField';
import { type InputFieldMDRC } from '../../../renderChildren/InputFieldMDRC';
import { InputFieldArgumentType } from '../../../parsers/inputFieldParser/InputFieldConfigs';
import { optClamp, parseUnknownToFloat } from '../../../utils/Utils';
import { type SvelteComponent } from 'svelte';
import ProgressBarComponent from './ProgressBarComponent.svelte';
import { ErrorLevel, MetaBindArgumentError } from '../../../utils/errors/MetaBindErrors';

export class ProgressBarIPF extends NewAbstractInputField<number, number> {
	minValue: number;
	maxValue: number;
	stepSize: number;

	constructor(renderChild: InputFieldMDRC) {
		super(renderChild);

		this.minValue = this.renderChild.getArgument(InputFieldArgumentType.MIN_VALUE)?.value ?? 0;
		this.maxValue = this.renderChild.getArgument(InputFieldArgumentType.MAX_VALUE)?.value ?? 100;
		this.stepSize = this.renderChild.getArgument(InputFieldArgumentType.STEP_SIZE)?.value ?? 1;

		if (this.minValue >= this.maxValue) {
			throw new MetaBindArgumentError(
				ErrorLevel.ERROR,
				'can not create progress bar input field',
				`minValue (${this.maxValue}) must be less than maxValue (${this.maxValue})`,
			);
		}
	}

	protected filterValue(value: unknown): number | undefined {
		return optClamp(parseUnknownToFloat(value), this.minValue, this.maxValue);
	}

	protected getFallbackDefaultValue(): number {
		return this.minValue;
	}

	protected getSvelteComponent(): typeof SvelteComponent {
		return ProgressBarComponent;
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
		};
	}
}
