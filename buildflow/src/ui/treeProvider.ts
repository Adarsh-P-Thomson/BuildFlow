import * as vscode from "vscode";
import { Category, GameplanStep, Project, Task } from "../model/types";
import { BuildflowStore } from "../storage/store";

type BuildflowNode =
	| { kind: "project"; project: Project }
	| { kind: "category"; category: Category }
	| { kind: "task"; task: Task }
	| { kind: "step"; step: GameplanStep }
	| { kind: "info"; message: string };

export class BuildflowTreeItem extends vscode.TreeItem {
	public readonly node: BuildflowNode;

	constructor(node: BuildflowNode) {
		super(
			BuildflowTreeItem.labelFor(node),
			BuildflowTreeItem.collapsibleStateFor(node)
		);
		this.node = node;
		this.contextValue = BuildflowTreeItem.contextValueFor(node);
		this.iconPath = BuildflowTreeItem.iconFor(node);
		this.checkboxState = BuildflowTreeItem.checkboxStateFor(node);
		this.description = BuildflowTreeItem.descriptionFor(node);
		this.tooltip = BuildflowTreeItem.tooltipFor(node);
	}

	private static labelFor(node: BuildflowNode): string {
		switch (node.kind) {
			case "project":
				return node.project.name;
			case "category":
				return node.category.name;
			case "task": {
				const completedSteps = node.task.gameplan.filter((step) => step.completed).length;
				const totalSteps = node.task.gameplan.length;
				const progress = totalSteps > 0 ? ` [${completedSteps}/${totalSteps}]` : "";
				const fileBadge = node.task.attachedFileUri ? " (file)" : "";
				return `${node.task.title}${progress}${fileBadge}`;
			}
			case "step":
				return node.step.attachedFileUri ? `${node.step.text} (file)` : node.step.text;
			case "info":
				return node.message;
		}
	}

	private static descriptionFor(node: BuildflowNode): string | undefined {
		if (node.kind === "task") {
			const parts: string[] = [];
			if (node.task.status === "IN_PROGRESS") {
				parts.push("in progress");
			}
			if (node.task.attachedFileUri) {
				parts.push(BuildflowTreeItem.fileNameFromUri(node.task.attachedFileUri));
			}
			return parts.length > 0 ? parts.join(" • ") : undefined;
		}

		if (node.kind === "step" && node.step.attachedFileUri) {
			return BuildflowTreeItem.fileNameFromUri(node.step.attachedFileUri);
		}

		return undefined;
	}

	private static tooltipFor(node: BuildflowNode): string | undefined {
		if (node.kind === "task" && node.task.attachedFileUri) {
			return vscode.workspace.asRelativePath(vscode.Uri.parse(node.task.attachedFileUri), false);
		}
		if (node.kind === "step" && node.step.attachedFileUri) {
			return vscode.workspace.asRelativePath(vscode.Uri.parse(node.step.attachedFileUri), false);
		}
		return undefined;
	}

	private static collapsibleStateFor(node: BuildflowNode): vscode.TreeItemCollapsibleState {
		switch (node.kind) {
			case "project":
			case "category":
			case "task":
				return vscode.TreeItemCollapsibleState.Collapsed;
			case "step":
			case "info":
				return vscode.TreeItemCollapsibleState.None;
		}
	}

	private static iconFor(node: BuildflowNode): vscode.ThemeIcon | undefined {
		switch (node.kind) {
			case "project":
				return new vscode.ThemeIcon("repo");
			case "category":
				return new vscode.ThemeIcon("folder");
			case "task":
				return undefined;
			case "step":
				return undefined;
			case "info":
				return new vscode.ThemeIcon("info");
		}
	}

	private static checkboxStateFor(node: BuildflowNode): vscode.TreeItemCheckboxState | undefined {
		switch (node.kind) {
			case "task":
				return node.task.status === "DONE"
					? vscode.TreeItemCheckboxState.Checked
					: vscode.TreeItemCheckboxState.Unchecked;
			case "step":
				return node.step.completed
					? vscode.TreeItemCheckboxState.Checked
					: vscode.TreeItemCheckboxState.Unchecked;
			default:
				return undefined;
		}
	}

	private static contextValueFor(node: BuildflowNode): string {
		if (node.kind === "task") {
			return node.task.attachedFileUri ? "taskAttached" : "task";
		}
		if (node.kind === "step") {
			return node.step.attachedFileUri ? "stepAttached" : "step";
		}
		return node.kind;
	}

	private static fileNameFromUri(rawUri: string): string {
		try {
			const uri = vscode.Uri.parse(rawUri);
			const segments = uri.path.split("/");
			return segments[segments.length - 1] || rawUri;
		} catch {
			return rawUri;
		}
	}
}

export class BuildflowTreeProvider implements vscode.TreeDataProvider<BuildflowTreeItem> {
	private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<BuildflowTreeItem | undefined>();
	public readonly onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;

	constructor(private readonly store: BuildflowStore) {}

	public refresh(): void {
		this.onDidChangeTreeDataEmitter.fire(undefined);
	}

	public getTreeItem(element: BuildflowTreeItem): vscode.TreeItem {
		return element;
	}

	public async getChildren(element?: BuildflowTreeItem): Promise<BuildflowTreeItem[]> {
		const data = await this.store.load();

		if (!element) {
			if (data.projects.length === 0) {
				return [new BuildflowTreeItem({ kind: "info", message: "No projects yet. Add one from commands." })];
			}

			return data.projects.map((project) => new BuildflowTreeItem({ kind: "project", project }));
		}

		switch (element.node.kind) {
			case "project":
				return element.node.project.categories.map((category) => new BuildflowTreeItem({ kind: "category", category }));
			case "category":
				return element.node.category.tasks.map((task) => new BuildflowTreeItem({ kind: "task", task }));
			case "task":
				return element.node.task.gameplan.map((step) => new BuildflowTreeItem({ kind: "step", step }));
			case "step":
			case "info":
				return [];
		}
	}

	public getParent(_element: BuildflowTreeItem): vscode.ProviderResult<BuildflowTreeItem> {
		return undefined;
	}
}

