import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthLayout, Field } from "./auth.login";

export const Route = createFileRoute("/auth/recover")({
  head: () => ({
    meta: [
      { title: "Recuperar senha — AET Hub" },
      { name: "description", content: "Recupere o acesso à sua conta AET." },
    ],
  }),
  component: Recover,
});

function Recover() {
  return (
    <AuthLayout eyebrow="RESET_ACCESS" title="RECUPERAR" accent="SENHA">
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <p className="text-sm text-silver-muted">
          Informe seu email cadastrado. Vamos enviar um link para redefinir a senha.
        </p>
        <Field label="EMAIL" type="email" placeholder="voce@aet.gg" />
        <button className="w-full bg-ember hover:bg-ember-glow text-white font-display py-3 tracking-widest uppercase italic transition-colors">
          Enviar link
        </button>
        <p className="text-xs text-silver-muted text-center pt-4">
          Lembrou?{" "}
          <Link to="/auth/login" className="text-ember hover:underline font-bold uppercase">
            Voltar ao login
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}