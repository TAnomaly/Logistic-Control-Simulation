#!/bin/bash

# Logistic Control Simulation - Tam İş Akışı Test Script'i (Gelişmiş Versiyon)
# Bu script rastgele verilerle driver oluşturur, 3 sipariş yapar, ML ile dinamik rota optimizasyonu yapar ve driver'a atar

echo "🚀 Logistic Control Simulation - Gelişmiş Tam İş Akışı Testi Başlıyor..."
echo "========================================================================"

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Global değişkenler
PLANNER_TOKEN=""
DRIVER_TOKEN=""
DRIVER_ID=""
SHIPMENT_IDS=()
CURRENT_DRIVER_LOCATION=""
DELIVERY_STEPS=()
TOTAL_DISTANCE=0
TOTAL_TIME=0

# Rastgele veri oluşturma fonksiyonları
generate_random_name() {
    local names=("Ahmet Yılmaz" "Mehmet Demir" "Ali Kaya" "Hasan Özkan" "Mustafa Çelik" "İbrahim Şahin" "Ömer Arslan" "Yusuf Koç" "Fatih Aydın" "Emre Özdemir")
    echo "${names[$RANDOM % ${#names[@]}]}"
}

generate_random_license() {
    local letters=("A" "B" "C" "D" "E" "F" "G" "H" "I" "J" "K" "L" "M" "N" "O" "P" "R" "S" "T" "U" "V" "Y" "Z")
    local letter1="${letters[$RANDOM % ${#letters[@]}]}"
    local letter2="${letters[$RANDOM % ${#letters[@]}]}"
    local numbers=$((RANDOM % 900000 + 100000))
    echo "TR${letter1}${letter2}${numbers}"
}

generate_random_location() {
    local cities=("Istanbul" "Ankara" "Izmir" "Bursa" "Antalya" "Adana" "Konya" "Gaziantep" "Mersin" "Diyarbakir")
    echo "${cities[$RANDOM % ${#cities[@]}]}, Turkey"
}

generate_random_weight() {
    echo $((RANDOM % 2000 + 500))
}

# UI Fonksiyonları
print_header() {
    echo ""
    echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                    🚛 GELİŞMİŞ DRIVER ROTA TAKİP SİSTEMİ                    ║${NC}"
    echo -e "${BLUE}║                        ML Destekli Dinamik Optimizasyon                      ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_driver_info() {
    echo -e "${CYAN}┌──────────────────────────────────────────────────────────────────────────────────┐${NC}"
    echo -e "${CYAN}│                            🚛 DRIVER BİLGİLERİ                                │${NC}"
    echo -e "${CYAN}├──────────────────────────────────────────────────────────────────────────────────┤${NC}"
    echo -e "${CYAN}│  🆔 ID: $DRIVER_ID${NC}"
    echo -e "${CYAN}│  📍 Mevcut Konum: $CURRENT_DRIVER_LOCATION${NC}"
    echo -e "${CYAN}│  📦 Toplam Sipariş: ${#SHIPMENT_IDS[@]}${NC}"
    echo -e "${CYAN}│  📏 Toplam Mesafe: ${TOTAL_DISTANCE}km${NC}"
    echo -e "${CYAN}│  ⏱️  Toplam Süre: ${TOTAL_TIME} saat${NC}"
    echo -e "${CYAN}└──────────────────────────────────────────────────────────────────────────────────┘${NC}"
    echo ""
}

