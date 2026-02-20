#!/usr/bin/env python3
"""
Compliance Verification Test - 3 Critical Fixes
================================================

FIX 1: GITHUB_TOKEN mandatory (no credential fallback)
FIX 2: Deterministic strict_output format (exact mapping)
FIX 3: Format validation with regex enforcement
"""

import sys
import json
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent / "autonomous-cicd-healing-agent" / "backend"))

from agents.git_agent import GitAgent
from agents.fix_agent import FixAgent
from models import BugType, FixRecord, FixStatus


def test_fix_1_mandatory_token():
    """FIX 1: Verify GITHUB_TOKEN is MANDATORY, no fallback to cached credentials."""
    print("\n" + "="*80)
    print("FIX 1: GITHUB_TOKEN Mandatory (No Credential Fallback)")
    print("="*80)
    
    # Test GitAgent raises exception when token missing
    import os
    old_token = os.environ.pop("GITHUB_TOKEN", None)
    
    try:
        git_agent = GitAgent()
        print("❌ FAIL: GitAgent() should raise exception when GITHUB_TOKEN missing")
        return False
    except Exception as e:
        print(f"✅ PASS: GitAgent() raises exception: {e}")
    
    # Restore token
    if old_token:
        os.environ["GITHUB_TOKEN"] = old_token
    
    return True


def test_fix_2_deterministic_output():
    """FIX 2: Verify strict_output has DETERMINISTIC mapping (no variation)."""
    print("\n" + "="*80)
    print("FIX 2: Deterministic Strict Output Format")
    print("="*80)
    
    # Set dummy token to avoid exception
    import os
    os.environ["GITHUB_TOKEN"] = "dummy_token_for_testing"
    
    fix_agent = FixAgent()
    
    test_cases = [
        (BugType.IMPORT, "IMPORT error in test.py line 5 → Fix: add the missing import statement"),
        (BugType.SYNTAX, "SYNTAX error in utils.py line 12 → Fix: add the missing colon at the correct position"),
        (BugType.INDENTATION, "INDENTATION error in main.py line 20 → Fix: correct the indentation"),
        (BugType.TYPE_ERROR, "TYPE_ERROR error in handler.py line 8 → Fix: correct the type usage"),
        (BugType.LOGIC, "LOGIC error in calc.py line 15 → Fix: correct the return statement logic"),
        (BugType.LINTING, "LINTING error in module.py line 3 → Fix: remove the unused import statement"),
    ]
    
    all_passed = True
    for bug_type, expected in test_cases:
        proposal = fix_agent.generate_fix("test.py", 5, bug_type, "dummy message")
        
        # For non-matching filenames and line numbers, adjust expected
        if bug_type == BugType.SYNTAX:
            expected = "SYNTAX error in test.py line 5 → Fix: add the missing colon at the correct position"
        elif bug_type == BugType.INDENTATION:
            expected = "INDENTATION error in test.py line 5 → Fix: correct the indentation"
        elif bug_type == BugType.TYPE_ERROR:
            expected = "TYPE_ERROR error in test.py line 5 → Fix: correct the type usage"
        elif bug_type == BugType.LOGIC:
            expected = "LOGIC error in test.py line 5 → Fix: correct the return statement logic"
        elif bug_type == BugType.LINTING:
            expected = "LINTING error in test.py line 5 → Fix: remove the unused import statement"
        
        match = proposal.strict_output == expected
        status = "✅" if match else "❌"
        print(f"{status} {bug_type.value}")
        print(f"   Output: {proposal.strict_output}")
        if not match:
            print(f"   Expected: {expected}")
            all_passed = False
    
    return all_passed


