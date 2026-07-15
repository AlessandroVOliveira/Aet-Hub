import { AppError } from './app-error.js';

const ALEGRETE_CITY = 'alegrete';
const ALEGRETE_STATE = 'RS';

interface ViaCepResponse {
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export interface ValidatedAddress {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  validatedVia: 'viacep';
}

// RF-05 é um gate obrigatório do cadastro: só gente de Alegrete/RS pode se
// cadastrar. Por isso a validação é fail-closed — se a ViaCEP (fonte
// oficial, espelha a base dos Correios) não puder confirmar o CEP, o
// cadastro é rejeitado em vez de cair num fallback impreciso.
export async function validateAlegreteAddress(cep: string): Promise<ValidatedAddress> {
  const digitsOnly = cep.replace(/\D/g, '');

  if (digitsOnly.length !== 8) {
    throw new AppError('CEP inválido: informe os 8 dígitos', 422);
  }

  let response: Response;
  try {
    response = await fetch(`https://viacep.com.br/ws/${digitsOnly}/json/`);
  } catch {
    throw new AppError('Não foi possível validar o CEP no momento, tente novamente', 503);
  }

  if (!response.ok) {
    throw new AppError('Não foi possível validar o CEP no momento, tente novamente', 503);
  }

  const data = (await response.json()) as ViaCepResponse;

  if (data.erro) {
    throw new AppError('CEP não encontrado', 422);
  }

  if (data.localidade.trim().toLowerCase() !== ALEGRETE_CITY || data.uf !== ALEGRETE_STATE) {
    throw new AppError('Cadastro disponível apenas para moradores de Alegrete/RS', 422);
  }

  return {
    cep: digitsOnly,
    street: data.logradouro,
    neighborhood: data.bairro,
    city: data.localidade,
    state: data.uf,
    validatedVia: 'viacep',
  };
}