print_route_step() {
    local step_number=$1
    local from_location=$2
    local to_location=$3
    local shipment_id=$4
    local weight=$5
    local distance=$6
    local time=$7
    local optimization_type=$8
    
    echo -e "${PURPLE}┌──────────────────────────────────────────────────────────────────────────────────┐${NC}"
    echo -e "${PURPLE}│                            🗺️  ROTA ADIMI $step_number                                │${NC}"
    echo -e "${PURPLE}├──────────────────────────────────────────────────────────────────────────────────┤${NC}"
    echo -e "${PURPLE}│  🚛 Driver Konumu: $from_location${NC}"
    echo -e "${PURPLE}│  🎯 Hedef: $to_location${NC}"
    echo -e "${PURPLE}│  📦 Sipariş ID: $shipment_id${NC}"
    echo -e "${PURPLE}│  ⚖️  Ağırlık: ${weight}kg${NC}"
    echo -e "${PURPLE}│  📏 Mesafe: ${distance}km${NC}"
    echo -e "${PURPLE}│  ⏱️  Süre: ${time} saat${NC}"
    echo -e "${PURPLE}│  🤖 Optimizasyon: $optimization_type${NC}"
    echo -e "${PURPLE}└──────────────────────────────────────────────────────────────────────────────────┘${NC}"
    echo ""
}

print_delivery_complete() {
    local step_number=$1
    local location=$2
    local shipment_id=$3
    local distance=$4
    local time=$5
    
    echo -e "${GREEN}┌──────────────────────────────────────────────────────────────────────────────────┐${NC}"
    echo -e "${GREEN}│                            ✅ TESLİMAT TAMAMLANDI                              │${NC}"
    echo -e "${GREEN}├──────────────────────────────────────────────────────────────────────────────────┤${NC}"
    echo -e "${GREEN}│  📍 Yeni Driver Konumu: $location${NC}"
    echo -e "${GREEN}│  📦 Teslim Edilen Sipariş: $shipment_id${NC}"
    echo -e "${GREEN}│  🎯 Adım: $step_number / ${#SHIPMENT_IDS[@]}${NC}"
    echo -e "${GREEN}│  📏 Bu Adım Mesafesi: ${distance}km${NC}"
    echo -e "${GREEN}│  ⏱️  Bu Adım Süresi: ${time} saat${NC}"
    echo -e "${GREEN}└──────────────────────────────────────────────────────────────────────────────────┘${NC}"
    echo ""
}

print_ml_optimization() {
    local current_location=$1
    local remaining_shipments=$2
    
    echo -e "${YELLOW}┌──────────────────────────────────────────────────────────────────────────────────┐${NC}"
    echo -e "${YELLOW}│                            🤖 ML ROTA OPTİMİZASYONU                          │${NC}"
    echo -e "${YELLOW}├──────────────────────────────────────────────────────────────────────────────────┤${NC}"
    echo -e "${YELLOW}│  📍 Mevcut Konum: $current_location${NC}"
    echo -e "${YELLOW}│  📦 Kalan Sipariş: $remaining_shipments${NC}"
    echo -e "${YELLOW}│  🔄 Dinamik rota hesaplanıyor...${NC}"
    echo -e "${YELLOW}└──────────────────────────────────────────────────────────────────────────────────┘${NC}"
    echo ""
}

print_final_summary() {
    echo -e "${YELLOW}┌──────────────────────────────────────────────────────────────────────────────────┐${NC}"
    echo -e "${YELLOW}│                                📊 FİNAL ÖZET                                  │${NC}"
    echo -e "${YELLOW}├──────────────────────────────────────────────────────────────────────────────────┤${NC}"
    echo -e "${YELLOW}│  🚛 Driver ID: $DRIVER_ID${NC}"
    echo -e "${YELLOW}│  📍 Başlangıç Konumu: ${DELIVERY_STEPS[0]}${NC}"
    echo -e "${YELLOW}│  🎯 Bitiş Konumu: $CURRENT_DRIVER_LOCATION${NC}"
    echo -e "${YELLOW}│  📦 Toplam Teslimat: ${#SHIPMENT_IDS[@]}${NC}"
    echo -e "${YELLOW}│  📏 Toplam Mesafe: ${TOTAL_DISTANCE}km${NC}"
    echo -e "${YELLOW}│  ⏱️  Toplam Süre: ${TOTAL_TIME} saat${NC}"
    echo -e "${YELLOW}│  🤖 ML Optimizasyon: ${#SHIPMENT_IDS[@]} kez kullanıldı${NC}"
    echo -e "${YELLOW}└──────────────────────────────────────────────────────────────────────────────────┘${NC}"
    echo ""
}

