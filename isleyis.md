# 📚 Lojistik Kontrol Simülasyon Sistemi - İşleyiş Rehberi

Bu doküman, sistemde bir **görev (assignment)** ve **gönderi (shipment)** ile ilgili tüm işleyişi, temel akışları ve örnek senaryoları adım adım açıklar.

---

## 1. Temel Kavramlar

- **Assignment (Görev):** Bir sürücüye atanan iş (teslimat, pickup, transfer vb.). Görev bir shipment'a (gönderi) bağlı olabilir.
- **Shipment (Gönderi):** Taşınacak olan paket veya yük.
- **Tracking Event (Takip Olayı):** Bir gönderinin bir kapıdan geçişi, yük ölçümü, zaman, açıklama gibi olaylar.

---

## 2. Temel İşleyiş Akışı

### 2.1 Görev (Assignment) Oluşturma
1. Bir sürücü ve (varsa) bir shipment seçilir.
2. API üzerinden görev atanır.
   - **POST /api/assignments**
   - Body örneği:
     ```json
     {
       "driverId": "<sürücü_id>",
       "taskType": "DELIVERY",
       "shipmentId": "<gönderi_id>",
       "description": "Açıklama"
     }
     ```
3. Response'da yeni görevin benzersiz `id`'si döner.

### 2.2 Görev Güncelleme
- Görevin tipi, açıklaması, atanan sürücüsü veya shipment'ı değiştirilebilir.
- **PUT /api/assignments/{assignment_id}**
- Body örneği:
  ```json
  {
    "taskType": "PICKUP",
    "description": "Güncellenmiş açıklama",
    "driverId": "<yeni_sürücü_id>",
    "shipmentId": "<yeni_gönderi_id>"
  }
  ```

### 2.3 Görev Silme
- **DELETE /api/assignments/{assignment_id}**
- Görev silinir, response: HTTP 204

### 2.4 Görev Detaylarını ve İlişkili Shipment'ı Görüntüleme
- **GET /api/assignments** veya **GET /api/assignments/driver/{driver_id}**
- Her assignment'ın içinde shipment bilgisi de yer alır.

### 2.5 Shipment'ın Kapı Geçişleri ve Yük Bilgisi
1. Assignment'ın shipment.id'sini al.
2. **GET /api/shipments/tracking/{trackingNumber}** veya **GET /api/tracking-events/shipment/{shipmentId}**
3. Response'da shipment'ın hangi kapılardan geçtiği, yük bilgisi, zaman, açıklama gibi tüm detaylar gelir.

---

## 3. Senaryolar

### Senaryo 1: Teslimat Görevi Oluşturma ve İzleme
1. Sürücü ve shipment oluştur.
2. Görev ata:
   ```json
   {
     "driverId": "cf4411fe-5fcb-4cc8-a27b-e8453ab171a4",
     "taskType": "DELIVERY",
     "shipmentId": "26028c9f-84f2-4d44-aea4-3bc18e0e5bde",
     "description": "Ankara teslimatı"
   }
   ```
3. Response'dan assignment id'yi al.
4. Görev detayını veya tüm görevleri çekerek shipment id'yi bul.
5. **GET /api/shipments/tracking/{trackingNumber}** ile shipment'ın tüm hareketlerini (kapı geçişleri, yük, zaman) gör.

### Senaryo 2: Görev Güncelleme
1. Var olan bir assignment'ın id'si ile:
   ```json
   {
     "taskType": "PICKUP",
     "description": "Güncellenmiş açıklama",
     "driverId": "dc3df3c1-1f0b-4656-aa35-f4eba5167228"
   }
   ```
2. **PUT /api/assignments/{assignment_id}** ile güncelle.

### Senaryo 3: Görev Silme
1. **DELETE /api/assignments/{assignment_id}** ile görevi sil.
2. Silinen assignment artık listelerde görünmez.

### Senaryo 4: Shipment'ın Kapı Geçişlerini ve Yük Bilgisini Görüntüleme
1. Assignment'ın shipment id'sini bul.
2. **GET /api/tracking-events/shipment/{shipmentId}** ile shipment'ın tüm kapı geçişlerini, yük ve zaman bilgilerini listele.

---

## 4. Özet Akış

1. **Görev oluştur** → assignment id döner.
2. **Görev güncelle/sil** → assignment id ile işlem yapılır.
3. **Görev detayında shipment id bulunur.**
4. **Shipment'ın tracking event'leriyle** kapı geçişleri, yük, zaman, açıklama gibi tüm detaylar izlenir.

---

## 5. Faydalı API Uçları

- **POST /api/assignments** : Görev oluştur
- **PUT /api/assignments/{assignment_id}** : Görev güncelle
- **DELETE /api/assignments/{assignment_id}** : Görev sil
- **GET /api/assignments** : Tüm görevleri listele
- **GET /api/assignments/driver/{driver_id}** : Sürücüye göre görevleri listele
- **GET /api/shipments/tracking/{trackingNumber}** : Shipment'ın tüm hareketleri
- **GET /api/tracking-events/shipment/{shipmentId}** : Shipment'ın tüm kapı geçişleri ve yük bilgisi

---

Bu rehberle, sistemde görev ve gönderi yönetimiyle ilgili tüm temel işleyişi ve senaryoları kolayca uygulayabilirsin. 