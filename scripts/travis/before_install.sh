#!/bin/bash
set -e -v

echo "Now testing on $TRAVIS_OS_NAME"
echo "Using the android emulator? $USE_EMULATOR"
echo "Travis branch is $TRAVIS_BRANCH"
echo "Travis is in pull request $TRAVIS_PULL_REQUEST"
echo "Build triggered by $TRAVIS_EVENT_TYPE"
echo "Using node $TRAVIS_NODE_VERSION"

# ensure that the PR branch exists locally
#git config --add remote.origin.fetch "+refs/heads/$BRANCH:refs/remotes/origin/$BRANCH"
#git fetch

# if the branch doesn't exist, make it (the branch only exists on push builds, not PR ones)
#if ! git rev-parse --quiet --verify "$BRANCH" > /dev/null; then
  #git branch "$BRANCH"
#fi

# turn off fancy npm stuff
npm config set spin=false
npm config set progress=false

npm install -g npm@latest

# Get the deploy key by using Travis's stored variables to decrypt deploy_key.enc
# openssl aes-256-cbc -K "$ENCRYPTED_KEY" -iv "$ENCRYPTED_IV" -in "$DEPLOY_KEY.enc" -out "$DEPLOY_KEY" -d
# chmod 600 "$DEPLOY_KEY"
# eval "$(ssh-agent -s)"
# ssh-add "$DEPLOY_KEY"

# Adding this to accept ConstraintLayout's license... see https://github.com/travis-ci/travis-ci/issues/6617
echo yes | sdkmanager "extras;m2repository;com;android;support;constraint;constraint-layout;1.0.2"
echo yes | sdkmanager "extras;m2repository;com;android;support;constraint;constraint-layout-solver;1.0.2"

#if [[ $ANDROID ]]; then
  #mkdir -p "$ANDROID_HOME/licenses"
  #echo -e "\n8933bad161af4178b1185d1a37fbf41ea5269c55" > "$ANDROID_HOME/licenses/android-sdk-license"
  #echo -e "\n84831b9409646a918e30573bab4c9c91346d8abd" > "$ANDROID_HOME/licenses/android-sdk-preview-license"
#fi