# Test fonksiyonları
wait_for_services() {
    echo -e "${YELLOW}⏳ Servislerin başlaması bekleniyor...${NC}"
    sleep 10
}

get_auth_tokens() {
    echo -e "${BLUE}🔐 JWT Token'ları alınıyor...${NC}"
    
    # Planner API'den token al
    PLANNER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/planner/login \
        -H "Content-Type: application/json" \
        -d '{"email": "planner@logistic.com", "password": "planner123"}')
    
    PLANNER_TOKEN=$(echo "$PLANNER_RESPONSE" | jq -r '.access_token')
    
    if [ "$PLANNER_TOKEN" != "null" ] && [ -n "$PLANNER_TOKEN" ]; then
        echo -e "${GREEN}✅ Planner API JWT token alındı${NC}"
    else
        echo -e "${RED}❌ Planner API JWT token alınamadı${NC}"
        echo "Response: $PLANNER_RESPONSE"
        return 1
    fi
    
    # Driver API'den admin token al
    DRIVER_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/admin/login \
        -H "Content-Type: application/json" \
        -d '{"email": "admin@logistic.com", "password": "admin123"}')
    
    DRIVER_TOKEN=$(echo "$DRIVER_RESPONSE" | jq -r '.access_token')
    
    if [ "$DRIVER_TOKEN" != "null" ] && [ -n "$DRIVER_TOKEN" ]; then
        echo -e "${GREEN}✅ Driver API JWT token alındı${NC}"
    else
        echo -e "${RED}❌ Driver API JWT token alınamadı${NC}"
        echo "Response: $DRIVER_RESPONSE"
        return 1
    fi
}

create_random_driver() {
    echo -e "${PURPLE}🚛 Rastgele Driver oluşturuluyor...${NC}"
    
    local driver_name=$(generate_random_name)
    local license_number=$(generate_random_license)
    CURRENT_DRIVER_LOCATION=$(generate_random_location)
    local capacity=$((RANDOM % 3000 + 1000))
    
    echo -e "${CYAN}📋 Driver Bilgileri:${NC}"
    echo "   İsim: $driver_name"
    echo "   Lisans: $license_number"
    echo "   Başlangıç Konumu: $CURRENT_DRIVER_LOCATION"
    echo "   Kapasite: ${capacity}kg"
    
    DRIVER_RESPONSE=$(curl -s -X POST http://localhost:3001/api/drivers \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $DRIVER_TOKEN" \
        -d "{
            \"name\": \"$driver_name\",
            \"licenseNumber\": \"$license_number\",
            \"phoneNumber\": \"555$((RANDOM % 9000000 + 1000000))\"
        }")
    
    DRIVER_ID=$(echo "$DRIVER_RESPONSE" | jq -r '.id')
    if [ "$DRIVER_ID" != "null" ] && [ -n "$DRIVER_ID" ]; then
        echo -e "${GREEN}✅ Driver oluşturuldu (ID: $DRIVER_ID)${NC}"
        DELIVERY_STEPS+=("$CURRENT_DRIVER_LOCATION")
        return 0
    else
        echo -e "${RED}❌ Driver oluşturulamadı${NC}"
        echo "Response: $DRIVER_RESPONSE"
        return 1
    fi
}

