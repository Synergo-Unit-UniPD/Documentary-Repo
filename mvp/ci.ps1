<#
.SYNOPSIS
    Equivalente PowerShell del Makefile, per chi non ha `make` disponibile
    (es. Windows senza winget/choco/scoop). Riproduce esattamente gli stessi
    comandi usati dalla pipeline CI (.github/workflows/ci.yml).

.USAGE
    Da dentro la cartella mvp/:
        .\ci.ps1              # equivalente a "make ci": lint + format-check + typecheck + coverage (con test) + build
        .\ci.ps1 lint
        .\ci.ps1 format
        .\ci.ps1 format-check
        .\ci.ps1 typecheck
        .\ci.ps1 test
        .\ci.ps1 coverage
        .\ci.ps1 ci            # esplicito, stesso effetto di nessun argomento

    Se PowerShell si rifiuta di eseguire lo script (Execution Policy),
    lancialo così, una tantum per sessione:
        powershell -ExecutionPolicy Bypass -File .\ci.ps1 ci

.PREREQUISITI
    - Python + virtualenv con backend\requirements-dev.txt installato
      (cd backend; python -m venv .venv; .venv\Scripts\Activate.ps1;
       pip install -r requirements-dev.txt)
    - Node + `npm install` già eseguito in frontend\
#>

param(
    [Parameter(Position = 0)]
    [ValidateSet('ci', 'lint', 'lint-fix', 'format', 'format-check', 'typecheck', 'test', 'coverage')]
    [string]$Target = 'ci'
)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot

function Invoke-Step {
    param([string]$Description, [scriptblock]$Command)
    Write-Host ""
    Write-Host "==> $Description" -ForegroundColor Cyan
    & $Command
    if ($LASTEXITCODE -ne 0) {
        Write-Host "FALLITO: $Description (exit code $LASTEXITCODE)" -ForegroundColor Red
        exit $LASTEXITCODE
    }
}

function Lint-Backend {
    Invoke-Step "Backend: ruff check" { Set-Location "$root\backend"; ruff check . }
}
function Lint-Frontend {
    Invoke-Step "Frontend: eslint" { Set-Location "$root\frontend"; npx eslint . }
}
function LintFix-Backend {
    Invoke-Step "Backend: ruff check --fix" { Set-Location "$root\backend"; ruff check . --fix }
}
function LintFix-Frontend {
    Invoke-Step "Frontend: eslint --fix (npm run lint)" { Set-Location "$root\frontend"; npm run lint }
}
function Format-Backend {
    Invoke-Step "Backend: ruff format" { Set-Location "$root\backend"; ruff format . }
}
function Format-Frontend {
    Invoke-Step "Frontend: prettier --write" { Set-Location "$root\frontend"; npx prettier --write "src/**/*.{ts,vue,css}" }
}
function FormatCheck-Backend {
    Invoke-Step "Backend: ruff format --check" { Set-Location "$root\backend"; ruff format --check . }
}
function FormatCheck-Frontend {
    Invoke-Step "Frontend: prettier --check" { Set-Location "$root\frontend"; npx prettier --check "src/**/*.{ts,vue,css}" }
}
function Typecheck-Backend {
    Invoke-Step "Backend: mypy" { Set-Location "$root\backend"; mypy . }
}
function Typecheck-Frontend {
    Invoke-Step "Frontend: vue-tsc (npm run type-check)" { Set-Location "$root\frontend"; npm run type-check }
}
function Test-Backend {
    Invoke-Step "Backend: pytest" { Set-Location "$root\backend"; pytest -v }
}
function Test-Frontend {
    Invoke-Step "Frontend: vitest run (npm run test:unit)" { Set-Location "$root\frontend"; npm run test:unit }
}
function Coverage-Backend {
    Invoke-Step "Backend: pytest --cov (soglia 90%)" {
        Set-Location "$root\backend"
        pytest -v --cov=. --cov-report=term-missing --cov-report=html --cov-fail-under=90
    }
    Write-Host "Report HTML: backend\htmlcov\index.html"
}
function Coverage-Frontend {
    Invoke-Step "Frontend: vitest run --coverage (npm run test:coverage)" { Set-Location "$root\frontend"; npm run test:coverage }
    Write-Host "Report HTML: frontend\coverage\index.html"
}
function Build-Frontend {
    Invoke-Step "Frontend: vite build (npm run build-only)" { Set-Location "$root\frontend"; npm run build-only }
}

switch ($Target) {
    'lint' {
        Lint-Backend
        Lint-Frontend
    }
    'lint-fix' {
        LintFix-Backend
        LintFix-Frontend
    }
    'format' {
        Format-Backend
        Format-Frontend
    }
    'format-check' {
        FormatCheck-Backend
        FormatCheck-Frontend
    }
    'typecheck' {
        Typecheck-Backend
        Typecheck-Frontend
    }
    'test' {
        Test-Backend
        Test-Frontend
    }
    'coverage' {
        Coverage-Backend
        Coverage-Frontend
    }
    'ci' {
        # Stesso ordine della pipeline CI: analisi statica prima dei test.
        # Usa Coverage-* (non Test-*) perche' la CI reale esegue SEMPRE i
        # test con verifica delle soglie di coverage: Coverage-* include
        # gia' l'esecuzione di tutti i test, quindi non serve farlo due volte.
        Lint-Backend
        Lint-Frontend
        FormatCheck-Backend
        FormatCheck-Frontend
        Typecheck-Backend
        Typecheck-Frontend
        Coverage-Backend
        Coverage-Frontend
        Build-Frontend
    }
}

Set-Location $root
Write-Host ""
Write-Host "Tutto OK ($Target)" -ForegroundColor Green