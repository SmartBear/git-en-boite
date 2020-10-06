#!/bin/sh
set -e
export url=$1
if [ -z "$url" ]
then
      echo "Usage: smoke-test <url>"
      exit 1
fi

export repo_id=smoke-test-`uuidgen`
export remote_url='https://github.com/smartbear/git-en-boite-demo.git'

green='\033[0;32m'
nc='\033[0m'
clear='\033c'

echo $clear
echo "${green}Checking the server is up: $url${nc}"
echo
export cmd="curl -v $url --fail"
echo "> $cmd"
eval $cmd
echo "${green}Server is up!${nc} ✅"

echo $clear
echo "${green}Creating repo:"
echo "  repoId: $repo_id"
echo "  remoteUrl: $remote_url${nc}"
echo
export cmd="curl -v $url/repos -d \"{ \\\"repoId\\\": \\\"$repo_id\\\", \\\"remoteUrl\\\":\\\"$remote_url\\\" }\" -H 'content-type: application/json' -L --fail"
echo "> $cmd"
eval $cmd
echo "\n${green}Repo created.${nc} ✅"

echo $clear
echo "${green}Waiting for repo to be fetched...${nc}"
echo
export cmd="curl -v -s \"$url/repos/$repo_id/events?until=repo.fetched\" --fail"
echo "> $cmd"
eval $cmd
echo "\n${green}Repo fetched.${nc} ✅"

echo $clear
echo "${green}Getting repo branch details:${nc}"
echo
export cmd="curl -v -s $url/repos/$repo_id --fail | jq .branches[]"
echo "> $cmd"
eval $cmd