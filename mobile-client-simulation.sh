#!/bin/bash

# Mobile Client Simulation Script
# Chapter Lead Demo için hazırlanmıştır

set -e

# API Endpoints
API_DRIVER="http://localhost:3001/api"
API_PLANNER="http://localhost:3000/api"
ADMIN_EMAIL="admin@logistic.com"
ADMIN_PASS="admin123"

# Renkler
GREEN="\033[1;32m"
CYAN="\033[1;36m"
YELLOW="\033[1;33m"
RED="\033[1;31m"
PURPLE="\033[1;35m"
BLUE="\033[1;34m"
NC="\033[0m"

# Global değişkenler
DRIVER_ID=""
ADMIN_TOKEN=""

function print_header() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    MOBİL CLIENT SIMÜLASYONU                  ║"
    echo "║                     Demo                         ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

function print_step() {
    echo -e "${YELLOW}🔄 $1${NC}"
}

function print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

function print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

function print_webhook() {
    echo -e "${PURPLE}📡 $1${NC}"
}

function print_route() {
    echo -e "${CYAN}🗺️  $1${NC}"
}

function wait_for_services() {
    print_step "Servislerin hazır olması bekleniyor..."
    
    # Driver API kontrolü
    until curl -s http://localhost:3001/api/health > /dev/null 2>&1; do
        sleep 1
    done
    
    # Planner API kontrolü
    until curl -s http://localhost:3000/api/health > /dev/null 2>&1; do
        sleep 1
    done
    
    # ML Service kontrolü
    until curl -s http://localhost:8000/health > /dev/null 2>&1; do
        sleep 1
    done
    
    print_success "Tüm servisler hazır!"
}

function get_admin_token() {
    print_step "Admin token alınıyor..."
    ADMIN_TOKEN=$(curl -s -X POST $API_DRIVER/auth/admin/login \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"$ADMIN_EMAIL\", \"password\": \"$ADMIN_PASS\"}" \
        | jq -r '.access_token')
    
    if [[ "$ADMIN_TOKEN" == "null" || -z "$ADMIN_TOKEN" ]]; then
        echo -e "${RED}❌ Admin token alınamadı!${NC}"
        echo "Response: $(curl -s -X POST $API_DRIVER/auth/admin/login -H "Content-Type: application/json" -d "{\"email\": \"$ADMIN_EMAIL\", \"password\": \"$ADMIN_PASS\"}")"
        exit 1
    fi
    
    print_success "Admin token alındı"
}

function create_test_driver() {
    print_step "Test driver oluşturuluyor..."
    
    # Unique license number oluştur
    TIMESTAMP=$(date +%s)
    LICENSE_NUMBER="MOBILE${TIMESTAMP}"
    
    DRIVER_RESPONSE=$(curl -s -X POST $API_DRIVER/drivers \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -d "{
            \"name\": \"Mobile App Driver\",
            \"licenseNumber\": \"$LICENSE_NUMBER\",
            \"phoneNumber\": \"5551234567\"
        }")
    
    echo "Driver Response: $DRIVER_RESPONSE"
    
    DRIVER_ID=$(echo "$DRIVER_RESPONSE" | jq -r '.id')
    
    if [[ "$DRIVER_ID" == "null" || -z "$DRIVER_ID" ]]; then
        echo -e "${RED}❌ Driver oluşturulamadı!${NC}"
        echo "Full response: $DRIVER_RESPONSE"
        exit 1
    fi
    
    print_success "Driver oluşturuldu: $DRIVER_ID"
}

function assign_shipments() {
    print_step "Driver'a shipment'lar atanıyor..."
    
    # Mevcut shipment'ları al
    SHIPMENT_IDS=$(curl -s -X GET $API_PLANNER/shipments \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        | jq -r '.[] | select(.status=="pending") | .id' | head -3)
    
    if [[ -z "$SHIPMENT_IDS" ]]; then
        echo -e "${RED}❌ Kullanılabilir shipment bulunamadı!${NC}"
        exit 1
    fi
    
    # Shipment'ları driver'a ata - direkt veritabanına kaydet
    echo "$SHIPMENT_IDS" | while read SHIPMENT_ID; do
        if [[ -n "$SHIPMENT_ID" ]]; then
            # Direkt veritabanına kaydet
            docker exec logistic-postgres psql -U postgres -d driver_db -c "INSERT INTO driver_assignments (\"driverId\", \"shipmentId\", status, \"assignedAt\", \"createdAt\", \"updatedAt\") VALUES ('$DRIVER_ID', '$SHIPMENT_ID', 'pending', NOW(), NOW(), NOW());" > /dev/null 2>&1
            
            print_success "Shipment $SHIPMENT_ID driver'a atandı (veritabanına kaydedildi)"
        fi
    done
}

