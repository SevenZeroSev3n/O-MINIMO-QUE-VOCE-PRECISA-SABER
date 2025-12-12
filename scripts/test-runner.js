#!/usr/bin/env node

/**
 * Test Runner com Painel Visual
 * Executa testes do Backend e Frontend com visualização no terminal
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

// Cores ANSI
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',

  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
};

const c = colors;

// Símbolos
const symbols = {
  check: '✓',
  cross: '✗',
  bullet: '•',
  arrow: '→',
  line: '─',
  doubleLine: '═',
};

// Utilitários
function clearLine() {
  process.stdout.write('\r\x1b[K');
}

function printLine(char = symbols.line, length = 60) {
  console.log(c.dim + char.repeat(length) + c.reset);
}

function printDoubleLine(length = 60) {
  console.log(c.cyan + symbols.doubleLine.repeat(length) + c.reset);
}

function printHeader() {
  console.clear();
  printDoubleLine();
  console.log(c.bold + c.cyan + '  🧪 TEST RUNNER - O Mínimo que Você Precisa' + c.reset);
  console.log(c.dim + '     Testes Automatizados Backend & Frontend' + c.reset);
  printDoubleLine();
  console.log();
}

function printSectionHeader(title, emoji = '📦') {
  console.log();
  printLine();
  console.log(c.bold + `  ${emoji} ${title}` + c.reset);
  printLine();
}

function printStatus(label, status, details = '') {
  const statusIcon = status === 'pass'
    ? c.green + symbols.check
    : status === 'fail'
      ? c.red + symbols.cross
      : c.yellow + symbols.bullet;

  const statusText = status === 'pass'
    ? c.green + 'PASSOU'
    : status === 'fail'
      ? c.red + 'FALHOU'
      : c.yellow + 'PULADO';

  console.log(`  ${statusIcon} ${c.reset}${label} ${c.dim}${symbols.arrow}${c.reset} ${statusText}${c.reset} ${c.dim}${details}${c.reset}`);
}

function printSummary(results) {
  console.log();
  printDoubleLine();
  console.log(c.bold + '  📊 RESUMO FINAL' + c.reset);
  printDoubleLine();
  console.log();

  const totalPassed = results.filter(r => r.status === 'pass').length;
  const totalFailed = results.filter(r => r.status === 'fail').length;
  const totalSkipped = results.filter(r => r.status === 'skip').length;

  // Barra de progresso visual
  const total = results.length;
  const barLength = 40;
  const passedBar = Math.round((totalPassed / total) * barLength);
  const failedBar = Math.round((totalFailed / total) * barLength);

  const progressBar =
    c.bgGreen + ' '.repeat(passedBar) + c.reset +
    c.bgRed + ' '.repeat(failedBar) + c.reset +
    c.bgYellow + ' '.repeat(barLength - passedBar - failedBar) + c.reset;

  console.log(`  ${progressBar}`);
  console.log();

  // Estatísticas
  console.log(`  ${c.green}${symbols.check} Passou:${c.reset}  ${totalPassed}`);
  console.log(`  ${c.red}${symbols.cross} Falhou:${c.reset}  ${totalFailed}`);
  if (totalSkipped > 0) {
    console.log(`  ${c.yellow}${symbols.bullet} Pulado:${c.reset}  ${totalSkipped}`);
  }
  console.log();

  // Status final
  if (totalFailed === 0) {
    console.log(c.bgGreen + c.bold + '                                                            ' + c.reset);
    console.log(c.bgGreen + c.bold + '   ✅ TODOS OS TESTES PASSARAM!                             ' + c.reset);
    console.log(c.bgGreen + c.bold + '                                                            ' + c.reset);
  } else {
    console.log(c.bgRed + c.bold + '                                                            ' + c.reset);
    console.log(c.bgRed + c.bold + `   ❌ ${totalFailed} TESTE(S) FALHARAM                                    ` + c.reset);
    console.log(c.bgRed + c.bold + '                                                            ' + c.reset);
  }

  console.log();
  printDoubleLine();
}

function runCommand(command, args, cwd, name) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let output = '';
    let passed = 0;
    let failed = 0;

    const proc = spawn(command, args, {
      cwd,
      shell: true,
      env: { ...process.env, FORCE_COLOR: '1' }
    });

    proc.stdout.on('data', (data) => {
      output += data.toString();
    });

    proc.stderr.on('data', (data) => {
      output += data.toString();
    });

    proc.on('close', (code) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      // Parse output para contar testes
      // Vitest format: "Tests  44 passed (44)" - precisa da linha específica
      const lines = output.split('\n');
      for (const line of lines) {
        // Linha de resumo do Vitest: "Tests  44 passed (44)" ou "Tests  7 failed | 37 passed (44)"
        if (line.includes('Tests') && line.includes('passed')) {
          const passMatch = line.match(/(\d+)\s+passed/);
          const failMatch = line.match(/(\d+)\s+failed/);
          if (passMatch) passed = parseInt(passMatch[1]);
          if (failMatch) failed = parseInt(failMatch[1]);
          break;
        }
      }

      // Formato Node test runner: "# pass 25" ou "✔ pass 25"
      if (!passed) {
        const nodePassMatch = output.match(/(?:#|✔)\s*pass\s+(\d+)/i);
        const nodeFailMatch = output.match(/(?:#|✖)\s*fail\s+(\d+)/i);
        if (nodePassMatch) passed = parseInt(nodePassMatch[1]);
        if (nodeFailMatch) failed = parseInt(nodeFailMatch[1]);
      }

      resolve({
        name,
        status: code === 0 ? 'pass' : 'fail',
        passed,
        failed,
        duration,
        output,
        exitCode: code
      });
    });

    proc.on('error', (err) => {
      resolve({
        name,
        status: 'fail',
        passed: 0,
        failed: 1,
        duration: '0',
        output: err.message,
        exitCode: 1
      });
    });
  });
}

async function checkServerRunning() {
  try {
    const response = await fetch('http://127.0.0.1:3000');
    return response.ok;
  } catch {
    return false;
  }
}

async function main() {
  const results = [];
  const args = process.argv.slice(2);
  const runBackend = args.includes('--backend') || args.includes('-b') || args.length === 0;
  const runFrontend = args.includes('--frontend') || args.includes('-f') || args.length === 0;
  const showOutput = args.includes('--verbose') || args.includes('-v');

  printHeader();

  // Frontend Tests
  if (runFrontend) {
    printSectionHeader('TESTES DO FRONTEND (React + Vitest)', '⚛️');
    console.log(c.dim + '  Executando testes...' + c.reset);

    const frontendResult = await runCommand(
      'npm',
      ['run', 'test:run'],
      join(ROOT_DIR, 'english-page'),
      'Frontend'
    );

    clearLine();
    printStatus(
      'React Components & Services',
      frontendResult.status,
      `(${frontendResult.passed} passou, ${frontendResult.failed} falhou) ${frontendResult.duration}s`
    );

    if (showOutput && frontendResult.output) {
      console.log(c.dim + '\n  Output:' + c.reset);
      console.log(frontendResult.output.split('\n').map(l => '    ' + l).join('\n'));
    }

    results.push(frontendResult);
  }

  // Backend Tests
  if (runBackend) {
    printSectionHeader('TESTES DO BACKEND (Node.js + Supertest)', '🖥️');

    // Verifica se o servidor está rodando
    const serverRunning = await checkServerRunning();

    if (!serverRunning) {
      console.log(c.yellow + '  ⚠️  Servidor não está rodando em localhost:3000' + c.reset);
      console.log(c.dim + '     Execute "npm run dev" em outro terminal primeiro' + c.reset);
      console.log();

      results.push({
        name: 'Backend',
        status: 'skip',
        passed: 0,
        failed: 0,
        duration: '0',
        output: 'Servidor não está rodando'
      });

      printStatus('API Endpoints', 'skip', '(servidor offline)');
    } else {
      console.log(c.dim + '  Executando testes...' + c.reset);

      const backendResult = await runCommand(
        'npm',
        ['test'],
        ROOT_DIR,
        'Backend'
      );

      clearLine();
      printStatus(
        'API Endpoints & Auth',
        backendResult.status,
        `(${backendResult.passed} passou, ${backendResult.failed} falhou) ${backendResult.duration}s`
      );

      if (showOutput && backendResult.output) {
        console.log(c.dim + '\n  Output:' + c.reset);
        console.log(backendResult.output.split('\n').map(l => '    ' + l).join('\n'));
      }

      results.push(backendResult);
    }
  }

  // Resumo
  printSummary(results);

  // Exit code
  const hasFailures = results.some(r => r.status === 'fail');
  process.exit(hasFailures ? 1 : 0);
}

main().catch(console.error);
