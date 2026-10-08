import { AuthError, type AuthService, type User } from "@/services/auth";
import {
	latency,
	readSessionUser,
	readUsers,
	writeSession,
	writeUsers,
	type StoredUser,
} from "./store";

const normalise = (email: string) => email.trim().toLowerCase();

const publicUser = ({ id, email }: StoredUser): User => ({ id, email });

/** The session's user, once the given password has been checked against it. */
function confirmPassword(password: string): StoredUser {
	const user = readSessionUser();
	if (!user) {
		throw new AuthError("unauthenticated", "You are no longer logged in.");
	}
	if (user.password !== password) {
		throw new AuthError(
			"wrong-password",
			"Your current password is wrong.",
		);
	}
	return user;
}

function save(changed: StoredUser) {
	writeUsers(
		readUsers().map((user) => (user.id === changed.id ? changed : user)),
	);
}

/** Accounts and sessions kept in this browser, until the real service exists. */
export const mockAuth: AuthService = {
	async getSession() {
		await latency(150);
		const user = readSessionUser();
		return user && publicUser(user);
	},

	async login({ email, password }) {
		await latency();
		const user = readUsers().find(
			(candidate) => candidate.email === normalise(email),
		);
		if (!user || user.password !== password) {
			throw new AuthError(
				"invalid-credentials",
				"Wrong email or password.",
			);
		}
		writeSession(user.id);
		return publicUser(user);
	},

	async signup({ email, password }) {
		await latency();
		const users = readUsers();
		if (users.some((user) => user.email === normalise(email))) {
			throw new AuthError(
				"email-taken",
				"An account with this email already exists.",
			);
		}
		const user: StoredUser = {
			id: `user-${crypto.randomUUID()}`,
			email: normalise(email),
			password,
		};
		writeUsers([...users, user]);
		writeSession(user.id);
		return publicUser(user);
	},

	async logout() {
		await latency(150);
		writeSession(null);
	},

	async updateEmail({ email, currentPassword }) {
		await latency();
		const user = confirmPassword(currentPassword);
		const taken = readUsers().some(
			(other) => other.id !== user.id && other.email === normalise(email),
		);
		if (taken) {
			throw new AuthError(
				"email-taken",
				"An account with this email already exists.",
			);
		}
		const changed = { ...user, email: normalise(email) };
		save(changed);
		return publicUser(changed);
	},

	async updatePassword({ currentPassword, newPassword }) {
		await latency();
		save({ ...confirmPassword(currentPassword), password: newPassword });
	},
};
