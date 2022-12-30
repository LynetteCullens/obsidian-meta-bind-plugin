import { EnclosingPair, ParserUtils } from '../utils/ParserUtils';
import { isTruthy } from '../utils/Utils';
import { InputFieldArgumentFactory } from '../inputFieldArguments/InputFieldArgumentFactory';
import { InputFieldArgumentContainer } from '../inputFieldArguments/InputFieldArgumentContainer';
import { MetaBindParsingError } from '../utils/MetaBindErrors';
import { AbstractInputFieldArgument } from 'src/inputFieldArguments/AbstractInputFieldArgument';

export enum InputFieldType {
	TOGGLE = 'toggle',
	SLIDER = 'slider',
	TEXT = 'text',
	TEXT_AREA = 'text_area',
	SELECT = 'select',
	MULTI_SELECT = 'multi_select',
	DATE = 'date',
	TIME = 'time',
	DATE_PICKER = 'date_picker',
	NUMBER = 'number',
	SUGGESTER = 'suggester',
	EDITOR = 'editor',
	IMAGE_SUGGESTER = 'imageSuggester',

	INVALID = 'invalid',
}

export enum InputFieldArgumentType {
	CLASS = 'class',
	ADD_LABELS = 'addLabels',
	MIN_VALUE = 'minValue',
	MAX_VALUE = 'maxValue',
	OPTION = 'option',
	TITLE = 'title',
	ALIGN_RIGHT = 'alignRight',
	OPTION_QUERY = 'optionQuery',
	SHOWCASE = 'showcase',

	INVALID = 'invalid',
}

export interface InputFieldDeclaration {
	/**
	 * The full declaration of the input field including the "INPUT[]".
	 * e.g.
	 * INPUT[input_type(argument_name(value)):bind_target]
	 */
	fullDeclaration: string;
	/**
	 * Trimmed declaration of the input field including without the "INPUT[]".
	 * e.g.
	 * input_type(argument_name(value)):bind_target
	 */
	declaration: string;
	/**
	 * The type of the input field.
	 * e.g.
	 * input_type
	 */
	inputFieldType: InputFieldType;
	/**
	 * Whether the input field is bound.
	 * e.g.
	 * true
	 */
	isBound: boolean;
	/**
	 * The frontmatter field the input field is bound to.
	 * e.g.
	 * bind_target
	 */
	bindTarget: string;
	/**
	 * A collection of the input field arguments.
	 */
	argumentContainer: InputFieldArgumentContainer;

	error?: Error | string;
}

export interface Template {
	identifier: string;
	template: InputFieldDeclaration;
}

export class InputFieldDeclarationParser {
	static roundBracesPair: EnclosingPair = new EnclosingPair('(', ')');
	static squareBracesPair: EnclosingPair = new EnclosingPair('[', ']');
	static curlyBracesPair: EnclosingPair = new EnclosingPair('{', '}');
	static allBracesPairs: EnclosingPair[] = [
		InputFieldDeclarationParser.roundBracesPair,
		InputFieldDeclarationParser.squareBracesPair,
		InputFieldDeclarationParser.curlyBracesPair,
	];

	static templates: Template[] = [];

	static parseDeclaration(
		fullDeclaration: InputFieldDeclaration,
		inputFieldArguments: Record<InputFieldArgumentType, string> | {} | undefined | null = undefined,
		templateName: string | undefined | null = undefined
	): InputFieldDeclaration {
		// field type check
		fullDeclaration.inputFieldType = InputFieldDeclarationParser.getInputFieldType(fullDeclaration.inputFieldType);

		try {
			// template check:
			let useTemplate: boolean = isTruthy(templateName);
			if (useTemplate) {
				InputFieldDeclarationParser.applyTemplate(fullDeclaration, templateName);
			}

			if (fullDeclaration.inputFieldType === InputFieldType.INVALID) {
				throw new MetaBindParsingError(`unknown input field type`);
			}

			// arguments check:
			fullDeclaration.argumentContainer = new InputFieldArgumentContainer();
			if (inputFieldArguments) {
				for (const inputFieldArgumentIdentifier in Object.keys(inputFieldArguments)) {
					const inputFieldArgument: AbstractInputFieldArgument = InputFieldArgumentFactory.createInputFieldArgument(inputFieldArgumentIdentifier);

					if (!inputFieldArgument.isAllowed(fullDeclaration.inputFieldType)) {
						throw new MetaBindParsingError(
							`argument \'${inputFieldArgumentIdentifier}\' is only applicable to ${inputFieldArgument.getAllowedInputFieldsAsString()} input fields`
						);
					}

					if (inputFieldArgument.requiresValue) {
						inputFieldArgument.parseValue((inputFieldArguments as Record<InputFieldArgumentType, string>)[inputFieldArgumentIdentifier as InputFieldArgumentType]);
					}

					fullDeclaration.argumentContainer.add(inputFieldArgument);
				}

				fullDeclaration.argumentContainer.validate();
			}
		} catch (e) {
			if (e instanceof Error) {
				fullDeclaration.error = e;
				console.warn(e);
			}
		}

		return fullDeclaration;
	}

