--
-- PostgreSQL database dump
--

-- Dumped from database version 15.13
-- Dumped by pg_dump version 15.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: driver; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA driver;


ALTER SCHEMA driver OWNER TO postgres;

--
-- Name: planner; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA planner;


ALTER SCHEMA planner OWNER TO postgres;

--
-- Name: tracking; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA tracking;


ALTER SCHEMA tracking OWNER TO postgres;

--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: driver_assignments_status_enum; Type: TYPE; Schema: driver; Owner: postgres
--

CREATE TYPE driver.driver_assignments_status_enum AS ENUM (
    'pending',
    'accepted',
    'rejected',
    'in_progress',
    'completed',
    'cancelled'
);


ALTER TYPE driver.driver_assignments_status_enum OWNER TO postgres;

--
-- Name: driver_outbox_events_status_enum; Type: TYPE; Schema: driver; Owner: postgres
--

CREATE TYPE driver.driver_outbox_events_status_enum AS ENUM (
    'pending',
    'processing',
    'processed',
    'completed',
    'failed'
);


ALTER TYPE driver.driver_outbox_events_status_enum OWNER TO postgres;

--
-- Name: driver_shipments_priority_enum; Type: TYPE; Schema: driver; Owner: postgres
--

CREATE TYPE driver.driver_shipments_priority_enum AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);


ALTER TYPE driver.driver_shipments_priority_enum OWNER TO postgres;

--
-- Name: driver_shipments_status_enum; Type: TYPE; Schema: driver; Owner: postgres
--

CREATE TYPE driver.driver_shipments_status_enum AS ENUM (
    'pending',
    'assigned',
    'in_transit',
    'delivered',
    'cancelled'
);


ALTER TYPE driver.driver_shipments_status_enum OWNER TO postgres;

--
-- Name: drivers_status_enum; Type: TYPE; Schema: driver; Owner: postgres
--

CREATE TYPE driver.drivers_status_enum AS ENUM (
    'available',
    'busy',
    'offline',
    'on_break'
);


ALTER TYPE driver.drivers_status_enum OWNER TO postgres;

--
-- Name: drivers_vehicletype_enum; Type: TYPE; Schema: driver; Owner: postgres
--

CREATE TYPE driver.drivers_vehicletype_enum AS ENUM (
    'van',
    'truck',
    'motorcycle',
    'car'
);


ALTER TYPE driver.drivers_vehicletype_enum OWNER TO postgres;

--
-- Name: outbox_events_status_enum; Type: TYPE; Schema: driver; Owner: postgres
--

CREATE TYPE driver.outbox_events_status_enum AS ENUM (
    'PENDING',
    'PROCESSING',
    'PROCESSED',
    'COMPLETED',
    'FAILED'
);


ALTER TYPE driver.outbox_events_status_enum OWNER TO postgres;

--
-- Name: shipments_status_enum; Type: TYPE; Schema: driver; Owner: postgres
--

CREATE TYPE driver.shipments_status_enum AS ENUM (
    'pending',
    'assigned',
    'in_transit',
    'delivered',
    'cancelled'
);


ALTER TYPE driver.shipments_status_enum OWNER TO postgres;

--
-- Name: planner_drivers_status_enum; Type: TYPE; Schema: planner; Owner: postgres
--

CREATE TYPE planner.planner_drivers_status_enum AS ENUM (
    'available',
    'busy',
    'offline',
    'on_delivery'
);


ALTER TYPE planner.planner_drivers_status_enum OWNER TO postgres;

--
-- Name: planner_outbox_events_status_enum; Type: TYPE; Schema: planner; Owner: postgres
--

CREATE TYPE planner.planner_outbox_events_status_enum AS ENUM (
    'pending',
    'processing',
    'processed',
    'completed',
    'failed'
);


ALTER TYPE planner.planner_outbox_events_status_enum OWNER TO postgres;

--
-- Name: planner_shipments_status_enum; Type: TYPE; Schema: planner; Owner: postgres
--

CREATE TYPE planner.planner_shipments_status_enum AS ENUM (
    'pending',
    'assigned',
    'in_transit',
    'delivered',
    'cancelled'
);


ALTER TYPE planner.planner_shipments_status_enum OWNER TO postgres;

--
-- Name: tracking_events_eventtype_enum; Type: TYPE; Schema: planner; Owner: postgres
--

CREATE TYPE planner.tracking_events_eventtype_enum AS ENUM (
    'created',
    'assigned',
    'picked_up',
    'in_transit',
    'out_for_delivery',
    'delivered',
    'failed_delivery',
    'cancelled'
);


ALTER TYPE planner.tracking_events_eventtype_enum OWNER TO postgres;

--
-- Name: driver_assignments_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.driver_assignments_status_enum AS ENUM (
    'pending',
    'accepted',
    'rejected',
    'in_progress',
    'completed',
    'cancelled'
);


ALTER TYPE public.driver_assignments_status_enum OWNER TO postgres;

--
-- Name: driver_outbox_events_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.driver_outbox_events_status_enum AS ENUM (
    'pending',
    'processing',
    'processed',
    'completed',
    'failed'
);


