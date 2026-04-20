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
		this.contextValue = node.kind;
		this.iconPath = BuildflowTreeItem.iconFor(node);
		this.checkboxState = BuildflowTreeItem.checkboxStateFor(node);
		this.description = BuildflowTreeItem.descriptionFor(node);
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
				return `${node.task.title}${progress}`;
			}
			case "step":
				return node.step.text;
			case "info":
				return node.message;
		}
	}

	private static descriptionFor(node: BuildflowNode): string | undefined {
		if (node.kind !== "task") {
			return undefined;
		}

		if (node.task.status === "IN_PROGRESS") {
			return "in progress";
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

