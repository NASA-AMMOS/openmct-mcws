#!/bin/bash
# Script Name: issue-by-criticality.sh
# Description: Generates a list of issues by criticality from a specified GitHub repository and formats them for Confluence.

# Requires:
# - gh: GitHub CLI (https://github.com/cli/cli)
# - jq: Command-line JSON processor (https://github.com/stedolan/jq)

# Usage:
# sh ./issue-by-criticality.sh

# Notes:
# - Ensure you have the necessary permissions to access the GitHub repository.
# - Customize the REPO variable as needed.

# Change as needed
REPO="NASA-AMMOS/openmct-mcws"
CRITICALITY_LABELS=("crit-1" "crit-2" "crit-3" "crit-4")

# Function to list issues for a specific criticality label and format as a Confluence wiki table
list_issues_by_criticality() {
    local label=$1
    local criticality_number=${label#crit-}
    local jq_filter='.[] | @base64'
    
    echo "h2. Criticality $criticality_number"
    
    # Fetch issues with the specified criticality label (only open issues)
    local issue_data=$(gh issue list --repo "$REPO" --label "$label" --state open --json number,title,url --jq "$jq_filter")
    
    # Check if no issues found
    if [ -z "$issue_data" ]; then
        echo "No issues found with criticality $criticality_number."
        echo
        return
    fi
    
    # Create table header based on criticality
    if [ "$label" == "crit-2" ]; then
        echo "|| Key || Summary || Workaround ||"
    else
        echo "|| Key || Summary ||"
    fi
    
    # Process each issue
    while IFS= read -r line; do
        # Check if no issue
        if [ -z "$line" ]; then
            break
        fi
        
        local issue_number=$(echo "$line" | base64 --decode | jq -r '.number')
        local issue_title=$(echo "$line" | base64 --decode | jq -r '.title')
        local issue_url=$(echo "$line" | base64 --decode | jq -r '.url')
        
        # Format table row based on criticality
        if [ "$label" == "crit-2" ]; then
            echo "| [$issue_number|$issue_url] | $issue_title | |"
        else
            echo "| [$issue_number|$issue_url] | $issue_title |"
        fi
        
    done <<< "$issue_data"
    
    echo
}

# Main Script
echo "*Repository*: [openmct-mcws|https://github.com/NASA-AMMOS/openmct-mcws]"

for label in "${CRITICALITY_LABELS[@]}"; do
    list_issues_by_criticality "$label"
done 