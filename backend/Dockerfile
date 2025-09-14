
# Use an official Python runtime as a parent image
FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set work directory
WORKDIR /app

# Install uv
RUN pip install uv

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install dependencies using uv
RUN uv sync --frozen

# Copy project
COPY . /app/

# Expose the port your app runs on
EXPOSE 8000

# Run the application using uv
CMD ["uv", "run", "gunicorn", "dosealert.wsgi:application", "--bind", "0.0.0.0:8000"]
