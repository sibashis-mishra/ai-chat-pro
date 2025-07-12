#!/bin/bash
set -e

echo "Installing client dependencies..."
cd client
yarn install

echo "Building client..."
yarn build

echo "Build completed successfully!" 