type CopyFallbackWindow = Window & {
  clipboardData?: {
    setData: (format: string, data: string) => boolean;
  };
};

function copyViaHiddenTextarea(text: string): void {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '0';
  textarea.style.opacity = '0';

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  const ok = document.execCommand('copy');
  document.body.removeChild(textarea);

  if (!ok) {
    throw new Error('Copy failed');
  }
}

export async function copyTextToClipboard(text: string): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('Nothing to copy');
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(trimmed);
    return;
  }

  const win = window as CopyFallbackWindow;
  if (win.clipboardData?.setData) {
    const ok = win.clipboardData.setData('Text', trimmed);
    if (!ok) {
      throw new Error('Copy failed');
    }
    return;
  }

  copyViaHiddenTextarea(trimmed);
}