ALTER TYPE public.driver_outbox_events_status_enum OWNER TO postgres;

--
-- Name: driver_shipments_priority_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.driver_shipments_priority_enum AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);


ALTER TYPE public.driver_shipments_priority_enum OWNER TO postgres;

--
-- Name: driver_shipments_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.driver_shipments_status_enum AS ENUM (
    'pending',
    'assigned',
    'in_transit',
    'delivered',
    'cancelled'
);


ALTER TYPE public.driver_shipments_status_enum OWNER TO postgres;

--
-- Name: drivers_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.drivers_status_enum AS ENUM (
    'available',
    'busy',
    'offline',
    'on_break'
);


ALTER TYPE public.drivers_status_enum OWNER TO postgres;

--
-- Name: drivers_vehicletype_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.drivers_vehicletype_enum AS ENUM (
    'van',
    'truck',
    'motorcycle',
    'car'
);


ALTER TYPE public.drivers_vehicletype_enum OWNER TO postgres;

--
-- Name: outbox_events_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.outbox_events_status_enum AS ENUM (
    'PENDING',
    'PROCESSING',
    'PROCESSED',
    'COMPLETED',
    'FAILED'
);


ALTER TYPE public.outbox_events_status_enum OWNER TO postgres;

--
-- Name: shipments_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.shipments_status_enum AS ENUM (
    'pending',
    'assigned',
    'in_transit',
    'delivered',
    'cancelled'
);


ALTER TYPE public.shipments_status_enum OWNER TO postgres;

--
-- Name: tracking_events_eventtype_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.tracking_events_eventtype_enum AS ENUM (
    'created',
    'assigned',
    'picked_up',
    'in_transit',
    'out_for_delivery',
    'delivered',
    'failed_delivery',
    'cancelled'
);


ALTER TYPE public.tracking_events_eventtype_enum OWNER TO postgres;

--
-- Name: tracking_outbox_events_status_enum; Type: TYPE; Schema: tracking; Owner: postgres
--

CREATE TYPE tracking.tracking_outbox_events_status_enum AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed'
);


ALTER TYPE tracking.tracking_outbox_events_status_enum OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: driver_assignments; Type: TABLE; Schema: driver; Owner: postgres
--

CREATE TABLE driver.driver_assignments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "driverId" character varying NOT NULL,
    "shipmentId" character varying NOT NULL,
    status driver.driver_assignments_status_enum DEFAULT 'pending'::driver.driver_assignments_status_enum NOT NULL,
    "assignedAt" timestamp without time zone NOT NULL,
    "acceptedAt" timestamp without time zone,
    "startedAt" timestamp without time zone,
    "completedAt" timestamp without time zone,
    notes text,
    "estimatedDuration" numeric(10,2),
    "actualDuration" numeric(10,2),
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE driver.driver_assignments OWNER TO postgres;

--
-- Name: driver_locations; Type: TABLE; Schema: driver; Owner: postgres
--

CREATE TABLE driver.driver_locations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "driverId" character varying NOT NULL,
    latitude numeric(10,8) NOT NULL,
    longitude numeric(11,8) NOT NULL,
    address text,
    speed numeric(5,2),
    heading numeric(5,2),
    "h3Cell" text,
    "recordedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE driver.driver_locations OWNER TO postgres;

--
-- Name: driver_outbox_events; Type: TABLE; Schema: driver; Owner: postgres
--

