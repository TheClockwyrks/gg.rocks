import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useAuth } from "@/auth/AuthProvider";
import { useRedirectTarget, withRedirect } from "@/auth/guards";
import { Button } from "@/components/Button/Button";
import { Field } from "@/components/Field/Field";
import { Notice } from "@/components/Notice/Notice";
import { PageBody } from "@/components/PageBody/PageBody";
import { PageIntro } from "@/components/PageIntro/PageIntro";
import { accountPaths } from "@/data/site";
import { demoCredentials } from "@/services";
import { useAction } from "@/utils/useAction";
import styles from "./Auth.module.scss";

export const PASSWORD_MIN_LENGTH = 8;

const copy = {
	login: {
		title: "Log in",
		lead: "Log in to manage your account and subscription.",
		submit: "Log in",
		prompt: "Don't have an account?",
		other: "Sign up",
		otherPath: accountPaths.signup,
	},
	signup: {
		title: "Sign up",
		lead: "Create an account to subscribe and manage your plan.",
		submit: "Create account",
		prompt: "Already have an account?",
		other: "Log in",
		otherPath: accountPaths.login,
	},
} as const;

/**
 * The log-in and sign-up forms. Neither navigates on success: the session
 * changes, and the guard around these routes moves the visitor on.
 */
function Auth({ mode }: { mode: keyof typeof copy }) {
	const auth = useAuth();
	const redirect = useRedirectTarget();
	const { pending, error, setError, run } = useAction();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmation, setConfirmation] = useState("");
	const text = copy[mode];
	const signingUp = mode === "signup";

	const onSubmit = (event: FormEvent) => {
		event.preventDefault();
		if (signingUp && password !== confirmation) {
			setError("The passwords do not match.");
			return;
		}
		void run(() => auth[mode]({ email, password }));
	};

	return (
		<PageBody width="narrow">
			<PageIntro
				eyebrow="Account"
				title={text.title}
			>
				{text.lead}
			</PageIntro>

			<form
				className={styles.form}
				onSubmit={onSubmit}
			>
				<Field
					label="Email"
					type="email"
					autoComplete="email"
					required
					value={email}
					onChange={(event) => setEmail(event.target.value)}
				/>
				<Field
					label="Password"
					type="password"
					autoComplete={signingUp ? "new-password" : "current-password"}
					required
					minLength={signingUp ? PASSWORD_MIN_LENGTH : undefined}
					hint={
						signingUp ? `At least ${PASSWORD_MIN_LENGTH} characters` : undefined
					}
					value={password}
					onChange={(event) => setPassword(event.target.value)}
				/>
				{signingUp && (
					<Field
						label="Confirm password"
						type="password"
						autoComplete="new-password"
						required
						value={confirmation}
						onChange={(event) => setConfirmation(event.target.value)}
					/>
				)}
				{error && <Notice tone="error">{error}</Notice>}
				<Button
					type="submit"
					variant="primary"
					disabled={pending}
				>
					{text.submit}
				</Button>
				<p className={styles.switch}>
					{text.prompt}{" "}
					<Link to={withRedirect(text.otherPath, redirect)}>{text.other}</Link>
				</p>
				{!signingUp && demoCredentials && (
					<p className={styles.demo}>
						Demo account: {demoCredentials.email} / {demoCredentials.password}
					</p>
				)}
			</form>
		</PageBody>
	);
}

// Keyed so the fields empty when the visitor switches between the two.
export const Login = () => (
	<Auth
		key="login"
		mode="login"
	/>
);

export const Signup = () => (
	<Auth
		key="signup"
		mode="signup"
	/>
);
