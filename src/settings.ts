import { App, PluginSettingTab, Setting } from "obsidian";
import type DailyOrganizerPlugin from "./main";

export type LLMProvider = 'claude' | 'openai';
export type InsertPosition = 'top' | 'bottom';

export interface DailyOrganizerSettings {
	// LLM Settings
	llmProvider: LLMProvider;
	claudeApiKey: string;
	openaiApiKey: string;
	claudeModel: string;
	openaiModel: string;

	// Daily Notes Settings
	dailyNotesFolder: string;

	// Todo Migration Settings
	todoMigrationEnabled: boolean;
	todoSectionTag: string;

	// Project Updates Settings
	projectTag: string;
	projectUpdateTag: string;
	projectAutoUpdateEnabled: boolean;
	projectUpdatePosition: InsertPosition;
	autoUpdateProjectKeywords: boolean;

	// Task Completion Date Settings
	completionDateEnabled: boolean;
	completionDateField: string;

	// Task Created Date Settings
	createdDateEnabled: boolean;
	createdDateField: string;

	// Task Tagging Settings
	taskTaggingEnabled: boolean;
}

export const DEFAULT_SETTINGS: DailyOrganizerSettings = {
	// LLM Settings
	llmProvider: 'claude',
	claudeApiKey: '',
	openaiApiKey: '',
	claudeModel: 'claude-opus-4-20250514',
	openaiModel: 'gpt-4',

	// Daily Notes Settings
	dailyNotesFolder: '',

	// Todo Migration Settings
	todoMigrationEnabled: true,
	todoSectionTag: '#todos',

	// Project Updates Settings
	projectTag: '#project',
	projectUpdateTag: '#daily-updates',
	projectAutoUpdateEnabled: false,
	projectUpdatePosition: 'top',
	autoUpdateProjectKeywords: false,

	// Task Completion Date Settings
	completionDateEnabled: false,
	completionDateField: 'completion',

	// Task Created Date Settings
	createdDateEnabled: false,
	createdDateField: 'created',

	// Task Tagging Settings
	taskTaggingEnabled: true,
};

export class DailyOrganizerSettingTab extends PluginSettingTab {
	plugin: DailyOrganizerPlugin;

