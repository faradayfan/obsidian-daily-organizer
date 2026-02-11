/* eslint-disable obsidianmd/ui/sentence-case */
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
	generateKeywordsAsArray: boolean;

	// Task Metadata Processing
	autoProcessMetadataBeforeMigration: boolean;
	autoProcessMetadataOnEdit: boolean;
	autoProcessMetadataDebounceMs: number;

	// Task Completion Date Settings
	completionDateEnabled: boolean;
	completionDateField: string;
	completionDateUseShorthand: boolean;

	// Task Created Date Settings
	createdDateEnabled: boolean;
	createdDateField: string;
	createdDateUseShorthand: boolean;

	// Task Due Date Settings
	dueDateEnabled: boolean;
	dueDateField: string;
	dueDateUseShorthand: boolean;
	dueDateAutoDetect: boolean;
	dueDateRemoveExpression: boolean;

	// Task Priority Settings
	priorityEnabled: boolean;
	priorityField: string;
	priorityUseShorthand: boolean;
	priorityAutoDetect: boolean;
	priorityRemoveExpression: boolean;

	// Task Tagging Settings
	taskTaggingEnabled: boolean;
	autoTagTasksBeforeMigration: boolean;
	autoTagTasksOnEdit: boolean;
	autoTagTasksDebounceMs: number;
	ignoreProjectTaggingTag: string;
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

	// Task Metadata Processing
	autoProcessMetadataBeforeMigration: false,
	autoProcessMetadataOnEdit: false,
	autoProcessMetadataDebounceMs: 5000,

	// Project Updates Settings
	projectTag: '#project',
	projectUpdateTag: '#daily-updates',
	projectAutoUpdateEnabled: false,
	projectUpdatePosition: 'top',
	autoUpdateProjectKeywords: false,
	generateKeywordsAsArray: false,

	// Task Completion Date Settings
	completionDateEnabled: false,
	completionDateField: 'completion',
	completionDateUseShorthand: false,

	// Task Created Date Settings
	createdDateEnabled: false,
	createdDateField: 'created',
	createdDateUseShorthand: false,

	// Task Due Date Settings
	dueDateEnabled: false,
	dueDateField: 'due',
	dueDateUseShorthand: false,
	dueDateAutoDetect: true,
	dueDateRemoveExpression: true,

	// Task Priority Settings
	priorityEnabled: true,
	priorityField: 'priority',
	priorityUseShorthand: true,
	priorityAutoDetect: true,
	priorityRemoveExpression: true,

	// Task Tagging Settings
	taskTaggingEnabled: true,
	autoTagTasksBeforeMigration: false,
	autoTagTasksOnEdit: false,
	autoTagTasksDebounceMs: 5000,
	ignoreProjectTaggingTag: '#ignore-project-tagging',
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
		new Setting(containerEl).setName("LLM Configuration").setHeading();

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
					.addOption('claude-opus-4-6', 'Claude Opus 4.6')
					.addOption('claude-opus-4-5-20251101', 'Claude Opus 4.5')
					.addOption('claude-opus-4-1-20250805', 'Claude Opus 4.1')
					.addOption('claude-opus-4-20250514', 'Claude Opus 4')
					.addOption('claude-haiku-4-5-20251001', 'Claude Haiku 4.5')
					.addOption('claude-sonnet-4-5-20250929', 'Claude Sonnet 4.5')
					.addOption('claude-sonnet-4-20250514', 'Claude Sonnet 4')
					.addOption('claude-3-haiku-20240307', 'Claude Haiku 3')
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
		new Setting(containerEl).setName("Daily Notes").setHeading();

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
		new Setting(containerEl).setName("Todo Migration").setHeading();

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

		new Setting(containerEl)
			.setName('Auto-tag Tasks Before Migration')
			.setDesc('Automatically add project tags to tasks in the previous daily note before migration (runs before metadata processing)')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoTagTasksBeforeMigration)
				.onChange(async (value) => {
					this.plugin.settings.autoTagTasksBeforeMigration = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Auto-process Task Metadata')
			.setDesc('Automatically add metadata (created date, due date, priority) to all tasks before migration')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoProcessMetadataBeforeMigration)
				.onChange(async (value) => {
					this.plugin.settings.autoProcessMetadataBeforeMigration = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Auto-process on Edit')
			.setDesc('Automatically process task metadata after you stop editing (uses debounce delay)')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoProcessMetadataOnEdit)
				.onChange(async (value) => {
					this.plugin.settings.autoProcessMetadataOnEdit = value;
					await this.plugin.saveSettings();
					this.display();
				}));

		if (this.plugin.settings.autoProcessMetadataOnEdit) {
			new Setting(containerEl)
				.setName('Metadata Processing Debounce (ms)')
				.setDesc('Wait time in milliseconds after the last edit before auto-processing (default: 5000 = 5 seconds)')
				.addText(text => text
					.setPlaceholder('5000')
					.setValue(String(this.plugin.settings.autoProcessMetadataDebounceMs))
					.onChange(async (value) => {
						const num = parseInt(value);
						if (!isNaN(num) && num >= 1000) {
							this.plugin.settings.autoProcessMetadataDebounceMs = num;
							await this.plugin.saveSettings();
						}
					}));
		}

		// Project Updates Section
		new Setting(containerEl).setName("Project Updates").setHeading();

		new Setting(containerEl)
			.setName('Project tag prefix')
			.setDesc('Tag prefix for project discovery. Tag project pages with #project/<name> (e.g., #project/my-app).')
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

		new Setting(containerEl)
			.setName('Generate Keywords as Array')
			.setDesc('Save generated keywords as YAML array instead of comma-separated string')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.generateKeywordsAsArray)
				.onChange(async (value) => {
					this.plugin.settings.generateKeywordsAsArray = value;
					await this.plugin.saveSettings();
				}));

		// Task Metadata Section
		new Setting(containerEl).setName("Task Metadata").setHeading();

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

			new Setting(containerEl)
				.setName('Use Shorthand Format')
				.setDesc('Use shorthand emoji format (➕YYYY-MM-DD) instead of inline field format')
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.createdDateUseShorthand)
					.onChange(async (value) => {
						this.plugin.settings.createdDateUseShorthand = value;
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

			new Setting(containerEl)
				.setName('Use Shorthand Format')
				.setDesc('Use shorthand emoji format (✅YYYY-MM-DD) instead of inline field format')
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.completionDateUseShorthand)
					.onChange(async (value) => {
						this.plugin.settings.completionDateUseShorthand = value;
						await this.plugin.saveSettings();
					}));
		}

		new Setting(containerEl)
			.setName('Enable Due Date')
			.setDesc('Add a dataview-compliant due date when tasks are created')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.dueDateEnabled)
				.onChange(async (value) => {
					this.plugin.settings.dueDateEnabled = value;
					await this.plugin.saveSettings();
					this.display();
				}));

		if (this.plugin.settings.dueDateEnabled) {
			new Setting(containerEl)
				.setName('Due Date Field')
				.setDesc('The dataview field name to use (e.g., "due" creates [due:: YYYY-MM-DD])')
				.addText(text => text
					.setPlaceholder('due')
					.setValue(this.plugin.settings.dueDateField)
					.onChange(async (value) => {
						this.plugin.settings.dueDateField = value || 'due';
						await this.plugin.saveSettings();
					}));

			new Setting(containerEl)
				.setName('Use Shorthand Format')
				.setDesc('Use shorthand emoji format (📅YYYY-MM-DD) instead of inline field format')
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.dueDateUseShorthand)
					.onChange(async (value) => {
						this.plugin.settings.dueDateUseShorthand = value;
						await this.plugin.saveSettings();
					}));

			new Setting(containerEl)
				.setName('Auto-detect Due Dates')
				.setDesc('Automatically parse due dates from natural language (e.g., "due tomorrow", "by Jan 15")')
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.dueDateAutoDetect)
					.onChange(async (value) => {
						this.plugin.settings.dueDateAutoDetect = value;
						await this.plugin.saveSettings();
					}));

			new Setting(containerEl)
				.setName('Remove Natural Language Expression')
				.setDesc('Remove the natural language text after parsing (e.g., remove "due tomorrow" from task)')
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.dueDateRemoveExpression)
					.onChange(async (value) => {
						this.plugin.settings.dueDateRemoveExpression = value;
						await this.plugin.saveSettings();
					}));
		}

		new Setting(containerEl)
			.setName('Enable Priority')
			.setDesc('Add a dataview-compliant priority when tasks are created')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.priorityEnabled)
				.onChange(async (value) => {
					this.plugin.settings.priorityEnabled = value;
					await this.plugin.saveSettings();
					this.display();
				}));

		if (this.plugin.settings.priorityEnabled) {
			new Setting(containerEl)
				.setName('Priority Field')
				.setDesc('The dataview field name to use (e.g., "priority" creates [priority:: high])')
				.addText(text => text
					.setPlaceholder('priority')
					.setValue(this.plugin.settings.priorityField)
					.onChange(async (value) => {
						this.plugin.settings.priorityField = value || 'priority';
						await this.plugin.saveSettings();
					}));

			new Setting(containerEl)
				.setName('Use Shorthand Format')
				.setDesc('Use shorthand emoji format (⏫ high, 🔼 medium, 🔽 low, ⏬ lowest) instead of inline field format')
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.priorityUseShorthand)
					.onChange(async (value) => {
						this.plugin.settings.priorityUseShorthand = value;
						await this.plugin.saveSettings();
					}));

			new Setting(containerEl)
				.setName('Auto-detect Priority')
				.setDesc('Automatically parse priority from natural language (e.g., "high priority", "urgent", "low priority")')
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.priorityAutoDetect)
					.onChange(async (value) => {
						this.plugin.settings.priorityAutoDetect = value;
						await this.plugin.saveSettings();
					}));

			new Setting(containerEl)
				.setName('Remove Natural Language Expression')
				.setDesc('Remove the natural language text after parsing (e.g., remove "high priority" from task)')
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.priorityRemoveExpression)
					.onChange(async (value) => {
						this.plugin.settings.priorityRemoveExpression = value;
						await this.plugin.saveSettings();
					}));
		}

		// Task Tagging Section
		new Setting(containerEl).setName("Task Tagging").setHeading();

		new Setting(containerEl)
			.setName('Enable Task Tagging')
			.setDesc('Allow tagging tasks with project-based tags using the "Tag tasks" command')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.taskTaggingEnabled)
				.onChange(async (value) => {
					this.plugin.settings.taskTaggingEnabled = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Auto-tag Tasks on Edit')
			.setDesc('Automatically tag tasks with project tags after you stop editing (uses debounce delay)')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoTagTasksOnEdit)
				.onChange(async (value) => {
					this.plugin.settings.autoTagTasksOnEdit = value;
					await this.plugin.saveSettings();
					this.display();
				}));

		if (this.plugin.settings.autoTagTasksOnEdit) {
			new Setting(containerEl)
				.setName('Task Tagging Debounce (ms)')
				.setDesc('Wait time in milliseconds after the last edit before auto-tagging (default: 5000 = 5 seconds)')
				.addText(text => text
					.setPlaceholder('5000')
					.setValue(String(this.plugin.settings.autoTagTasksDebounceMs))
					.onChange(async (value) => {
						const num = parseInt(value);
						if (!isNaN(num) && num >= 1000) {
							this.plugin.settings.autoTagTasksDebounceMs = num;
							await this.plugin.saveSettings();
						}
					}));
		}

		new Setting(containerEl)
			.setName('Ignore Project Tagging Tag')
			.setDesc('Section headers containing this tag will be excluded from project tagging')
			.addText(text => text
				.setPlaceholder('#ignore-project-tagging')
				.setValue(this.plugin.settings.ignoreProjectTaggingTag)
				.onChange(async (value) => {
					this.plugin.settings.ignoreProjectTaggingTag = value;
					await this.plugin.saveSettings();
				}));
	}
}
