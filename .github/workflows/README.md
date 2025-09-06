# CI/CD Pipeline Configuration

## Overview

This repository uses GitHub Actions for continuous integration and automated testing. The pipeline ensures code quality, runs comprehensive tests, and validates builds before allowing merges to protected branches.

## Workflow Files

### `test.yml` - Main CI/CD Pipeline

**Triggers:**
- Push to `main`, `develop`, and feature branches (`feature/*`, `fix/*`, `hotfix/*`)
- Pull requests targeting `main` or `develop`

**Jobs:**

1. **Test Suite** (`test`)
   - Runs on Ubuntu with Node.js 20.x
   - Uses pnpm 10.12.4 with caching for faster builds
   - Executes: type checking, linting, unit tests, and coverage reporting
   - Uploads coverage reports to Codecov (if configured)
   - Times out after 15 minutes

2. **Quality Gate** (`quality-gate`)
   - Validates that all tests pass
   - Acts as a checkpoint before proceeding to build verification

3. **Build Verification** (`build-verification`)
   - Ensures the application builds successfully
   - Uploads build artifacts for debugging

4. **Security Scan** (`security`)
   - Runs Trivy vulnerability scanner on PRs and main branch
   - Uploads security findings to GitHub Security tab

5. **CI Success** (`ci-success`)
   - Final status check for PR validation
   - Provides clear success/failure summary

## Required Secrets

### Optional Secrets
- `CODECOV_TOKEN` - For uploading test coverage reports to Codecov

## Branch Protection Rules

To ensure code quality, configure the following branch protection rules for `main` and `develop`:

1. **Required Status Checks:**
   - `CI Pipeline Success`
   - `Test Suite`
   - `Build Verification`

2. **Required Reviews:**
   - At least 1 approval required
   - Dismiss stale reviews when new commits are pushed

3. **Additional Settings:**
   - Require branches to be up to date before merging
   - Include administrators in restrictions

## Performance Optimizations

- **Dependency Caching:** Uses pnpm store cache for faster dependency installation
- **Parallel Jobs:** Tests and security scans run independently where possible  
- **Timeout Protection:** Jobs timeout after 15 minutes to prevent stuck builds
- **Artifact Management:** Build outputs and coverage reports are retained for debugging

## Test Coverage Requirements

The pipeline enforces minimum coverage thresholds:
- Branches: 80%
- Functions: 80%
- Lines: 80%
- Statements: 80%

## Troubleshooting

### Common Issues

1. **Tests Failing in CI but Passing Locally**
   - Check Node.js version compatibility
   - Verify environment variables are set correctly
   - Review test setup for CI-specific configurations

2. **Build Timeouts**
   - Check for infinite loops or hanging processes
   - Review test performance and optimize slow tests
   - Consider increasing timeout if legitimately needed

3. **Dependency Issues**
   - Ensure `pnpm-lock.yaml` is committed
   - Check for version conflicts in `package.json`
   - Verify all dependencies are compatible with Node.js 20.x

### Debug Information

- **Build Logs:** Available in GitHub Actions tab
- **Coverage Reports:** Downloadable as artifacts
- **Security Scan Results:** Available in Security tab
- **Build Artifacts:** Available for 3 days after successful builds

## Local Development

To run the same checks locally:

```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint

# Tests with coverage
pnpm test:coverage

# Build verification
pnpm build
```

## Extending the Pipeline

To add additional jobs or modify the pipeline:

1. **Adding New Test Suites:** Add steps to the `test` job
2. **Additional Security Scans:** Add new jobs that depend on `quality-gate`
3. **Deployment:** Add deployment jobs that depend on `ci-success`

Remember to update this documentation when making changes to the pipeline configuration.