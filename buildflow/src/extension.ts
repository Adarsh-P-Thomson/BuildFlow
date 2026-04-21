import * as vscode from "vscode";
import { BuildflowData, Category, GameplanStep, Project, Task } from "./model/types";
import { BuildflowStore } from "./storage/store";
import { BuildflowTreeItem, BuildflowTreeProvider } from "./ui/treeProvider";

function createId(prefix: string): string {
	return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function pickProject(data: BuildflowData): Promise<Project | undefined> {
	if (data.projects.length === 0) {
		vscode.window.showWarningMessage("Create a project first.");
		return undefined;
	}

	const selected = await vscode.window.showQuickPick(
		data.projects.map((project) => ({ label: project.name, project })),
		{ title: "Select Project" }
	);

	return selected?.project;
}

function findProjectById(data: BuildflowData, projectId: string): Project | undefined {
	return data.projects.find((project) => project.id === projectId);
}

function findCategoryRef(data: BuildflowData, categoryId: string):
	| { project: Project; category: Category; categoryIndex: number }
	| undefined {
	for (const project of data.projects) {
		const categoryIndex = project.categories.findIndex((category) => category.id === categoryId);
		if (categoryIndex >= 0) {
			return {
				project,
				category: project.categories[categoryIndex],
				categoryIndex
			};
		}
	}

	return undefined;
}

function findTaskRef(data: BuildflowData, taskId: string):
	| { category: Category; task: Task; taskIndex: number }
	| undefined {
	for (const project of data.projects) {
		for (const category of project.categories) {
			const taskIndex = category.tasks.findIndex((task) => task.id === taskId);
			if (taskIndex >= 0) {
				return {
					category,
					task: category.tasks[taskIndex],
					taskIndex
				};
			}
		}
	}

	return undefined;
}

function findStepRef(data: BuildflowData, stepId: string):
	| { task: Task; step: GameplanStep; stepIndex: number }
	| undefined {
	for (const project of data.projects) {
		for (const category of project.categories) {
			for (const task of category.tasks) {
				const stepIndex = task.gameplan.findIndex((step) => step.id === stepId);
				if (stepIndex >= 0) {
					return {
						task,
						step: task.gameplan[stepIndex],
						stepIndex
					};
				}
			}
		}
	}

	return undefined;
}

async function pickCategory(data: BuildflowData): Promise<Category | undefined> {
	const project = await pickProject(data);
	if (!project) {
		return undefined;
	}

	if (project.categories.length === 0) {
		vscode.window.showWarningMessage("Add a category to the project first.");
		return undefined;
	}

	const selected = await vscode.window.showQuickPick(
		project.categories.map((category) => ({ label: `${project.name} / ${category.name}`, category })),
		{ title: "Select Category" }
	);

	return selected?.category;
}

async function pickTask(data: BuildflowData): Promise<Task | undefined> {
	const category = await pickCategory(data);
	if (!category) {
		return undefined;
	}

	if (category.tasks.length === 0) {
		vscode.window.showWarningMessage("Add a task to the category first.");
		return undefined;
	}

	const selected = await vscode.window.showQuickPick(
		category.tasks.map((task) => ({ label: task.title, task })),
		{ title: "Select Task" }
	);

	return selected?.task;
}

async function pickStep(data: BuildflowData): Promise<GameplanStep | undefined> {
	const task = await pickTask(data);
	if (!task) {
		return undefined;
	}

	if (task.gameplan.length === 0) {
		vscode.window.showWarningMessage("Add a gameplan step to the task first.");
		return undefined;
	}

	const selected = await vscode.window.showQuickPick(
		task.gameplan.map((step) => ({
			label: `${step.completed ? "$(pass)" : "$(circle-outline)"} ${step.text}`,
			step
		})),
		{ title: "Select Gameplan Step" }
	);

	return selected?.step;
}

async function pickFileUri(): Promise<vscode.Uri | undefined> {
	const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
	if (!workspaceFolder) {
		vscode.window.showWarningMessage("Open a workspace folder to attach files.");
		return undefined;
	}

	const files = await vscode.workspace.findFiles(
		"**/*",
		"**/{node_modules,.git,.vscode-test,dist,out}/**"
	);

	if (files.length === 0) {
		vscode.window.showWarningMessage("No files found in the current workspace.");
		return undefined;
	}

	const activeFileUri = vscode.window.activeTextEditor?.document.uri;
	const sortedFiles = [...files];
	if (activeFileUri && activeFileUri.scheme === "file") {
		const activeIndex = sortedFiles.findIndex((uri) => uri.toString() === activeFileUri.toString());
		if (activeIndex > 0) {
			const [active] = sortedFiles.splice(activeIndex, 1);
			sortedFiles.unshift(active);
		}
	}

	const selected = await vscode.window.showQuickPick(
		sortedFiles.map((uri, index) => ({
			label: vscode.workspace.asRelativePath(uri, false),
			description: index === 0 && activeFileUri && uri.toString() === activeFileUri.toString() ? "current file" : "",
			uri
		})),
		{
			title: "Attach Workspace File",
			matchOnDescription: true,
			placeHolder: "Type to filter files from your workspace"
		}
	);

	return selected?.uri;
}

function extractTodoLikeSteps(fileText: string): string[] {
	const lines = fileText.split(/\r?\n/);
	const extracted: string[] = [];
	const unique = new Set<string>();
	const markerPattern = /\b(?:todo|fixme|fix me)\b[:\-\s]*(.*)$/i;

	for (const line of lines) {
		const match = line.match(markerPattern);
		if (!match) {
			continue;
		}

		const body = match[1]?.trim();
		const stepText = body && body.length > 0 ? body : line.trim();
		const key = stepText.toLowerCase();
		if (!unique.has(key)) {
			unique.add(key);
			extracted.push(stepText);
		}
	}

	return extracted;
}

function nextTaskStatus(status: Task["status"]): Task["status"] {
	if (status === "TODO") {
		return "IN_PROGRESS";
	}
	if (status === "IN_PROGRESS") {
		return "DONE";
	}
	return "TODO";
}

function statusFromSteps(task: Task): Task["status"] {
	if (task.gameplan.length === 0) {
		return task.status;
	}

	const completed = task.gameplan.filter((step) => step.completed).length;
	if (completed === 0) {
		return "TODO";
	}
	if (completed === task.gameplan.length) {
		return "DONE";
	}
	return "IN_PROGRESS";
}

async function openUriInEditor(rawUri: string): Promise<void> {
	const uri = vscode.Uri.parse(rawUri);
	const document = await vscode.workspace.openTextDocument(uri);
	await vscode.window.showTextDocument(document, { preview: false });
}

async function pickTaskPriority(current?: Task["priority"]): Promise<Task["priority"] | undefined> {
	const selected = await vscode.window.showQuickPick(
		[
			{ label: "CRITICAL", value: "CRITICAL" as const },
			{ label: "HIGH", value: "HIGH" as const },
			{ label: "NORMAL", value: "NORMAL" as const }
		],
		{
			title: "Select Priority",
			placeHolder: current ?? "NORMAL"
		}
	);

	return selected?.value;
}

async function pickTaskStatus(current?: Task["status"]): Promise<Task["status"] | undefined> {
	const selected = await vscode.window.showQuickPick(
		[
			{ label: "TODO", value: "TODO" as const },
			{ label: "IN_PROGRESS", value: "IN_PROGRESS" as const },
			{ label: "DONE", value: "DONE" as const }
		],
		{
			title: "Select Status",
			placeHolder: current ?? "TODO"
		}
	);

	return selected?.value;
}

export function activate(context: vscode.ExtensionContext) {
	const store = new BuildflowStore();
	const treeProvider = new BuildflowTreeProvider(store);

	const treeView = vscode.window.createTreeView("buildflow.sidebar", {
		treeDataProvider: treeProvider,
		showCollapseAll: true
	});

	const checkboxChangeDisposable = treeView.onDidChangeCheckboxState(async (event) => {
		const data = await store.load();
		let changed = false;

		for (const [item, checkboxState] of event.items) {
			if (item.node.kind === "task") {
				const taskRef = findTaskRef(data, item.node.task.id);
				if (!taskRef) {
					continue;
				}

				const checked = checkboxState === vscode.TreeItemCheckboxState.Checked;
				taskRef.task.status = checked ? "DONE" : "TODO";
				if (taskRef.task.gameplan.length > 0) {
					for (const step of taskRef.task.gameplan) {
						step.completed = checked;
					}
				}
				changed = true;
				continue;
			}

			if (item.node.kind === "step") {
				const stepRef = findStepRef(data, item.node.step.id);
				if (!stepRef) {
					continue;
				}

				stepRef.step.completed = checkboxState === vscode.TreeItemCheckboxState.Checked;
				stepRef.task.status = statusFromSteps(stepRef.task);
				changed = true;
			}
		}

		if (changed) {
			await store.save(data);
			treeProvider.refresh();
		}
	});

	const refreshCommand = vscode.commands.registerCommand("buildflow.refresh", () => {
		treeProvider.refresh();
	});

	const createProjectCommand = vscode.commands.registerCommand("buildflow.createProject", async () => {
		const name = await vscode.window.showInputBox({
			title: "BuildFlow: Create Project",
			prompt: "Project name",
			ignoreFocusOut: true,
			validateInput: (value) => (value.trim().length === 0 ? "Project name is required." : undefined)
		});

		if (!name) {
			return;
		}

		const data = await store.load();
		data.projects.push({
			id: createId("project"),
			name: name.trim(),
			categories: []
		});
		await store.save(data);
		treeProvider.refresh();
	});

	const renameProjectCommand = vscode.commands.registerCommand(
		"buildflow.renameProject",
		async (item?: BuildflowTreeItem) => {
			const data = await store.load();
			const selectedNode = item?.node;
			let project: Project | undefined;

			if (selectedNode?.kind === "project") {
				project = findProjectById(data, selectedNode.project.id);
			} else {
				project = await pickProject(data);
			}

			if (!project) {
				return;
			}

			const updatedName = await vscode.window.showInputBox({
				title: "BuildFlow: Rename Project",
				prompt: "Project name",
				value: project.name,
				ignoreFocusOut: true,
				validateInput: (value) => (value.trim().length === 0 ? "Project name is required." : undefined)
			});

			if (!updatedName) {
				return;
			}

			project.name = updatedName.trim();
			await store.save(data);
			treeProvider.refresh();
		}
	);

	const deleteProjectCommand = vscode.commands.registerCommand(
		"buildflow.deleteProject",
		async (item?: BuildflowTreeItem) => {
			const data = await store.load();
			const selectedNode = item?.node;
			let project: Project | undefined;

			if (selectedNode?.kind === "project") {
				project = findProjectById(data, selectedNode.project.id);
			} else {
				project = await pickProject(data);
			}

			if (!project) {
				return;
			}

			const decision = await vscode.window.showWarningMessage(
				`Delete project "${project.name}" and all its categories/tasks?`,
				{ modal: true },
				"Delete"
			);

			if (decision !== "Delete") {
				return;
			}

			data.projects = data.projects.filter((candidate) => candidate.id !== project.id);
			await store.save(data);
			treeProvider.refresh();
		}
	);

	const addCategoryCommand = vscode.commands.registerCommand(
		"buildflow.addCategory",
		async (item?: BuildflowTreeItem) => {
			const name = await vscode.window.showInputBox({
				title: "BuildFlow: Add Category",
				prompt: "Category name",
				ignoreFocusOut: true,
				validateInput: (value) => (value.trim().length === 0 ? "Category name is required." : undefined)
			});

			if (!name) {
				return;
			}

			const data = await store.load();
			let project: Project | undefined;
			const selectedNode = item?.node;
			if (selectedNode?.kind === "project") {
				project = data.projects.find((candidate) => candidate.id === selectedNode.project.id);
			} else {
				project = await pickProject(data);
			}

			if (!project) {
				return;
			}

			project.categories.push({
				id: createId("category"),
				name: name.trim(),
				tasks: []
			});
			await store.save(data);
			treeProvider.refresh();
		}
	);

	const removeCategoryCommand = vscode.commands.registerCommand(
		"buildflow.removeCategory",
		async (item?: BuildflowTreeItem) => {
			const data = await store.load();
			const selectedNode = item?.node;
			let categoryRef: { project: Project; category: Category; categoryIndex: number } | undefined;

			if (selectedNode?.kind === "category") {
				categoryRef = findCategoryRef(data, selectedNode.category.id);
			} else {
				const category = await pickCategory(data);
				categoryRef = category ? findCategoryRef(data, category.id) : undefined;
			}

			if (!categoryRef) {
				return;
			}

			const decision = await vscode.window.showWarningMessage(
				`Remove category "${categoryRef.category.name}" from "${categoryRef.project.name}"?`,
				{ modal: true },
				"Remove"
			);

			if (decision !== "Remove") {
				return;
			}

			categoryRef.project.categories.splice(categoryRef.categoryIndex, 1);
			await store.save(data);
			treeProvider.refresh();
		}
	);

	const renameCategoryCommand = vscode.commands.registerCommand(
		"buildflow.renameCategory",
		async (item?: BuildflowTreeItem) => {
			const data = await store.load();
			const selectedNode = item?.node;
			let categoryRef: { project: Project; category: Category; categoryIndex: number } | undefined;

			if (selectedNode?.kind === "category") {
				categoryRef = findCategoryRef(data, selectedNode.category.id);
			} else {
				const category = await pickCategory(data);
				categoryRef = category ? findCategoryRef(data, category.id) : undefined;
			}

			if (!categoryRef) {
				return;
			}

			const updatedName = await vscode.window.showInputBox({
				title: "BuildFlow: Rename Category",
				prompt: "Category name",
				value: categoryRef.category.name,
				ignoreFocusOut: true,
				validateInput: (value) => (value.trim().length === 0 ? "Category name is required." : undefined)
			});

			if (!updatedName) {
				return;
			}

			categoryRef.category.name = updatedName.trim();
			await store.save(data);
			treeProvider.refresh();
		}
	);

	const addTaskCommand = vscode.commands.registerCommand("buildflow.addTask", async (item?: BuildflowTreeItem) => {
		const title = await vscode.window.showInputBox({
			title: "BuildFlow: Add Task",
			prompt: "Task title",
			ignoreFocusOut: true,
			validateInput: (value) => (value.trim().length === 0 ? "Task title is required." : undefined)
		});

		if (!title) {
			return;
		}

		const data = await store.load();
		let category: Category | undefined;
		const selectedNode = item?.node;
		if (selectedNode?.kind === "category") {
			category = data.projects
				.flatMap((project) => project.categories)
				.find((candidate) => candidate.id === selectedNode.category.id);
		} else {
			category = await pickCategory(data);
		}

		if (!category) {
			return;
		}

		category.tasks.push({
			id: createId("task"),
			title: title.trim(),
			status: "TODO",
			priority: "NORMAL",
			gameplan: []
		});
		await store.save(data);
		treeProvider.refresh();
	});

	const editTaskCommand = vscode.commands.registerCommand("buildflow.editTask", async (item?: BuildflowTreeItem) => {
		const data = await store.load();
		const selectedNode = item?.node;
		let task: Task | undefined;
		if (selectedNode?.kind === "task") {
			task = findTaskRef(data, selectedNode.task.id)?.task;
		} else {
			task = await pickTask(data);
		}

		if (!task) {
			return;
		}

		const title = await vscode.window.showInputBox({
			title: "BuildFlow: Edit Task",
			prompt: "Task title",
			value: task.title,
			ignoreFocusOut: true,
			validateInput: (value) => (value.trim().length === 0 ? "Task title is required." : undefined)
		});
		if (!title) {
			return;
		}

		const priority = await pickTaskPriority(task.priority);
		if (!priority) {
			return;
		}

		const status = await pickTaskStatus(task.status);
		if (!status) {
			return;
		}

		const description = await vscode.window.showInputBox({
			title: "BuildFlow: Edit Task Description",
			prompt: "Optional description",
			value: task.description ?? "",
			ignoreFocusOut: true
		});
		if (description === undefined) {
			return;
		}

		task.title = title.trim();
		task.priority = priority;
		task.status = status;
		task.description = description.trim().length > 0 ? description.trim() : undefined;
		await store.save(data);
		treeProvider.refresh();
	});

	const deleteTaskCommand = vscode.commands.registerCommand("buildflow.deleteTask", async (item?: BuildflowTreeItem) => {
		const data = await store.load();
		const selectedNode = item?.node;
		let taskRef: { category: Category; task: Task; taskIndex: number } | undefined;

		if (selectedNode?.kind === "task") {
			taskRef = findTaskRef(data, selectedNode.task.id);
		} else {
			const task = await pickTask(data);
			taskRef = task ? findTaskRef(data, task.id) : undefined;
		}

		if (!taskRef) {
			return;
		}

		const decision = await vscode.window.showWarningMessage(
			`Delete task "${taskRef.task.title}"?`,
			{ modal: true },
			"Delete"
		);

		if (decision !== "Delete") {
			return;
		}

		taskRef.category.tasks.splice(taskRef.taskIndex, 1);
		await store.save(data);
		treeProvider.refresh();
	});

	const attachFileToTaskCommand = vscode.commands.registerCommand(
		"buildflow.attachFileToTask",
		async (item?: BuildflowTreeItem) => {
			const data = await store.load();
			const selectedNode = item?.node;
			let task: Task | undefined;
			if (selectedNode?.kind === "task") {
				task = findTaskRef(data, selectedNode.task.id)?.task;
			} else {
				task = await pickTask(data);
			}

			if (!task) {
				return;
			}

			const fileUri = await pickFileUri();
			if (!fileUri) {
				return;
			}

			task.attachedFileUri = fileUri.toString();

			let addedStepCount = 0;
			try {
				const bytes = await vscode.workspace.fs.readFile(fileUri);
				const fileText = new TextDecoder("utf-8").decode(bytes);
				const parsedSteps = extractTodoLikeSteps(fileText);
				const existing = new Set(task.gameplan.map((step) => step.text.toLowerCase()));
				for (const parsedStep of parsedSteps) {
					const key = parsedStep.toLowerCase();
					if (existing.has(key)) {
						continue;
					}
					existing.add(key);
					task.gameplan.push({
						id: createId("step"),
						text: parsedStep,
						completed: false
					});
					addedStepCount++;
				}
			} catch (error) {
				vscode.window.showWarningMessage(
					`Attached file, but TODO/FIXME parsing failed: ${error instanceof Error ? error.message : "Unknown error"}`
				);
			}

			task.status = statusFromSteps(task);
			await store.save(data);
			treeProvider.refresh();

			const relative = vscode.workspace.asRelativePath(fileUri, false);
			vscode.window.showInformationMessage(
				addedStepCount > 0
					? `Attached ${relative}. Added ${addedStepCount} step(s) from TODO/FIXME.`
					: `Attached ${relative}. No TODO/FIXME items found.`
			);
		}
	);

	const detachFileFromTaskCommand = vscode.commands.registerCommand(
		"buildflow.detachFileFromTask",
		async (item?: BuildflowTreeItem) => {
			const data = await store.load();
			const selectedNode = item?.node;
			let task: Task | undefined;

			if (selectedNode?.kind === "task") {
				task = findTaskRef(data, selectedNode.task.id)?.task;
			} else {
				task = await pickTask(data);
			}

			if (!task || !task.attachedFileUri) {
				return;
			}

			task.attachedFileUri = undefined;
			await store.save(data);
			treeProvider.refresh();
		}
	);

	const openTaskAttachedFileCommand = vscode.commands.registerCommand(
		"buildflow.openTaskAttachedFile",
		async (item?: BuildflowTreeItem) => {
			const data = await store.load();
			const selectedNode = item?.node;
			let task: Task | undefined;

			if (selectedNode?.kind === "task") {
				task = findTaskRef(data, selectedNode.task.id)?.task;
			} else {
				task = await pickTask(data);
			}

			if (!task?.attachedFileUri) {
				vscode.window.showInformationMessage("No file attached to this task.");
				return;
			}

			await openUriInEditor(task.attachedFileUri);
		}
	);

	const attachFileToStepCommand = vscode.commands.registerCommand(
		"buildflow.attachFileToStep",
		async (item?: BuildflowTreeItem) => {
			const data = await store.load();
			const selectedNode = item?.node;
			let stepRef: { task: Task; step: GameplanStep; stepIndex: number } | undefined;

			if (selectedNode?.kind === "step") {
				stepRef = findStepRef(data, selectedNode.step.id);
			} else {
				const step = await pickStep(data);
				stepRef = step ? findStepRef(data, step.id) : undefined;
			}

			if (!stepRef) {
				return;
			}

			const fileUri = await pickFileUri();
			if (!fileUri) {
				return;
			}

			stepRef.step.attachedFileUri = fileUri.toString();
			await store.save(data);
			treeProvider.refresh();
			vscode.window.showInformationMessage(`Attached ${vscode.workspace.asRelativePath(fileUri, false)} to step.`);
		}
	);

	const detachFileFromStepCommand = vscode.commands.registerCommand(
		"buildflow.detachFileFromStep",
		async (item?: BuildflowTreeItem) => {
			const data = await store.load();
			const selectedNode = item?.node;
			let stepRef: { task: Task; step: GameplanStep; stepIndex: number } | undefined;

			if (selectedNode?.kind === "step") {
				stepRef = findStepRef(data, selectedNode.step.id);
			} else {
				const step = await pickStep(data);
				stepRef = step ? findStepRef(data, step.id) : undefined;
			}

			if (!stepRef || !stepRef.step.attachedFileUri) {
				return;
			}

			stepRef.step.attachedFileUri = undefined;
			await store.save(data);
			treeProvider.refresh();
		}
	);

	const openStepAttachedFileCommand = vscode.commands.registerCommand(
		"buildflow.openStepAttachedFile",
		async (item?: BuildflowTreeItem) => {
			const data = await store.load();
			const selectedNode = item?.node;
			let stepRef: { task: Task; step: GameplanStep; stepIndex: number } | undefined;

			if (selectedNode?.kind === "step") {
				stepRef = findStepRef(data, selectedNode.step.id);
			} else {
				const step = await pickStep(data);
				stepRef = step ? findStepRef(data, step.id) : undefined;
			}

			if (!stepRef?.step.attachedFileUri) {
				vscode.window.showInformationMessage("No file attached to this step.");
				return;
			}

			await openUriInEditor(stepRef.step.attachedFileUri);
		}
	);

	const addGameplanStepCommand = vscode.commands.registerCommand(
		"buildflow.addGameplanStep",
		async (item?: BuildflowTreeItem) => {
			const text = await vscode.window.showInputBox({
				title: "BuildFlow: Add Gameplan Step",
				prompt: "Step text",
				ignoreFocusOut: true,
				validateInput: (value) => (value.trim().length === 0 ? "Step text is required." : undefined)
			});

			if (!text) {
				return;
			}

			const data = await store.load();
			let task: Task | undefined;
			const selectedNode = item?.node;
			if (selectedNode?.kind === "task") {
				task = data.projects
					.flatMap((project) => project.categories)
					.flatMap((category) => category.tasks)
					.find((candidate) => candidate.id === selectedNode.task.id);
			} else if (selectedNode?.kind === "step") {
				task = findStepRef(data, selectedNode.step.id)?.task;
			} else {
				task = await pickTask(data);
			}

			if (!task) {
				return;
			}

			const step: GameplanStep = {
				id: createId("step"),
				text: text.trim(),
				completed: false
			};
			task.gameplan.push(step);

			await store.save(data);
			treeProvider.refresh();
		}
	);

	const editGameplanStepCommand = vscode.commands.registerCommand(
		"buildflow.editGameplanStep",
		async (item?: BuildflowTreeItem) => {
			const data = await store.load();
			const selectedNode = item?.node;
			let stepRef: { task: Task; step: GameplanStep; stepIndex: number } | undefined;

			if (selectedNode?.kind === "step") {
				stepRef = findStepRef(data, selectedNode.step.id);
			} else {
				const step = await pickStep(data);
				stepRef = step ? findStepRef(data, step.id) : undefined;
			}

			if (!stepRef) {
				return;
			}

			const updatedText = await vscode.window.showInputBox({
				title: "BuildFlow: Edit Gameplan Step",
				prompt: "Step text",
				value: stepRef.step.text,
				ignoreFocusOut: true,
				validateInput: (value) => (value.trim().length === 0 ? "Step text is required." : undefined)
			});

			if (!updatedText) {
				return;
			}

			stepRef.step.text = updatedText.trim();
			await store.save(data);
			treeProvider.refresh();
		}
	);

	const removeGameplanStepCommand = vscode.commands.registerCommand(
		"buildflow.removeGameplanStep",
		async (item?: BuildflowTreeItem) => {
			const data = await store.load();
			const selectedNode = item?.node;
			let stepRef: { task: Task; step: GameplanStep; stepIndex: number } | undefined;

			if (selectedNode?.kind === "step") {
				stepRef = findStepRef(data, selectedNode.step.id);
			} else {
				const step = await pickStep(data);
				stepRef = step ? findStepRef(data, step.id) : undefined;
			}

			if (!stepRef) {
				return;
			}

			stepRef.task.gameplan.splice(stepRef.stepIndex, 1);
			await store.save(data);
			treeProvider.refresh();
		}
	);

	const toggleGameplanStepCompleteCommand = vscode.commands.registerCommand(
		"buildflow.toggleGameplanStepComplete",
		async (item?: BuildflowTreeItem) => {
			const data = await store.load();
			let step: GameplanStep | undefined;
			const selectedNode = item?.node;
			if (selectedNode?.kind === "step") {
				step = data.projects
					.flatMap((project) => project.categories)
					.flatMap((category) => category.tasks)
					.flatMap((task) => task.gameplan)
					.find((candidate) => candidate.id === selectedNode.step.id);
			} else {
				step = await pickStep(data);
			}

			if (!step) {
				return;
			}

			step.completed = !step.completed;
			await store.save(data);
			treeProvider.refresh();
		}
	);

	const toggleTaskStatusCommand = vscode.commands.registerCommand(
		"buildflow.toggleTaskStatus",
		async (item?: BuildflowTreeItem) => {
			const data = await store.load();
			let task: Task | undefined;
			const selectedNode = item?.node;
			if (selectedNode?.kind === "task") {
				task = data.projects
					.flatMap((project) => project.categories)
					.flatMap((category) => category.tasks)
					.find((candidate) => candidate.id === selectedNode.task.id);
			} else {
				task = await pickTask(data);
			}

			if (!task) {
				return;
			}

			task.status = nextTaskStatus(task.status);
			await store.save(data);
			treeProvider.refresh();
		}
	);

	context.subscriptions.push(
		treeView,
		checkboxChangeDisposable,
		refreshCommand,
		createProjectCommand,
		addCategoryCommand,
		renameCategoryCommand,
		removeCategoryCommand,
		addTaskCommand,
		editTaskCommand,
		deleteTaskCommand,
		attachFileToTaskCommand,
		detachFileFromTaskCommand,
		openTaskAttachedFileCommand,
		addGameplanStepCommand,
		editGameplanStepCommand,
		removeGameplanStepCommand,
		attachFileToStepCommand,
		detachFileFromStepCommand,
		openStepAttachedFileCommand,
		renameProjectCommand,
		deleteProjectCommand,
		toggleGameplanStepCompleteCommand,
		toggleTaskStatusCommand
	);
}

export function deactivate() {}
