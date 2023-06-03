import { AbstractInputField } from './AbstractInputField';
import { SelectInputFieldElement } from './SelectInputFieldElement';
import { mod } from '../utils/Utils';
import { InputFieldArgumentType } from '../parsers/InputFieldDeclarationParser';
import { AbstractInputFieldArgument } from '../inputFieldArguments/AbstractInputFieldArgument';
import { MetaBindInternalError } from '../utils/MetaBindErrors';
import { InputFieldMDRC } from '../renderChildren/InputFieldMDRC';

export class SelectInputField extends AbstractInputField {
	static allowInline: boolean = false;
	elements: SelectInputFieldElement[];
	allowMultiSelect: boolean;
	container: HTMLDivElement | undefined;

	constructor(inputFieldMDRC: InputFieldMDRC) {
		super(inputFieldMDRC);
		this.elements = [];
		this.allowMultiSelect = false;
	}

	getHtmlElement(): HTMLElement {
		if (!this.container) {
			throw new MetaBindInternalError('select input container is undefined');
		}

		return this.container;
	}

	getValue(): string | undefined {
		if (!this.container) {
			return undefined;
		}
		return this.elements.filter(x => x.isActive()).first()?.value ?? '';
	}

	setValue(value: any): void {
		for (const element of this.elements) {
			if (value === element.value) {
				element.setActive(true, false);
			} else {
				element.setActive(false, false);
			}
		}
	}

	isEqualValue(value: any): boolean {
		return this.getValue() == value;
	}

	getDefaultValue(): any {
		return '';
	}

	onChange(): void {
		this.onValueChange(this.getValue());
	}

	render(container: HTMLDivElement): void {
		console.debug(`meta-bind | SelectInputField >> render ${this.renderChild.uuid}`);
		this.container = container;

		const elementArguments: AbstractInputFieldArgument[] = this.renderChild.getArguments(InputFieldArgumentType.OPTION);

		let i = 0;
		for (const elementArgument of elementArguments) {
			const selectInputFieldElement = new SelectInputFieldElement(elementArgument.value, container, i, this, false);

			this.elements.push(selectInputFieldElement);

			selectInputFieldElement.render();

			i += 1;
		}

		this.setValue(this.renderChild.getInitialValue());
	}

	public destroy(): void {}

	disableAllOtherElements(elementId: number): void {
		for (const selectModalElement of this.elements) {
			if (selectModalElement.id !== elementId) {
				selectModalElement.setActive(false, false);
			}
		}
	}

	deHighlightAllOtherElements(elementId: number): void {
		for (const selectModalElement of this.elements) {
			if (selectModalElement.id !== elementId) {
				selectModalElement.setHighlighted(false);
			}
		}
	}

	activateHighlighted(): void {
		for (const selectModalElement of this.elements) {
			if (selectModalElement.isHighlighted()) {
				selectModalElement.setActive(!selectModalElement.isActive());
				if (!this.allowMultiSelect) {
					this.disableAllOtherElements(selectModalElement.id);
				}
			}
		}
	}

	highlightUp(): void {
		for (const selectModalElement of this.elements) {
			if (selectModalElement.isHighlighted()) {
				this.getPreviousSelectModalElement(selectModalElement)?.setHighlighted(true);
				return;
			}
		}

		// nothing is highlighted
		this.elements.at(-1)?.setHighlighted(true);
	}

	highlightDown(): void {
		for (const selectModalElement of this.elements) {
			if (selectModalElement.isHighlighted()) {
				this.getNextSelectModalElement(selectModalElement)?.setHighlighted(true);
				return;
			}
		}

		// nothing is highlighted
		this.elements.at(0)?.setHighlighted(true);
	}

	private getNextSelectModalElement(element: SelectInputFieldElement): SelectInputFieldElement | undefined {
		let nextId = element.id + 1;
		nextId = mod(nextId, this.elements.length);

		return this.elements.filter(x => x.id === nextId).at(0);
	}

	private getPreviousSelectModalElement(element: SelectInputFieldElement): SelectInputFieldElement | undefined {
		let nextId = element.id - 1;
		nextId = mod(nextId, this.elements.length);

		return this.elements.filter(x => x.id === nextId).at(0);
	}
}
