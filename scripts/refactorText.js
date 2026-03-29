const fs = require('fs');
const path = require('path');

function refactor(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            refactor(fullPath);
        } else if (fullPath.endsWith('.tsx') && !fullPath.includes('StyledText.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let hasChanges = false;
            let needsText = false;
            let needsTextInput = false;

            content = content.replace(/import\s+{([^}]*)}\s+from\s+['"]react-native['"];?/g, (match, importsStr) => {
                let imports = importsStr.split(',').map(s => s.trim()).filter(Boolean);
                
                if (imports.includes('Text')) {
                    needsText = true;
                    hasChanges = true;
                }
                if (imports.includes('TextInput')) {
                    needsTextInput = true;
                    hasChanges = true;
                }
                
                imports = imports.filter(i => i !== 'Text' && i !== 'TextInput');
                
                if (imports.length === 0) return '';
                return `import { ${imports.join(', ')} } from 'react-native';`;
            });

            if (hasChanges) {
                const importString = `import { ${[needsText && 'Text', needsTextInput && 'TextInput'].filter(Boolean).join(', ')} } from '@/app/components/StyledText';\n`;
                content = importString + content;
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Updated', fullPath);
            }
        }
    }
}

refactor(path.join(process.cwd(), 'app'));
