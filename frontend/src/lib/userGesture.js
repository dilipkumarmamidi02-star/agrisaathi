let hasInteracted = false;

if (typeof window !== 'undefined') {
  const markInteracted = () => {
    hasInteracted = true;
    window.removeEventListener('click', markInteracted);
    window.removeEventListener('keydown', markInteracted);
    window.removeEventListener('touchstart', markInteracted);
  };
  window.addEventListener('click', markInteracted, { once: true });
  window.addEventListener('keydown', markInteracted, { once: true });
  window.addEventListener('touchstart', markInteracted, { once: true });
}

export function userHasInteracted() {
  return hasInteracted;
}

export function speakWhenReady(speakFn) {
  if (hasInteracted) {
    speakFn();
    return;
  }
  const trigger = () => {
    speakFn();
    window.removeEventListener('click', trigger);
    window.removeEventListener('keydown', trigger);
    window.removeEventListener('touchstart', trigger);
  };
  window.addEventListener('click', trigger, { once: true });
  window.addEventListener('keydown', trigger, { once: true });
  window.addEventListener('touchstart', trigger, { once: true });
}
