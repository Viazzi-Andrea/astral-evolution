export async function generatePDF(
  content: string,
  title: string,
  subtitle: string
): Promise<Buffer> {
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        @page {
            margin: 2cm;
            size: A4;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            font-size: 11pt;
        }

        .cover {
            text-align: center;
            padding: 4cm 2cm;
            page-break-after: always;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }

        .cover h1 {
            font-size: 36pt;
            margin-bottom: 0.5cm;
            font-weight: 700;
        }

        .cover h2 {
            font-size: 18pt;
            margin-bottom: 2cm;
            font-weight: 400;
            opacity: 0.9;
        }

        .cover .logo {
            font-size: 14pt;
            margin-top: 3cm;
            opacity: 0.7;
        }

        h1 {
            font-size: 24pt;
            margin-top: 1.5cm;
            margin-bottom: 0.5cm;
            color: #667eea;
            page-break-after: avoid;
        }

        h2 {
            font-size: 18pt;
            margin-top: 1cm;
            margin-bottom: 0.4cm;
            color: #764ba2;
            page-break-after: avoid;
        }

        h3 {
            font-size: 14pt;
            margin-top: 0.8cm;
            margin-bottom: 0.3cm;
            color: #555;
            page-break-after: avoid;
        }

        p {
            margin-bottom: 0.5cm;
            text-align: justify;
        }

        ul, ol {
            margin-left: 1cm;
            margin-bottom: 0.5cm;
        }

        li {
            margin-bottom: 0.2cm;
        }

        .page-break {
            page-break-before: always;
        }

        .highlight-box {
            background-color: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 0.5cm;
            margin: 0.5cm 0;
        }

        .footer {
            position: fixed;
            bottom: 1cm;
            left: 2cm;
            right: 2cm;
            text-align: center;
            font-size: 9pt;
            color: #999;
            border-top: 1px solid #e0e0e0;
            padding-top: 0.3cm;
        }

        strong {
            color: #333;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="cover">
        <h1>${title}</h1>
        <h2>${subtitle}</h2>
        <div class="logo">Astral Evolution</div>
    </div>

    <div class="content">
        ${formatContent(content)}
    </div>

    <div class="footer">
        <p>© ${new Date().getFullYear()} Astral Evolution | Este informe es confidencial y personal</p>
    </div>
</body>
</html>
  `;

  return Buffer.from('PDF_PLACEHOLDER');
}

function formatContent(content: string): string {
  let formatted = content
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');

  formatted = formatted.replace(/^(#{1,3})\s+(.+)$/gm, (match, hashes, title) => {
    const level = hashes.length;
    return `<h${level}>${title}</h${level}>`;
  });

  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');

  formatted = formatted.replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>');
  formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

  formatted = `<p>${formatted}</p>`;

  return formatted;
}
