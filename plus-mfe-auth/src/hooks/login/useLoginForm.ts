import { useState, useCallback, type ChangeEvent, type FormEvent } from "react";

export interface LoginFormValues {
  email:    string;
  password: string;
}

interface FieldErrors {
  email?:    string;
  password?: string;
}

interface UseLoginFormOptions {
  onSubmit: (values: LoginFormValues) => Promise<void>;
}

function validateEmail(v: string) {
  if (!v) return "E-mail é obrigatório.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Informe um e-mail válido.";
}
function validatePassword(v: string) {
  if (!v) return "Senha é obrigatória.";
  if (v.length < 6) return "Mínimo 6 caracteres.";
}

export function useLoginForm({ onSubmit }: UseLoginFormOptions) {
  const [values, setValues] = useState<LoginFormValues>({ email: "", password: "" });
  const [errors, setErrors]   = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof LoginFormValues, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback(
    (field: keyof LoginFormValues) => (e: ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setValues(prev => ({ ...prev, [field]: val }));
      if (touched[field]) {
        setErrors(prev => ({
          ...prev,
          [field]: field === "email" ? validateEmail(val) : validatePassword(val),
        }));
      }
    },
    [touched]
  );

  const handleBlur = useCallback(
    (field: keyof LoginFormValues) => () => {
      setTouched(prev => ({ ...prev, [field]: true }));
      setErrors(prev => ({
        ...prev,
        [field]: field === "email"
          ? validateEmail(values[field])
          : validatePassword(values[field]),
      }));
    },
    [values]
  );

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const emailErr    = validateEmail(values.email);
      const passwordErr = validatePassword(values.password);
      if (emailErr || passwordErr) {
        setErrors({ email: emailErr, password: passwordErr });
        setTouched({ email: true, password: true });
        return;
      }
      setIsSubmitting(true);
      try { await onSubmit(values); }
      finally { setIsSubmitting(false); }
    },
    [values, onSubmit]
  );

  const fieldValid = (field: keyof LoginFormValues) =>
    touched[field] && !errors[field] && Boolean(values[field]);

  return { values, errors, touched, isSubmitting, fieldValid, handleChange, handleBlur, handleSubmit };
}