import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from "react";
import { authService } from "@/services";
import type { AuthService, User } from "@/services/auth";

type AuthState =
	// Until the service has said whether there is a session.
	| { status: "loading"; user: null }
	| { status: "anonymous"; user: null }
	| { status: "authenticated"; user: User };

type AuthActions = Pick<
	AuthService,
	"login" | "signup" | "logout" | "updateEmail" | "updatePassword"
>;

type AuthContextValue = AuthState & AuthActions;

const AuthContext = createContext<AuthContextValue | null>(null);

const signedIn = (user: User): AuthState => ({ status: "authenticated", user });
const signedOut: AuthState = { status: "anonymous", user: null };

/** Holds the current session and keeps it in step with the login service. */
export function AuthProvider({ children }: { children: ReactNode }) {
	const [state, setState] = useState<AuthState>({
		status: "loading",
		user: null,
	});

	useEffect(() => {
		let stale = false;
		authService
			.getSession()
			.catch(() => null)
			.then((user) => {
				if (!stale) setState(user ? signedIn(user) : signedOut);
			});
		return () => {
			stale = true;
		};
	}, []);

	const actions = useMemo<AuthActions>(() => {
		const entering = async (request: Promise<User>) => {
			const user = await request;
			setState(signedIn(user));
			return user;
		};
		return {
			login: (credentials) => entering(authService.login(credentials)),
			signup: (credentials) => entering(authService.signup(credentials)),
			updateEmail: (change) => entering(authService.updateEmail(change)),
			updatePassword: (change) => authService.updatePassword(change),
			logout: async () => {
				await authService.logout();
				setState(signedOut);
			},
		};
	}, []);

	const value = useMemo(() => ({ ...state, ...actions }), [state, actions]);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
	const value = useContext(AuthContext);
	if (!value) throw new Error("useAuth must be used inside an AuthProvider");
	return value;
}
