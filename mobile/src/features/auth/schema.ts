import { z } from 'zod';

export const authFields = z.object({
  name: z.string(),
  email: z.email('Enter a valid email address.'),
  password: z
    .string()
    .min(8, 'Use at least 8 characters.')
    .max(72, 'Use at most 72 characters.')
    .refine(
      (value) => new TextEncoder().encode(value).length <= 72,
      'Use at most 72 bytes for your password.',
    ),
  confirm: z.string(),
});

export function authSchema(register: boolean) {
  return authFields.superRefine((data, context) => {
    if (register && !data.name.trim()) {
      context.addIssue({ code: 'custom', path: ['name'], message: 'Enter your name.' });
    }
    if (register && data.password !== data.confirm) {
      context.addIssue({
        code: 'custom',
        path: ['confirm'],
        message: 'Passwords do not match.',
      });
    }
  });
}
