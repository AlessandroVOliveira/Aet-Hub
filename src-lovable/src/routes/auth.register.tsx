import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthLayout, Field } from "./auth.login";
import { cepMock } from "@/lib/mock";

export const Route = createFileRoute("/auth/register")({
  head: () => ({
    meta: [
      { title: "Cadastro — AET Hub" },
      { name: "description", content: "Crie sua conta AET, escolha sua gamer tag e entre na cena de esports do pampa." },
    ],
  }),
  component: Register,
});

const steps = ["Dados", "Perfil Gamer", "Endereço"];

function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [cep, setCep] = useState("");
  const cepInfo = cepMock[cep.replace(/\D/g, "")];

  return (
    <AuthLayout eyebrow="NEW_PLAYER" title="CRIAR" accent="CONTA">
      <ol className="flex items-center gap-2 mb-6 font-mono text-[10px] uppercase">
        {steps.map((s, i) => (
          <li key={s} className="flex-1 flex items-center gap-2">
            <span
              className={`size-6 grid place-items-center italic font-display ${
                i <= step ? "bg-ember text-white" : "bg-navy-light text-silver-muted"
              }`}
            >
              {i + 1}
            </span>
            <span className={i === step ? "text-silver" : "text-silver-muted"}>{s}</span>
          </li>
        ))}
      </ol>

      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        {step === 0 && (
          <>
            <Field label="NOME COMPLETO" placeholder="Lucas Almeida" />
            <Field label="EMAIL" type="email" placeholder="voce@aet.gg" />
            <Field label="SENHA" type="password" placeholder="mínimo 8 caracteres" />
            <Field label="CONFIRMAR SENHA" type="password" />
          </>
        )}
        {step === 1 && (
          <>
            <Field label="GAMER TAG" placeholder="gaucho_slayer" />
            <div>
              <span className="font-mono text-[10px] text-silver-muted uppercase tracking-widest">
                JOGOS FAVORITOS
              </span>
              <div className="flex flex-wrap gap-2 mt-2">
                {["SF6", "Tekken 8", "Valorant", "CS2", "Rocket League", "LoL"].map((g) => (
                  <label
                    key={g}
                    className="px-3 py-1 bg-navy-light ring-1 ring-silver/20 text-xs font-mono uppercase cursor-pointer hover:ring-ember/50 has-[:checked]:bg-ember has-[:checked]:text-white has-[:checked]:ring-ember"
                  >
                    <input type="checkbox" className="hidden" />
                    {g}
                  </label>
                ))}
              </div>
            </div>
            <Field label="PLATAFORMA PRINCIPAL" placeholder="PC / PS5 / Xbox" />
          </>
        )}
        {step === 2 && (
          <>
            <Field
              label="CEP"
              placeholder="97542-000"
              value={cep}
              onChange={(e) => setCep(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <Field label="CIDADE" value={cepInfo?.city ?? ""} readOnly />
              <Field label="UF" value={cepInfo?.uf ?? ""} readOnly />
            </div>
            <Field label="RUA" value={cepInfo?.street ?? ""} readOnly />
            <Field label="NÚMERO" placeholder="123" />
            <p className="text-[10px] font-mono text-silver-muted">
              Tente 97542000 ou 97500000 para preenchimento automático.
            </p>
          </>
        )}

        <div className="flex gap-2 pt-2">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex-1 py-3 bg-navy-light ring-1 ring-silver/20 font-mono text-xs uppercase tracking-widest hover:ring-ember/40"
            >
              Voltar
            </button>
          )}
          <button
            type="button"
            onClick={() => (step < 2 ? setStep(step + 1) : navigate({ to: "/" }))}
            className="flex-1 bg-ember hover:bg-ember-glow text-white font-display py-3 tracking-widest uppercase italic transition-colors"
          >
            {step < 2 ? "Continuar" : "Finalizar"}
          </button>
        </div>

        <p className="text-xs text-silver-muted text-center pt-4">
          Já tem conta?{" "}
          <Link to="/auth/login" className="text-ember hover:underline font-bold uppercase">
            Entrar
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}