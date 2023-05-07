const vscode = require("vscode");
const fs = require("fs");

async function activate(context: any) {
  const dartExtension = vscode.extensions.getExtension("dart-code.dart-code");
  if (!dartExtension) {
    vscode.window.showErrorMessage("Dart extension not found.");
    return;
  }

  if (!dartExtension.isActive) {
    await dartExtension.activate();
  }

  const originalProvideHover = dartExtension.exports._privateApi.analyzer.client._clientOptions.middleware.provideHover;

  // Override the provideHover method.
  dartExtension.exports._privateApi.analyzer.client._clientOptions.middleware.provideHover = async function (
    document: any,
    position: any,
    token: any,
    next: any
  ) {
    const hover = await originalProvideHover(document, position, token, next);

    // Modify the hover contents.
    if (hover && hover.contents) {
      const originalText = hover.contents[0].value;
      const newText = formatHoverText(originalText);
      hover.contents[0].value = newText;
      // console.log(originalText);
    }

    return hover;
  };
}

function formatHoverText(text) {
  return text.replace(/```dart([\s\S]*?)```/g, (match, code) => {
    const lines = code.split('\n');
    const firstTwoLines = lines.slice(0, 2).join('\n');
    const remainingLines = lines.slice(2).join('\n');
    const formattedCode = formatParameters(remainingLines);
    return '```dart' + firstTwoLines + '\n' + formattedCode + '```';
  });
}

function formatParameters(code) {
  const typeRegex = /((?:required\s+)?(([\w<>?]+(\s+Function\([^)]*\))?)\??)(\s+\w+)(\s+=\s+\w+)?)/g;
  return code.replace(typeRegex, (match, _, type, __, ___, name, defaultValue) => {
    const required = match.startsWith('required') ? 'required ' : '';
    return `${name.trim()}: ${required}${type}${defaultValue ? defaultValue : ''}`;
  });
}

exports.activate = activate;


