# 🌐 pgAdmin Kullanım Kılavuzu - Veritabanı Yönetimi

Bu kılavuz pgAdmin'e başarıyla bağlandıktan sonra veritabanını keşfetmek, test verileri eklemek ve sorgu yapmak için gereken tüm adımları içerir.

## 🔌 **İlk Bağlantı Kontrolü**

### ✅ **Başarılı Bağlantı Sonrası:**
pgAdmin'e giriş yaptıktan sonra sol panelde şunu görmelisiniz:
```
📁 Servers
  └── 📊 Logistic Postgres (ya da verdiğiniz isim)
      ├── 🏠 Dashboard
      ├── 📈 Statistics  
      └── 🗃️ Databases
          └── 💾 logistic_control
```

---

## 📂 **Veritabanı Yapısını Keşfetme**

### 1. 🗂️ **Tablo Yapısını Görme:**
Sol panelde şu sırayı takip edin:
```
Servers
└── Logistic Postgres
    └── Databases
        └── logistic_control
            └── Schemas
                └── public
                    └── Tables ← **BURAYA TIKLAYIN**
                        ├── 📦 shipment (Gönderiler)
                        ├── 🚪 gate (Kapılar/Noktalar)
                        └── 📍 tracking_event (Takip Olayları)
```

### 2. 📋 **Tablo Yapısını İnceleme:**
Herhangi bir tabloya **sağ tık** yapın:
- **Properties** → Tablo özelliklerini görüntüler
- **View/Edit Data** → **All Rows** → Tüm verileri görüntüler
- **Scripts** → **CREATE Script** → Tablo oluşturma script'ini gösterir

---

## 🧪 **Test Verileri Ekleme**

### 1. ⚡ **Query Tool'u Açma:**
- **logistic_control** veritabanına **sağ tık**
- **Query Tool** seçeneğini tıklayın
- SQL editörü açılacak

### 2. 📦 **Örnek Gönderi Verileri:**

#### Tekli Gönderi:
```sql
INSERT INTO shipment (
    id,
    tracking_number, 
    sender_name,
    sender_address,
    receiver_name, 
    receiver_address,
    weight,
    length,
    width,
    height,
    status,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'LCS-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substring(md5(random()::text), 1, 6)),
    'Ahmet Yılmaz',
    'İstanbul, Kadıköy, Türkiye',
    'Mehmet Demir', 
    'Ankara, Çankaya, Türkiye',
    2.5,
    30.00,
    20.00,
    15.00,
    'CREATED',
    now(),
    now()
);
```

#### Toplu Gönderi Ekleme:
```sql
INSERT INTO shipment (
    id, tracking_number, sender_name, sender_address, receiver_name, receiver_address, 
    weight, length, width, height, status, created_at, updated_at
) VALUES 
(gen_random_uuid(), 'LCS-20250122-ABC123', 'Ayşe Kaya', 'Bursa, Türkiye', 'Fatma Özkan', 'İzmir, Türkiye', 1.8, 25.0, 15.0, 10.0, 'CREATED', now(), now()),
(gen_random_uuid(), 'LCS-20250122-DEF456', 'Can Demir', 'Antalya, Türkiye', 'Ali Yıldız', 'Trabzon, Türkiye', 3.2, 40.0, 25.0, 20.0, 'IN_TRANSIT', now(), now()),
(gen_random_uuid(), 'LCS-20250122-GHI789', 'Zehra Çelik', 'Adana, Türkiye', 'Murat Şen', 'Samsun, Türkiye', 0.9, 20.0, 12.0, 8.0, 'DELIVERED', now(), now());
```

### 3. 🚪 **Kapı/Nokta Verileri:**
```sql
INSERT INTO gate (
    id, name, location, gate_type, created_at, updated_at
) VALUES 
(gen_random_uuid(), 'İstanbul Merkez Depo', 'İstanbul, Pendik, Türkiye', 'WAREHOUSE', now(), now()),
(gen_random_uuid(), 'Ankara Dağıtım Merkezi', 'Ankara, Sincan, Türkiye', 'WAREHOUSE', now(), now()),
(gen_random_uuid(), 'İzmir Liman Terminal', 'İzmir, Alsancak, Türkiye', 'PORT', now(), now()),
(gen_random_uuid(), 'Bolu Kontrol Noktası', 'Bolu, Merkez, Türkiye', 'CHECKPOINT', now(), now()),
(gen_random_uuid(), 'Bursa Ara Transfer', 'Bursa, Osmangazi, Türkiye', 'TRANSFER', now(), now());
```

### 4. 📍 **Takip Olayları:**
```sql
-- Önce mevcut bir gönderi ID'si al
WITH sample_shipment AS (
    SELECT id FROM shipment LIMIT 1
),
sample_gate AS (
    SELECT id FROM gate WHERE gate_type = 'WAREHOUSE' LIMIT 1
)
INSERT INTO tracking_event (
    id, shipment_id, gate_id, event_type, notes, timestamp, created_at, updated_at
)
SELECT 
    gen_random_uuid(),
    sample_shipment.id,
    sample_gate.id,
    'PACKAGE_RECEIVED',
    'Gönderi depoya teslim alındı',
    now(),
    now(),
    now()
FROM sample_shipment, sample_gate;
```

---

## 🔍 **Veri Sorgulama Örnekleri**

