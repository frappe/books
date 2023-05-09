# #! /bin/zsh

set -e

# Check node and yarn versions
NODE_VERSION=$(node --version)
YARN_VERSION=$(yarn --version)
if [ "$YARN_VERSION" != "1.22.18" ]; then
  echo "Incorrect yarn version: $YARN_VERSION"
  exit 1
elif [ "$NODE_VERSION" != "v16.13.1" ]; then
  echo "Incorrect node version: $NODE_VERSION"
  exit 1
fi

# Source secrets
source .env.publish

# Create folder for the publish build
rm -rf build_publish
mkdir build_publish
cd build_publish

# Clone and cd into books
git clone https://github.com/frappe/books --depth 1
cd books

# Copy creds to log_creds.txt
echo $ERR_LOG_KEY > log_creds.txt
echo $ERR_LOG_SECRET >> log_creds.txt
echo $ERR_LOG_URL >> log_creds.txt
echo $TELEMETRY_URL >> log_creds.txt

# Enable Code Signing
CSC_IDENTITY_AUTO_DISCOVERY=true

# Build
yarn install
export GH_TOKEN=$GH_PUBLISH_TOKEN &&
 yarn electron:build --mac --publish=always

cd ../../
