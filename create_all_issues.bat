@echo off
REM Master script to create all GitHub Issues for Instagram Automation SaaS
REM This script runs all phase scripts sequentially
REM 
REM IMPORTANT: Make sure you are authenticated with GitHub CLI before running this script
REM Run: gh auth login

echo =====================================================
echo Instagram Automation SaaS - GitHub Issues Creation
echo =====================================================
echo.
echo This will create all 34 issues across 5 phases:
echo   - Phase 1 (MVP): Issues #1-7
echo   - Phase 2 (Feature Expansion): Issues #8-14
echo   - Phase 3 (AI Enhancement): Issues #15-20
echo   - Phase 4 (API Integration): Issues #21-26
echo   - Phase 5 (Scaling): Issues #27-34
echo.
echo Press any key to continue or Ctrl+C to cancel...
pause > nul

echo.
echo Checking GitHub authentication...
gh auth status
if errorlevel 1 (
    echo ERROR: Not authenticated with GitHub CLI
    echo Please run: gh auth login
    exit /b 1
)

echo.
echo =====================================================
echo Creating Phase 1 Issues (MVP)...
echo =====================================================
call create_issues_phase1.bat
if errorlevel 1 (
    echo ERROR: Phase 1 failed
    exit /b 1
)

echo.
echo =====================================================
echo Creating Phase 2 Issues (Feature Expansion)...
echo =====================================================
call create_issues_phase2.bat
if errorlevel 1 (
    echo ERROR: Phase 2 failed
    exit /b 1
)

echo.
echo =====================================================
echo Creating Phase 3 Issues (AI Enhancement)...
echo =====================================================
call create_issues_phase3.bat
if errorlevel 1 (
    echo ERROR: Phase 3 failed
    exit /b 1
)

echo.
echo =====================================================
echo Creating Phase 4 Issues (API Integration)...
echo =====================================================
call create_issues_phase4.bat
if errorlevel 1 (
    echo ERROR: Phase 4 failed
    exit /b 1
)

echo.
echo =====================================================
echo Creating Phase 5 Issues (Scaling)...
echo =====================================================
call create_issues_phase5.bat
if errorlevel 1 (
    echo ERROR: Phase 5 failed
    exit /b 1
)

echo.
echo =====================================================
echo ALL 34 GITHUB ISSUES CREATED SUCCESSFULLY!
echo =====================================================
echo.
echo Issue Summary:
echo   Phase 1 (MVP): Issues #1-7
echo   Phase 2 (Feature Expansion): Issues #8-14
echo   Phase 3 (AI Enhancement): Issues #15-20
echo   Phase 4 (API Integration): Issues #21-26
echo   Phase 5 (Scaling): Issues #27-34
echo.
echo Total: 34 issues created
echo.
pause
