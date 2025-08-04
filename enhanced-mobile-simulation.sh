#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
API_GATEWAY_URL="http://localhost:3001"
DRIVER_API_URL="http://localhost:3001"
PLANNER_API_URL="http://localhost:3000"
ML_SERVICE_URL="http://localhost:8000"
TRACKING_SERVICE_URL="http://localhost:8002"

# Global variables
ADMIN_TOKEN=""
DRIVER_IDS=()
SHIPMENT_IDS=()

# Turkish cities with coordinates (using arrays instead of associative arrays for compatibility)
TURKISH_CITIES=(
    "Ankara:39.9334,32.8597"
    "Istanbul:41.0082,28.9784"
    "Izmir:38.4192,27.1287"
    "Bursa:40.1885,29.0610"
    "Antalya:36.8969,30.7133"
    "Adana:37.0000,35.3213"
    "Konya:37.8667,32.4833"
    "Gaziantep:37.0662,37.3833"
    "Kayseri:38.7205,35.4826"
    "Mersin:36.8000,34.6333"
    "Diyarbakir:37.9144,40.2306"
    "Samsun:41.2867,36.3300"
    "Denizli:37.7765,29.0864"
    "Eskisehir:39.7767,30.5206"
    "Urfa:37.1591,38.7969"
    "Malatya:38.3552,38.3095"
    "Erzurum:39.9000,41.2700"
    "Van:38.4891,43.4089"
    "Batman:37.8812,41.1351"
    "Elazig:38.6810,39.2264"
)

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

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

