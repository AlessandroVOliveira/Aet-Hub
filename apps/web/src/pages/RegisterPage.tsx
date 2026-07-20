import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { register as registerRequest } from '@/services/auth';
import { ApiError } from '@/services/http';
import type { RegisterPayload } from '@/types/auth';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Field } from '@/components/ui/Field';
import { Banner } from '@/components/ui/Banner';

type FormValues = RegisterPayload;
type FieldErrors = Partial<Record<keyof FormValues, string>>;

const initialValues: FormValues = {
  username: '',
  password: '',
  email: '',
  cep: '',
  addressNumber: '',
  addressComplement: '',
  displayName: '',
  acceptedTerms: false,
};

function validateRegisterForm(values: FormValues): FieldErrors {
  const errors: FieldErrors = {};

  if (!/^[a-zA-Z0-9_]{3,30}$/.test(values.username)) {
    errors.username = 'Use de 3 a 30 letras, números ou _';
  }
  if (values.password.length < 8) {
    errors.password = 'Mínimo de 8 caracteres';
  }
  if (!/^\S+@\S+\.\S+$/.test(values.email)) {
    errors.email = 'E-mail inválido';
  }
  if (values.cep.replace(/\D/g, '').length < 8) {
    errors.cep = 'Informe um CEP com 8 dígitos';
  }
  if (!values.addressNumber.trim()) {
    errors.addressNumber = 'Campo obrigatório';
  } else if (values.addressNumber.length > 20) {
    errors.addressNumber = 'Máximo de 20 caracteres';
  }
  if (values.addressComplement && values.addressComplement.length > 120) {
    errors.addressComplement = 'Máximo de 120 caracteres';
  }
  if (values.displayName && (values.displayName.length < 2 || values.displayName.length > 60)) {
    errors.displayName = 'Deve ter entre 2 e 60 caracteres';
  }
  if (!values.acceptedTerms) {
    errors.acceptedTerms = 'É preciso aceitar os termos';
  }

  return errors;
}

export function RegisterPage() {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: registerRequest,
    onSuccess: () => {
      navigate('/login', { state: { registered: true } });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.issues) {
        const mapped: FieldErrors = {};
        for (const issue of error.issues) {
          const key = issue.path[0] as keyof FormValues;
          mapped[key] = issue.message;
        }
        setFieldErrors(mapped);
      }
    },
  });

  function updateField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const errors = validateRegisterForm(values);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    mutation.mutate({
      ...values,
      addressComplement: values.addressComplement || undefined,
      displayName: values.displayName || undefined,
    });
  }

  const generalError =
    mutation.isError && mutation.error instanceof ApiError && !mutation.error.issues
      ? mutation.error.message
      : null;

  return (
    <AuthLayout eyebrow="NEW_PLAYER" title="CRIAR" accent="CONTA">
      {generalError && <Banner variant="error">{generalError}</Banner>}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Field
          label="USUÁRIO"
          id="username"
          value={values.username}
          onChange={(event) => updateField('username', event.target.value)}
          error={fieldErrors.username}
        />

        <Field
          label="SENHA"
          id="password"
          type="password"
          value={values.password}
          onChange={(event) => updateField('password', event.target.value)}
          error={fieldErrors.password}
        />

        <Field
          label="E-MAIL"
          id="email"
          type="email"
          value={values.email}
          onChange={(event) => updateField('email', event.target.value)}
          error={fieldErrors.email}
        />

        <Field
          label="CEP"
          id="cep"
          value={values.cep}
          onChange={(event) => updateField('cep', event.target.value)}
          placeholder="Só de Alegrete/RS"
          error={fieldErrors.cep}
        />

        <Field
          label="NÚMERO"
          id="addressNumber"
          value={values.addressNumber}
          onChange={(event) => updateField('addressNumber', event.target.value)}
          error={fieldErrors.addressNumber}
        />

        <Field
          label="COMPLEMENTO (OPCIONAL)"
          id="addressComplement"
          value={values.addressComplement}
          onChange={(event) => updateField('addressComplement', event.target.value)}
          error={fieldErrors.addressComplement}
        />

        <Field
          label="NOME DE EXIBIÇÃO (OPCIONAL)"
          id="displayName"
          value={values.displayName}
          onChange={(event) => updateField('displayName', event.target.value)}
          error={fieldErrors.displayName}
        />

        <div>
          <label className="flex items-center gap-2 text-xs text-silver-muted">
            <input
              id="acceptedTerms"
              type="checkbox"
              className="accent-ember size-4"
              checked={values.acceptedTerms}
              onChange={(event) => updateField('acceptedTerms', event.target.checked)}
            />
            Aceito os termos de uso e a política de privacidade
          </label>
          {fieldErrors.acceptedTerms && (
            <span className="block mt-1 text-xs font-mono text-ember">
              {fieldErrors.acceptedTerms}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full bg-ember hover:bg-ember-glow disabled:opacity-60 disabled:cursor-not-allowed text-white font-display py-3 tracking-widest uppercase italic transition-colors"
        >
          {mutation.isPending ? 'Enviando...' : 'Criar conta'}
        </button>

        <p className="text-xs text-silver-muted text-center pt-4">
          Já tem conta?{' '}
          <Link to="/login" className="text-ember hover:underline font-bold uppercase">
            Entrar
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
