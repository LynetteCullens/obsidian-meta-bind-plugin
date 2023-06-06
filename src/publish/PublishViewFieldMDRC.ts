import { MarkdownRenderChild } from 'obsidian/publish';
import { PublishAPI } from './PublishAPI';
import { BindTargetDeclaration } from '../parsers/BindTargetParser';
import { ErrorCollection } from '../utils/errors/ErrorCollection';
import { traverseObjectToParentByPath } from '../utils/Utils';
import { ViewFieldDeclaration } from '../parsers/ViewFieldDeclarationParser';
import * as MathJs from 'mathjs';
import { ErrorLevel, MetaBindExpressionError } from '../utils/errors/MetaBindErrors';
import { ViewFieldVariable } from '../renderChildren/ViewFieldMDRC';
import { Signal } from '../utils/Signal';
import { traverseObjectByPath } from '@opd-libs/opd-utils-lib/lib/ObjectTraversalUtils';

export class PublishViewFieldMDRC extends MarkdownRenderChild {
	api: PublishAPI;

	declaration: ViewFieldDeclaration;
	bindTargetDeclaration?: BindTargetDeclaration;
	filePath: string;
	metadata: Record<string, any> | undefined;
	uuid: string;

	expressionStr: string;
	expression?: MathJs.EvalFunction;

	variables: ViewFieldVariable[];

	errorCollection: ErrorCollection;

	constructor(containerEl: HTMLElement, api: PublishAPI, declaration: ViewFieldDeclaration, filePath: string, metadata: Record<string, any> | undefined, uuid: string) {
		super(containerEl);

		this.api = api;
		this.declaration = declaration;
		this.filePath = filePath;
		this.uuid = uuid;
		this.metadata = metadata;
		this.expressionStr = '';
		this.variables = [];

		this.errorCollection = new ErrorCollection(`input field ${uuid}`);
		this.errorCollection.merge(declaration.errorCollection);

		if (this.errorCollection.isEmpty()) {
			try {
				for (const bindTarget of this.declaration.bindTargets ?? []) {
					const parsedBindTarget = this.api.bindTargetParser.parseBindTarget(bindTarget, this.filePath);
					const value = parsedBindTarget.filePath === this.filePath ? traverseObjectByPath(parsedBindTarget.metadataPath, metadata) : undefined;
					this.variables.push({
						bindTargetDeclaration: parsedBindTarget,
						writeSignal: new Signal<any>(value),
						uuid: self.crypto.randomUUID(),
						metadataCache: undefined,
						writeSignalListener: undefined,
						contextName: undefined,
					});
				}

				this.parseExpression();
			} catch (e) {
				this.errorCollection.add(e);
			}
		}

		this.load();
	}

	parseExpression() {
		const declaration = this.declaration.declaration ?? '';
		let varCounter = 0;

		this.expressionStr = declaration.replace(/{.*?}/g, (substring: string): string => {
			// remove braces and leading and trailing spaces
			substring = substring.substring(1, substring.length - 1).trim();
			// replace by variable name;
			for (const variable of this.variables) {
				if (variable.bindTargetDeclaration.metadataFieldName === substring) {
					let varName = `MB_VAR_${varCounter}`;
					variable.contextName = varName;
					varCounter += 1;
					return varName;
				}
			}

			// this should be unreachable
			return 'MB_VAR_NOT_FOUND';
		});

		this.expression = MathJs.compile(this.expressionStr);
	}

	buildContext(): Record<string, any> {
		const context: Record<string, any> = {};
		for (const variable of this.variables ?? []) {
			if (!variable.contextName || !variable.writeSignal) {
				continue;
			}

			context[variable.contextName] = variable.writeSignal.get() ?? '';
		}

		return context;
	}

	async evaluateExpression(): Promise<string> {
		if (!this.expression) {
			throw new MetaBindExpressionError(ErrorLevel.ERROR, 'failed to evaluate expression', 'expression is undefined');
		}

		const context = this.buildContext();
		try {
			return this.expression.evaluate(context);
		} catch (e: any) {
			throw new MetaBindExpressionError(ErrorLevel.ERROR, `failed to evaluate expression`, e, {
				declaration: this.declaration.declaration,
				expression: this.expressionStr,
				context: context,
			});
		}
	}

	async onload(): Promise<void> {
		console.log('meta-bind | InputFieldMarkdownRenderChild >> load', this);

		this.containerEl.addClass('meta-bind-plugin-view');
		this.containerEl.empty();

		this.errorCollection.render(this.containerEl);
		if (this.errorCollection.hasErrors()) {
			return;
		}

		const container: HTMLDivElement = createDiv();
		container.addClass('meta-bind-plugin-view-wrapper');

		const span = container.createEl('span');

		try {
			span.innerText = await this.evaluateExpression();
		} catch (e) {
			if (e instanceof Error) {
				span.innerText = e.message;
				span.addClass('meta-bind-plugin-error');
			}
		}

		this.containerEl.appendChild(container);
	}
}