CREATE TABLE driver.driver_outbox_events (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "eventType" character varying(100) NOT NULL,
    "eventData" jsonb NOT NULL,
    "routingKey" character varying(100),
    exchange character varying(100),
    status driver.driver_outbox_events_status_enum DEFAULT 'pending'::driver.driver_outbox_events_status_enum NOT NULL,
    "errorMessage" text,
    "retryCount" integer DEFAULT 0 NOT NULL,
    "processedAt" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE driver.driver_outbox_events OWNER TO postgres;

--
-- Name: driver_routes; Type: TABLE; Schema: driver; Owner: postgres
--

CREATE TABLE driver.driver_routes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "driverId" character varying NOT NULL,
    waypoints json NOT NULL,
    "totalDistance" numeric(10,2) NOT NULL,
    "totalTime" integer NOT NULL,
    "fuelEstimate" numeric(10,2) NOT NULL,
    efficiency numeric(5,2) NOT NULL,
    "currentLocation" jsonb,
    "routeStatistics" json,
    "startedAt" timestamp without time zone,
    "completedAt" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE driver.driver_routes OWNER TO postgres;

--
-- Name: driver_shipments; Type: TABLE; Schema: driver; Owner: postgres
--

CREATE TABLE driver.driver_shipments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "trackingNumber" character varying(100) NOT NULL,
    description text NOT NULL,
    weight numeric(10,2) NOT NULL,
    volume numeric(10,2) NOT NULL,
    origin character varying(255) NOT NULL,
    destination character varying(255) NOT NULL,
    "assignedDriverId" uuid,
    "pickupLocation" jsonb NOT NULL,
    "deliveryLocation" jsonb NOT NULL,
    status driver.driver_shipments_status_enum DEFAULT 'pending'::driver.driver_shipments_status_enum NOT NULL,
    priority driver.driver_shipments_priority_enum DEFAULT 'medium'::driver.driver_shipments_priority_enum NOT NULL,
    "pickupTime" timestamp without time zone,
    "deliveryTime" timestamp without time zone,
    "estimatedDeliveryDate" timestamp without time zone,
    notes text,
    metadata jsonb,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE driver.driver_shipments OWNER TO postgres;

--
-- Name: drivers; Type: TABLE; Schema: driver; Owner: postgres
--

CREATE TABLE driver.drivers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    "licenseNumber" character varying NOT NULL,
    "phoneNumber" character varying NOT NULL,
    address text NOT NULL,
    "maxCapacity" numeric(8,2) DEFAULT '1000'::numeric NOT NULL,
    "maxVolume" numeric(8,2) DEFAULT '10'::numeric NOT NULL,
    "maxDeliveries" integer DEFAULT 20 NOT NULL,
    "vehicleType" driver.drivers_vehicletype_enum DEFAULT 'van'::driver.drivers_vehicletype_enum NOT NULL,
    status driver.drivers_status_enum DEFAULT 'available'::driver.drivers_status_enum NOT NULL,
    "currentLocation" jsonb,
    "lastActiveAt" timestamp without time zone,
    preferences jsonb,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE driver.drivers OWNER TO postgres;

--
-- Name: outbox_events; Type: TABLE; Schema: driver; Owner: postgres
--

CREATE TABLE driver.outbox_events (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "eventType" character varying NOT NULL,
    "eventData" json NOT NULL,
    "routingKey" character varying,
    exchange character varying,
    status driver.outbox_events_status_enum DEFAULT 'PENDING'::driver.outbox_events_status_enum NOT NULL,
    "errorMessage" character varying,
    "retryCount" integer DEFAULT 0 NOT NULL,
    "processedAt" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE driver.outbox_events OWNER TO postgres;

--
-- Name: outbox_events; Type: TABLE; Schema: planner; Owner: postgres
--

CREATE TABLE planner.outbox_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_type character varying(255) NOT NULL,
    event_data jsonb NOT NULL,
    routing_key character varying(255),
    exchange character varying(255),
    status character varying(50) DEFAULT 'pending'::character varying,
    error_message text,
    retry_count integer DEFAULT 0,
    processed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE planner.outbox_events OWNER TO postgres;

--
-- Name: planner_drivers; Type: TABLE; Schema: planner; Owner: postgres
--

CREATE TABLE planner.planner_drivers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    "licenseNumber" character varying(100) NOT NULL,
    "phoneNumber" character varying(20) NOT NULL,
    address text,
    status planner.planner_drivers_status_enum DEFAULT 'available'::planner.planner_drivers_status_enum NOT NULL,
    "currentCapacity" numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    "maxCapacity" numeric(10,2) DEFAULT '1000'::numeric NOT NULL,
    "currentLatitude" numeric(10,6),
    "currentLongitude" numeric(10,6),
    "lastLocationUpdate" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE planner.planner_drivers OWNER TO postgres;

--
-- Name: planner_outbox_events; Type: TABLE; Schema: planner; Owner: postgres
--

CREATE TABLE planner.planner_outbox_events (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "eventType" character varying(100) NOT NULL,
    "eventData" jsonb NOT NULL,
    "routingKey" character varying(100),
    exchange character varying(100),
    status planner.planner_outbox_events_status_enum DEFAULT 'pending'::planner.planner_outbox_events_status_enum NOT NULL,
    "errorMessage" text,
    "retryCount" integer DEFAULT 0 NOT NULL,
    "processedAt" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE planner.planner_outbox_events OWNER TO postgres;

--
-- Name: planner_shipments; Type: TABLE; Schema: planner; Owner: postgres
--

CREATE TABLE planner.planner_shipments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "trackingNumber" character varying NOT NULL,
    origin character varying NOT NULL,
    destination character varying NOT NULL,
    description text,
    weight numeric(10,2) NOT NULL,
    volume numeric(10,2) NOT NULL,
    status planner.planner_shipments_status_enum DEFAULT 'pending'::planner.planner_shipments_status_enum NOT NULL,
    "assignedDriverId" character varying,
    "estimatedDeliveryDate" timestamp without time zone,
    "actualDeliveryDate" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE planner.planner_shipments OWNER TO postgres;

--
-- Name: shipments; Type: TABLE; Schema: planner; Owner: postgres
--

CREATE TABLE planner.shipments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tracking_number character varying(255) NOT NULL,
    origin character varying(255) NOT NULL,
    destination character varying(255) NOT NULL,
    description text,
    weight numeric(10,2),
    volume numeric(10,2),
    status character varying(50) DEFAULT 'pending'::character varying,
    estimated_delivery_date timestamp without time zone,
    assigned_driver_id uuid,
    actual_delivery_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE planner.shipments OWNER TO postgres;

--
-- Name: tracking_events; Type: TABLE; Schema: planner; Owner: postgres
--

CREATE TABLE planner.tracking_events (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "shipmentId" uuid NOT NULL,
    "eventType" planner.tracking_events_eventtype_enum NOT NULL,
    description text NOT NULL,
    location jsonb,
    "driverId" character varying,
    "eventTimestamp" timestamp without time zone NOT NULL,
    metadata jsonb,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE planner.tracking_events OWNER TO postgres;

--
-- Name: assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    driver_id uuid NOT NULL,
    shipment_id uuid,
    type character varying(20) DEFAULT 'shipment'::character varying,
    status character varying(20) DEFAULT 'pending'::character varying,
    description text,
    assigned_at timestamp without time zone NOT NULL,
    accepted_at timestamp without time zone,
    started_at timestamp without time zone,
    completed_at timestamp without time zone,
    notes text,
    estimated_duration numeric(10,2),
    actual_duration numeric(10,2),
    metadata jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.assignments OWNER TO postgres;

--
-- Name: driver_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.driver_assignments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "driverId" character varying NOT NULL,
    "shipmentId" character varying NOT NULL,
    status public.driver_assignments_status_enum DEFAULT 'pending'::public.driver_assignments_status_enum NOT NULL,
    "assignedAt" timestamp without time zone NOT NULL,
    "acceptedAt" timestamp without time zone,
    "startedAt" timestamp without time zone,
    "completedAt" timestamp without time zone,
    notes text,
    "estimatedDuration" numeric(10,2),
    "actualDuration" numeric(10,2),
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.driver_assignments OWNER TO postgres;

--
-- Name: driver_locations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.driver_locations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "driverId" character varying NOT NULL,
    latitude numeric(10,8) NOT NULL,
    longitude numeric(11,8) NOT NULL,
    address text,
    speed numeric(5,2),
    heading numeric(5,2),
    "h3Cell" text,
    "recordedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.driver_locations OWNER TO postgres;

--
-- Name: driver_outbox_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.driver_outbox_events (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "eventType" character varying(100) NOT NULL,
    "eventData" jsonb NOT NULL,
    "routingKey" character varying(100),
    exchange character varying(100),
    status public.driver_outbox_events_status_enum DEFAULT 'pending'::public.driver_outbox_events_status_enum NOT NULL,
    "errorMessage" text,
    "retryCount" integer DEFAULT 0 NOT NULL,
    "processedAt" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.driver_outbox_events OWNER TO postgres;

--
-- Name: driver_routes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.driver_routes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "driverId" character varying NOT NULL,
    waypoints json NOT NULL,
    "totalDistance" numeric(10,2) NOT NULL,
    "totalTime" integer NOT NULL,
    "fuelEstimate" numeric(10,2) NOT NULL,
    efficiency numeric(5,2) NOT NULL,
    "currentLocation" jsonb,
    "routeStatistics" json,
    "startedAt" timestamp without time zone,
    "completedAt" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.driver_routes OWNER TO postgres;

--
-- Name: driver_shipments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.driver_shipments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "trackingNumber" character varying(100) NOT NULL,
    description text NOT NULL,
    weight numeric(10,2) NOT NULL,
    volume numeric(10,2) NOT NULL,
    origin character varying(255) NOT NULL,
    destination character varying(255) NOT NULL,
    "assignedDriverId" uuid,
    "pickupLocation" jsonb NOT NULL,
    "deliveryLocation" jsonb NOT NULL,
    status public.driver_shipments_status_enum DEFAULT 'pending'::public.driver_shipments_status_enum NOT NULL,
    priority public.driver_shipments_priority_enum DEFAULT 'medium'::public.driver_shipments_priority_enum NOT NULL,
    "pickupTime" timestamp without time zone,
    "deliveryTime" timestamp without time zone,
    "estimatedDeliveryDate" timestamp without time zone,
    notes text,
    metadata jsonb,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.driver_shipments OWNER TO postgres;

--
-- Name: drivers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.drivers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    "licenseNumber" character varying NOT NULL,
    "phoneNumber" character varying NOT NULL,
    address text NOT NULL,
    "maxCapacity" numeric(8,2) DEFAULT '1000'::numeric NOT NULL,
    "maxVolume" numeric(8,2) DEFAULT '10'::numeric NOT NULL,
    "maxDeliveries" integer DEFAULT 20 NOT NULL,
    "vehicleType" public.drivers_vehicletype_enum DEFAULT 'van'::public.drivers_vehicletype_enum NOT NULL,
    status public.drivers_status_enum DEFAULT 'available'::public.drivers_status_enum NOT NULL,
    "currentLocation" jsonb,
    "lastActiveAt" timestamp without time zone,
    preferences jsonb,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.drivers OWNER TO postgres;

--
-- Name: locations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.locations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    latitude numeric(10,8) NOT NULL,
    longitude numeric(11,8) NOT NULL,
    address text,
    h3_cell text,
    speed numeric(5,2),
    heading numeric(5,2),
    recorded_at timestamp without time zone NOT NULL,
    entity_id uuid,
    entity_type character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.locations OWNER TO postgres;

--
-- Name: outbox_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.outbox_events (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "eventType" character varying NOT NULL,
    "eventData" json NOT NULL,
    "routingKey" character varying,
    exchange character varying,
    status public.outbox_events_status_enum DEFAULT 'PENDING'::public.outbox_events_status_enum NOT NULL,
    "errorMessage" character varying,
    "retryCount" integer DEFAULT 0 NOT NULL,
    "processedAt" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.outbox_events OWNER TO postgres;

--
-- Name: shipments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shipments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "trackingNumber" character varying NOT NULL,
    origin character varying NOT NULL,
    destination character varying NOT NULL,
    description text,
    weight numeric(10,2) NOT NULL,
    volume numeric(10,2) NOT NULL,
    status public.shipments_status_enum DEFAULT 'pending'::public.shipments_status_enum NOT NULL,
    "assignedDriverId" character varying,
    "estimatedDeliveryDate" timestamp without time zone,
    "actualDeliveryDate" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.shipments OWNER TO postgres;

--
-- Name: tracking_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tracking_events (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "shipmentId" uuid NOT NULL,
    "eventType" public.tracking_events_eventtype_enum NOT NULL,
    description text NOT NULL,
    location jsonb,
    "driverId" character varying,
    "eventTimestamp" timestamp without time zone NOT NULL,
    metadata jsonb,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.tracking_events OWNER TO postgres;

--
-- Name: route_optimization; Type: TABLE; Schema: tracking; Owner: postgres
--

CREATE TABLE tracking.route_optimization (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "driverId" character varying(255) NOT NULL,
    "optimizedRoute" jsonb,
    "h3OptimizedRoute" jsonb,
    waypoints jsonb DEFAULT '[]'::jsonb NOT NULL,
    "totalDistance" numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    "totalTime" integer DEFAULT 0 NOT NULL,
    "fuelEstimate" numeric(8,2) DEFAULT '0'::numeric NOT NULL,
    efficiency numeric(5,2) DEFAULT '0'::numeric NOT NULL,
    status character varying(50) DEFAULT 'planned'::character varying NOT NULL,
    "optimizationAlgorithm" character varying(100) DEFAULT 'H3_GRID'::character varying NOT NULL,
    "currentLocation" jsonb,
    "completedDeliveries" integer DEFAULT 0 NOT NULL,
    "totalDeliveries" integer DEFAULT 0 NOT NULL,
    "routeStatistics" jsonb,
    "startedAt" timestamp without time zone,
    "completedAt" timestamp without time zone,
    "lastOptimizedAt" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE tracking.route_optimization OWNER TO postgres;

--
-- Name: tracking_outbox_events; Type: TABLE; Schema: tracking; Owner: postgres
--

CREATE TABLE tracking.tracking_outbox_events (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "eventType" character varying(100) NOT NULL,
    "eventData" jsonb NOT NULL,
    "routingKey" character varying(100),
    exchange character varying(100),
    status tracking.tracking_outbox_events_status_enum DEFAULT 'pending'::tracking.tracking_outbox_events_status_enum NOT NULL,
    "errorMessage" text,
    "retryCount" integer DEFAULT 0 NOT NULL,
    "processedAt" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE tracking.tracking_outbox_events OWNER TO postgres;

--
-- Name: driver_locations PK_31aae5c417762bf01ec26a53f02; Type: CONSTRAINT; Schema: driver; Owner: postgres
--

ALTER TABLE ONLY driver.driver_locations
    ADD CONSTRAINT "PK_31aae5c417762bf01ec26a53f02" PRIMARY KEY (id);


--
-- Name: driver_shipments PK_38fd1deb0f3008b5461cb6c3812; Type: CONSTRAINT; Schema: driver; Owner: postgres
--

ALTER TABLE ONLY driver.driver_shipments
    ADD CONSTRAINT "PK_38fd1deb0f3008b5461cb6c3812" PRIMARY KEY (id);


--
-- Name: outbox_events PK_6689a16c00d09b8089f6237f1d2; Type: CONSTRAINT; Schema: driver; Owner: postgres
--

ALTER TABLE ONLY driver.outbox_events
    ADD CONSTRAINT "PK_6689a16c00d09b8089f6237f1d2" PRIMARY KEY (id);


--
-- Name: driver_outbox_events PK_73a77aea920afedede44f055de9; Type: CONSTRAINT; Schema: driver; Owner: postgres
--

ALTER TABLE ONLY driver.driver_outbox_events
    ADD CONSTRAINT "PK_73a77aea920afedede44f055de9" PRIMARY KEY (id);


--
-- Name: driver_routes PK_8daa55d88fade48327edb50bc69; Type: CONSTRAINT; Schema: driver; Owner: postgres
--

ALTER TABLE ONLY driver.driver_routes
    ADD CONSTRAINT "PK_8daa55d88fade48327edb50bc69" PRIMARY KEY (id);


--
-- Name: drivers PK_92ab3fb69e566d3eb0cae896047; Type: CONSTRAINT; Schema: driver; Owner: postgres
--

ALTER TABLE ONLY driver.drivers
    ADD CONSTRAINT "PK_92ab3fb69e566d3eb0cae896047" PRIMARY KEY (id);


--
-- Name: driver_assignments PK_b72677caff7b7e9acad3d55b3ec; Type: CONSTRAINT; Schema: driver; Owner: postgres
--

ALTER TABLE ONLY driver.driver_assignments
    ADD CONSTRAINT "PK_b72677caff7b7e9acad3d55b3ec" PRIMARY KEY (id);


--
-- Name: drivers UQ_754b3d50a8cc64f7ad5c24f62b4; Type: CONSTRAINT; Schema: driver; Owner: postgres
--

ALTER TABLE ONLY driver.drivers
    ADD CONSTRAINT "UQ_754b3d50a8cc64f7ad5c24f62b4" UNIQUE ("licenseNumber");


--
-- Name: planner_shipments PK_5a2953bab74fb6f9af6b5be41b9; Type: CONSTRAINT; Schema: planner; Owner: postgres
--

ALTER TABLE ONLY planner.planner_shipments
    ADD CONSTRAINT "PK_5a2953bab74fb6f9af6b5be41b9" PRIMARY KEY (id);


--
-- Name: planner_drivers PK_6dd24450c8436028ca847408912; Type: CONSTRAINT; Schema: planner; Owner: postgres
--

ALTER TABLE ONLY planner.planner_drivers
    ADD CONSTRAINT "PK_6dd24450c8436028ca847408912" PRIMARY KEY (id);


--
-- Name: tracking_events PK_cc22ae68e05d9ba5a6575a6f429; Type: CONSTRAINT; Schema: planner; Owner: postgres
--

ALTER TABLE ONLY planner.tracking_events
    ADD CONSTRAINT "PK_cc22ae68e05d9ba5a6575a6f429" PRIMARY KEY (id);


--
-- Name: planner_outbox_events PK_fd88d0eddc9ae2dbdf65a5ae213; Type: CONSTRAINT; Schema: planner; Owner: postgres
--

ALTER TABLE ONLY planner.planner_outbox_events
    ADD CONSTRAINT "PK_fd88d0eddc9ae2dbdf65a5ae213" PRIMARY KEY (id);


--
-- Name: planner_shipments UQ_95611a5ebfbecdf9ffa378fc11e; Type: CONSTRAINT; Schema: planner; Owner: postgres
--

ALTER TABLE ONLY planner.planner_shipments
    ADD CONSTRAINT "UQ_95611a5ebfbecdf9ffa378fc11e" UNIQUE ("trackingNumber");


--
-- Name: planner_drivers UQ_dbbe868d553f5d74cb09ca8cf7e; Type: CONSTRAINT; Schema: planner; Owner: postgres
--

ALTER TABLE ONLY planner.planner_drivers
    ADD CONSTRAINT "UQ_dbbe868d553f5d74cb09ca8cf7e" UNIQUE ("licenseNumber");


--
-- Name: outbox_events outbox_events_pkey; Type: CONSTRAINT; Schema: planner; Owner: postgres
--

ALTER TABLE ONLY planner.outbox_events
    ADD CONSTRAINT outbox_events_pkey PRIMARY KEY (id);


--
-- Name: shipments shipments_pkey; Type: CONSTRAINT; Schema: planner; Owner: postgres
--

ALTER TABLE ONLY planner.shipments
    ADD CONSTRAINT shipments_pkey PRIMARY KEY (id);


--
-- Name: driver_locations PK_31aae5c417762bf01ec26a53f02; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.driver_locations
    ADD CONSTRAINT "PK_31aae5c417762bf01ec26a53f02" PRIMARY KEY (id);


--
-- Name: driver_shipments PK_38fd1deb0f3008b5461cb6c3812; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.driver_shipments
    ADD CONSTRAINT "PK_38fd1deb0f3008b5461cb6c3812" PRIMARY KEY (id);


--
-- Name: outbox_events PK_6689a16c00d09b8089f6237f1d2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.outbox_events
    ADD CONSTRAINT "PK_6689a16c00d09b8089f6237f1d2" PRIMARY KEY (id);


--
-- Name: shipments PK_6deda4532ac542a93eab214b564; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipments
    ADD CONSTRAINT "PK_6deda4532ac542a93eab214b564" PRIMARY KEY (id);


--
-- Name: driver_outbox_events PK_73a77aea920afedede44f055de9; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.driver_outbox_events
    ADD CONSTRAINT "PK_73a77aea920afedede44f055de9" PRIMARY KEY (id);


--
-- Name: driver_routes PK_8daa55d88fade48327edb50bc69; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.driver_routes
    ADD CONSTRAINT "PK_8daa55d88fade48327edb50bc69" PRIMARY KEY (id);


--
-- Name: drivers PK_92ab3fb69e566d3eb0cae896047; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT "PK_92ab3fb69e566d3eb0cae896047" PRIMARY KEY (id);


--
-- Name: driver_assignments PK_b72677caff7b7e9acad3d55b3ec; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.driver_assignments
    ADD CONSTRAINT "PK_b72677caff7b7e9acad3d55b3ec" PRIMARY KEY (id);


--
-- Name: tracking_events PK_cc22ae68e05d9ba5a6575a6f429; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tracking_events
    ADD CONSTRAINT "PK_cc22ae68e05d9ba5a6575a6f429" PRIMARY KEY (id);


--
-- Name: shipments UQ_3300d7adbd17fdb51bdfd8c951e; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipments
    ADD CONSTRAINT "UQ_3300d7adbd17fdb51bdfd8c951e" UNIQUE ("trackingNumber");


--
-- Name: drivers UQ_754b3d50a8cc64f7ad5c24f62b4; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT "UQ_754b3d50a8cc64f7ad5c24f62b4" UNIQUE ("licenseNumber");


--
-- Name: assignments assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_pkey PRIMARY KEY (id);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: tracking_outbox_events PK_2c641b140cb4a8246c77e4d871b; Type: CONSTRAINT; Schema: tracking; Owner: postgres
--

ALTER TABLE ONLY tracking.tracking_outbox_events
    ADD CONSTRAINT "PK_2c641b140cb4a8246c77e4d871b" PRIMARY KEY (id);


--
-- Name: route_optimization PK_b2820658050fe6eadbd6ea80dd5; Type: CONSTRAINT; Schema: tracking; Owner: postgres
--

ALTER TABLE ONLY tracking.route_optimization
    ADD CONSTRAINT "PK_b2820658050fe6eadbd6ea80dd5" PRIMARY KEY (id);


--
-- Name: IDX_06daa36e802a6747176edb5358; Type: INDEX; Schema: driver; Owner: postgres
--

CREATE INDEX "IDX_06daa36e802a6747176edb5358" ON driver.driver_outbox_events USING btree (status, "createdAt");


--
-- Name: IDX_41829f189c8472a58e1961cb58; Type: INDEX; Schema: driver; Owner: postgres
--

CREATE INDEX "IDX_41829f189c8472a58e1961cb58" ON driver.driver_outbox_events USING btree ("eventType", "routingKey");


--
-- Name: IDX_4e6a3081aeaa5ebbec96198ab2; Type: INDEX; Schema: driver; Owner: postgres
--

CREATE INDEX "IDX_4e6a3081aeaa5ebbec96198ab2" ON driver.driver_outbox_events USING btree ("eventType");


--
-- Name: IDX_614f34d9e08e741472fcbe140c; Type: INDEX; Schema: driver; Owner: postgres
--

CREATE INDEX "IDX_614f34d9e08e741472fcbe140c" ON driver.driver_shipments USING btree ("pickupLocation", "deliveryLocation");


--
-- Name: IDX_67ddc9e662a4a4076cb6064d24; Type: INDEX; Schema: driver; Owner: postgres
--

CREATE INDEX "IDX_67ddc9e662a4a4076cb6064d24" ON driver.driver_shipments USING btree ("trackingNumber");


--
-- Name: IDX_6917e344ce1621cb3db08715ee; Type: INDEX; Schema: driver; Owner: postgres
--

CREATE INDEX "IDX_6917e344ce1621cb3db08715ee" ON driver.driver_outbox_events USING btree (status);


--
-- Name: IDX_864bda696e361b121cf39bfee6; Type: INDEX; Schema: driver; Owner: postgres
--

CREATE INDEX "IDX_864bda696e361b121cf39bfee6" ON driver.driver_shipments USING btree (status);


--
-- Name: IDX_e571fa7e125f9c35d96f7d4367; Type: INDEX; Schema: driver; Owner: postgres
--

CREATE INDEX "IDX_e571fa7e125f9c35d96f7d4367" ON driver.driver_shipments USING btree (status, priority);


--
-- Name: IDX_159152f400a67b24bf2d58d475; Type: INDEX; Schema: planner; Owner: postgres
--

CREATE INDEX "IDX_159152f400a67b24bf2d58d475" ON planner.planner_outbox_events USING btree (status);


--
-- Name: IDX_1c9847cbcb3903e70e21e7fa1f; Type: INDEX; Schema: planner; Owner: postgres
--

CREATE INDEX "IDX_1c9847cbcb3903e70e21e7fa1f" ON planner.planner_drivers USING btree ("phoneNumber");


--
-- Name: IDX_1da8168bb1947a9e5353b5ed3a; Type: INDEX; Schema: planner; Owner: postgres
--

CREATE INDEX "IDX_1da8168bb1947a9e5353b5ed3a" ON planner.planner_outbox_events USING btree (status, "createdAt");


--
-- Name: IDX_24f195b64eae081cb595ec930a; Type: INDEX; Schema: planner; Owner: postgres
--

CREATE INDEX "IDX_24f195b64eae081cb595ec930a" ON planner.planner_shipments USING btree (origin, destination);


--
-- Name: IDX_95611a5ebfbecdf9ffa378fc11; Type: INDEX; Schema: planner; Owner: postgres
--

CREATE INDEX "IDX_95611a5ebfbecdf9ffa378fc11" ON planner.planner_shipments USING btree ("trackingNumber");


--
-- Name: IDX_b5768102d2354a65f2530cc15e; Type: INDEX; Schema: planner; Owner: postgres
--

CREATE INDEX "IDX_b5768102d2354a65f2530cc15e" ON planner.planner_shipments USING btree (status, "assignedDriverId");


--
-- Name: IDX_bf6c6cf245dde9d0c10cc249fe; Type: INDEX; Schema: planner; Owner: postgres
--

CREATE INDEX "IDX_bf6c6cf245dde9d0c10cc249fe" ON planner.planner_outbox_events USING btree ("eventType");


--
-- Name: IDX_cbe54e58632384e2dfe3ab3eb8; Type: INDEX; Schema: planner; Owner: postgres
--

CREATE INDEX "IDX_cbe54e58632384e2dfe3ab3eb8" ON planner.planner_outbox_events USING btree ("eventType", "routingKey");


--
-- Name: IDX_ee1bf28155fca7e71d44b0a594; Type: INDEX; Schema: planner; Owner: postgres
--

CREATE INDEX "IDX_ee1bf28155fca7e71d44b0a594" ON planner.planner_drivers USING btree (status, "licenseNumber");


--
-- Name: IDX_06daa36e802a6747176edb5358; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_06daa36e802a6747176edb5358" ON public.driver_outbox_events USING btree (status, "createdAt");


--
-- Name: IDX_41829f189c8472a58e1961cb58; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_41829f189c8472a58e1961cb58" ON public.driver_outbox_events USING btree ("eventType", "routingKey");


--
-- Name: IDX_4e6a3081aeaa5ebbec96198ab2; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_4e6a3081aeaa5ebbec96198ab2" ON public.driver_outbox_events USING btree ("eventType");


--
-- Name: IDX_614f34d9e08e741472fcbe140c; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_614f34d9e08e741472fcbe140c" ON public.driver_shipments USING btree ("pickupLocation", "deliveryLocation");


--
-- Name: IDX_67ddc9e662a4a4076cb6064d24; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_67ddc9e662a4a4076cb6064d24" ON public.driver_shipments USING btree ("trackingNumber");


--
-- Name: IDX_6917e344ce1621cb3db08715ee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_6917e344ce1621cb3db08715ee" ON public.driver_outbox_events USING btree (status);


--
-- Name: IDX_864bda696e361b121cf39bfee6; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_864bda696e361b121cf39bfee6" ON public.driver_shipments USING btree (status);


--
-- Name: IDX_e571fa7e125f9c35d96f7d4367; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_e571fa7e125f9c35d96f7d4367" ON public.driver_shipments USING btree (status, priority);


--
-- Name: IDX_35baca825aa38b7781412188cb; Type: INDEX; Schema: tracking; Owner: postgres
--

CREATE INDEX "IDX_35baca825aa38b7781412188cb" ON tracking.tracking_outbox_events USING btree ("eventType");


--
-- Name: IDX_470834cf6cddff151f6d523f01; Type: INDEX; Schema: tracking; Owner: postgres
--

CREATE INDEX "IDX_470834cf6cddff151f6d523f01" ON tracking.route_optimization USING btree ("driverId");


--
-- Name: IDX_622be2c6b14462585ea1ad3421; Type: INDEX; Schema: tracking; Owner: postgres
--

CREATE INDEX "IDX_622be2c6b14462585ea1ad3421" ON tracking.tracking_outbox_events USING btree (status);


--
-- Name: IDX_74d5dcb0f3c81f6c61babe5d81; Type: INDEX; Schema: tracking; Owner: postgres
--

CREATE INDEX "IDX_74d5dcb0f3c81f6c61babe5d81" ON tracking.tracking_outbox_events USING btree ("eventType", "routingKey");


--
-- Name: IDX_a8f3e3e9212163aac83643c46b; Type: INDEX; Schema: tracking; Owner: postgres
--

CREATE INDEX "IDX_a8f3e3e9212163aac83643c46b" ON tracking.route_optimization USING btree ("createdAt");


--
-- Name: IDX_dabe23e760558c6fbca96b701f; Type: INDEX; Schema: tracking; Owner: postgres
--

CREATE INDEX "IDX_dabe23e760558c6fbca96b701f" ON tracking.route_optimization USING btree ("driverId", status);


--
-- Name: IDX_ee787350539b4b2d4f93ffbe5f; Type: INDEX; Schema: tracking; Owner: postgres
--

CREATE INDEX "IDX_ee787350539b4b2d4f93ffbe5f" ON tracking.tracking_outbox_events USING btree (status, "createdAt");


--
-- Name: tracking_events FK_bc333e60902230de3bd29923a26; Type: FK CONSTRAINT; Schema: planner; Owner: postgres
--

ALTER TABLE ONLY planner.tracking_events
    ADD CONSTRAINT "FK_bc333e60902230de3bd29923a26" FOREIGN KEY ("shipmentId") REFERENCES planner.planner_shipments(id);


--
-- Name: tracking_events FK_bc333e60902230de3bd29923a26; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tracking_events
    ADD CONSTRAINT "FK_bc333e60902230de3bd29923a26" FOREIGN KEY ("shipmentId") REFERENCES public.shipments(id);


--
-- PostgreSQL database dump complete
--

