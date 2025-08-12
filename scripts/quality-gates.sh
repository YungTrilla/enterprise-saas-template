#!/bin/bash

# Enterprise SaaS Template - Quality Gates Script
# Comprehensive quality checks for code before commit/push

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MAX_FILE_SIZE="500k"
MAX_LINE_LENGTH=120
SECURITY_AUDIT_LEVEL="moderate"

# Helper functions
print_step() {
    echo -e "${BLUE}🔍 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in a git repository
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Not in a git repository"
        exit 1
    fi
}

# Get staged files for pre-commit, or all files for full check
get_files() {
    local mode=${1:-"staged"}
    
    if [ "$mode" = "staged" ]; then
        git diff --cached --name-only --diff-filter=ACM
    else
        git ls-files
    fi
}

# Check for large files
check_file_sizes() {
    local mode=${1:-"staged"}
    print_step "Checking file sizes (max: $MAX_FILE_SIZE)"
    
    local large_files=()
    while IFS= read -r -d '' file; do
        if [ -f "$file" ]; then
            large_files[${#large_files[@]}]="$file"
        fi
    done < <(get_files "$mode" | grep -E '\.(js|jsx|ts|tsx|json|md|css|scss)$' | xargs -I {} find {} -size +$MAX_FILE_SIZE -print0 2>/dev/null || true)
    
    if [ ${#large_files[@]} -gt 0 ]; then
        print_warning "Large files detected:"
        for file in "${large_files[@]}"; do
            size=$(du -h "$file" | cut -f1)
            echo "  - $file ($size)"
        done
        print_warning "Consider splitting large files or adding to .gitignore"
        return 1
    fi
    
    print_success "File size check passed"
    return 0
}

# Check for security patterns
check_security_patterns() {
    local mode=${1:-"staged"}
    print_step "Checking for security patterns"
    
    local issues=0
    local files
    files=$(get_files "$mode" | grep -E '\.(js|jsx|ts|tsx|json|md|yml|yaml)$' || true)
    
    if [ -z "$files" ]; then
        print_success "No files to check for security patterns"
        return 0
    fi
    
    # Check for potential secrets
    local secret_patterns=(
        'password\s*=\s*["\'][^"\']{8,}'
        'api[_-]?key\s*[=:]\s*["\'][^"\']{10,}'
        'secret[_-]?key\s*[=:]\s*["\'][^"\']{10,}'
        'private[_-]?key\s*[=:]\s*["\'][^"\']{10,}'
        'token\s*[=:]\s*["\'][^"\']{10,}'
        'jwt[_-]?secret\s*[=:]\s*["\'][^"\']{10,}'
    )
    
    for pattern in "${secret_patterns[@]}"; do
        if echo "$files" | xargs grep -l -i -E "$pattern" 2>/dev/null; then
            print_warning "Potential secret pattern found: $pattern"
            issues=$((issues + 1))
        fi
    done
    
    # Check for dangerous functions
    local dangerous_patterns=(
        'eval\s*\('
        'innerHTML\s*='
        'document\.write\s*\('
        'setTimeout\s*\(\s*["\']'
        'setInterval\s*\(\s*["\']'
    )
    
    for pattern in "${dangerous_patterns[@]}"; do
        if echo "$files" | xargs grep -l -E "$pattern" 2>/dev/null; then
            print_warning "Potentially dangerous pattern found: $pattern"
            issues=$((issues + 1))
        fi
    done
    
    if [ $issues -gt 0 ]; then
        print_warning "Security pattern check found $issues potential issues"
        return 1
    fi
    
    print_success "Security pattern check passed"
    return 0
}

# Check dependencies for vulnerabilities
check_dependencies() {
    print_step "Checking dependencies for vulnerabilities"
    
    if ! command -v pnpm >/dev/null 2>&1; then
        print_warning "pnpm not found, skipping dependency check"
        return 0
    fi
    
    local audit_output
    if audit_output=$(pnpm audit --audit-level=$SECURITY_AUDIT_LEVEL 2>&1); then
        print_success "Dependency security check passed"
        return 0
    else
        print_warning "Dependency vulnerabilities detected:"
        printf '%s\n' "$audit_output" | grep -E 'high|critical|moderate' || true
        return 1
    fi
}

# Check code complexity (basic)
check_complexity() {
    local mode=${1:-"staged"}
    print_step "Checking basic code complexity"
    
    local complex_files=()
    local files
    files=$(get_files "$mode" | grep -E '\.(js|jsx|ts|tsx)$' || true)
    
    if [ -z "$files" ]; then
        print_success "No JavaScript/TypeScript files to check"
        return 0
    fi
    
    # Simple complexity check: lines per function
    while IFS= read -r file; do
        if [ -f "$file" ]; then
            # Count lines in functions (basic heuristic)
            local func_lines
            func_lines=$(grep -n -E "(function|=>|{)" "$file" | wc -l 2>/dev/null || echo "0")
            local total_lines
            total_lines=$(wc -l < "$file" 2>/dev/null || echo "0")
            
            if [ "$total_lines" -gt 500 ] && [ "$func_lines" -lt 10 ]; then
                complex_files[${#complex_files[@]}]="$file - ${total_lines} lines, possible large function"
            fi
        fi
    done <<< "$files"
    
    if [ ${#complex_files[@]} -gt 0 ]; then
        print_warning "Complex files detected:"
        for file in "${complex_files[@]}"; do
            echo "  - $file"
        done
        print_warning "Consider refactoring large functions"
        return 1
    fi
    
    print_success "Code complexity check passed"
    return 0
}

# Check line length
check_line_length() {
    local mode=${1:-"staged"}
    print_step "Checking line length (max: $MAX_LINE_LENGTH characters)"
    
    local long_lines=()
    local files
    files=$(get_files "$mode" | grep -E '\.(js|jsx|ts|tsx|css|scss|md)$' || true)
    
    if [ -z "$files" ]; then
        print_success "No files to check for line length"
        return 0
    fi
    
    while IFS= read -r file; do
        if [ -f "$file" ]; then
            local line_nums
            line_nums=$(awk "length > $MAX_LINE_LENGTH {print NR}" "$file" 2>/dev/null || true)
            if [ -n "$line_nums" ]; then
                line_list=$(echo "$line_nums" | tr '\n' ' ')
                long_lines[${#long_lines[@]}]="$file: lines $line_list"
            fi
        fi
    done <<< "$files"
    
    if [ ${#long_lines[@]} -gt 0 ]; then
        print_warning "Long lines detected:"
        for line in "${long_lines[@]}"; do
            echo "  - $line"
        done
        print_warning "Consider breaking long lines for readability"
        return 1
    fi
    
    print_success "Line length check passed"
    return 0
}

# Check for TODO/FIXME comments in production code
check_todos() {
    local mode=${1:-"staged"}
    print_step "Checking for TODO/FIXME comments"
    
    local todo_files=()
    local files
    files=$(get_files "$mode" | grep -E '\.(js|jsx|ts|tsx)$' | grep -v -E '(test|spec|\.test\.|\.spec\.)' || true)
    
    if [ -z "$files" ]; then
        print_success "No production files to check for TODOs"
        return 0
    fi
    
    while IFS= read -r file; do
        if [ -f "$file" ]; then
            local todos
            todos=$(grep -n -i -E "(TODO|FIXME|HACK|XXX)" "$file" 2>/dev/null || true)
            if [ -n "$todos" ]; then
                todo_files[${#todo_files[@]}]="$file"
            fi
        fi
    done <<< "$files"
    
    if [ ${#todo_files[@]} -gt 0 ]; then
        print_warning "TODO/FIXME comments found in production code:"
        for file in "${todo_files[@]}"; do
            echo "  - $file"
            grep -n -i -E "(TODO|FIXME|HACK|XXX)" "$file" | head -3 | sed 's/^/    /'
        done
        print_warning "Consider addressing TODOs before committing"
        return 1
    fi
    
    print_success "TODO check passed"
    return 0
}

# Main quality gate runner
run_quality_gates() {
    local mode=${1:-"staged"}
    local strict=${2:-"false"}
    
    echo "🏗️  Enterprise SaaS Template - Quality Gates"
    echo "Mode: $mode"
    echo "Strict: $strict"
    echo "=================================="
    
    check_git_repo
    
    local failures=0
    
    # Run all checks
    check_file_sizes "$mode" || failures=$((failures + 1))
    check_security_patterns "$mode" || failures=$((failures + 1))
    check_dependencies || failures=$((failures + 1))
    check_complexity "$mode" || failures=$((failures + 1))
    check_line_length "$mode" || failures=$((failures + 1))
    check_todos "$mode" || failures=$((failures + 1))
    
    echo "=================================="
    
    if [ $failures -eq 0 ]; then
        print_success "All quality gates passed! 🎉"
        return 0
    else
        if [ "$strict" = "true" ]; then
            print_error "$failures quality gate(s) failed in strict mode"
            return 1
        else
            print_warning "$failures quality gate(s) failed (warnings only)"
            return 0
        fi
    fi
}

# Script entry point
main() {
    local mode="staged"
    local strict="false"
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --all)
                mode="all"
                shift
                ;;
            --strict)
                strict="true"
                shift
                ;;
            --help)
                echo "Usage: $0 [--all] [--strict] [--help]"
                echo "  --all     Check all files instead of just staged"
                echo "  --strict  Fail on warnings (default: warnings only)"
                echo "  --help    Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    run_quality_gates "$mode" "$strict"
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi