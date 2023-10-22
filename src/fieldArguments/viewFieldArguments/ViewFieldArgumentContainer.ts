import { AbstractFieldArgumentContainer } from '../AbstractFieldArgumentContainer';
import { type ViewFieldArgumentConfig, type ViewFieldArgumentType, type ViewFieldType } from '../../parsers/viewFieldParser/ViewFieldConfigs';
import { type ViewFieldArgumentMapType } from './ViewFieldArgumentFactory';

export class ViewFieldArgumentContainer extends AbstractFieldArgumentContainer<ViewFieldType, ViewFieldArgumentType, ViewFieldArgumentConfig> {
	getAll<T extends ViewFieldArgumentType>(name: T): NonNullable<ViewFieldArgumentMapType<T>>[] {
		// @ts-ignore
		return super.getAll(name);
	}

	get<T extends ViewFieldArgumentType>(name: T): ViewFieldArgumentMapType<T> | undefined {
		return this.getAll(name).at(0);
	}
}
