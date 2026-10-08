import type { User } from "@/services/auth";

// Browser-only stand-in for the login service's database and session cookie.
// Nothing here is secure, and none of it should outlive the mock.

export interface StoredUser extends User {
	password: string;
}

const USERS_KEY = "gg.mock.users";
const SESSION_KEY = "gg.mock.session";

/** An account that always exists, so there is something to log in to. */
export const demoUser: StoredUser = {
	id: "user-demo",
	email: "demo@gg.rocks",
	password: "password123",
};

function read<T>(key: string): T | null {
	try {
		const raw = localStorage.getItem(key);
		return raw === null ? null : (JSON.parse(raw) as T);
	} catch {
		return null;
	}
}

function write(key: string, value: unknown) {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch {
		// Storage is unavailable (private window); the session lasts until reload.
	}
}

export const readUsers = (): StoredUser[] =>
	read<StoredUser[]>(USERS_KEY) ?? [demoUser];

export const writeUsers = (users: StoredUser[]) => write(USERS_KEY, users);

export function readSessionUser(): StoredUser | null {
	const id = read<string>(SESSION_KEY);
	return readUsers().find((user) => user.id === id) ?? null;
}

export function writeSession(userId: string | null) {
	if (userId === null) {
		try {
			localStorage.removeItem(SESSION_KEY);
		} catch {
			// Nothing was stored.
		}
	} else {
		write(SESSION_KEY, userId);
	}
}

/** Resolves after roughly the time a network round trip takes. */
export const latency = (ms = 350) =>
	new Promise<void>((resolve) => setTimeout(resolve, ms));
