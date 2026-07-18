import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { register as registerRequest } from '@/services/auth';
import { ApiError } from '@/services/http';
import type { RegisterPayload } from '@/types/auth';
import styles from './RegisterPage.module.css';

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
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Criar conta</h2>

      {generalError && <p className={styles.errorBanner}>{generalError}</p>}

      <form onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label htmlFor="username">Usuário</label>
          <input
            id="username"
            value={values.username}
            onChange={(event) => updateField('username', event.target.value)}
          />
          {fieldErrors.username && <span className={styles.fieldError}>{fieldErrors.username}</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="password">Senha</label>
          <input
            id="password"
            type="password"
            value={values.password}
            onChange={(event) => updateField('password', event.target.value)}
          />
          {fieldErrors.password && <span className={styles.fieldError}>{fieldErrors.password}</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            value={values.email}
            onChange={(event) => updateField('email', event.target.value)}
          />
          {fieldErrors.email && <span className={styles.fieldError}>{fieldErrors.email}</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="cep">CEP</label>
          <input
            id="cep"
            value={values.cep}
            onChange={(event) => updateField('cep', event.target.value)}
            placeholder="Só de Alegrete/RS"
          />
          {fieldErrors.cep && <span className={styles.fieldError}>{fieldErrors.cep}</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="addressNumber">Número</label>
          <input
            id="addressNumber"
            value={values.addressNumber}
            onChange={(event) => updateField('addressNumber', event.target.value)}
          />
          {fieldErrors.addressNumber && (
            <span className={styles.fieldError}>{fieldErrors.addressNumber}</span>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="addressComplement">Complemento (opcional)</label>
          <input
            id="addressComplement"
            value={values.addressComplement}
            onChange={(event) => updateField('addressComplement', event.target.value)}
          />
          {fieldErrors.addressComplement && (
            <span className={styles.fieldError}>{fieldErrors.addressComplement}</span>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="displayName">Nome de exibição (opcional)</label>
          <input
            id="displayName"
            value={values.displayName}
            onChange={(event) => updateField('displayName', event.target.value)}
          />
          {fieldErrors.displayName && (
            <span className={styles.fieldError}>{fieldErrors.displayName}</span>
          )}
        </div>

        <div className={styles.checkboxField}>
          <input
            id="acceptedTerms"
            type="checkbox"
            checked={values.acceptedTerms}
            onChange={(event) => updateField('acceptedTerms', event.target.checked)}
          />
          <label htmlFor="acceptedTerms">Aceito os termos de uso e a política de privacidade</label>
        </div>
        {fieldErrors.acceptedTerms && (
          <span className={styles.fieldError}>{fieldErrors.acceptedTerms}</span>
        )}

        <button type="submit" className={styles.submitButton} disabled={mutation.isPending}>
          {mutation.isPending ? 'Enviando...' : 'Criar conta'}
        </button>
      </form>

      <p className={styles.footerLink}>
        Já tem conta? <Link to="/login">Entrar</Link>
      </p>
    </div>
  );
}
