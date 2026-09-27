export function formatApiError(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }

  if (!error || typeof error !== 'object') {
    return 'Une erreur est survenue. Vérifiez vos informations.';
  }

  const response = error as {
    message?: string | string[] | ValidationDetails;
    error?: string | ValidationDetails;
  };
  const details = isValidationDetails(response.error)
    ? response.error
    : isValidationDetails(response.message)
      ? response.message
      : undefined;
  const message = details?.message
    ?? (typeof response.error === 'string' ? response.error : response.message);

  if (Array.isArray(message)) {
    return message.join(' ');
  }

  if (typeof message === 'string') {
    return message;
  }

  if (details) {
    const fieldMessages = Object.entries(details.fieldErrors ?? {})
      .flatMap(([field, messages]) => messages?.map((item) => `${fieldLabel(field)} : ${item}`) ?? []);
    const formMessages = details.formErrors ?? [];
    const validationMessages = [...fieldMessages, ...formMessages];
    if (validationMessages.length > 0) {
      return validationMessages.join(' ');
    }
  }

  return 'Une erreur est survenue. Vérifiez vos informations.';
}

type ValidationDetails = {
  message?: string | string[];
  formErrors?: string[];
  fieldErrors?: Record<string, string[] | undefined>;
};

function isValidationDetails(value: unknown): value is ValidationDetails {
  return typeof value === 'object' && value !== null;
}

function fieldLabel(field: string): string {
  const labels: Record<string, string> = {
    name: 'Nom complet',
    matricule: 'Matricule',
    password: 'Mot de passe',
    restaurantCode: 'Code restaurant',
    role: 'Rôle',
  };

  return labels[field] ?? field;
}
