#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
API_GATEWAY_URL="http://localhost:3001"
DRIVER_API_URL="http://localhost:3001"

# Global variables
ADMIN_TOKEN=""

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

# Function to get admin token
get_admin_token() {
    print_status "Getting admin token..."
    
    local response=$(curl -s -X POST "$API_GATEWAY_URL/api/auth/admin/login" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "admin@logistic.com",
            "password": "admin123"
        }')
    
    if [ $? -eq 0 ]; then
        ADMIN_TOKEN=$(echo "$response" | jq -r '.access_token')
        if [ "$ADMIN_TOKEN" != "null" ] && [ -n "$ADMIN_TOKEN" ] && [ "$ADMIN_TOKEN" != "" ]; then
            print_success "Admin token obtained successfully"
            return 0
        else
            print_error "Token parsing failed. Response: $response"
        fi
    else
        print_error "HTTP request failed. Response: $response"
    fi
    
    print_error "Failed to get admin token"
    return 1
}

# Function to get all drivers with different API endpoints
get_all_drivers() {
    print_status "Getting all existing drivers..."
    
    # Try different API endpoints
    local endpoints=(
        "$DRIVER_API_URL/api/drivers"
        "$DRIVER_API_URL/api/drivers/list"
        "$DRIVER_API_URL/api/drivers/all"
        "$API_GATEWAY_URL/api/drivers"
    )
    
    for endpoint in "${endpoints[@]}"; do
        print_status "Trying endpoint: $endpoint"
        
        local response=$(curl -s -X GET "$endpoint" \
            -H "Authorization: Bearer $ADMIN_TOKEN")
        
        if [ $? -eq 0 ]; then
            # Try different JSON paths
            local drivers=$(echo "$response" | jq -r '.drivers[].id // .data[].id // .[].id // empty' 2>/dev/null)
            
            if [ -n "$drivers" ]; then
                print_success "Found drivers using endpoint: $endpoint"
                while IFS= read -r driver_id; do
                    if [ -n "$driver_id" ] && [ "$driver_id" != "null" ]; then
                        echo "$driver_id"
                    fi
                done <<< "$drivers"
                return 0
            fi
        fi
    done
    
    print_warning "No drivers found with any endpoint"
    return 1
}

# Function to delete driver
delete_driver() {
    local driver_id=$1
    
    # Try different delete endpoints
    local endpoints=(
        "$DRIVER_API_URL/api/drivers/$driver_id"
        "$API_GATEWAY_URL/api/drivers/$driver_id"
    )
    
    for endpoint in "${endpoints[@]}"; do
        local response=$(curl -s -X DELETE "$endpoint" \
            -H "Authorization: Bearer $ADMIN_TOKEN")
        
        if [ $? -eq 0 ]; then
            local success=$(echo "$response" | jq -r '.success // .deleted // true' 2>/dev/null)
            if [ "$success" = "true" ] || [ "$success" = "1" ]; then
                print_success "Driver $driver_id deleted successfully via $endpoint"
                return 0
            fi
        fi
    done
    
    print_error "Failed to delete driver $driver_id"
    return 1
}

# Function to create new driver
create_driver() {
    local driver_name=$1
    local city_name=$2
    
    local timestamp=$(date +%s%N | cut -b1-13)
    local full_name="$driver_name - $city_name"
    
    local response=$(curl -s -X POST "$DRIVER_API_URL/api/drivers" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -d "{
            \"name\": \"$full_name\",
            \"licenseNumber\": \"TRK${timestamp}\",
            \"phoneNumber\": \"+90555${timestamp}\"
        }")
    
    if [ $? -eq 0 ]; then
        local driver_id=$(echo "$response" | jq -r '.id // .driverId // empty')
        if [ "$driver_id" != "null" ] && [ -n "$driver_id" ] && [ "$driver_id" != "" ]; then
            print_success "Driver '$full_name' created with ID: $driver_id"
            return 0
        else
            print_error "Driver creation failed for $full_name"
            return 1
        fi
    else
        print_error "Failed to create driver $full_name"
        return 1
    fi
}

# Function to clean database directly (if possible)
clean_database() {
    print_status "Attempting to clean database directly..."
    
    # Try to connect to PostgreSQL and clean drivers table
    if command -v psql &> /dev/null; then
        print_status "PostgreSQL found, attempting direct database cleanup..."
        
        # This would require database credentials
        # psql -h localhost -U postgres -d logistic_control -c "DELETE FROM drivers;"
        print_warning "Direct database cleanup requires credentials"
    fi
}

# Main execution
main() {
    print_header "🧹 FORCE Driver Cleanup and Recreation"
    
    # Get admin token
    if ! get_admin_token; then
        print_error "Failed to get admin token. Exiting."
        exit 1
    fi
    
    # Get all existing drivers
    print_status "Force cleaning up existing drivers..."
    local existing_drivers=$(get_all_drivers)
    
    if [ -n "$existing_drivers" ]; then
        local count=0
        while IFS= read -r driver_id; do
            if [ -n "$driver_id" ]; then
                delete_driver "$driver_id"
                count=$((count + 1))
                sleep 0.5  # Small delay between deletions
            fi
        done <<< "$existing_drivers"
        print_success "Attempted to delete $count existing drivers"
    else
        print_status "No existing drivers found"
    fi
    
    # Wait a bit for deletions to complete
    sleep 2
    
    # Try to clean database directly
    clean_database
    
    # Create new drivers
    print_status "Creating new drivers..."
    
    create_driver "Ahmet Yılmaz" "İstanbul"
    sleep 1
    create_driver "Mehmet Demir" "Ankara"
    sleep 1
    create_driver "Ali Kaya" "İzmir"
    
    print_success "Force driver cleanup and recreation completed!"
    print_status "Now you can run the smart simulation with only 3 drivers"
}

# Run main function
main "$@" 