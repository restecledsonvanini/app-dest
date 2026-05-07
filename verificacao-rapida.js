#!/usr/bin/env node
/**
 * VERIFICAÇÃO RÁPIDA – Auditoria do Código em 5 minutos
 * Cole no terminal para validar integridade do código
 * 
 * @author Auditoria de Código 2026-04-09
 * 
 * Uso:
 *   node verificacao-rapida.js
 *   (ou execute os comandos manualmente)
 */

const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'src/js');
const issues = [];
const warnings = [];
const successes = [];

console.log('\n🔍 VERIFICAÇÃO RÁPIDA DE INTEGRIDADE DO CÓDIGO\n');
console.log('='.repeat(60));

// 1. VERIFICAÇÃO: Limite de 250 linhas
console.log('\n✅ 1. VERIFICANDO LIMITE DE 250 LINHAS/ARQUIVO\n');

const files = [];
function walkDir(dir) {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
        const itemPath = path.join(dir, item);
        if (fs.statSync(itemPath).isDirectory()) {
            walkDir(itemPath);
        } else if (item.endsWith('.js')) {
            files.push(itemPath);
        }
    });
}
walkDir(srcPath);

let maxLines = 0;
let maxFile = '';

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n').length - 1;

    if (lines > 250) {
        issues.push(`   ❌ ${file.replace(srcPath, '')}: ${lines} linhas (exceeds 250)`);
    } else if (lines > 200) {
        warnings.push(`   ⚠️  ${file.replace(srcPath, '')}: ${lines} linhas (próximo do limite)`);
    } else {
        successes.push(`   ✅ ${file.replace(srcPath, '')}: ${lines} linhas OK`);
    }

    if (lines > maxLines) {
        maxLines = lines;
        maxFile = file.replace(srcPath, '');
    }
});

console.log(`Total arquivos JS: ${files.length}`);
console.log(`Maior arquivo: ${maxFile} (${maxLines} linhas)`);
console.log(`\nArquivos fora do limite:`);
issues.forEach(i => console.log(i));
console.log(`\nArquivos próximos do limite:`);
warnings.forEach(w => console.log(w));

// 2. VERIFICAÇÃO: Hard-coded strings
console.log('\n✅ 2. VERIFICANDO HARD-CODED STRINGS (CentralizadasS?)\n');

const hardcodedPatterns = [
    { pattern: /SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA/g, name: 'SECRETARIA...' },
    { pattern: /\.docx(?![\w-])/g, name: '".docx"' },
    { pattern: /\/src\/images\//g, name: 'Paths' },
];

let hardcodedCount = 0;
files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    // Skip config files
    if (file.includes('config/')) return;

    hardcodedPatterns.forEach(({ pattern, name }) => {
        const matches = content.match(pattern) || [];
        if (matches.length > 0 && !file.includes('config')) {
            hardcodedCount += matches.length;
            console.log(`   ⚠️  ${path.basename(file)}: ${matches.length}x "${name}"`);
        }
    });
});

if (hardcodedCount === 0) {
    console.log('   ✅ Nenhuma hard-coded string crítica encontrada!');
} else {
    console.log(`\n   🔴 Total: ${hardcodedCount} hard-coded strings `);
    console.log('   → Migrate para src/js/config/messages.js');
}

// 3. VERIFICAÇÃO: Timeout implementado
console.log('\n✅ 3. VERIFICANDO TIMEOUT NAS APIs\n');

const apiCheckFile = path.join(srcPath, 'services', 'BrasilAPIService.js');
if (fs.existsSync(apiCheckFile)) {
    const content = fs.readFileSync(apiCheckFile, 'utf8');
    if (content.includes('AbortController') && content.includes('setTimeout')) {
        console.log('   ✅ BrasilAPIService.js tem timeout + AbortController');
        successes.push('   ✅ API timeout implementado');
    }
} else {
    console.log('   ⚠️  BrasilAPIService.js não encontrado');
    console.log('   → Execute: git pull origin (para ler soluções criadas)');
}

// 4. VERIFICAÇÃO: Factory Pattern
console.log('\n✅ 4. VERIFICANDO PADRÕES (Factory, DI)\n');

const factoryCheckFile = path.join(srcPath, 'handlers', 'MaskHandlerFactory.js');
if (fs.existsSync(factoryCheckFile)) {
    const content = fs.readFileSync(factoryCheckFile, 'utf8');
    if (content.includes('createMaskHandler')) {
        console.log('   ✅ MaskHandlerFactory.js implementado');
        successes.push('   ✅ Factory Pattern detectado');
    }
} else {
    console.log('   ℹ️  MaskHandlerFactory.js não encontrado');
    console.log('   → Rode novamente após executar GUIA_IMPLEMENTACAO.md');
}

// 5. VERIFICAÇÃO: Configuration Center
console.log('\n✅ 5. VERIFICANDO CONFIGURAÇÃO CENTRALIZADA\n');

const configFiles = [
    'config/messages.js',
    'config/institution.js',
    'config/patterns.js'
];

configFiles.forEach(f => {
    const configPath = path.join(srcPath, f);
    if (fs.existsSync(configPath)) {
        console.log(`   ✅ ${f} existe`);
        successes.push(`   ✅ ${f} detectado`);
    } else {
        console.log(`   ⚠️  ${f} não encontrado`);
    }
});

// 6. VERIFICAÇÃO: Error Handling
console.log('\n✅ 6. VERIFICANDO ERROR HANDLING CENTRALIZADO\n');

const errorCheckFile = path.join(srcPath, 'services', 'ErrorHandler.js');
if (fs.existsSync(errorCheckFile)) {
    const content = fs.readFileSync(errorCheckFile, 'utf8');
    if (content.includes('class AppError') && content.includes('ERROR_TYPE')) {
        console.log('   ✅ ErrorHandler.js tem AppError centralizado');
        successes.push('   ✅ Error handling centralizado');
    }
} else {
    console.log('   ℹ️  ErrorHandler.js não encontrado (criado mas não integrado)');
}

// RESUMO FINAL
console.log('\n' + '='.repeat(60));
console.log('\n📊 RESUMO DA VERIFICAÇÃO\n');

console.log(`✅ Sucessos: ${successes.length}`);
console.log(`⚠️  Avisos: ${warnings.length}`);
console.log(`❌ Problemas: ${issues.length}`);

if (issues.length === 0 && hardcodedCount === 0) {
    console.log('\n🎉 CÓDIGO PASSOU NA VERIFICAÇÃO!\n');
} else {
    console.log('\n⚠️  AÇÕES NECESSÁRIAS:\n');
    if (issues.length > 0) {
        console.log('   1. Reduzir tamanho de arquivos (> 250 linhas)');
        console.log('      → Veja GUIA_IMPLEMENTACAO.md');
    }
    if (hardcodedCount > 0) {
        console.log('   2. Centralizar hard-coded strings');
        console.log('      → Veja AUDITORIA_CODIGO_RIGOROSA.md');
    }
    console.log('\n');
}

console.log('📖 Referências:');
console.log('   - AUDITORIA_CODIGO_RIGOROSA.md — Análise completa');
console.log('   - GUIA_IMPLEMENTACAO.md — Passo-a-passo');
console.log('   - SUMARIO_EXECUTIVO.md — Visão geral\n');

process.exit(issues.length > 0 ? 1 : 0);
