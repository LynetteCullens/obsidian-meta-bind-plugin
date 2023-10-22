import { type App, Modal } from 'obsidian';
import type MetaBindPlugin from '../../main';
import ExcludedFoldersSettingComponent from './ExcludedFoldersSettingComponent.svelte';
import { ErrorCollection } from '../../utils/errors/ErrorCollection';

export class ExcludedFoldersSettingModal extends Modal {
	private readonly plugin: MetaBindPlugin;
	private component: ExcludedFoldersSettingComponent | undefined;

	constructor(app: App, plugin: MetaBindPlugin) {
		super(app);
		this.plugin = plugin;
	}

	public onOpen(): void {
		this.contentEl.empty();
		if (this.component) {
			this.component.$destroy();
		}

		this.component = new ExcludedFoldersSettingComponent({
			target: this.contentEl,
			props: {
				excludedFolders: this.plugin.settings.excludedFolders.slice(),
				modal: this,
			},
		});
	}

	public onClose(): void {
		this.contentEl.empty();
		if (this.component) {
			this.component.$destroy();
		}
	}

	public save(folders: string[]): ErrorCollection | undefined {
		for (const folder of folders) {
			if (folder === '') {
				const errorCollection = new ErrorCollection('Excluded Folders');

				errorCollection.add(new Error(`Invalid Folder Path '${folder}'. Folder path may not be empty.`));

				return errorCollection;
			}
		}

		this.plugin.settings.excludedFolders = folders;
		this.plugin.saveSettings();

		return undefined;
	}
}
