import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import type { FormIssue } from './validate-tournament-form';

// Helper único que consome tanto ApiError.issues (backend) quanto o retorno
// de validateTournamentCrossFields (mesma shape {path, message}) — um só
// código pra pintar erro de campo no RHF, seja a origem client ou server.
export function applyIssuesToForm<T extends FieldValues>(
  issues: FormIssue[],
  setError: UseFormSetError<T>,
): void {
  for (const issue of issues) {
    const path = issue.path.join('.') as Path<T>;
    setError(path, { type: 'server', message: issue.message });
  }
}
