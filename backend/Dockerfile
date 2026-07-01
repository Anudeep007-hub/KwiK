FROM python:3.11-slim 

WORKDIR /app 

ENV PYTHONPATH=/app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt 

COPY . .

# Make the start script executable
RUN chmod +x start.sh

EXPOSE 8000 

# Run the shell script instead of uvicorn directly
CMD ["./start.sh"]