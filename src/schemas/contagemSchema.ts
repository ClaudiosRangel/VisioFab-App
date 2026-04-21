import { z } from 'zod';

export const contagemSchema = z
  .object({
    contadorInicial: z
      .number({ required_error: 'Obrigatório', invalid_type_error: 'Deve ser um número' })
      .int('Deve ser um número inteiro')
      .min(0, 'Deve ser maior ou igual a zero'),
    contadorFinal: z
      .number({ required_error: 'Obrigatório', invalid_type_error: 'Deve ser um número' })
      .int('Deve ser um número inteiro')
      .min(0, 'Deve ser maior ou igual a zero'),
  })
  .refine((data) => data.contadorFinal >= data.contadorInicial, {
    message: 'Contador Final deve ser maior ou igual ao Contador Inicial',
    path: ['contadorFinal'],
  });

export type ContagemFormValues = z.infer<typeof contagemSchema>;