function simulate_mobile_location_update() {
    local location_name=$1
    local latitude=$2
    local longitude=$3
    local address=$4
    
    print_step "📱 Mobil uygulamadan konum güncellemesi: $location_name"
    print_info "Konum: $address ($latitude, $longitude)"
    
    # Mobil uygulamadan geliyormuş gibi konum güncellemesi
    LOCATION_RESPONSE=$(curl -s -X PUT $API_DRIVER/drivers/$DRIVER_ID/location \
        -H "Content-Type: application/json" \
        -d "{
            \"latitude\": $latitude,
            \"longitude\": $longitude,
            \"address\": \"$address\",
            \"speed\": 0,
            \"heading\": 0
        }")
    
    if echo "$LOCATION_RESPONSE" | jq -e '.success' > /dev/null; then
        print_success "Konum güncellendi"
        print_webhook "Webhook event'i tetiklendi: driver.location.updated"
        
        # Webhook event'inin işlenmesi için bekle
        sleep 3
        
        # Driver'ın güncel rotasını kontrol et
        check_driver_route
    else
        echo -e "${RED}❌ Konum güncellenemedi!${NC}"
        echo "$LOCATION_RESPONSE"
    fi
}

function check_driver_route() {
    print_step "Driver'ın güncel rotası kontrol ediliyor..."
    
    ROUTE_RESPONSE=$(curl -s -X GET $API_DRIVER/drivers/$DRIVER_ID/current-route \
        -H "Authorization: Bearer $ADMIN_TOKEN")
    
    if echo "$ROUTE_RESPONSE" | jq -e '.success' > /dev/null; then
        local optimized_route=$(echo "$ROUTE_RESPONSE" | jq -r '.optimizedRoute')
        local total_distance=$(echo "$ROUTE_RESPONSE" | jq -r '.totalDistance')
        local total_time=$(echo "$ROUTE_RESPONSE" | jq -r '.totalTime')
        local status=$(echo "$ROUTE_RESPONSE" | jq -r '.status')
        
        print_route "OPTİMİZE EDİLMİŞ ROTA:"
        echo -e "${CYAN}   🛣️  $optimized_route${NC}"
        echo -e "${CYAN}   📏 Toplam Mesafe: ${total_distance} km${NC}"
        echo -e "${CYAN}   ⏱️  Tahmini Süre: ${total_time} saat${NC}"
        echo -e "${CYAN}   📊 Durum: $status${NC}"
    else
        print_info "Henüz optimize edilmiş rota yok"
    fi
}

function show_webhook_logs() {
    print_step "Webhook consumer logları kontrol ediliyor..."
    
    WEBHOOK_LOGS=$(docker logs logistic-webhook-consumer --tail 10 2>/dev/null || echo "Webhook consumer logları alınamadı")
    
    if [[ -n "$WEBHOOK_LOGS" ]]; then
        echo -e "${PURPLE}📡 Webhook Consumer Logları:${NC}"
        echo "$WEBHOOK_LOGS"
    else
        print_info "Webhook consumer logları bulunamadı"
    fi
}

function show_final_summary() {
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    DEMO TAMAMLANDI!                          ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    print_info "🎯 Gösterilen Özellikler:"
    echo -e "${BLUE}   • Mobil uygulamadan konum güncellemesi${NC}"
    echo -e "${BLUE}   • Webhook event sistemi${NC}"
    echo -e "${BLUE}   • Otomatik rota optimizasyonu${NC}"
    echo -e "${BLUE}   • Real-time rota güncellemesi${NC}"
    echo -e "${BLUE}   • PostgreSQL'e rota kaydetme${NC}"
    
    print_info "🔧 Teknik Detaylar:"
    echo -e "${BLUE}   • Driver ID: $DRIVER_ID${NC}"
    echo -e "${BLUE}   • Event Type: driver.location.updated${NC}"
    echo -e "${BLUE}   • ML Service: Route Optimization${NC}"
    echo -e "${BLUE}   • Database: PostgreSQL${NC}"
    echo -e "${BLUE}   • Message Broker: RabbitMQ${NC}"
}

# Ana fonksiyon
function main() {
    print_header
    
    # Servisleri kontrol et
    wait_for_services
    
    # Admin token al
    get_admin_token
    
    # Test driver oluştur
    create_test_driver
    
    # Shipment'ları ata
    assign_shipments
    
    echo -e "${YELLOW}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║              MOBİL UYGULAMA SİMÜLASYONU BAŞLIYOR            ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    # Mobil uygulamadan konum güncellemeleri simüle et
    simulate_mobile_location_update "Ankara" 39.9334 32.8597 "Ankara, Turkey"
    sleep 2
    
    simulate_mobile_location_update "Istanbul" 41.0082 28.9784 "Istanbul, Turkey"
    sleep 2
    
    simulate_mobile_location_update "Izmir" 38.4192 27.1287 "Izmir, Turkey"
    sleep 2
    
    # Webhook loglarını göster
    show_webhook_logs
    
    # Final özet
    show_final_summary
}

# Scripti çalıştır
main "$@" 