export interface User {
	id: string;
	email: string;
}

export interface Credentials {
	email: string;
	password: string;
}

export type AuthErrorCode =
	| "invalid-credentials"
	| "email-taken"
	| "wrong-password"
	| "unauthenticated";

/** A failure the visitor can act on; its message is safe to show them. */
export class AuthError extends Error {
	readonly code: AuthErrorCode;

	constructor(code: AuthErrorCode, message: string) {
		super(message);
		this.name = "AuthError";
		this.code = code;
	}
}

/**
 * Everything the site asks of the login service. The app only ever talks to
 * this interface, so the mock can be swapped for the real service in one place
 * (see `services/index.ts`).
 */
export interface AuthService {
	/** The logged-in user, or null. Called once when the app loads. */
	getSession(): Promise<User | null>;
	login(credentials: Credentials): Promise<User>;
	/** Creates an account and logs it in. */
	signup(credentials: Credentials): Promise<User>;
	logout(): Promise<void>;
	updateEmail(change: {
		email: string;
		currentPassword: string;
	}): Promise<User>;
	updatePassword(change: {
		currentPassword: string;
		newPassword: string;
	}): Promise<void>;
}
