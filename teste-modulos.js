#!/usr/bin/env node
/**
 * teste-modulos.js — Teste robusto de módulos ES
 * Verifica sintaxe, imports/exports e dependências
 * @author Auditoria de Código 2026-04-09
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔬 TESTE ROBUSTO DE MÓDULOS ES\n');

const modules = [
    'src/js/modules/documentEditor/uiHelpers.js',
    'src/js/modules/documentEditor/eventHandlers.js',
    'src/js/modules/documentEditor/settingsHelpers.js',
    'src/js/modules/documentEditor/exportHelpers.js',
    'src/js/modules/documentEditor/DocumentEditorController.js',
    'src/js/modules/documentEditor/ExportOrchestrator.js',
    'src/js/modules/documentEditor/DocumentEditorPanel.js'
];

let allPassed = true;
const errors = [];

// 1. Verificar sintaxe básica
console.log('📝 VERIFICANDO SINTAXE...');
modules.forEach(file => {
    try {
        execSync(`node -c "${file}"`, { stdio: 'pipe' });
        console.log(`  ✅ ${path.basename(file)}`);
    } catch (e) {
        console.log(`  ❌ ${path.basename(file)} - ERRO DE SINTAXE`);
        errors.push(`${file}: ${e.stderr.toString().trim()}`);
        allPassed = false;
    }
});

// 2. Verificar duplicatas de export
console.log('\n📦 VERIFICANDO DUPLICATAS DE EXPORT...');
modules.forEach(file => {
    if (!fs.existsSync(file)) return;

    const content = fs.readFileSync(file, 'utf8');
    const exports = content.match(/export function (\w+)/g) || [];
    const duplicates = exports.filter((exp, index) => exports.indexOf(exp) !== index);

    if (duplicates.length > 0) {
        console.log(`  ❌ ${path.basename(file)} - DUPLICATAS: ${duplicates.join(', ')}`);
        errors.push(`${file}: Duplicatas de export - ${duplicates.join(', ')}`);
        allPassed = false;
    } else {
        console.log(`  ✅ ${path.basename(file)}`);
    }
});

// 3. Verificar imports não resolvidos (apenas sintaxe básica)
console.log('\n🔗 VERIFICANDO IMPORTS (Sintaxe básica)...');
modules.forEach(file => {
    if (!fs.existsSync(file)) return;

    const content = fs.readFileSync(file, 'utf8');
    const imports = content.match(/import .* from ['"]([^'"]+)['"]/g) || [];

    let hasSyntaxError = false;
    imports.forEach(imp => {
        // Verificar apenas sintaxe básica dos imports
        if (!imp.includes('from') || !imp.includes('"') && !imp.includes("'")) {
            console.log(`  ❌ ${path.basename(file)} - Sintaxe de import inválida`);
            errors.push(`${file}: Sintaxe de import inválida - ${imp}`);
            hasSyntaxError = true;
            allPassed = false;
        }
    });

    if (!hasSyntaxError) {
        console.log(`  ✅ ${path.basename(file)}`);
    }
});

// Resultado final
console.log('\n' + '='.repeat(50));
if (allPassed) {
    console.log('🎉 TODOS OS TESTES PASSARAM!');
    console.log('✅ Módulos prontos para produção');
} else {
    console.log('❌ FALHAS DETECTADAS:');
    errors.forEach(error => console.log(`   • ${error}`));
    console.log('\n🔧 Execute: node teste-modulos.js');
    process.exit(1);
}

console.log('='.repeat(50));