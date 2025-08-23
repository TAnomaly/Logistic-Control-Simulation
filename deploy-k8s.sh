#!/bin/bash

# Logistic Control System - Kubernetes Deployment Script
# Bu script tüm microservice'leri Kubernetes'te deploy eder

set -e  # Hata durumunda script'i durdur

echo "🚀 Logistic Control System - Kubernetes Deployment Başlıyor..."

# Renkli output için
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Log fonksiyonu
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

# Kubernetes cluster kontrolü
check_k8s() {
    log "Kubernetes cluster kontrol ediliyor..."
    if ! kubectl cluster-info &> /dev/null; then
        error "Kubernetes cluster'a bağlanılamıyor. Lütfen cluster'ı başlatın."
    fi
    log "✅ Kubernetes cluster hazır"
}

# Docker image'ları build et
build_images() {
    log "Docker image'ları build ediliyor..."
    
    # Driver API
    log "Building driver-api image..."
    docker build -t logistic-driver-api:latest ./driver-api || error "Driver API build hatası"
    
    # Planner API
    log "Building planner-api image..."
    docker build -t logistic-planner-api:latest ./planner-api || error "Planner API build hatası"
    
    # Tracking Service
    log "Building tracking-service image..."
    docker build -t logistic-tracking-service:latest ./tracking-service || error "Tracking Service build hatası"
    
    log "✅ Tüm image'lar başarıyla build edildi"
}

# Kubernetes deployment
deploy_k8s() {
    log "Kubernetes deployment başlatılıyor..."
    
    # Namespace ve tüm kaynakları deploy et
    kubectl apply -f k8s/complete-deployment.yaml
    
    log "✅ Kubernetes deployment tamamlandı"
}

# Deployment durumunu kontrol et
check_deployment() {
    log "Deployment durumu kontrol ediliyor..."
    
    # Namespace kontrolü
    if ! kubectl get namespace logistic-system &> /dev/null; then
        error "logistic-system namespace bulunamadı"
    fi
    
    # Pod'ların hazır olmasını bekle
    log "Pod'ların hazır olması bekleniyor..."
    kubectl wait --for=condition=ready pod -l app=postgres -n logistic-system --timeout=300s
    kubectl wait --for=condition=ready pod -l app=redis -n logistic-system --timeout=300s
    kubectl wait --for=condition=ready pod -l app=rabbitmq -n logistic-system --timeout=300s
    
    # API servislerinin hazır olmasını bekle
    kubectl wait --for=condition=ready pod -l app=driver-api -n logistic-system --timeout=300s
    kubectl wait --for=condition=ready pod -l app=planner-api -n logistic-system --timeout=300s
    kubectl wait --for=condition=ready pod -l app=tracking-service -n logistic-system --timeout=300s
    
    log "✅ Tüm pod'lar hazır"
}

# Servis durumunu göster
show_status() {
    log "Deployment durumu:"
    echo ""
    
    echo "📊 Pod Durumu:"
    kubectl get pods -n logistic-system
    
    echo ""
    echo "🌐 Servisler:"
    kubectl get services -n logistic-system
    
    echo ""
    echo "📈 Deployment'lar:"
    kubectl get deployments -n logistic-system
    
    echo ""
    echo "🔗 Ingress:"
    kubectl get ingress -n logistic-system
    
    echo ""
    echo "⚖️  HPA (Horizontal Pod Autoscaler):"
    kubectl get hpa -n logistic-system
}

# Port-forward ayarları
setup_port_forward() {
    log "Port-forward ayarları yapılıyor..."
    
    # Background'da port-forward'ları başlat
    kubectl port-forward -n logistic-system service/driver-api-service 3001:80 &
    kubectl port-forward -n logistic-system service/planner-api-service 3000:80 &
    kubectl port-forward -n logistic-system service/tracking-service-service 8002:80 &
    kubectl port-forward -n logistic-system service/postgres-service 5432:5432 &
    kubectl port-forward -n logistic-system service/redis-service 6379:6379 &
    kubectl port-forward -n logistic-system service/rabbitmq-service 15672:15672 &
    
    log "✅ Port-forward'lar başlatıldı"
    log "🌐 Servisler şu adreslerde erişilebilir:"
    log "   - Driver API: http://localhost:3001"
    log "   - Planner API: http://localhost:3000"
    log "   - Tracking Service: http://localhost:8002"
    log "   - PostgreSQL: localhost:5432"
    log "   - Redis: localhost:6379"
    log "   - RabbitMQ Management: http://localhost:15672"
}

# Cleanup fonksiyonu
cleanup() {
    log "Temizlik yapılıyor..."
    
    # Port-forward'ları durdur
    pkill -f "kubectl port-forward" || true
    
    # Kubernetes kaynaklarını sil
    kubectl delete -f k8s/complete-deployment.yaml --ignore-not-found=true
    
    log "✅ Temizlik tamamlandı"
}

# Health check
health_check() {
    log "Health check yapılıyor..."
    
    # API'lerin health endpoint'lerini kontrol et
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log "Health check denemesi $attempt/$max_attempts"
        
        if curl -f http://localhost:3001/health &> /dev/null; then
            log "✅ Driver API sağlıklı"
        else
            warn "Driver API henüz hazır değil"
        fi
        
        if curl -f http://localhost:3000/health &> /dev/null; then
            log "✅ Planner API sağlıklı"
        else
            warn "Planner API henüz hazır değil"
        fi
        
        if curl -f http://localhost:8002/health &> /dev/null; then
            log "✅ Tracking Service sağlıklı"
            break
        else
            warn "Tracking Service henüz hazır değil"
        fi
        
        sleep 10
        ((attempt++))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        error "Health check başarısız - servisler hazır değil"
    fi
    
    log "✅ Tüm servisler sağlıklı"
}

# Ana fonksiyon
main() {
    case "${1:-deploy}" in
        "deploy")
            check_k8s
            build_images
            deploy_k8s
            check_deployment
            setup_port_forward
            health_check
            show_status
            log "🎉 Deployment başarıyla tamamlandı!"
            ;;
        "status")
            show_status
            ;;
        "cleanup")
            cleanup
            ;;
        "health")
            health_check
            ;;
        "logs")
            if [ -z "$2" ]; then
                echo "Kullanım: $0 logs <service-name>"
                echo "Örnek: $0 logs driver-api"
                exit 1
            fi
            kubectl logs -f deployment/$2 -n logistic-system
            ;;
        *)
            echo "Kullanım: $0 {deploy|status|cleanup|health|logs}"
            echo ""
            echo "Komutlar:"
            echo "  deploy   - Tüm servisleri deploy et"
            echo "  status   - Deployment durumunu göster"
            echo "  cleanup  - Tüm kaynakları temizle"
            echo "  health   - Health check yap"
            echo "  logs     - Servis loglarını göster"
            exit 1
            ;;
    esac
}

# Script'i çalıştır
main "$@" 