	constructor(app: App, plugin: DailyOrganizerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// LLM Configuration Section
		containerEl.createEl('h2', { text: 'LLM Configuration' });

		new Setting(containerEl)
			.setName('LLM Provider')
			.setDesc('Select which LLM provider to use for project analysis')
			.addDropdown(dropdown => dropdown
				.addOption('claude', 'Claude (Anthropic)')
				.addOption('openai', 'OpenAI (ChatGPT)')
				.setValue(this.plugin.settings.llmProvider)
				.onChange(async (value: LLMProvider) => {
					this.plugin.settings.llmProvider = value;
					await this.plugin.saveSettings();
					this.display(); // Refresh to show relevant API key field
				}));

		if (this.plugin.settings.llmProvider === 'claude') {
			new Setting(containerEl)
				.setName('Claude API Key')
				.setDesc('Your Anthropic API key for Claude')
				.addText(text => text
					.setPlaceholder('sk-ant-...')
					.setValue(this.plugin.settings.claudeApiKey)
					.onChange(async (value) => {
						this.plugin.settings.claudeApiKey = value;
						await this.plugin.saveSettings();
					}));

			new Setting(containerEl)
				.setName('Claude Model')
				.setDesc('The Claude model to use')
				.addDropdown(dropdown => dropdown
					.addOption('claude-opus-4-20250514', 'Claude Opus 4')
					.addOption('claude-sonnet-4-20250514', 'Claude Sonnet 4')
					.addOption('claude-3-5-haiku-20241022', 'Claude 3.5 Haiku')
					.setValue(this.plugin.settings.claudeModel)
					.onChange(async (value) => {
						this.plugin.settings.claudeModel = value;
						await this.plugin.saveSettings();
					}));
		} else {
			new Setting(containerEl)
				.setName('OpenAI API Key')
				.setDesc('Your OpenAI API key')
				.addText(text => text
					.setPlaceholder('sk-...')
					.setValue(this.plugin.settings.openaiApiKey)
					.onChange(async (value) => {
						this.plugin.settings.openaiApiKey = value;
						await this.plugin.saveSettings();
					}));

			new Setting(containerEl)
				.setName('OpenAI Model')
				.setDesc('The OpenAI model to use')
				.addDropdown(dropdown => dropdown
					.addOption('gpt-4', 'GPT-4')
					.addOption('gpt-4-turbo', 'GPT-4 Turbo')
					.addOption('gpt-3.5-turbo', 'GPT-3.5 Turbo')
					.setValue(this.plugin.settings.openaiModel)
					.onChange(async (value) => {
						this.plugin.settings.openaiModel = value;
						await this.plugin.saveSettings();
					}));
		}

		// Daily Notes Section
		containerEl.createEl('h2', { text: 'Daily Notes' });

		new Setting(containerEl)
			.setName('Daily Notes Folder')
			.setDesc('Folder where daily notes are stored (leave empty for vault root)')
			.addText(text => text
				.setPlaceholder('Daily Notes')
				.setValue(this.plugin.settings.dailyNotesFolder)
				.onChange(async (value) => {
					this.plugin.settings.dailyNotesFolder = value;
					await this.plugin.saveSettings();
				}));

		// Todo Migration Section
		containerEl.createEl('h2', { text: 'Todo Migration' });

		new Setting(containerEl)
			.setName('Enable Auto Migration')
			.setDesc('Automatically migrate uncompleted todos when a new daily note is created')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.todoMigrationEnabled)
				.onChange(async (value) => {
					this.plugin.settings.todoMigrationEnabled = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Todo Section Tag')
			.setDesc('Tag used to identify the todos section in daily notes')
			.addText(text => text
				.setPlaceholder('#todos')
				.setValue(this.plugin.settings.todoSectionTag)
				.onChange(async (value) => {
					this.plugin.settings.todoSectionTag = value;
					await this.plugin.saveSettings();
				}));

		// Project Updates Section
		containerEl.createEl('h2', { text: 'Project Updates' });

		new Setting(containerEl)
			.setName('Project Tag')
			.setDesc('Tag used to identify project pages')
			.addText(text => text
				.setPlaceholder('#project')
				.setValue(this.plugin.settings.projectTag)
				.onChange(async (value) => {
					this.plugin.settings.projectTag = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Project Update Tag')
			.setDesc('Tag that marks where daily updates will be inserted')
			.addText(text => text
				.setPlaceholder('#daily-updates')
				.setValue(this.plugin.settings.projectUpdateTag)
				.onChange(async (value) => {
					this.plugin.settings.projectUpdateTag = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Update Insert Position')
			.setDesc('Where to insert new updates in the section')
			.addDropdown(dropdown => dropdown
				.addOption('top', 'Top (newest first)')
				.addOption('bottom', 'Bottom (oldest first)')
				.setValue(this.plugin.settings.projectUpdatePosition)
				.onChange(async (value: InsertPosition) => {
					this.plugin.settings.projectUpdatePosition = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Auto-update Projects')
			.setDesc('Automatically update project pages when a new daily note is created (analyzes previous daily note)')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.projectAutoUpdateEnabled)
				.onChange(async (value) => {
					this.plugin.settings.projectAutoUpdateEnabled = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Auto-update Project Keywords')
			.setDesc('Automatically regenerate project keywords (using LLM) when updating project pages')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoUpdateProjectKeywords)
				.onChange(async (value) => {
					this.plugin.settings.autoUpdateProjectKeywords = value;
					await this.plugin.saveSettings();
				}));

		// Task Metadata Section
		containerEl.createEl('h2', { text: 'Task Metadata' });

		new Setting(containerEl)
			.setName('Enable Created Date')
			.setDesc('Add a dataview-compliant created date when a new task checkbox is created')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.createdDateEnabled)
				.onChange(async (value) => {
					this.plugin.settings.createdDateEnabled = value;
					await this.plugin.saveSettings();
					this.display();
				}));

		if (this.plugin.settings.createdDateEnabled) {
			new Setting(containerEl)
				.setName('Created Date Field')
				.setDesc('The dataview field name to use (e.g., "created" creates [created:: YYYY-MM-DD])')
				.addText(text => text
					.setPlaceholder('created')
					.setValue(this.plugin.settings.createdDateField)
					.onChange(async (value) => {
						this.plugin.settings.createdDateField = value || 'created';
						await this.plugin.saveSettings();
					}));
		}

		new Setting(containerEl)
			.setName('Enable Completion Date')
			.setDesc('Add a dataview-compliant completion date when tasks are checked, remove when unchecked')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.completionDateEnabled)
				.onChange(async (value) => {
					this.plugin.settings.completionDateEnabled = value;
					await this.plugin.saveSettings();
					this.display();
				}));

		if (this.plugin.settings.completionDateEnabled) {
			new Setting(containerEl)
				.setName('Completion Date Field')
				.setDesc('The dataview field name to use (e.g., "completion" creates [completion:: YYYY-MM-DD])')
				.addText(text => text
					.setPlaceholder('completion')
					.setValue(this.plugin.settings.completionDateField)
					.onChange(async (value) => {
						this.plugin.settings.completionDateField = value || 'completion';
						await this.plugin.saveSettings();
					}));
		}

		// Task Tagging Section
		containerEl.createEl('h2', { text: 'Task Tagging' });

		new Setting(containerEl)
			.setName('Enable Task Tagging')
			.setDesc('Allow tagging tasks with project-based tags using the "Tag tasks" command')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.taskTaggingEnabled)
				.onChange(async (value) => {
					this.plugin.settings.taskTaggingEnabled = value;
					await this.plugin.saveSettings();
				}));
	}
}
