#!/bin/bash
set -e

# Quando Root Directory = apps/web, precisamos instalar na raiz primeiro
cd ../..
npm ci