	static parseString(fullDeclaration: string): InputFieldDeclaration {
		let inputFieldDeclaration: InputFieldDeclaration = {} as InputFieldDeclaration;

		try {
			let useTemplate = false;
			let templateName = '';

			// declaration
			inputFieldDeclaration.fullDeclaration = fullDeclaration;
			const temp = ParserUtils.getInBetween(fullDeclaration, InputFieldDeclarationParser.squareBracesPair);
			if (Array.isArray(temp)) {
				if (temp.length === 2) {
					useTemplate = true;
					templateName = temp[0];
					inputFieldDeclaration.declaration = temp[1];
				} else {
					throw new MetaBindParsingError('invalid input field declaration');
				}
			} else {
				inputFieldDeclaration.declaration = temp;
			}

			// declaration parts
			const declarationParts: string[] = ParserUtils.split(inputFieldDeclaration.declaration, ':', InputFieldDeclarationParser.squareBracesPair);

			// bind target
			inputFieldDeclaration.bindTarget = declarationParts[1] ?? '';
			inputFieldDeclaration.isBound = isTruthy(inputFieldDeclaration.bindTarget);

			// input field type and arguments
			const inputFieldTypeWithArguments: string = declarationParts[0];
			if (inputFieldTypeWithArguments) {
				// input field type
				const inputFieldTypeString = ParserUtils.removeInBetween(inputFieldTypeWithArguments, InputFieldDeclarationParser.roundBracesPair);
				inputFieldDeclaration.inputFieldType = InputFieldDeclarationParser.getInputFieldType(inputFieldTypeString);

				// arguments
				const inputFieldArgumentsString: string = ParserUtils.getInBetween(inputFieldTypeWithArguments, InputFieldDeclarationParser.roundBracesPair) as string;
				// console.log(inputFieldArgumentsString);
				if (inputFieldArgumentsString) {
					inputFieldDeclaration.argumentContainer = InputFieldDeclarationParser.parseArguments(inputFieldArgumentsString, inputFieldDeclaration.inputFieldType);
				} else {
					inputFieldDeclaration.argumentContainer = new InputFieldArgumentContainer();
				}
			} else {
				inputFieldDeclaration.inputFieldType = InputFieldType.INVALID;
				inputFieldDeclaration.argumentContainer = new InputFieldArgumentContainer();
			}

			if (useTemplate) {
				InputFieldDeclarationParser.applyTemplate(inputFieldDeclaration, templateName);
			}

			if (inputFieldDeclaration.inputFieldType === InputFieldType.INVALID) {
				throw new MetaBindParsingError(`unknown input field type`);
			}
		} catch (e) {
			if (e instanceof Error) {
				inputFieldDeclaration.error = e;
				console.warn(e);
			}
		}

		return inputFieldDeclaration;
	}

