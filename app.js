(function () {
  'use strict';

  // Elements
  const form = document.getElementById('cover-form');
  const submitBtn = document.getElementById('submit-btn');

  const errorEl = document.getElementById('form-error');

  const emptyEl =
    document.getElementById('result-empty');

  const loadingEl =
    document.getElementById('result-loading');

  const outputEl =
    document.getElementById('result-output');

  const downloadBtn =
    document.getElementById('download-btn');

  const copyBtn =
    document.getElementById('copy-btn');

  // State
  let currentLetter = '';

  let currentMeta = {
    fullName: '',
    company: '',
    role: ''
  };

  // Error Handler
  function setError(message) {

    if (!message) {
      errorEl.hidden = true;
      errorEl.textContent = '';
      return;
    }

    errorEl.textContent = message;
    errorEl.hidden = false;
  }

  // Loading State
  function setLoading(isLoading) {

    submitBtn.disabled = isLoading;

    submitBtn.setAttribute(
      'aria-busy',
      String(isLoading)
    );

    if (isLoading) {

      emptyEl.hidden = true;
      outputEl.hidden = true;

      loadingEl.hidden = false;

    } else {

      loadingEl.hidden = true;
    }
  }

  // Show Generated Letter
  function showLetter(text) {

    currentLetter = text;

    outputEl.textContent = text;

    emptyEl.hidden = true;
    loadingEl.hidden = true;

    outputEl.hidden = false;

    downloadBtn.disabled = false;
    copyBtn.disabled = false;
  }

  // Read Form Data
  function readForm() {

    const data = new FormData(form);

    const obj = {};

    for (const [key, value] of data.entries()) {

      obj[key] =
        typeof value === 'string'
          ? value.trim()
          : value;
    }

    return obj;
  }

  // Safe PDF Filename
  function safeFilename(name) {

    return (
      (name || 'cover-letter')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60)
        || 'cover-letter'
    );
  }

  // Generate Cover Letter
  async function generate(payload) {

    const res = await fetch(
      'http://localhost:3001/api/generate',
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify(payload)
      }
    );

    let data = null;

    try {

      data = await res.json();

    } catch (_) {}

    if (!res.ok) {

      const msg =
        (data && data.error)
        || `Request failed (${res.status}).`;

      throw new Error(msg);
    }

    if (
      !data ||
      typeof data.coverLetter !== 'string' ||
      !data.coverLetter.trim()
    ) {

      throw new Error(
        'Empty response from the server.'
      );
    }

    return data.coverLetter.trim();
  }

  // Form Submit
  form.addEventListener(
    'submit',
    async (event) => {

      event.preventDefault();

      setError('');

      if (!form.checkValidity()) {

        form.reportValidity();
        return;
      }

      const payload = readForm();

      currentMeta = {
        fullName:
          payload.fullName || '',

        company:
          payload.company || '',

        role:
          payload.role || ''
      };

      setLoading(true);

      try {

        const letter =
          await generate(payload);

        showLetter(letter);

      } catch (err) {

        setError(
          err.message ||
          'Something went wrong.'
        );

        if (currentLetter) {

          outputEl.hidden = false;

        } else {

          emptyEl.hidden = false;
        }

      } finally {

        setLoading(false);
      }
    }
  );

  // Copy Button
  copyBtn.addEventListener(
    'click',
    async () => {

      if (!currentLetter) return;

      try {

        await navigator.clipboard.writeText(
          currentLetter
        );

        const original =
          copyBtn.textContent;

        copyBtn.textContent = 'Copied';

        copyBtn.disabled = true;

        setTimeout(() => {

          copyBtn.textContent = original;

          copyBtn.disabled = false;

        }, 1400);

      } catch (_) {

        setError(
          'Could not copy to clipboard.'
        );
      }
    }
  );

  // Download PDF
  downloadBtn.addEventListener(
    'click',
    () => {

      if (!currentLetter) return;

      const jsPDFCtor =
        window.jspdf &&
        window.jspdf.jsPDF;

      if (!jsPDFCtor) {

        setError(
          'PDF library failed to load.'
        );

        return;
      }

      const doc =
        new jsPDFCtor({
          unit: 'pt',
          format: 'letter'
        });

      const pageWidth =
        doc.internal.pageSize.getWidth();

      const pageHeight =
        doc.internal.pageSize.getHeight();

      const margin = 64;

      const maxWidth =
        pageWidth - margin * 2;

      let y = margin;

      // Header
      if (currentMeta.fullName) {

        doc.setFont('times', 'bold');

        doc.setFontSize(16);

        doc.text(
          currentMeta.fullName,
          margin,
          y
        );

        y += 22;
      }

      // Subtitle
      if (
        currentMeta.role ||
        currentMeta.company
      ) {

        doc.setFont(
          'times',
          'italic'
        );

        doc.setFontSize(11);

        const sub =
          [
            currentMeta.role,
            currentMeta.company
          ]
          .filter(Boolean)
          .join(' — ');

        doc.text(sub, margin, y);

        y += 18;
      }

      // Divider
      y += 8;

      doc.setDrawColor(180);

      doc.line(
        margin,
        y,
        pageWidth - margin,
        y
      );

      y += 18;

      // Body
      doc.setFont(
        'times',
        'normal'
      );

      doc.setFontSize(12);

      const paragraphs =
        currentLetter.split(/\n\s*\n/);

      const lineHeight = 16;

      for (const para of paragraphs) {

        const wrapped =
          doc.splitTextToSize(
            para
              .replace(/\s+\n/g, '\n')
              .trim(),
            maxWidth
          );

        for (const line of wrapped) {

          if (y > pageHeight - margin) {

            doc.addPage();

            y = margin;
          }

          doc.text(
            line,
            margin,
            y
          );

          y += lineHeight;
        }

        y += lineHeight * 0.6;
      }

      // Save PDF
      const filename =
        `cover-letter-${safeFilename(
          currentMeta.company ||
          currentMeta.fullName
        )}.pdf`;

      doc.save(filename);
    }
  );

})();