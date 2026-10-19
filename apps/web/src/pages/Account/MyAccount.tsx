import { useState, type FormEvent } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/Button/Button";
import { Field } from "@/components/Field/Field";
import { Notice } from "@/components/Notice/Notice";
import { PASSWORD_MIN_LENGTH } from "@/pages/Auth/Auth";
import { useAction } from "@/utils/useAction";
import { AccountSection } from "./AccountSection";
import styles from "./Account.module.scss";

function EmailForm() {
  const { user, updateEmail } = useAuth();
  const { pending, error, run } = useAction();
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [changed, setChanged] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setChanged(false);
    if (await run(() => updateEmail({ email, currentPassword }))) {
      setEmail("");
      setCurrentPassword("");
      setChanged(true);
    }
  };

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <p className={styles.text}>Your email is {user?.email}.</p>
      <Field
        label="New email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <Field
        label="Current password"
        type="password"
        autoComplete="current-password"
        required
        value={currentPassword}
        onChange={(event) => setCurrentPassword(event.target.value)}
      />
      {error && <Notice tone="error">{error}</Notice>}
      {changed && <Notice tone="success">Your email has been changed.</Notice>}
      <div className={styles.actions}>
        <Button type="submit" disabled={pending}>
          Change email
        </Button>
      </div>
    </form>
  );
}

function PasswordForm() {
  const { updatePassword } = useAuth();
  const { pending, error, setError, run } = useAction();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [changed, setChanged] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setChanged(false);
    if (newPassword !== confirmation) {
      setError("The new passwords do not match.");
      return;
    }
    if (await run(() => updatePassword({ currentPassword, newPassword }))) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmation("");
      setChanged(true);
    }
  };

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <Field
        label="Current password"
        type="password"
        autoComplete="current-password"
        required
        value={currentPassword}
        onChange={(event) => setCurrentPassword(event.target.value)}
      />
      <Field
        label="New password"
        type="password"
        autoComplete="new-password"
        required
        minLength={PASSWORD_MIN_LENGTH}
        hint={`At least ${PASSWORD_MIN_LENGTH} characters`}
        value={newPassword}
        onChange={(event) => setNewPassword(event.target.value)}
      />
      <Field
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        required
        value={confirmation}
        onChange={(event) => setConfirmation(event.target.value)}
      />
      {error && <Notice tone="error">{error}</Notice>}
      {changed && (
        <Notice tone="success">Your password has been changed.</Notice>
      )}
      <div className={styles.actions}>
        <Button type="submit" disabled={pending}>
          Change password
        </Button>
      </div>
    </form>
  );
}

export function MyAccount() {
  const { logout } = useAuth();
  const { pending, error, run } = useAction();

  return (
    <>
      <AccountSection title="Email" summary="Used to log in and for receipts.">
        <EmailForm />
      </AccountSection>
      <AccountSection title="Password">
        <PasswordForm />
      </AccountSection>
      <AccountSection
        title="Log out"
        summary="Ends your session in this browser."
      >
        {error && <Notice tone="error">{error}</Notice>}
        {/* The guard around the account routes takes over from here. */}
        <Button disabled={pending} onClick={() => void run(logout)}>
          Log out
        </Button>
      </AccountSection>
    </>
  );
}