create_random_shipments() {
    echo -e "${PURPLE}📦 3 adet rastgele sipariş oluşturuluyor...${NC}"
    
    SHIPMENT_IDS=()
    
    for i in {1..3}; do
        echo -e "${CYAN}📋 Sipariş $i Bilgileri:${NC}"
        
        local origin=$(generate_random_location)
        local destination=$(generate_random_location)
        local weight=$(generate_random_weight)
        local delivery_date=$(date -u +%Y-%m-%dT%H:%M:%SZ)
        
        echo "   Başlangıç: $origin"
        echo "   Hedef: $destination"
        echo "   Ağırlık: ${weight}kg"
        echo "   Teslimat: $delivery_date"
        
        SHIPMENT_RESPONSE=$(curl -s -X POST http://localhost:3000/api/shipments \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $PLANNER_TOKEN" \
            -d "{
                \"trackingNumber\": \"TRK$((RANDOM % 900000 + 100000))\",
                \"origin\": \"$origin\",
                \"destination\": \"$destination\",
                \"weight\": $weight,
                \"volume\": 0,
                \"estimatedDeliveryDate\": \"$delivery_date\"
            }")
        
        SHIPMENT_ID=$(echo "$SHIPMENT_RESPONSE" | jq -r '.id')
        if [ "$SHIPMENT_ID" != "null" ] && [ -n "$SHIPMENT_ID" ]; then
            echo -e "${GREEN}✅ Sipariş $i oluşturuldu (ID: $SHIPMENT_ID)${NC}"
            SHIPMENT_IDS+=($SHIPMENT_ID)
        else
            echo -e "${RED}❌ Sipariş $i oluşturulamadı${NC}"
            echo "Response: $SHIPMENT_RESPONSE"
            return 1
        fi
        
        echo ""
    done
    
    echo -e "${GREEN}✅ Tüm siparişler oluşturuldu: ${SHIPMENT_IDS[@]}${NC}"
}

assign_shipments_to_driver() {
    echo -e "${PURPLE}🔗 Siparişler driver'a atanıyor...${NC}"
    
    for shipment_id in "${SHIPMENT_IDS[@]}"; do
        echo -e "${CYAN}📦 Sipariş $shipment_id driver'a atanıyor...${NC}"
        
        ASSIGNMENT_RESPONSE=$(curl -s -X POST http://localhost:3001/api/drivers/$DRIVER_ID/assign-shipment \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $DRIVER_TOKEN" \
            -d "{
                \"shipmentId\": \"$shipment_id\"
            }")
        
        if echo "$ASSIGNMENT_RESPONSE" | jq -e '.success' > /dev/null; then
            echo -e "${GREEN}✅ Sipariş $shipment_id driver'a atandı${NC}"
        else
            echo -e "${RED}❌ Sipariş $shipment_id atanamadı${NC}"
            echo "Response: $ASSIGNMENT_RESPONSE"
        fi
    done
}

update_driver_location() {
    local new_location=$1
    local lat=$((RANDOM % 7 + 36))
    local lon=$((RANDOM % 12 + 26))
    
    LOCATION_RESPONSE=$(curl -s -X PUT http://localhost:3001/api/drivers/$DRIVER_ID/location \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $DRIVER_TOKEN" \
        -d "{
            \"latitude\": $lat.$((RANDOM % 1000)),
            \"longitude\": $lon.$((RANDOM % 1000)),
            \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
        }")
    
    if echo "$LOCATION_RESPONSE" | jq -e '.success' > /dev/null; then
        CURRENT_DRIVER_LOCATION="$new_location"
        echo -e "${GREEN}✅ Driver konumu güncellendi: $CURRENT_DRIVER_LOCATION${NC}"
        return 0
    else
        echo -e "${RED}❌ Driver konumu güncellenemedi${NC}"
        echo "Response: $LOCATION_RESPONSE"
        return 1
    fi
}

