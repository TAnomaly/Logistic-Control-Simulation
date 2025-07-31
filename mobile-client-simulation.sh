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
DRIVER_ID=""
SHIPMENT_IDS=()

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

# Function to create a driver
create_driver() {
    print_status "Creating a new driver..."
    
    local timestamp=$(date +%s%N | cut -b1-13)
    local response=$(curl -s -X POST "$DRIVER_API_URL/api/drivers" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -d "{
            \"name\": \"Test Driver $timestamp\",
            \"licenseNumber\": \"MOBILE$timestamp\",
            \"phoneNumber\": \"+90555$timestamp\"
        }")
    
    if [ $? -eq 0 ]; then
        DRIVER_ID=$(echo "$response" | jq -r '.id')
        if [ "$DRIVER_ID" != "null" ] && [ -n "$DRIVER_ID" ] && [ "$DRIVER_ID" != "" ]; then
            print_success "Driver created with ID: $DRIVER_ID"
            return 0
        else
            print_error "Driver creation failed. Response: $response"
        fi
    else
        print_error "HTTP request failed. Response: $response"
    fi
    
    print_error "Failed to create driver"
    return 1
}

# Function to create shipments
create_shipments() {
    print_status "Creating shipments..."
    
    local shipment_count=$((1 + RANDOM % 5)) # 1-5 shipments
    print_status "Creating $shipment_count shipments..."
    
    for i in $(seq 1 $shipment_count); do
        local timestamp=$(date +%s%N | cut -b1-13)
        local response=$(curl -s -X POST "$PLANNER_API_URL/api/shipments" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $ADMIN_TOKEN" \
                    -d "{
            \"trackingNumber\": \"TRK$timestamp$i\",
            \"origin\": \"Ankara\",
            \"destination\": \"Istanbul\",
            \"description\": \"Test shipment $i\",
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
    done
    
    if [ ${#SHIPMENT_IDS[@]} -gt 0 ]; then
        print_success "Created ${#SHIPMENT_IDS[@]} shipments"
        return 0
    else
        print_error "Failed to create any shipments"
        return 1
    fi
}

# Function to assign shipments to driver
assign_shipments() {
    print_status "Assigning shipments to driver..."
    
    for shipment_id in "${SHIPMENT_IDS[@]}"; do
        local response=$(curl -s -X POST "$DRIVER_API_URL/api/drivers/$DRIVER_ID/assign-shipment" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $ADMIN_TOKEN" \
            -d "{
                \"shipmentId\": \"$shipment_id\"
            }")
        
        if [ $? -eq 0 ]; then
            local success=$(echo "$response" | jq -r '.success')
            if [ "$success" = "true" ]; then
                print_success "Shipment $shipment_id assigned to driver"
            else
                print_warning "Failed to assign shipment $shipment_id via API, using direct DB insertion"
                # Direct database insertion as fallback
                docker exec logistic-postgres psql -U postgres -d driver_db -c "
                    INSERT INTO driver_assignments (\"driverId\", \"shipmentId\", \"assignedAt\", status)
                    VALUES ('$DRIVER_ID', '$shipment_id', NOW(), 'pending');
                "
            fi
        fi
    done
}

# Function to simulate mobile app location updates
simulate_mobile_updates() {
    print_status "Starting mobile app simulation..."
    
    # Initial location (Ankara)
    update_driver_location 39.9334 32.8597 "Ankara"
    sleep 2
    
    # Move to Istanbul
    update_driver_location 41.0082 28.9784 "Istanbul"
    sleep 2
    
    # Move to Izmir
    update_driver_location 38.4192 27.1287 "Izmir"
    sleep 2
    
    # Move to Bursa
    update_driver_location 40.1885 29.0610 "Bursa"
    sleep 2
    
    # Move to Antalya
    update_driver_location 36.8969 30.7133 "Antalya"
    sleep 2
    
    # Test polyline after location updates
    print_status "Testing driver polyline after location updates..."
    sleep 3  # Wait for webhook processing
    local polyline_response=$(curl -s "$TRACKING_SERVICE_URL/api/drivers/$DRIVER_ID/polyline")
    if [ $? -eq 0 ]; then
        local location_count=$(echo "$polyline_response" | jq -r '.locationCount')
        local total_distance=$(echo "$polyline_response" | jq -r '.totalDistance')
        if [ "$location_count" != "null" ] && [ "$location_count" -gt 0 ]; then
            print_success "Driver polyline: $location_count locations, ${total_distance}km total distance"
        else
            print_warning "Driver polyline: No locations recorded yet"
        fi
    fi
    
    print_success "Mobile app simulation completed"
}

# Function to update driver location
update_driver_location() {
    local lat=$1
    local lng=$2
    local city=$3
    
    print_status "Updating driver location to $city ($lat, $lng)..."
    
    local response=$(curl -s -X PUT "$DRIVER_API_URL/api/drivers/$DRIVER_ID/location" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -d "{
            \"latitude\": $lat,
            \"longitude\": $lng,
            \"speed\": $((30 + RANDOM % 50)),
            \"heading\": $((RANDOM % 360)),
            \"accuracy\": $((5 + RANDOM % 10))
        }")
    
    if [ $? -eq 0 ]; then
        local success=$(echo "$response" | jq -r '.success')
        if [ "$success" = "true" ]; then
            print_success "Location updated to $city"
        else
            print_warning "Location update failed for $city"
        fi
    else
        print_error "Failed to update location to $city"
    fi
}

# Function to test tracking service
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
    
    # Test specific driver endpoint
    if [ -n "$DRIVER_ID" ]; then
        print_status "Testing driver polyline endpoint..."
        local polyline_response=$(curl -s "$TRACKING_SERVICE_URL/api/drivers/$DRIVER_ID/polyline")
        if [ $? -eq 0 ]; then
            local location_count=$(echo "$polyline_response" | jq -r '.locationCount')
            local total_distance=$(echo "$polyline_response" | jq -r '.totalDistance')
            print_success "Driver polyline: $location_count locations, ${total_distance}km total distance"
        fi
    fi
}

# Function to test ML service
test_ml_service() {
    print_header "Testing ML Service"
    
    # Wait for ML service
    wait_for_service "ML Service" "$ML_SERVICE_URL/api/health"
    
    # Test basic route optimization
    print_status "Testing basic route optimization..."
    local basic_response=$(curl -s -X POST "$ML_SERVICE_URL/api/optimize-route" \
        -H "Content-Type: application/json" \
        -d '{
            "driverId": "test-driver",
            "driverLocation": {"latitude": 41.0082, "longitude": 28.9784},
            "deliveries": [
                {"id": "delivery1", "address": "Ankara", "coordinates": {"latitude": 39.9334, "longitude": 32.8597}, "priority": "high", "weight": 10, "volume": 2},
                {"id": "delivery2", "address": "Izmir", "coordinates": {"latitude": 38.4192, "longitude": 27.1287}, "priority": "medium", "weight": 15, "volume": 3},
                {"id": "delivery3", "address": "Bursa", "coordinates": {"latitude": 40.1885, "longitude": 29.0610}, "priority": "low", "weight": 8, "volume": 1}
            ]
        }')
    
    if [ $? -eq 0 ]; then
        local optimized_route=$(echo "$basic_response" | jq -r '.optimizedRoute')
        if [ "$optimized_route" != "null" ] && [ -n "$optimized_route" ]; then
            local total_distance=$(echo "$basic_response" | jq -r '.totalDistance')
            print_success "Basic route optimization successful - Total distance: ${total_distance}km"
        else
            print_warning "Basic route optimization failed"
        fi
    fi
    
    # Test H3 route optimization
    print_status "Testing H3 route optimization..."
    local h3_response=$(curl -s -X POST "$ML_SERVICE_URL/api/optimize-route-h3" \
        -H "Content-Type: application/json" \
        -d '{
            "driverId": "test-driver",
            "driverLocation": {"latitude": 41.0082, "longitude": 28.9784},
            "deliveries": [
                {"id": "delivery1", "address": "Ankara", "coordinates": {"latitude": 39.9334, "longitude": 32.8597}, "priority": "high", "weight": 10, "volume": 2},
                {"id": "delivery2", "address": "Izmir", "coordinates": {"latitude": 38.4192, "longitude": 27.1287}, "priority": "medium", "weight": 15, "volume": 3},
                {"id": "delivery3", "address": "Bursa", "coordinates": {"latitude": 40.1885, "longitude": 29.0610}, "priority": "low", "weight": 8, "volume": 1}
            ],
            "h3Resolution": 9
        }')
    
    if [ $? -eq 0 ]; then
        local optimized_route=$(echo "$h3_response" | jq -r '.optimizedRoute')
        if [ "$optimized_route" != "null" ] && [ -n "$optimized_route" ]; then
            local total_distance=$(echo "$h3_response" | jq -r '.totalDistance')
            print_success "H3 route optimization successful - Total distance: ${total_distance}km"
        else
            print_warning "H3 route optimization failed"
        fi
    fi
}

# Function to show final summary
show_summary() {
    print_header "Simulation Summary"
    
    echo -e "${CYAN}📊 Results:${NC}"
    echo -e "  • Driver ID: ${GREEN}$DRIVER_ID${NC}"
    echo -e "  • Shipments Created: ${GREEN}${#SHIPMENT_IDS[@]}${NC}"
    echo -e "  • Location Updates: ${GREEN}5 cities${NC}"
    echo -e "  • Webhook Events: ${GREEN}Triggered${NC}"
    
    echo -e "\n${CYAN}🔗 Service URLs:${NC}"
    echo -e "  • API Gateway: ${BLUE}$API_GATEWAY_URL${NC}"
    echo -e "  • Driver API: ${BLUE}$DRIVER_API_URL${NC}"
    echo -e "  • Planner API: ${BLUE}$PLANNER_API_URL${NC}"
    echo -e "  • ML Service: ${BLUE}$ML_SERVICE_URL${NC}"
    echo -e "  • Tracking Service: ${BLUE}$TRACKING_SERVICE_URL${NC}"
    echo -e "  • Tracking Dashboard: ${BLUE}http://localhost:8002/tracking-dashboard/index.html${NC}"
    
    echo -e "\n${CYAN}📱 Mobile App Simulation:${NC}"
    echo -e "  • Ankara → Istanbul → Izmir → Bursa → Antalya"
    echo -e "  • Real-time location tracking"
    echo -e "  • Polyline generation"
    echo -e "  • WebSocket updates"
    
    echo -e "\n${CYAN}🎯 Next Steps:${NC}"
    echo -e "  • Open tracking dashboard in browser"
    echo -e "  • Monitor real-time driver movements"
    echo -e "  • Check webhook consumer logs"
    echo -e "  • Test route optimization endpoints"
    
    print_success "Mobile client simulation completed successfully!"
}

# Main execution
main() {
    print_header "🚗 Mobile Client Simulation"
    print_status "Starting comprehensive mobile app simulation..."
    
    # Check if services are running
    print_status "Checking service availability..."
    
    # Get admin token
    if ! get_admin_token; then
        print_error "Failed to get admin token. Exiting."
        exit 1
    fi
    
    # Create driver
    if ! create_driver; then
        print_error "Failed to create driver. Exiting."
        exit 1
    fi
    
    # Create shipments
    if ! create_shipments; then
        print_error "Failed to create shipments. Exiting."
        exit 1
    fi
    
    # Assign shipments to driver
    assign_shipments
    
    # Test tracking service
    test_tracking_service
    
    # Test ML service
    test_ml_service
    
    # Simulate mobile app updates
    simulate_mobile_updates
    
    # Show summary
    show_summary
}

# Run main function
main "$@" 