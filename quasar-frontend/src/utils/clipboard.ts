export type CopyTextResult = 'clipboard' | 'execCommand' | 'manual';

function legacyCopy(text: string): boolean {
  if (typeof document === 'undefined' || !document.body) {
    return false;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.left = '-9999px';
  textarea.style.opacity = '0';

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  let copied = false;
  try {
    copied = document.execCommand('copy');
  } catch {
    copied = false;
  } finally {
    document.body.removeChild(textarea);
  }

  return copied;
}

export async function copyText(text: string): Promise<CopyTextResult> {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return 'clipboard';
  }

  if (legacyCopy(text)) {
    return 'execCommand';
  }

  if (typeof window !== 'undefined' && typeof window.prompt === 'function') {
    window.prompt('คัดลอกลิงก์นี้ด้วยตนเอง', text);
    return 'manual';
  }

  throw new Error('Clipboard copy is unavailable');
}
