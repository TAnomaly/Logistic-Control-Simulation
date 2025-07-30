#!/bin/bash

set -e

API_DRIVER="http://localhost:3001/api"
API_PLANNER="http://localhost:3000/api"
ADMIN_EMAIL="admin@logistic.com"
ADMIN_PASS="admin123"

NUM_DRIVERS=3
NUM_SHIPMENTS=6
ASSIGNMENTS_PER_DRIVER=2

# Renkler
GREEN="\033[1;32m"
CYAN="\033[1;36m"
YELLOW="\033[1;33m"
NC="\033[0m"

function random_name() {
  echo "Driver$((RANDOM % 10000))"
}
function random_license() {
  echo "LIC$((RANDOM % 1000000))"
}
function random_phone() {
  echo "555$((RANDOM % 900000 + 100000))"
}
function random_city() {
  cities=("Ankara, Turkey" "Istanbul, Turkey" "Izmir, Turkey" "Bursa, Turkey" "Antalya, Turkey")
  echo "${cities[$RANDOM % ${#cities[@]}]}"
}
function random_weight() {
  echo $((RANDOM % 20 + 1))
}
function random_volume() {
  echo $((RANDOM % 5 + 1))
}

echo -e "${CYAN}==> Admin token alınıyor...${NC}"
ADMIN_TOKEN=$(curl -s -X POST $API_DRIVER/auth/admin/login -H "Content-Type: application/json" -d "{\"email\": \"$ADMIN_EMAIL\", \"password\": \"$ADMIN_PASS\"}" | jq -r '.access_token')

echo -e "${CYAN}==> Rastgele $NUM_DRIVERS driver oluşturuluyor...${NC}"
DRIVER_IDS=()
for ((i=0;i<$NUM_DRIVERS;i++)); do
  NAME=$(random_name)
  LICENSE=$(random_license)
  PHONE=$(random_phone)
  DRIVER_ID=$(curl -s -X POST $API_DRIVER/drivers -H "Content-Type: application/json" -H "Authorization: Bearer $ADMIN_TOKEN" -d "{\"name\": \"$NAME\", \"licenseNumber\": \"$LICENSE\", \"phoneNumber\": \"$PHONE\"}" | jq -r '.id')
  DRIVER_IDS+=("$DRIVER_ID")
  echo -e "${GREEN}Driver: $NAME ($DRIVER_ID)${NC}"
done

echo -e "${CYAN}==> Rastgele $NUM_SHIPMENTS shipment oluşturuluyor...${NC}"
SHIPMENT_IDS=()
for ((i=0;i<$NUM_SHIPMENTS;i++)); do
  ORIGIN=$(random_city)
  DEST=$(random_city)
  while [[ "$DEST" == "$ORIGIN" ]]; do DEST=$(random_city); done
  WEIGHT=$(random_weight)
  VOLUME=$(random_volume)
  SHIPMENT_ID=$(curl -s -X POST $API_PLANNER/shipments -H "Content-Type: application/json" -H "Authorization: Bearer $ADMIN_TOKEN" -d "{\"origin\": \"$ORIGIN\", \"destination\": \"$DEST\", \"weight\": $WEIGHT, \"volume\": $VOLUME}" | jq -r '.id')
  SHIPMENT_IDS+=("$SHIPMENT_ID")
  echo -e "${GREEN}Shipment: $ORIGIN -> $DEST ($SHIPMENT_ID)${NC}"
done

echo -e "${CYAN}==> Her driver'a $ASSIGNMENTS_PER_DRIVER shipment atanıyor...${NC}"
for DRIVER_ID in "${DRIVER_IDS[@]}"; do
  for ((j=0;j<$ASSIGNMENTS_PER_DRIVER;j++)); do
    IDX=$((RANDOM % NUM_SHIPMENTS))
    SHIPMENT_ID=${SHIPMENT_IDS[$IDX]}
    curl -s -X POST $API_DRIVER/drivers/$DRIVER_ID/assign-shipment -H "Content-Type: application/json" -H "Authorization: Bearer $ADMIN_TOKEN" -d "{\"shipmentId\": \"$SHIPMENT_ID\"}" > /dev/null
    echo -e "${YELLOW}Driver $DRIVER_ID -> Shipment $SHIPMENT_ID${NC}"
  done
done

echo -e "${CYAN}==> Her driver için rastgele konum güncelleniyor (mobil app gibi)...${NC}"
for DRIVER_ID in "${DRIVER_IDS[@]}"; do
  CITY=$(random_city)
  if [[ "$CITY" == "Ankara, Turkey" ]]; then LAT=39.9334; LON=32.8597;
  elif [[ "$CITY" == "Istanbul, Turkey" ]]; then LAT=41.0082; LON=28.9784;
  elif [[ "$CITY" == "Izmir, Turkey" ]]; then LAT=38.4192; LON=27.1287;
  elif [[ "$CITY" == "Bursa, Turkey" ]]; then LAT=40.1828; LON=29.0665;
  elif [[ "$CITY" == "Antalya, Turkey" ]]; then LAT=36.8969; LON=30.7133;
  else LAT=39.0; LON=32.0; fi
  curl -s -X PUT $API_DRIVER/drivers/$DRIVER_ID/location -H "Content-Type: application/json" -d "{\"latitude\": $LAT, \"longitude\": $LON, \"address\": \"$CITY\", \"speed\": 0, \"heading\": 0}" > /dev/null
  echo -e "${GREEN}Driver $DRIVER_ID konumu güncellendi: $CITY ($LAT,$LON)${NC}"
done

echo -e "${CYAN}==> Senaryo tamamlandı! Webhook consumer ve ML loglarını kontrol edebilirsin.${NC}" 