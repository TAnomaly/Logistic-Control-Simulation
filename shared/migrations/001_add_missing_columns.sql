-- Clean migration for core business workflow tables only
-- This creates only the tables needed for the main business flow

-- Enable uuid-ossp for uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. DRIVERS TABLE - Driver oluşturma
CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    "licenseNumber" VARCHAR(50) UNIQUE NOT NULL,
    "phoneNumber" VARCHAR(20) NOT NULL,
    address TEXT,
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'busy', 'offline', 'on_delivery')),
    "currentLocation" JSONB,
    "lastActiveAt" TIMESTAMP,
    "maxCapacity" NUMERIC(10,2) DEFAULT 1000.00,
    "maxVolume" NUMERIC(10,2) DEFAULT 10.00,
    "maxDeliveries" INTEGER DEFAULT 5,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. SHIPMENTS TABLE - Sipariş oluşturma
CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "trackingNumber" VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    weight NUMERIC(10,2) NOT NULL DEFAULT 0,
    volume NUMERIC(10,2) NOT NULL DEFAULT 0,
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled')),
    "pickupLatitude" NUMERIC(10,7),
    "pickupLongitude" NUMERIC(11,7),
    "deliveryLatitude" NUMERIC(10,7),
    "deliveryLongitude" NUMERIC(11,7),
    "estimatedDeliveryDate" TIMESTAMP,
    "actualDeliveryDate" TIMESTAMP,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. DRIVER_ASSIGNMENTS TABLE - Sipariş atama
CREATE TABLE IF NOT EXISTS driver_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "driverId" UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    "shipmentId" UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled', 'assigned')),
    "assignedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "startedAt" TIMESTAMP,
    "completedAt" TIMESTAMP,
    notes TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE("driverId", "shipmentId")
);

-- 4. DRIVER_LOCATIONS TABLE - Konum güncelleme
CREATE TABLE IF NOT EXISTS driver_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "driverId" UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    latitude NUMERIC(10,8) NOT NULL,
    longitude NUMERIC(11,8) NOT NULL,
    address TEXT,
    speed NUMERIC(5,2),
    heading NUMERIC(5,2),
    accuracy NUMERIC(8,2),
    "recordedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. DRIVER_ROUTES TABLE - Route oluşturma (güncel konumdan polyline)
CREATE TABLE IF NOT EXISTS driver_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "driverId" UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    "optimizedRoute" JSONB NOT NULL DEFAULT '{}',
    "totalDistance" NUMERIC(10,2) NOT NULL DEFAULT 0,
    "totalTime" INTEGER NOT NULL DEFAULT 0,
    "fuelEstimate" NUMERIC(10,2) NOT NULL DEFAULT 0,
    efficiency NUMERIC(5,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
    "currentLocation" JSONB,
    "completedDeliveries" INTEGER DEFAULT 0,
    "startedAt" TIMESTAMP,
    "completedAt" TIMESTAMP,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. OUTBOX_EVENTS TABLE - Event sourcing (sistem gerekli)
CREATE TABLE IF NOT EXISTS outbox_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "eventType" VARCHAR(100) NOT NULL,
    "eventData" JSONB NOT NULL,
    "routingKey" VARCHAR(100),
    exchange VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'failed')),
    "errorMessage" TEXT,
    "retryCount" INTEGER DEFAULT 0,
    "processedAt" TIMESTAMP,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_license ON drivers("licenseNumber");
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments("trackingNumber");
CREATE INDEX IF NOT EXISTS idx_assignments_driver ON driver_assignments("driverId");
CREATE INDEX IF NOT EXISTS idx_assignments_shipment ON driver_assignments("shipmentId");
CREATE INDEX IF NOT EXISTS idx_assignments_status ON driver_assignments(status);
CREATE INDEX IF NOT EXISTS idx_locations_driver ON driver_locations("driverId");
CREATE INDEX IF NOT EXISTS idx_locations_recorded ON driver_locations("recordedAt");
CREATE INDEX IF NOT EXISTS idx_routes_driver ON driver_routes("driverId");
CREATE INDEX IF NOT EXISTS idx_routes_status ON driver_routes(status);
CREATE INDEX IF NOT EXISTS idx_outbox_status ON outbox_events(status);
CREATE INDEX IF NOT EXISTS idx_outbox_created ON outbox_events("createdAt");

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_drivers_updated_at ON drivers;
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shipments_updated_at ON shipments;
CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON shipments 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assignments_updated_at ON driver_assignments;
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON driver_assignments 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_routes_updated_at ON driver_routes;
CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON driver_routes 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_outbox_updated_at ON outbox_events;
CREATE TRIGGER update_outbox_updated_at BEFORE UPDATE ON outbox_events 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE drivers IS 'Core table for driver management and capacity tracking';
COMMENT ON TABLE shipments IS 'Core table for shipment orders with pickup/delivery locations';
COMMENT ON TABLE driver_assignments IS 'Links drivers to shipments for assignment tracking';
COMMENT ON TABLE driver_locations IS 'Tracks driver current locations for route optimization';
COMMENT ON TABLE driver_routes IS 'Stores optimized routes with polylines starting from current location';
COMMENT ON TABLE outbox_events IS 'Event sourcing pattern for reliable messaging';

-- Success message
SELECT 'Core business workflow tables created successfully!' as result;