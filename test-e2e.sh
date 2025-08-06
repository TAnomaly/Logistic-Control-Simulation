#!/bin/bash
set -e

if ! command -v jq &> /dev/null; then
  echo "[ERROR] jq yüklü değil. Lütfen 'brew install jq' veya 'apt install jq' ile yükleyin."
  exit 1
fi

API_URL_PLANNER="http://localhost:3000/api"
API_URL_DRIVER="http://localhost:3001/api"
API_URL_TRACKING="http://localhost:8002/api"

PLANNER_EMAIL="planner@logistic.com"
PLANNER_PASSWORD="planner123"
DRIVER_NAMES=("Mirac2" "Ali" "Veli" "Ayşe" "Fatma")
DRIVER_LICENSES=("MIRAC2-123" "ALI-456" "VELI-789" "AYSE-321" "FATMA-654")
DRIVER_PHONES=("+905551234567" "+905551234568" "+905551234569" "+905551234570" "+905551234571")
DRIVER_VEHICLE="PICKUP"

# 1. Planner Login (JWT al)
echo "[1] Planner login..."
PLANNER_TOKEN=$(curl -s -X POST $API_URL_PLANNER/auth/planner/login \
  -H "Content-Type: application/json" \
  -d '{"email":"'$PLANNER_EMAIL'","password":"'$PLANNER_PASSWORD'"}' | jq -r .access_token)
if [ -z "$PLANNER_TOKEN" ] || [ "$PLANNER_TOKEN" == "null" ]; then
  echo "[ERROR] Planner login başarısız, JWT alınamadı."
  exit 1
fi
echo "PLANNER_TOKEN: $PLANNER_TOKEN"