	static parseTemplates(templates: string): void {
		InputFieldDeclarationParser.templates = [];

		let templateDeclarations = templates ? ParserUtils.split(templates, '\n', InputFieldDeclarationParser.squareBracesPair) : [];
		templateDeclarations = templateDeclarations.map(x => x.trim()).filter(x => x.length > 0);

		for (const templateDeclaration of templateDeclarations) {
			let templateDeclarationParts: string[] = ParserUtils.split(templateDeclaration, '->', InputFieldDeclarationParser.squareBracesPair);
			templateDeclarationParts = templateDeclarationParts.map(x => x.trim());

			if (templateDeclarationParts.length === 1) {
				throw new MetaBindParsingError('Invalid template syntax');
			} else if (templateDeclarationParts.length === 2) {
				InputFieldDeclarationParser.templates.push({
					identifier: templateDeclarationParts[0],
					template: InputFieldDeclarationParser.parseString(templateDeclarationParts[1]),
				});
			}
		}

		console.log(`meta-bind | InputFieldDeclarationParser >> parsed templates`, InputFieldDeclarationParser.templates);
	}

	static parseArguments(inputFieldArgumentsString: string, inputFieldType: InputFieldType): InputFieldArgumentContainer {
		// console.log('inputFieldArgumentsString', inputFieldArgumentsString);
		let inputFieldArgumentStrings: string[] = ParserUtils.split(inputFieldArgumentsString, ',', InputFieldDeclarationParser.roundBracesPair);
		inputFieldArgumentStrings = inputFieldArgumentStrings.map(x => x.trim());

		const inputFieldArgumentContainer: InputFieldArgumentContainer = new InputFieldArgumentContainer();

		for (const inputFieldArgumentString of inputFieldArgumentStrings) {
			const inputFieldArgumentIdentifier: string = InputFieldDeclarationParser.extractInputFieldArgumentIdentifier(inputFieldArgumentString);
			// console.log(inputFieldArgumentIdentifier);

			const inputFieldArgument = InputFieldArgumentFactory.createInputFieldArgument(inputFieldArgumentIdentifier);

			if (!inputFieldArgument.isAllowed(inputFieldType)) {
				throw new MetaBindParsingError(
					`argument '${inputFieldArgumentIdentifier}' is only applicable to ${inputFieldArgument.getAllowedInputFieldsAsString()} input fields`
				);
			}

			if (inputFieldArgument.requiresValue) {
				inputFieldArgument.parseValue(InputFieldDeclarationParser.extractInputFieldArgumentValue(inputFieldArgumentString));
			}

			inputFieldArgumentContainer.add(inputFieldArgument);
		}

		inputFieldArgumentContainer.validate();

		return inputFieldArgumentContainer;
	}

	static extractInputFieldArgumentIdentifier(argumentString: string): string {
		return ParserUtils.removeInBetween(argumentString, InputFieldDeclarationParser.roundBracesPair);
	}

	static extractInputFieldArgumentValue(argumentString: string): string {
		const argumentName = this.extractInputFieldArgumentIdentifier(argumentString);

		const argumentValue = ParserUtils.getInBetween(argumentString, InputFieldDeclarationParser.roundBracesPair) as string;
		if (!argumentValue) {
			throw new MetaBindParsingError(`argument '${argumentName}' requires a non empty value`);
		}

		return argumentValue;
	}

	static getInputFieldType(str: string): InputFieldType {
		for (const entry of Object.entries(InputFieldType)) {
			if (entry[1] === str) {
				return entry[1];
			}
		}

		return InputFieldType.INVALID;
	}

	static applyTemplate(inputFieldDeclaration: InputFieldDeclaration, templateName: string | null | undefined) {
		if (!templateName) {
			return;
		}

		const template = InputFieldDeclarationParser.templates.find(x => x.identifier === templateName)?.template;
		if (!template) {
			throw new MetaBindParsingError(`unknown template name \'${templateName}\'`);
		}

		inputFieldDeclaration.bindTarget = inputFieldDeclaration.bindTarget || template.bindTarget;
		inputFieldDeclaration.isBound = inputFieldDeclaration.isBound || template.isBound;
		inputFieldDeclaration.inputFieldType =
			(inputFieldDeclaration.inputFieldType === InputFieldType.INVALID ? template.inputFieldType : inputFieldDeclaration.inputFieldType) || template.inputFieldType;
		inputFieldDeclaration.argumentContainer = template.argumentContainer.mergeByOverride(inputFieldDeclaration.argumentContainer);
	}
}