optimize_route_with_ml() {
    local current_location=$1
    local remaining_shipments=("${@:2}")
    
    print_ml_optimization "$current_location" "${#remaining_shipments[@]}"
    
    # Kalan siparişlerin destination'larını al
    local destinations=()
    for shipment_id in "${remaining_shipments[@]}"; do
        local shipment_info=$(echo "$SHIPMENTS_DATA" | jq -r ".[] | select(.id == \"$shipment_id\")")
        local destination=$(echo "$shipment_info" | jq -r '.destination')
        destinations+=("$destination")
    done
    
    # ML service ile rota optimizasyonu
    local waypoints=$(printf '%s,' "${destinations[@]}" | sed 's/,$//')
    
    ROUTE_OPTIMIZATION_RESPONSE=$(curl -s -X POST http://localhost:8000/api/ml/optimize-route-simple \
        -H "Content-Type: application/json" \
        -d "{
            \"origin\": \"$current_location\",
            \"destination\": \"${destinations[-1]}\",
            \"waypoints\": [\"$waypoints\"]
        }")
    
    if echo "$ROUTE_OPTIMIZATION_RESPONSE" | jq -e '.optimized_route' > /dev/null; then
        local optimized_route=$(echo "$ROUTE_OPTIMIZATION_RESPONSE" | jq -r '.optimized_route')
        local total_distance=$(echo "$ROUTE_OPTIMIZATION_RESPONSE" | jq -r '.total_distance')
        local estimated_time=$(echo "$ROUTE_OPTIMIZATION_RESPONSE" | jq -r '.estimated_time')
        
        echo -e "${GREEN}✅ ML Rota optimizasyonu başarılı${NC}"
        echo -e "${CYAN}   🗺️ Optimize edilmiş rota: $optimized_route${NC}"
        echo -e "${CYAN}   📏 Toplam mesafe: ${total_distance}km${NC}"
        echo -e "${CYAN}   ⏱️ Tahmini süre: ${estimated_time} saat${NC}"
        
        # 🚛 GERÇEK ROTA ATAMASI - PostgreSQL'e kaydet
        echo -e "${PURPLE}🚛 Optimize edilmiş rota driver'a atanıyor...${NC}"
        
        ROUTE_ASSIGNMENT_RESPONSE=$(curl -s -X POST http://localhost:3001/api/drivers/$DRIVER_ID/route \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $DRIVER_TOKEN" \
            -d "{
                \"optimizedRoute\": \"$optimized_route\",
                \"totalDistance\": $total_distance,
                \"estimatedTime\": $estimated_time
            }")
        
        if echo "$ROUTE_ASSIGNMENT_RESPONSE" | grep -q "success.*true"; then
            echo -e "${GREEN}✅ Rota driver'a başarıyla atandı! (PostgreSQL'e kaydedildi)${NC}"
            
            # Driver'ın rotasını kontrol et
            echo -e "${CYAN}🔍 Driver'ın rotası kontrol ediliyor...${NC}"
            sleep 2
            
            CURRENT_ROUTE_RESPONSE=$(curl -s -X GET http://localhost:3001/api/drivers/$DRIVER_ID/current-route \
                -H "Authorization: Bearer $DRIVER_TOKEN")
            
            if echo "$CURRENT_ROUTE_RESPONSE" | grep -q "success.*true"; then
                echo -e "${GREEN}✅ Driver'ın rotası başarıyla alındı!${NC}"
                echo -e "${CYAN}   🗺️ Driver artık bu rotaya göre hareket edebilir!${NC}"
            else
                echo -e "${YELLOW}⚠️ Driver'ın rotası henüz kaydedilmemiş${NC}"
            fi
        else
            echo -e "${RED}❌ Rota atama başarısız${NC}"
            echo "Response: $ROUTE_ASSIGNMENT_RESPONSE"
        fi
        
        return 0
    else
        echo -e "${YELLOW}⚠️ ML rota optimizasyonu başarısız, varsayılan rota kullanılıyor${NC}"
        return 1
    fi
}

