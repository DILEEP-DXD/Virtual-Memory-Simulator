# Virtual Memory Management Tool - Docker Configuration

FROM node:18-alpine AS frontend-build

# Build frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Python backend stage
FROM python:3.10-slim

WORKDIR /app

# Install Python dependencies
COPY simulator/requirements.txt /app/simulator/
RUN pip install --no-cache-dir -r /app/simulator/requirements.txt

# Copy application files
COPY simulator/ /app/simulator/
COPY api/ /app/api/
COPY examples/ /app/examples/
COPY batch_runner.py /app/
COPY report_generator.py /app/
COPY ml/ /app/ml/
COPY notebooks/ /app/notebooks/

# Copy frontend build
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

# Expose ports
EXPOSE 8000 3000

# Create startup script
RUN echo '#!/bin/bash\n\
echo "Starting Virtual Memory Management Tool..."\n\
echo "API will be available at http://localhost:8000"\n\
echo "Frontend will be available at http://localhost:3000"\n\
echo ""\n\
# Start API in background\n\
cd /app && uvicorn api.main:app --host 0.0.0.0 --port 8000 &\n\
# Serve frontend\n\
cd /app/frontend/dist && python -m http.server 3000\n\
' > /app/start.sh && chmod +x /app/start.sh

CMD ["/app/start.sh"]

# Usage:
# docker build -t virtual-memory-tool .
# docker run -p 3000:3000 -p 8000:8000 virtual-memory-tool
#
# Then access:
# - Frontend: http://localhost:3000
# - API: http://localhost:8000
# - API Docs: http://localhost:8000/docs
#
# For development with live code updates, mount volumes:
# docker run -p 3000:3000 -p 8000:8000 \
#   -v $(pwd)/simulator:/app/simulator \
#   -v $(pwd)/api:/app/api \
#   virtual-memory-tool
