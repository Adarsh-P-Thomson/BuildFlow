import * as vscode from "vscode";
import {
	BuildflowData,
	Category,
	CodeReference,
	DEFAULT_BUILDFLOW_DATA,
	GameplanStep,
	Project,
	Task
} from "../model/types";

const BUILDFLOW_FILE_NAME = "buildflow.json";
const VSCODE_DIR_NAME = ".vscode";

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function isCodeReference(value: unknown): value is CodeReference {
	if (!isRecord(value)) {
		return false;
	}

	return typeof value.fileUri === "string" && typeof value.line === "number";
}

function isGameplanStep(value: unknown): value is GameplanStep {
	if (!isRecord(value)) {
		return false;
	}

	if (typeof value.id !== "string" || typeof value.text !== "string" || typeof value.completed !== "boolean") {
		return false;
	}

	if (value.attachedFileUri !== undefined && typeof value.attachedFileUri !== "string") {
		return false;
	}

	return true;
}

function isTask(value: unknown): value is Task {
	if (!isRecord(value)) {
		return false;
	}

	if (
		typeof value.id !== "string" ||
		typeof value.title !== "string" ||
		(value.status !== "TODO" && value.status !== "IN_PROGRESS" && value.status !== "DONE") ||
		(value.priority !== "CRITICAL" && value.priority !== "HIGH" && value.priority !== "NORMAL") ||
		!Array.isArray(value.gameplan)
	) {
		return false;
	}

	if (value.description !== undefined && typeof value.description !== "string") {
		return false;
	}
	if (value.deadline !== undefined && typeof value.deadline !== "string") {
		return false;
	}
	if (value.notes !== undefined && typeof value.notes !== "string") {
		return false;
	}
	if (value.codeRef !== undefined && !isCodeReference(value.codeRef)) {
		return false;
	}
	if (value.attachedFileUri !== undefined && typeof value.attachedFileUri !== "string") {
		return false;
	}

	return value.gameplan.every((step) => isGameplanStep(step));
}

function isCategory(value: unknown): value is Category {
	if (!isRecord(value)) {
		return false;
	}

	return (
		typeof value.id === "string" &&
		typeof value.name === "string" &&
		Array.isArray(value.tasks) &&
		value.tasks.every((task) => isTask(task))
	);
}

function isProject(value: unknown): value is Project {
	if (!isRecord(value)) {
		return false;
	}

	return (
		typeof value.id === "string" &&
		typeof value.name === "string" &&
		Array.isArray(value.categories) &&
		value.categories.every((category) => isCategory(category))
	);
}

function isBuildflowData(value: unknown): value is BuildflowData {
	if (!isRecord(value)) {
		return false;
	}

	return value.version === 1 && Array.isArray(value.projects) && value.projects.every((project) => isProject(project));
}

export class BuildflowStore {
	public getDataFileUri(): vscode.Uri {
		const rootUri = this.getWorkspaceRootUri();
		const vscodeDirUri = vscode.Uri.joinPath(rootUri, VSCODE_DIR_NAME);
		return vscode.Uri.joinPath(vscodeDirUri, BUILDFLOW_FILE_NAME);
	}

	public async load(): Promise<BuildflowData> {
		const fileUri = this.getDataFileUri();

		try {
			const bytes = await vscode.workspace.fs.readFile(fileUri);
			const rawText = new TextDecoder("utf-8").decode(bytes);
			const parsed = JSON.parse(rawText) as unknown;

			if (!isBuildflowData(parsed)) {
				throw new Error("Invalid buildflow.json schema.");
			}

			return parsed;
		} catch (error) {
			if (error instanceof vscode.FileSystemError && error.code === "FileNotFound") {
				await this.save(DEFAULT_BUILDFLOW_DATA);
				return DEFAULT_BUILDFLOW_DATA;
			}

			throw error;
		}
	}

	public async save(data: BuildflowData): Promise<void> {
		if (!isBuildflowData(data)) {
			throw new Error("Attempted to save invalid BuildFlow data.");
		}

		const fileUri = this.getDataFileUri();
		const vscodeDirUri = vscode.Uri.joinPath(this.getWorkspaceRootUri(), VSCODE_DIR_NAME);
		await vscode.workspace.fs.createDirectory(vscodeDirUri);

		const text = JSON.stringify(data, null, 2);
		const bytes = new TextEncoder().encode(text);
		await vscode.workspace.fs.writeFile(fileUri, bytes);
	}

	private getWorkspaceRootUri(): vscode.Uri {
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (!workspaceFolder) {
			throw new Error("BuildFlow requires an open workspace folder.");
		}

		return workspaceFolder.uri;
	}
}
