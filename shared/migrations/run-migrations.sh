#!/bin/bash

# Database Migration Runner
# Bu script veritabanı migration'larını çalıştırır

set -e

# Configuration
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}
DB_NAME=${DB_NAME:-"driver_db"}
DB_USER=${DB_USER:-"postgres"}
DB_PASSWORD=${DB_PASSWORD:-"password"}
MIGRATIONS_DIR="/migrations"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check if migrations directory exists
if [ ! -d "$MIGRATIONS_DIR" ]; then
    error "Migrations directory not found: $MIGRATIONS_DIR"
fi

# Function to run migration
run_migration() {
    local migration_file="$1"
    local migration_name=$(basename "$migration_file")
    
    log "Running migration: $migration_name"
    
    # Check if migration already applied
    local already_applied=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM schema_migrations WHERE migration_name = '$migration_name';" 2>/dev/null | tr -d ' ')
    
    if [ "$already_applied" = "1" ]; then
        warn "Migration $migration_name already applied, skipping..."
        return 0
    fi
    
    # Run migration
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration_file"; then
        log "✅ Migration $migration_name completed successfully"
    else
        error "❌ Migration $migration_name failed"
    fi
}

# Main execution
main() {
    log "Starting database migrations..."
    
    # Check database connection
    if ! PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
        error "Cannot connect to database. Please check your connection settings."
    fi
    
    log "Database connection successful"
    
    # Find all SQL migration files and sort them
    local migration_files=$(find "$MIGRATIONS_DIR" -name "*.sql" | sort)
    
    if [ -z "$migration_files" ]; then
        warn "No migration files found in $MIGRATIONS_DIR"
        return 0
    fi
    
    # Run each migration
    for migration_file in $migration_files; do
        run_migration "$migration_file"
    done
    
    log "🎉 All migrations completed successfully!"
}

# Run main function
main "$@"