### 1. 📊 **Genel İstatistikler:**
```sql
SELECT 
    'Toplam Gönderi' as kategori, COUNT(*) as sayi FROM shipment
UNION ALL
SELECT 
    'Toplam Kapı', COUNT(*) FROM gate
UNION ALL
SELECT 
    'Toplam Olay', COUNT(*) FROM tracking_event;
```

### 2. 📦 **Gönderi Durumu Analizi:**
```sql
SELECT 
    status as durum,
    COUNT(*) as adet,
    ROUND(AVG(weight), 2) as ortalama_agirlik,
    ROUND(AVG(length * width * height), 2) as ortalama_hacim
FROM shipment 
GROUP BY status
ORDER BY adet DESC;
```

### 3. 🚚 **Detaylı Gönderi Listesi:**
```sql
SELECT 
    tracking_number as takip_no,
    sender_name as gonderen,
    receiver_name as alici,
    status as durum,
    weight as agirlik,
    CONCAT(length, 'x', width, 'x', height, ' cm') as boyutlar,
    created_at as olusturma_tarihi
FROM shipment
ORDER BY created_at DESC;
```

### 4. 📍 **Takip Geçmişi:**
```sql
SELECT 
    s.tracking_number,
    g.name as kapi_adi,
    g.location as lokasyon,
    te.event_type as olay_tipi,
    te.notes as notlar,
    te.timestamp as olay_zamani
FROM tracking_event te
JOIN shipment s ON te.shipment_id = s.id
JOIN gate g ON te.gate_id = g.id
ORDER BY te.timestamp DESC
LIMIT 20;
```

### 5. 🏢 **Kapı Tipleri Analizi:**
```sql
SELECT 
    gate_type as kapi_tipi,
    COUNT(*) as adet,
    string_agg(name, ', ') as kapi_isimleri
FROM gate
GROUP BY gate_type
ORDER BY adet DESC;
```

---

## ⚡ **SQL Çalıştırma İpuçları**

### 1. 🎯 **Query Execution:**
- SQL kodunu seçin (ya da tümünü bırakın)
- **▶️ Execute/Run** butonuna basın (ya da **F5**)
- Alt panelde sonuçları göreceksiniz

### 2. 🔄 **Veri Yenileme:**
- Sol panelde tabloları **F5** ile yenileyin
- **View/Edit Data** → **All Rows** ile güncel verileri görün

### 3. 💾 **Script Kaydetme:**
- **File** → **Save** ile sorguları kaydedebilirsiniz
- **File** → **Open** ile kaydedilmiş sorguları açabilirsiniz

### 4. 📤 **Veri Export:**
- Sorgu sonucunda **Download as CSV** ile veri indirebilirsiniz

---

## 🔧 **Yararlı Komutlar**

### 📋 **Tablo Yapısını Görme:**
```sql
-- Tüm tabloları listele
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Shipment tablosunun kolonlarını görüntüle
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'shipment';
```

### 🧹 **Veri Temizleme:**
```sql
-- Test verilerini temizle (DİKKATLİ KULLAN!)
DELETE FROM tracking_event;
DELETE FROM shipment;
DELETE FROM gate;

-- Auto-increment sıfırla (eğer varsa)
ALTER SEQUENCE IF EXISTS shipment_id_seq RESTART WITH 1;
```

### 📊 **Performance Monitoring:**
```sql
-- Aktif bağlantıları görüntüle
SELECT pid, usename, application_name, state, query_start 
FROM pg_stat_activity 
WHERE datname = 'logistic_control';

-- Tablo boyutları
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats
WHERE schemaname = 'public';
```

---

## 🚨 **Güvenlik Notları**

### ⚠️ **Dikkat Edilmesi Gerekenler:**
1. **DELETE** ve **DROP** komutlarını dikkatli kullanın
2. Production veritabanında test yapmayın
3. Büyük veri setlerinde **LIMIT** kullanın
4. **WHERE** clause olmadan **UPDATE/DELETE** yapmayın

### 🔒 **Yedekleme:**
```sql
-- Veri export etme
COPY shipment TO '/tmp/shipment_backup.csv' DELIMITER ',' CSV HEADER;
```

---

## 🎯 **Hızlı Test Senaryosu**

### 1. ✅ **API Test ile Karşılaştırma:**
1. pgAdmin'de test verileri ekleyin
2. Postman'de `GET http://localhost:3000/api/shipments` çağırın
3. İki sonucu karşılaştırın

### 2. 🔄 **Gerçek Zamanlı Test:**
1. pgAdmin'de shipment tablosunu açık tutun
2. Postman'de yeni gönderi oluşturun
3. pgAdmin'de **F5** ile yenileyin - yeni kaydı görün!

---

## 📞 **Sorun Giderme**

### ❌ **Sık Karşılaşılan Hatalar:**

#### Connection Error:
```
Could not connect to server
```
**Çözüm:** Container'ların çalıştığından emin olun:
```bash
docker-compose ps
```

#### Permission Denied:
```
permission denied for table
```
**Çözüm:** Doğru kullanıcı ile bağlandığınızdan emin olun (postgres/password)

#### Syntax Error:
```
syntax error at or near
```
**Çözüm:** SQL syntax'ını kontrol edin, eksik noktalı virgül ekleyin

---

Bu kılavuz ile pgAdmin'i profesyonel seviyede kullanabilir, veritabanınızı etkili bir şekilde yönetebilirsiniz! 🚀

**💡 İpucu:** Bu komutları sık kullanacağınız için **Query Tool**'da **Favorites** olarak kaydedebilirsiniz. 