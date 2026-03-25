export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export type TaskPriority = "CRITICAL" | "HIGH" | "NORMAL";

export interface CodeReference {
	fileUri: string;
	line: number;
}

export interface GameplanStep {
	id: string;
	text: string;
	completed: boolean;
}

export interface Task {
	id: string;
	title: string;
	status: TaskStatus;
	priority: TaskPriority;
	description?: string;
	deadline?: string;
	notes?: string;
	codeRef?: CodeReference;
	gameplan: GameplanStep[];
}

export interface Category {
	id: string;
	name: string;
	tasks: Task[];
}

export interface Project {
	id: string;
	name: string;
	categories: Category[];
}

export interface BuildflowData {
	version: 1;
	projects: Project[];
}

export const DEFAULT_BUILDFLOW_DATA: BuildflowData = {
	version: 1,
	projects: []
};