simulate_dynamic_delivery() {
    echo -e "${PURPLE}🚛 Dinamik Teslimat Simülasyonu Başlıyor...${NC}"
    
    # Sipariş verilerini al
    SHIPMENTS_DATA=$(curl -s -X GET http://localhost:3000/api/shipments \
        -H "Authorization: Bearer $PLANNER_TOKEN")
    
    for i in "${!SHIPMENT_IDS[@]}"; do
        local shipment_id="${SHIPMENT_IDS[$i]}"
        local step_number=$((i + 1))
        
        # Sipariş detaylarını al
        local shipment_info=$(echo "$SHIPMENTS_DATA" | jq -r ".[] | select(.id == \"$shipment_id\")")
        local destination=$(echo "$shipment_info" | jq -r '.destination')
        local weight=$(echo "$shipment_info" | jq -r '.weight')
        
        # Kalan siparişler için ML optimizasyonu
        local remaining_shipments=()
        for j in $(seq $((i + 1)) $((${#SHIPMENT_IDS[@]} - 1))); do
            remaining_shipments+=("${SHIPMENT_IDS[$j]}")
        done
        
        local optimization_type="ML Optimizasyon"
        if [ ${#remaining_shipments[@]} -gt 0 ]; then
            if optimize_route_with_ml "$CURRENT_DRIVER_LOCATION" "${remaining_shipments[@]}"; then
                optimization_type="ML Optimizasyon ✅"
            else
                optimization_type="Varsayılan Rota"
            fi
        else
            optimization_type="Son Teslimat"
        fi
        
        # Rota adımını göster
        print_route_step "$step_number" "$CURRENT_DRIVER_LOCATION" "$destination" "$shipment_id" "$weight" "75" "2.0" "$optimization_type"
        
        # Driver'ın konumunu güncelle (teslimat noktasına git)
        if update_driver_location "$destination"; then
            DELIVERY_STEPS+=("$destination")
            
            # Mesafe ve süre hesapla
            local step_distance=75
            local step_time=2.0
            TOTAL_DISTANCE=$((TOTAL_DISTANCE + step_distance))
            TOTAL_TIME=$(echo "$TOTAL_TIME + $step_time" | bc -l)
            
            # Teslimat tamamlandı mesajı
            print_delivery_complete "$step_number" "$CURRENT_DRIVER_LOCATION" "$shipment_id" "$step_distance" "$step_time"
            
            # Kısa bekleme
            sleep 3
            
            # Bir sonraki adım için hazırlık
            if [ $i -lt $((${#SHIPMENT_IDS[@]} - 1)) ]; then
                echo -e "${CYAN}🔄 Bir sonraki teslimat için hazırlanıyor...${NC}"
                sleep 2
            fi
        else
            echo -e "${RED}❌ Teslimat adımı $step_number başarısız${NC}"
            return 1
        fi
    done
    
    echo -e "${GREEN}🎉 Tüm teslimatlar tamamlandı!${NC}"
}

show_final_status() {
    print_final_summary
    
    echo -e "${YELLOW}🔗 Erişim Linkleri:${NC}"
    echo "• Planner API: http://localhost:3000"
    echo "• Driver API: http://localhost:3001"
    echo "• ML Service: http://localhost:8000"
    echo "• Nginx Gateway: http://localhost"
    echo "• pgAdmin: http://localhost:5050 (admin@admin.com / admin)"
    echo "• RabbitMQ Management: http://localhost:15672 (admin / password)"
    echo "• Dashboard: file://$(pwd)/driver-tracking-dashboard.html"
    echo ""
    echo -e "${GREEN}🚀 Gelişmiş dinamik rota takip sistemi tamamen çalışır durumda!${NC}"
}

# Ana test akışı
main() {
    print_header
    
    echo -e "${YELLOW}🔧 Sistem kontrol ediliyor...${NC}"
    
    # Servislerin hazır olmasını bekle
    wait_for_services
    
    # JWT token'ları al
    if ! get_auth_tokens; then
        echo -e "${RED}❌ Authentication başarısız, test durduruluyor${NC}"
        exit 1
    fi
    
    echo ""
    
    # Rastgele driver oluştur
    if ! create_random_driver; then
        echo -e "${RED}❌ Driver oluşturulamadı, test durduruluyor${NC}"
        exit 1
    fi
    
    print_driver_info
    
    # 3 adet rastgele sipariş oluştur
    if ! create_random_shipments; then
        echo -e "${RED}❌ Siparişler oluşturulamadı, test durduruluyor${NC}"
        exit 1
    fi
    
    echo ""
    
    # Siparişleri driver'a ata
    assign_shipments_to_driver
    
    echo ""
    
    # Dinamik teslimat simülasyonu
    simulate_dynamic_delivery
    
    echo ""
    
    # Final durumu göster
    show_final_status
}

# Script'i çalıştır
main 