# Function to get random city coordinates
get_random_city() {
    local random_index=$((RANDOM % ${#TURKISH_CITIES[@]}))
    echo "${TURKISH_CITIES[$random_index]}"
}

# Function to add random offset to coordinates
add_random_offset() {
    local lat=$1
    local lng=$2
    local max_offset=0.01  # ~1km offset
    
    local lat_offset=$(echo "scale=6; $lat + ($RANDOM - 16384) / 1638400" | bc -l)
    local lng_offset=$(echo "scale=6; $lng + ($RANDOM - 16384) / 1638400" | bc -l)
    
    echo "$lat_offset:$lng_offset"
}

# Function to check if a service is ready
wait_for_service() {
    local service_name=$1
    local service_url=$2
    local max_attempts=30
    local attempt=1

    print_status "Waiting for $service_name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$service_url" > /dev/null 2>&1; then
            print_success "$service_name is ready!"
            return 0
        fi
        
        print_warning "Attempt $attempt/$max_attempts: $service_name not ready yet..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name failed to start after $max_attempts attempts"
    return 1
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

# Function to create multiple drivers
create_multiple_drivers() {
    local driver_count=$1
    print_status "Creating $driver_count drivers..."
    
    for i in $(seq 1 $driver_count); do
        local timestamp=$(date +%s%N | cut -b1-13)
        local driver_name="Driver $i - $(get_random_city | cut -d: -f1)"
        
        local response=$(curl -s -X POST "$DRIVER_API_URL/api/drivers" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $ADMIN_TOKEN" \
            -d "{
                \"name\": \"$driver_name\",
                \"licenseNumber\": \"DRV${timestamp}${i}\",
                \"phoneNumber\": \"+90555${timestamp}${i}\"
            }")
        
        if [ $? -eq 0 ]; then
            local driver_id=$(echo "$response" | jq -r '.id')
            if [ "$driver_id" != "null" ] && [ -n "$driver_id" ] && [ "$driver_id" != "" ]; then
                DRIVER_IDS+=("$driver_id")
                print_success "Driver $i created with ID: $driver_id"
            else
                print_error "Driver $i creation failed. Response: $response"
            fi
        else
            print_error "HTTP request failed for driver $i. Response: $response"
        fi
        
        sleep 1
    done
    
    if [ ${#DRIVER_IDS[@]} -gt 0 ]; then
        print_success "Created ${#DRIVER_IDS[@]} drivers"
        return 0
    else
        print_error "Failed to create any drivers"
        return 1
    fi
}

# Function to create shipments
create_shipments() {
    print_status "Creating shipments..."
    
    local shipment_count=$((3 + RANDOM % 8)) # 3-10 shipments
    print_status "Creating $shipment_count shipments..."
    
    for i in $(seq 1 $shipment_count); do
        local timestamp=$(date +%s%N | cut -b1-13)
        local origin_city=$(get_random_city | cut -d: -f1)
        local dest_city=$(get_random_city | cut -d: -f1)
        
        local response=$(curl -s -X POST "$PLANNER_API_URL/api/shipments" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $ADMIN_TOKEN" \
            -d "{
                \"trackingNumber\": \"TRK${timestamp}${i}\",
                \"origin\": \"$origin_city\",
                \"destination\": \"$dest_city\",
                \"description\": \"Shipment $i: $origin_city to $dest_city\",
                \"weight\": $((1 + RANDOM % 50)),
                \"volume\": $((1 + RANDOM % 10))
            }")
        
        if [ $? -eq 0 ]; then
            local shipment_id=$(echo "$response" | jq -r '.id')
            if [ "$shipment_id" != "null" ] && [ -n "$shipment_id" ] && [ "$shipment_id" != "" ]; then
                SHIPMENT_IDS+=("$shipment_id")
                print_success "Shipment $i created with ID: $shipment_id"
            else
                print_error "Shipment creation failed. Response: $response"
            fi
        else
            print_error "HTTP request failed. Response: $response"
        fi
        
        sleep 1
    done
    
    if [ ${#SHIPMENT_IDS[@]} -gt 0 ]; then
        print_success "Created ${#SHIPMENT_IDS[@]} shipments"
        return 0
    else
        print_error "Failed to create any shipments"
        return 1
    fi
}

# Function to assign shipments to drivers
assign_shipments_to_drivers() {
    print_status "Assigning shipments to drivers..."
    
    local shipment_index=0
    for driver_id in "${DRIVER_IDS[@]}"; do
        # Assign 1-3 shipments per driver
        local assignments=$((1 + RANDOM % 3))
        
        for i in $(seq 1 $assignments); do
            if [ $shipment_index -lt ${#SHIPMENT_IDS[@]} ]; then
                local shipment_id="${SHIPMENT_IDS[$shipment_index]}"
                
                local response=$(curl -s -X POST "$DRIVER_API_URL/api/drivers/$driver_id/assign-shipment" \
                    -H "Content-Type: application/json" \
                    -H "Authorization: Bearer $ADMIN_TOKEN" \
                    -d "{
                        \"shipmentId\": \"$shipment_id\"
                    }")
                
                if [ $? -eq 0 ]; then
                    local success=$(echo "$response" | jq -r '.success')
                    if [ "$success" = "true" ]; then
                        print_success "Shipment $shipment_id assigned to driver $driver_id"
                    else
                        print_warning "Failed to assign shipment $shipment_id to driver $driver_id"
                    fi
                fi
                
                shipment_index=$((shipment_index + 1))
            fi
        done
    done
}

# Function to simulate realistic driver movements
simulate_driver_movements() {
    print_status "Starting realistic driver movement simulation..."
    
    for driver_id in "${DRIVER_IDS[@]}"; do
        print_status "Simulating movements for driver $driver_id..."
        
        # Start from a random city
        local start_city_info=$(get_random_city)
        local start_city=$(echo "$start_city_info" | cut -d: -f1)
        local start_coords=$(echo "$start_city_info" | cut -d: -f2)
        local start_lat=$(echo "$start_coords" | cut -d, -f1)
        local start_lng=$(echo "$start_coords" | cut -d, -f2)
        
        # Add some random offset for more realistic starting position
        local offset_coords=$(add_random_offset "$start_lat" "$start_lng")
        local offset_lat=$(echo "$offset_coords" | cut -d: -f1)
        local offset_lng=$(echo "$offset_coords" | cut -d: -f2)
        
        # Update initial location
        update_driver_location "$offset_lat" "$offset_lng" "$start_city" "$driver_id"
        sleep 2
        
        # Simulate route with 3-6 stops
        local route_length=$((3 + RANDOM % 4))
        for i in $(seq 1 $route_length); do
            local next_city_info=$(get_random_city)
            local next_city=$(echo "$next_city_info" | cut -d: -f1)
            local next_coords=$(echo "$next_city_info" | cut -d: -f2)
            local next_lat=$(echo "$next_coords" | cut -d, -f1)
            local next_lng=$(echo "$next_coords" | cut -d, -f2)
            
            # Add random offset for more realistic positioning
            local next_offset_coords=$(add_random_offset "$next_lat" "$next_lng")
            local next_offset_lat=$(echo "$next_offset_coords" | cut -d: -f1)
            local next_offset_lng=$(echo "$next_offset_coords" | cut -d: -f2)
            
            update_driver_location "$next_offset_lat" "$next_offset_lng" "$next_city" "$driver_id"
            sleep $((2 + RANDOM % 4))  # Random delay between 2-5 seconds
        done
        
        print_success "Completed route simulation for driver $driver_id"
    done
}

# Function to update driver location with driver ID parameter
update_driver_location() {
    local lat=$1
    local lng=$2
    local city=$3
    local driver_id=$4
    
    print_status "Updating driver $driver_id location to $city ($lat, $lng)..."
    
    local response=$(curl -s -X PUT "$DRIVER_API_URL/api/drivers/$driver_id/location" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -d "{
            \"latitude\": $lat,
            \"longitude\": $lng,
            \"speed\": $((20 + RANDOM % 80)),
            \"heading\": $((RANDOM % 360)),
            \"accuracy\": $((3 + RANDOM % 8))
        }")
    
    if [ $? -eq 0 ]; then
        local success=$(echo "$response" | jq -r '.success')
        if [ "$success" = "true" ]; then
            print_success "Driver $driver_id location updated to $city"
        else
            print_warning "Location update failed for driver $driver_id in $city"
        fi
    else
        print_error "Failed to update location for driver $driver_id to $city"
    fi
}

# Function to test tracking service with multiple drivers
test_tracking_service() {
    print_header "Testing Tracking Service"
    
    # Wait for tracking service
    wait_for_service "Tracking Service" "$TRACKING_SERVICE_URL/api/health"
    
    # Test health endpoint
    print_status "Testing tracking service health..."
    local health_response=$(curl -s "$TRACKING_SERVICE_URL/api/health")
    if [ $? -eq 0 ]; then
        local status=$(echo "$health_response" | jq -r '.status')
        if [ "$status" = "healthy" ]; then
            print_success "Tracking service is healthy"
        else
            print_warning "Tracking service health check failed"
        fi
    fi
    
    # Test active drivers endpoint
    print_status "Testing active drivers endpoint..."
    local drivers_response=$(curl -s "$TRACKING_SERVICE_URL/api/drivers")
    if [ $? -eq 0 ]; then
        local count=$(echo "$drivers_response" | jq -r '.count')
        print_success "Found $count active drivers"
    fi
    
    # Test specific driver endpoints
    for driver_id in "${DRIVER_IDS[@]}"; do
        print_status "Testing driver $driver_id polyline endpoint..."
        local polyline_response=$(curl -s "$TRACKING_SERVICE_URL/api/drivers/$driver_id/polyline")
        if [ $? -eq 0 ]; then
            local location_count=$(echo "$polyline_response" | jq -r '.locationCount')
            local total_distance=$(echo "$polyline_response" | jq -r '.totalDistance')
            if [ "$location_count" != "null" ] && [ "$location_count" -gt 0 ]; then
                print_success "Driver $driver_id polyline: $location_count locations, ${total_distance}km total distance"
            else
                print_warning "Driver $driver_id polyline: No locations recorded yet"
            fi
        fi
    done
}

# Function to show final summary
show_summary() {
    print_header "Enhanced Simulation Summary"
    
    echo -e "${CYAN}📊 Results:${NC}"
    echo -e "  • Drivers Created: ${GREEN}${#DRIVER_IDS[@]}${NC}"
    echo -e "  • Shipments Created: ${GREEN}${#SHIPMENT_IDS[@]}${NC}"
    echo -e "  • Cities Visited: ${GREEN}${#TURKISH_CITIES[@]}${NC}"
    echo -e "  • Realistic Routes: ${GREEN}Generated${NC}"
    
    echo -e "\n${CYAN}🚗 Driver IDs:${NC}"
    for i in "${!DRIVER_IDS[@]}"; do
        echo -e "  • Driver $((i+1)): ${GREEN}${DRIVER_IDS[$i]}${NC}"
    done
    
    echo -e "\n${CYAN}🔗 Service URLs:${NC}"
    echo -e "  • API Gateway: ${BLUE}$API_GATEWAY_URL${NC}"
    echo -e "  • Driver API: ${BLUE}$DRIVER_API_URL${NC}"
    echo -e "  • Planner API: ${BLUE}$PLANNER_API_URL${NC}"
    echo -e "  • ML Service: ${BLUE}$ML_SERVICE_URL${NC}"
    echo -e "  • Tracking Service: ${BLUE}$TRACKING_SERVICE_URL${NC}"
    echo -e "  • Tracking Dashboard: ${BLUE}http://localhost:8002/tracking-dashboard/index.html${NC}"
    
    echo -e "\n${CYAN}📱 Enhanced Features:${NC}"
    echo -e "  • Multiple drivers with unique routes"
    echo -e "  • Random city selection from 20 Turkish cities"
    echo -e "  • Realistic coordinate offsets"
    echo -e "  • Variable speed and heading"
    echo -e "  • Random delays between movements"
    echo -e "  • Driver-specific shipment assignments"
    
    echo -e "\n${CYAN}🎯 Next Steps:${NC}"
    echo -e "  • Open tracking dashboard in browser"
    echo -e "  • Hover over driver markers for details"
    echo -e "  • Monitor real-time driver movements"
    echo -e "  • Check individual driver polylines"
    echo -e "  • Test route optimization with multiple drivers"
    
    print_success "Enhanced mobile client simulation completed successfully!"
}

# Main execution
main() {
    print_header "🚗 Enhanced Mobile Client Simulation"
    print_status "Starting enhanced mobile app simulation with multiple drivers..."
    
    # Check if bc is available for floating point calculations
    if ! command -v bc &> /dev/null; then
        print_error "bc command is required for coordinate calculations. Please install it."
        exit 1
    fi
    
    # Get admin token
    if ! get_admin_token; then
        print_error "Failed to get admin token. Exiting."
        exit 1
    fi
    
    # Create multiple drivers (3-5 drivers)
    local driver_count=$((3 + RANDOM % 3))
    if ! create_multiple_drivers $driver_count; then
        print_error "Failed to create drivers. Exiting."
        exit 1
    fi
    
    # Create shipments
    if ! create_shipments; then
        print_error "Failed to create shipments. Exiting."
        exit 1
    fi
    
    # Assign shipments to drivers
    assign_shipments_to_drivers
    
    # Test tracking service
    test_tracking_service
    
    # Simulate realistic driver movements
    simulate_driver_movements
    
    # Show summary
    show_summary
}

# Run main function
main "$@" 