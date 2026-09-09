export function getErrorMessage(error, fallback = 'Something went wrong') {
  if (!error) return fallback;

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error?.message === 'string') {
    return error.message;
  }

  if (typeof error?.detail === 'string') {
    return error.detail;
  }

  if (Array.isArray(error?.detail)) {
    const messages = error.detail
      .map((item) => item?.msg)
      .filter(Boolean);

    if (messages.length) {
      return messages.join(', ');
    }
  }

  try {
    return JSON.stringify(error);
  } catch {
    return fallback;
  }
}
