#!/bin/bash

# Run backend
cd backend/dotnet/FV.Api
dotnet run &

# Run frontend
cd ../../../frontend/portfolio-react
pnpm start &

# Wait for both
wait