# 2. 3 Driver oluştur (random isimlerle)
declare -a DRIVER_IDS
for i in 0 1 2; do
  echo "[2.$((i+1))] Driver oluşturuluyor: ${DRIVER_NAMES[$i]}"
  DRIVER_ID=$(curl -s -X POST $API_URL_PLANNER/drivers \
    -H "Authorization: Bearer $PLANNER_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"'${DRIVER_NAMES[$i]}'","licenseNumber":"'${DRIVER_LICENSES[$i]}'","phoneNumber":"'${DRIVER_PHONES[$i]}'","vehicleType":"'$DRIVER_VEHICLE'"}' | jq -r .data.id)
  if [ -z "$DRIVER_ID" ] || [ "$DRIVER_ID" == "null" ]; then
    echo "[ERROR] Driver oluşturulamadı."
    exit 1
  fi
  echo "DRIVER_ID_$i: $DRIVER_ID"
  DRIVER_IDS[$i]=$DRIVER_ID
done

# 3. 5 adet shipment oluştur (farklı şehirler ve koordinatlar)
declare -a SHIPMENT_IDS
CITIES=("Istanbul" "Ankara" "Izmir" "Antalya" "Bursa" "Adana")
COORDS=("41.0082 28.9784" "39.9334 32.8597" "38.4192 27.1287" "36.8969 30.7133" "40.1828 29.0665" "37.0 35.3213")
for i in 0 1 2 3 4; do
  PICKUP_IDX=$((RANDOM % 6))
  DELIVERY_IDX=$((RANDOM % 6))
  while [ $DELIVERY_IDX -eq $PICKUP_IDX ]; do DELIVERY_IDX=$((RANDOM % 6)); done
  PICKUP_CITY=${CITIES[$PICKUP_IDX]}
  DELIVERY_CITY=${CITIES[$DELIVERY_IDX]}
  PICKUP_LAT=$(echo ${COORDS[$PICKUP_IDX]} | cut -d' ' -f1)
  PICKUP_LNG=$(echo ${COORDS[$PICKUP_IDX]} | cut -d' ' -f2)
  DELIVERY_LAT=$(echo ${COORDS[$DELIVERY_IDX]} | cut -d' ' -f1)
  DELIVERY_LNG=$(echo ${COORDS[$DELIVERY_IDX]} | cut -d' ' -f2)
  echo "[3.$((i+1))] Shipment oluşturuluyor: $PICKUP_CITY -> $DELIVERY_CITY"
  SHIPMENT_ID=$(curl -s -X POST $API_URL_PLANNER/shipments/simple \
    -H "Authorization: Bearer $PLANNER_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "customerName": "Test '$i'",
      "pickupAddress": "'$PICKUP_CITY'",
      "deliveryAddress": "'$DELIVERY_CITY'",
      "weight": 10,
      "pickupLocation": {"latitude": '$PICKUP_LAT', "longitude": '$PICKUP_LNG'},
      "deliveryLocation": {"latitude": '$DELIVERY_LAT', "longitude": '$DELIVERY_LNG'}
    }' | jq -r .data.id)
  if [ -z "$SHIPMENT_ID" ] || [ "$SHIPMENT_ID" == "null" ]; then
    echo "[ERROR] Shipment oluşturulamadı."
    exit 1
  fi
  echo "SHIPMENT_ID_$i: $SHIPMENT_ID"
  SHIPMENT_IDS[$i]=$SHIPMENT_ID
done

# 4. Shipment'ları random driverlara ata
for i in 0 1 2 3 4; do
  DRIVER_IDX=$((RANDOM % 3))
  echo "[4.$((i+1))] Shipment atanıyor: ${SHIPMENT_IDS[$i]} -> ${DRIVER_IDS[$DRIVER_IDX]}"
  ASSIGN_RESULT=$(curl -s -X PUT $API_URL_PLANNER/shipments/${SHIPMENT_IDS[$i]}/assign \
    -H "Authorization: Bearer $PLANNER_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"driverId": "'${DRIVER_IDS[$DRIVER_IDX]}'"}')
  if [ "$(echo $ASSIGN_RESULT | jq -r .id)" == "null" ] || [ -z "$(echo $ASSIGN_RESULT | jq -r .id)" ]; then
    echo "[ERROR] Shipment atama başarısız: $ASSIGN_RESULT"
    exit 1
  fi
  echo "✅ Shipment atandı: $(echo $ASSIGN_RESULT | jq -r .id)"
  sleep 1
done

# 5. Her driver için rota optimize et
echo "[5] Her driver için rota optimizasyonu başlatılıyor..."
for i in 0 1 2; do
  echo "[5.$((i+1))] Driver: ${DRIVER_IDS[$i]}"
  ROUTE_RESULT=$(curl -s -X POST $API_URL_TRACKING/routes/optimize/${DRIVER_IDS[$i]})
  echo $ROUTE_RESULT | jq
  sleep 1
done

# 6. Her driver için login ve shipment/rota/profil çek
echo "[6] Her driver için login ve veri çekme..."
for i in 0 1 2; do
  DRIVER_TOKEN=$(curl -s -X POST $API_URL_DRIVER/auth/driver/login \
    -H "Content-Type: application/json" \
    -d '{"licenseNumber":"'${DRIVER_LICENSES[$i]}'","phoneNumber":"'${DRIVER_PHONES[$i]}'"}' | jq -r .access_token)
  if [ -z "$DRIVER_TOKEN" ] || [ "$DRIVER_TOKEN" == "null" ]; then
    echo "[ERROR] Driver login başarısız, JWT alınamadı."
    exit 1
  fi
  echo "[6.$((i+1))] DRIVER_TOKEN: $DRIVER_TOKEN"
  echo "[6.$((i+1))] Driver shipmentları:"
  curl -s -X GET $API_URL_DRIVER/drivers/${DRIVER_IDS[$i]}/shipments \
    -H "Authorization: Bearer $DRIVER_TOKEN" | jq
  echo "[6.$((i+1))] Driver optimize rotası:"
  curl -s -X GET $API_URL_DRIVER/drivers/${DRIVER_IDS[$i]}/optimized-route \
    -H "Authorization: Bearer $DRIVER_TOKEN" | jq
  echo "[6.$((i+1))] Driver profil bilgisi:"
  curl -s -X GET $API_URL_DRIVER/drivers/${DRIVER_IDS[$i]}/profile \
    -H "Authorization: Bearer $DRIVER_TOKEN" | jq
  sleep 1
done

echo "\n✅ TÜM AKIŞ BAŞARIYLA TAMAMLANDI!"