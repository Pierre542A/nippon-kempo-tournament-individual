#!/bin/bash
cd front-quasar
npm install
npm run build
cd ..
cd api-fastify  
npm install