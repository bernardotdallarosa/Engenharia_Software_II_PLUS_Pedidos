import { useState, useCallback, type ChangeEvent, type FormEvent } from "react";

export function useRegisterForm({ onSubmit }: { onSubmit: (values: any) => Promise<void> }) {
  const [values, setValues] = useState({ email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<any>({});
  const [touched, setTouched] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (field: string, value: string) => {
    if (field === "email") {
      if (!value) return "E-mail é obrigatório.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "E-mail inválido.";
    }
    if (field === "password") {
      if (!value) return "Senha é obrigatória.";
      if (value.length < 6) return "Mínimo 6 caracteres.";
      if (value.length > 10) return "Máximo 10 caracteres.";

      // Regras de força da senha (Regex)
      if (!/\d/.test(value)) return "A senha deve conter pelo menos um número.";
      if (!/[A-Z]/.test(value)) return "A senha deve conter pelo menos uma letra maiúscula.";
      if (!/[a-z]/.test(value)) return "A senha deve conter pelo menos uma letra minúscula.";
    }
    if (field === "confirmPassword") {
      if (value !== values.password) return "As senhas não coincidem.";
    }
    return undefined;
  };

  const handleChange = (field: string) => (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValues(prev => ({ ...prev, [field]: val }));
    if (touched[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: validate(field, val) }));
    }
  };

  const handleBlur = (field: string) => () => {
    setTouched((prev: any) => ({ ...prev, [field]: true }));
    setErrors((prev: any) => ({ ...prev, [field]: validate(field, values[field as keyof typeof values]) }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const eErr = validate("email", values.email);
    const pErr = validate("password", values.password);
    const cErr = validate("confirmPassword", values.confirmPassword);

    if (eErr || pErr || cErr) {
      setErrors({ email: eErr, password: pErr, confirmPassword: cErr });
      setTouched({ email: true, password: true, confirmPassword: true });
      return;
    }

    setIsSubmitting(true);
    try { await onSubmit(values); } 
    finally { setIsSubmitting(false); }
  };

  return { values, errors, touched, isSubmitting, handleChange, handleBlur, handleSubmit };
}