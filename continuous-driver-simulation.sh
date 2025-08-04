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
    
    local response=$(curl -s -X POST "$PLANNER_API_URL/api/auth/planner/login" \
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

# Function to simulate realistic movement between cities
simulate_city_movement() {
    local driver_id=$1
    local current_lat=$2
    local current_lng=$3
    local target_city_info=$4
    
    local target_city=$(echo "$target_city_info" | cut -d: -f1)
    local target_coords=$(echo "$target_city_info" | cut -d: -f2)
    local target_lat=$(echo "$target_coords" | cut -d, -f1)
    local target_lng=$(echo "$target_coords" | cut -d, -f2)
    
    # Calculate distance and direction
    local distance=$(echo "scale=2; sqrt(($target_lat - $current_lat)^2 + ($target_lng - $current_lng)^2) * 111" | bc -l)
    local steps=$(( $(echo "scale=0; $distance / 2" | bc -l) + 1 ))  # 2km steps for smoother movement
    
    print_status "Driver $driver_id moving to $target_city (${distance}km, $steps steps)"
    
    for i in $(seq 1 $steps); do
        # Interpolate position
        local progress=$(echo "scale=6; $i / $steps" | bc -l)
        local new_lat=$(echo "scale=6; $current_lat + ($target_lat - $current_lat) * $progress" | bc -l)
        local new_lng=$(echo "scale=6; $current_lng + ($target_lng - $current_lng) * $progress" | bc -l)
        
        # Random heading (simplified)
        local heading=$((RANDOM % 360))
        
        # Random speed between 40-80 km/h
        local speed=$((40 + RANDOM % 40))
        
        # Update location
        if update_driver_location "$driver_id" "$new_lat" "$new_lng" "$speed" "$heading"; then
            print_success "Driver $driver_id: Step $i/$steps - Lat: $new_lat, Lng: $new_lng, Speed: ${speed}km/h"
        else
            print_warning "Failed to update driver $driver_id location"
        fi
        
        # Faster updates for real-time tracking (0.5-1.5 seconds)
        sleep $((1 + RANDOM % 2))
    done
    
    print_success "Driver $driver_id arrived at $target_city"
}

# Function to simulate continuous driver movements
simulate_continuous_movements() {
    print_header "🚗 Continuous Driver Movement Simulation"
    print_status "Starting continuous movement simulation..."
    
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
        
        # Store position in array using index
        eval "driver_pos_$i=\"$offset_lat:$offset_lng\""
        
        # Set initial position
        update_driver_location "$driver_id" "$offset_lat" "$offset_lng" 0 0
        print_success "Driver $driver_id initialized at $offset_lat, $offset_lng"
    done
    
    # Continuous movement loop
    local iteration=1
    while true; do
        print_header "🔄 Movement Iteration $iteration"
        
        for i in "${!DRIVER_IDS[@]}"; do
            local driver_id="${DRIVER_IDS[$i]}"
            local current_pos_var="driver_pos_$i"
            local current_pos="${!current_pos_var}"
            local current_lat=$(echo "$current_pos" | cut -d: -f1)
            local current_lng=$(echo "$current_pos" | cut -d: -f2)
            
            # Choose next destination
            local next_city=$(get_random_city)
            local city_name=$(echo "$next_city" | cut -d: -f1)
            
            print_status "Driver $driver_id planning route to $city_name..."
            
            # Simulate movement to next city
            simulate_city_movement "$driver_id" "$current_lat" "$current_lng" "$next_city"
            
            # Update current position
            local new_coords=$(echo "$next_city" | cut -d: -f2)
            local new_lat=$(echo "$new_coords" | cut -d, -f1)
            local new_lng=$(echo "$new_coords" | cut -d, -f2)
            
            # Add random offset for more realistic positioning
            local final_offset=$(add_random_offset "$new_lat" "$new_lng")
            local final_lat=$(echo "$final_offset" | cut -d: -f1)
            local final_lng=$(echo "$final_offset" | cut -d: -f2)
            
            # Update position variable
            eval "$current_pos_var=\"$final_lat:$final_lng\""
            
            # Brief pause at destination
            print_status "Driver $driver_id pausing at $city_name..."
            sleep $((5 + RANDOM % 10))
        done
        
        print_success "Completed iteration $iteration"
        iteration=$((iteration + 1))
        
        # Brief pause between iterations
        sleep 10
    done
}

# Main execution
main() {
    print_header "🚗 Continuous Driver Simulation"
    print_status "Starting continuous driver movement simulation..."
    
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
    
    print_success "Starting continuous simulation with ${#DRIVER_IDS[@]} drivers"
    print_status "Press Ctrl+C to stop the simulation"
    
    # Start continuous movement simulation
    simulate_continuous_movements
}

# Handle Ctrl+C gracefully
trap 'echo -e "\n${YELLOW}[INFO]${NC} Stopping simulation..."; exit 0' INT

# Run main function
main "$@" 