def test_fix_3_format_validation():
    """FIX 3: Verify strict_output format is validated with regex."""
    print("\n" + "="*80)
    print("FIX 3: Strict Output Format Validation")
    print("="*80)
    
    import os
    os.environ["GITHUB_TOKEN"] = "dummy_token_for_testing"
    
    fix_agent = FixAgent()
    
    # Valid formats
    valid_cases = [
        "IMPORT error in test.py line 5 → Fix: add the missing import statement",
        "SYNTAX error in utils.py line 12 → Fix: add the missing colon at the correct position",
        "INDENTATION error in main.py line 20 → Fix: correct the indentation",
    ]
    
    print("\nTesting valid formats:")
    for valid in valid_cases:
        try:
            fix_agent._validate_strict_output_format(valid)
            print(f"✅ PASS: {valid[:60]}...")
        except Exception as e:
            print(f"❌ FAIL: Should be valid but got error: {e}")
            return False
    
    # Invalid formats (should raise exception)
    invalid_cases = [
        "import error in test.py line 5 → Fix: add the missing import statement",  # lowercase first word
        "IMPORT error in test.py line 5 -> Fix: add the missing import statement",  # wrong arrow
        "IMPORT error in test.py line 5 → Fix:add the missing import statement",  # missing space after colon
        "IMPORT error in test.py line abc → Fix: add the missing import statement",  # non-numeric line
    ]
    
    print("\nTesting invalid formats (should raise exception):")
    for invalid in invalid_cases:
        try:
            fix_agent._validate_strict_output_format(invalid)
            print(f"❌ FAIL: Should reject: {invalid[:60]}...")
            return False
        except Exception as e:
            print(f"✅ PASS: Correctly rejected: {invalid[:60]}...")
    
    return True


def show_example_output():
    """Show example of complete FixRecord with strict_output."""
    print("\n" + "="*80)
    print("Example: Complete FixRecord with strict_output")
    print("="*80)
    
    import os
    os.environ["GITHUB_TOKEN"] = "dummy_token_for_testing"
    
    fix_agent = FixAgent()
    proposal = fix_agent.generate_fix("handlers/auth.py", 42, BugType.IMPORT, "name 'requests' is not defined")
    
    # Create a FixRecord
    fix_record = FixRecord(
        file=proposal.file,
        bug_type=proposal.bug_type,
        line_number=proposal.line_number,
        commit_message=proposal.commit_message,
        status=FixStatus.FIXED,
        strict_output=proposal.strict_output,
    )
    
    print("\nFixRecord as JSON:")
    print(json.dumps(fix_record.model_dump(), indent=2))
    
    return True


def show_results_json_example():
    """Show example results.json entry with strict_output."""
    print("\n" + "="*80)
    print("Example: results.json Entry with strict_output")
    print("="*80)
    
    example = {
        "file": "src/main.py",
        "bug_type": "IMPORT",
        "line_number": 15,
        "commit_message": "[AI-AGENT] Fix import issue in src/main.py",
        "status": "FIXED",
        "strict_output": "IMPORT error in src/main.py line 15 → Fix: add the missing import statement"
    }
    
    print("\nJSON Entry:")
    print(json.dumps(example, indent=2))
    
    return True


def main():
    print("\n" + "#"*80)
    print("# COMPLIANCE VERIFICATION TEST SUITE")
    print("# 3 Critical Compliance Violations FIXED")
    print("#"*80)
    
    results = {
        "Fix 1: Mandatory GITHUB_TOKEN": test_fix_1_mandatory_token(),
        "Fix 2: Deterministic strict_output": test_fix_2_deterministic_output(),
        "Fix 3: Format Validation": test_fix_3_format_validation(),
    }
    
    # Show examples
    show_example_output()
    show_results_json_example()
    
    print("\n" + "="*80)
    print("SUMMARY")
    print("="*80)
    
    all_passed = True
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {test_name}")
        all_passed = all_passed and passed
    
    print("="*80)
    
    if all_passed:
        print("\n✅ ALL COMPLIANCE CHECKS PASSED!")
        print("\nCompliance fixes verified:")
        print("  ✓ FIX 1: GITHUB_TOKEN is mandatory - no fallback to cached credentials")
        print("  ✓ FIX 2: strict_output uses deterministic mapping - no variation")
        print("  ✓ FIX 3: strict_output format validated with regex enforcement")
        return 0
    else:
        print("\n❌ SOME CHECKS FAILED")
        return 1


if __name__ == "__main__":
    sys.exit(main())
