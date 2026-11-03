import { describe, expect, it } from 'vitest';
import { formatApiError } from './auth-error';

describe('formatApiError', () => {
  it('formats strings and API messages', () => {
    expect(formatApiError('Erreur réseau')).toBe('Erreur réseau');
    expect(formatApiError({ message: 'Identifiants invalides.' })).toBe('Identifiants invalides.');
    expect(formatApiError({ message: ['Champ requis', 'Format invalide'] }))
      .toBe('Champ requis Format invalide');
  });

  it('formats validation field and form errors', () => {
    expect(formatApiError({
      error: {
        fieldErrors: { password: ['Trop court'] },
        formErrors: ['Formulaire invalide'],
      },
    })).toBe('Mot de passe : Trop court Formulaire invalide');
  });

  it('returns a fallback for unknown errors', () => {
    expect(formatApiError(null)).toBe('Une erreur est survenue. Vérifiez vos informations.');
    expect(formatApiError({ code: 'UNKNOWN' })).toBe('Une erreur est survenue. Vérifiez vos informations.');
  });
});
