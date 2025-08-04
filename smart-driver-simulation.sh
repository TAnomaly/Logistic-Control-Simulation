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
TRACKING_SERVICE_URL="http://localhost:8002"

# Global variables
ADMIN_TOKEN=""
DRIVER_IDS=()

# Turkish cities with coordinates
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

print_notification() {
    echo -e "${CYAN}🔔 NOTIFICATION:${NC} $1"
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

# Function to get existing drivers
get_existing_drivers() {
    print_status "Getting existing drivers..."
    
    local response=$(curl -s -X GET "$DRIVER_API_URL/api/drivers" \
        -H "Authorization: Bearer $ADMIN_TOKEN")
    
    if [ $? -eq 0 ]; then
        local drivers=$(echo "$response" | jq -r '.drivers[].id')
        if [ -n "$drivers" ]; then
            while IFS= read -r driver_id; do
                if [ -n "$driver_id" ] && [ "$driver_id" != "null" ]; then
                    DRIVER_IDS+=("$driver_id")
                fi
            done <<< "$drivers"
            print_success "Found ${#DRIVER_IDS[@]} existing drivers"
            return 0
        else
            print_warning "No existing drivers found"
            return 1
        fi
    else
        print_error "Failed to get drivers"
        return 1
    fi
}

# Function to create drivers if none exist
create_drivers_if_needed() {
    if [ ${#DRIVER_IDS[@]} -eq 0 ]; then
        print_status "No drivers found, creating new drivers..."
        
        local driver_count=3
        for i in $(seq 1 $driver_count); do
            local timestamp=$(date +%s%N | cut -b1-13)
            local city_info=$(get_random_city)
            local city_name=$(echo "$city_info" | cut -d: -f1)
            local driver_name="Driver $i - $city_name"
            
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
                    print_error "Driver $i creation failed"
                fi
            else
                print_error "Failed to create driver $i"
            fi
            
            sleep 1
        done
    fi
}

# Function to update driver location
update_driver_location() {
    local driver_id=$1
    local lat=$2
    local lng=$3
    local speed=$4
    local heading=$5
    local status=$6
    
    local response=$(curl -s -X PUT "$DRIVER_API_URL/api/drivers/$driver_id/location" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -d "{
            \"latitude\": $lat,
            \"longitude\": $lng,
            \"speed\": $speed,
            \"heading\": $heading,
            \"accuracy\": $((3 + RANDOM % 8))
        }")
    
    if [ $? -eq 0 ]; then
        local success=$(echo "$response" | jq -r '.success')
        if [ "$success" = "true" ]; then
            return 0
        else
            return 1
        fi
    else
        return 1
    fi
}

# Function to simulate smart delivery route with key points
simulate_smart_delivery() {
    local driver_id=$1
    local start_city_info=$2
    local end_city_info=$3
    
    local start_city=$(echo "$start_city_info" | cut -d: -f1)
    local start_coords=$(echo "$start_city_info" | cut -d: -f2)
    local start_lat=$(echo "$start_coords" | cut -d, -f1)
    local start_lng=$(echo "$start_coords" | cut -d, -f2)
    
    local end_city=$(echo "$end_city_info" | cut -d: -f1)
    local end_coords=$(echo "$end_city_info" | cut -d: -f2)
    local end_lat=$(echo "$end_coords" | cut -d, -f1)
    local end_lng=$(echo "$end_coords" | cut -d, -f2)
    
    print_notification "🚛 Driver $driver_id starting delivery from $start_city to $end_city"
    
    # 1. Pickup location (warehouse)
    local pickup_offset=$(add_random_offset "$start_lat" "$start_lng")
    local pickup_lat=$(echo "$pickup_offset" | cut -d: -f1)
    local pickup_lng=$(echo "$pickup_offset" | cut -d: -f2)
    
    update_driver_location "$driver_id" "$pickup_lat" "$pickup_lng" 0 0
    print_notification "📦 Driver $driver_id arrived at pickup location in $start_city"
    sleep 3
    
    # 2. Highway entrance
    local highway_lat=$(echo "scale=6; $start_lat + 0.01" | bc -l)
    local highway_lng=$(echo "scale=6; $start_lng + 0.01" | bc -l)
    
    update_driver_location "$driver_id" "$highway_lat" "$highway_lng" 80 45
    print_notification "🛣️ Driver $driver_id entered highway, heading to $end_city"
    sleep 5
    
    # 3. Traffic light/intersection (random point)
    local mid_lat=$(echo "scale=6; ($start_lat + $end_lat) / 2" | bc -l)
    local mid_lng=$(echo "scale=6; ($start_lng + $end_lng) / 2" | bc -l)
    local traffic_offset=$(add_random_offset "$mid_lat" "$mid_lng")
    local traffic_lat=$(echo "$traffic_offset" | cut -d: -f1)
    local traffic_lng=$(echo "$traffic_offset" | cut -d: -f2)
    
    update_driver_location "$driver_id" "$traffic_lat" "$traffic_lng" 0 90
    print_notification "🚦 Driver $driver_id stopped at traffic light"
    sleep 2
    
    update_driver_location "$driver_id" "$traffic_lat" "$traffic_lng" 60 90
    print_notification "🚗 Driver $driver_id continued journey"
    sleep 4
    
    # 4. Delivery location
    local delivery_offset=$(add_random_offset "$end_lat" "$end_lng")
    local delivery_lat=$(echo "$delivery_offset" | cut -d: -f1)
    local delivery_lng=$(echo "$delivery_offset" | cut -d: -f2)
    
    update_driver_location "$driver_id" "$delivery_lat" "$delivery_lng" 0 180
    print_notification "✅ Driver $driver_id arrived at delivery location in $end_city"
    sleep 3
    
    # 5. Return to base (random city)
    local return_city=$(get_random_city)
    local return_city_name=$(echo "$return_city" | cut -d: -f1)
    local return_coords=$(echo "$return_city" | cut -d: -f2)
    local return_lat=$(echo "$return_coords" | cut -d, -f1)
    local return_lng=$(echo "$return_coords" | cut -d, -f2)
    
    update_driver_location "$driver_id" "$return_lat" "$return_lng" 70 270
    print_notification "🏠 Driver $driver_id returning to base in $return_city_name"
    sleep 2
    
    print_success "Driver $driver_id completed delivery route"
}

# Function to simulate smart driver movements
simulate_smart_movements() {
    print_header "🚛 Smart Driver Simulation"
    print_status "Starting smart delivery simulation with key point updates..."
    
    # Initialize starting positions for each driver
    for i in "${!DRIVER_IDS[@]}"; do
        local driver_id="${DRIVER_IDS[$i]}"
        local city_info=$(get_random_city)
        local coords=$(echo "$city_info" | cut -d: -f2)
        local lat=$(echo "$coords" | cut -d, -f1)
        local lng=$(echo "$coords" | cut -d, -f2)
        
        # Add random offset
        local offset_coords=$(add_random_offset "$lat" "$lng")
        local offset_lat=$(echo "$offset_coords" | cut -d: -f1)
        local offset_lng=$(echo "$offset_coords" | cut -d: -f2)
        
        # Set initial position
        update_driver_location "$driver_id" "$offset_lat" "$offset_lng" 0 0
        print_success "Driver $driver_id initialized at $offset_lat, $offset_lng"
    done
    
    # Smart delivery loop
    local iteration=1
    while true; do
        print_header "🔄 Smart Delivery Iteration $iteration"
        
        for i in "${!DRIVER_IDS[@]}"; do
            local driver_id="${DRIVER_IDS[$i]}"
            
            # Choose random start and end cities
            local start_city=$(get_random_city)
            local end_city=$(get_random_city)
            
            # Ensure different cities
            while [ "$start_city" = "$end_city" ]; do
                end_city=$(get_random_city)
            done
            
            print_status "Driver $driver_id planning smart delivery route..."
            
            # Simulate smart delivery with key points
            simulate_smart_delivery "$driver_id" "$start_city" "$end_city"
            
            # Brief pause between deliveries
            print_status "Driver $driver_id preparing for next delivery..."
            sleep $((3 + RANDOM % 5))
        done
        
        print_success "Completed smart delivery iteration $iteration"
        iteration=$((iteration + 1))
        
        # Brief pause between iterations
        sleep 10
    done
}

# Main execution
main() {
    print_header "🚛 Smart Driver Simulation"
    print_status "Starting smart driver simulation with key point updates..."
    
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
    
    # Get existing drivers or create new ones
    if ! get_existing_drivers; then
        create_drivers_if_needed
    fi
    
    if [ ${#DRIVER_IDS[@]} -eq 0 ]; then
        print_error "No drivers available. Exiting."
        exit 1
    fi
    
    print_success "Starting smart simulation with ${#DRIVER_IDS[@]} drivers"
    print_status "Press Ctrl+C to stop the simulation"
    print_notification "System will only update at key points: pickup, traffic lights, delivery, etc."
    
    # Start smart movement simulation
    simulate_smart_movements
}

# Handle Ctrl+C gracefully
trap 'echo -e "\n${YELLOW}[INFO]${NC} Stopping smart simulation..."; exit 0' INT

# Run main function
main "$@" 