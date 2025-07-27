import pytest
from unittest.mock import Mock, patch
from datetime import datetime, timedelta

from src.infrastructure.ml.route_optimizer_service import RouteOptimizerService
from src.domain.entities.route_entity import Waypoint, RouteSolutionDto

class TestRouteOptimizerService:
    
    @pytest.fixture
    def route_optimizer(self):
        return RouteOptimizerService()
    
    @pytest.fixture
    def sample_pickup_locations(self):
        return [
            Waypoint(lat=41.0082, lng=28.9784, type="pickup"),  # Istanbul
            Waypoint(lat=39.9334, lng=32.8597, type="pickup")   # Ankara
        ]
    
    @pytest.fixture
    def sample_delivery_locations(self):
        return [
            Waypoint(lat=38.4192, lng=27.1287, type="delivery"),  # Izmir
            Waypoint(lat=36.8969, lng=30.7133, type="delivery")   # Antalya
        ]
    
    def test_calculate_distance_matrix(self, route_optimizer):
        """Test distance matrix calculation"""
        locations = [
            (41.0082, 28.9784),  # Istanbul
            (39.9334, 32.8597),  # Ankara
            (38.4192, 27.1287)   # Izmir
        ]
        
        distance_matrix = route_optimizer.calculate_distance_matrix(locations)
        
        assert len(distance_matrix) == 3
        assert len(distance_matrix[0]) == 3
        assert distance_matrix[0][0] == 0  # Same location
        assert distance_matrix[0][1] > 0   # Different locations
        
    def test_traffic_factor_calculation(self, route_optimizer):
        """Test traffic factor calculation"""
        locations = [(41.0082, 28.9784), (39.9334, 32.8597)]
        
        # Test peak hours
        with patch('datetime.datetime') as mock_datetime:
            mock_datetime.utcnow.return_value = datetime(2024, 1, 1, 8, 0)  # 8 AM
            traffic_factor = route_optimizer._calculate_traffic_factor(locations)
            assert traffic_factor == 1.5
        
        # Test off-peak hours
        with patch('datetime.datetime') as mock_datetime:
            mock_datetime.utcnow.return_value = datetime(2024, 1, 1, 14, 0)  # 2 PM
            traffic_factor = route_optimizer._calculate_traffic_factor(locations)
            assert traffic_factor == 1.0
        
        # Test night hours
        with patch('datetime.datetime') as mock_datetime:
            mock_datetime.utcnow.return_value = datetime(2024, 1, 1, 23, 0)  # 11 PM
            traffic_factor = route_optimizer._calculate_traffic_factor(locations)
            assert traffic_factor == 0.8
    
    @patch('src.infrastructure.ml.route_optimizer_service.pywrapcp')
    def test_optimize_route_success(self, mock_pywrapcp, route_optimizer, 
                                   sample_pickup_locations, sample_delivery_locations):
        """Test successful route optimization"""
        # Mock OR-Tools components
        mock_manager = Mock()
        mock_routing = Mock()
        mock_solution = Mock()
        
        mock_pywrapcp.RoutingIndexManager.return_value = mock_manager
        mock_pywrapcp.RoutingModel.return_value = mock_routing
        
        # Mock solution values
        mock_solution.Value.return_value = 1
        mock_routing.SolveWithParameters.return_value = mock_solution
        mock_routing.IsEnd.return_value = False
        mock_routing.Start.return_value = 0
        mock_routing.GetArcCostForVehicle.return_value = 100000  # 100 km in meters
        
        # Mock manager methods
        mock_manager.IndexToNode.return_value = 0
        mock_manager.NodeToIndex.return_value = 0
        
        # Test optimization
        result = route_optimizer.optimize_route(
            pickup_locations=sample_pickup_locations,
            delivery_locations=sample_delivery_locations,
            vehicle_capacity=1000
        )
        
        assert isinstance(result, RouteSolutionDto)
        assert result.route_id.startswith("ROUTE_")
        assert result.total_distance > 0
        assert result.total_duration > 0
        assert result.fuel_consumption > 0
        assert result.traffic_factor > 0
    
    def test_optimize_route_no_solution(self, route_optimizer, 
                                       sample_pickup_locations, sample_delivery_locations):
        """Test route optimization when no solution is found"""
        with patch('src.infrastructure.ml.route_optimizer_service.pywrapcp') as mock_pywrapcp:
            mock_manager = Mock()
            mock_routing = Mock()
            
            mock_pywrapcp.RoutingIndexManager.return_value = mock_manager
            mock_pywrapcp.RoutingModel.return_value = mock_routing
            mock_routing.SolveWithParameters.return_value = None  # No solution
            
            with pytest.raises(Exception, match="No solution found"):
                route_optimizer.optimize_route(
                    pickup_locations=sample_pickup_locations,
                    delivery_locations=sample_delivery_locations,
                    vehicle_capacity=1000
                )
    
    def test_generate_route_map(self, route_optimizer):
        """Test route map generation"""
        route_solution = RouteSolutionDto(
            route_id="TEST_ROUTE_123",
            driver_id="driver-123",
            optimized_route=[
                Waypoint(lat=41.0082, lng=28.9784, type="pickup"),
                Waypoint(lat=39.9334, lng=32.8597, type="delivery")
            ],
            total_distance=450.5,
            total_duration=32400,
            estimated_eta=datetime.utcnow() + timedelta(hours=9),
            fuel_consumption=36.04,
            traffic_factor=1.2,
            waypoints=[
                Waypoint(lat=41.0082, lng=28.9784, type="pickup"),
                Waypoint(lat=39.9334, lng=32.8597, type="delivery")
            ]
        )
        
        with patch('folium.Map') as mock_map:
            mock_map_instance = Mock()
            mock_map.return_value = mock_map_instance
            
            map_filename = route_optimizer.generate_route_map(route_solution)
            
            assert map_filename.startswith("route_map_")
            assert map_filename.endswith(".html")
            assert "TEST_ROUTE_123" in map_filename
    
    def test_generate_route_map_empty_waypoints(self, route_optimizer):
        """Test route map generation with empty waypoints"""
        route_solution = RouteSolutionDto(
            route_id="TEST_ROUTE_123",
            driver_id="driver-123",
            optimized_route=[],
            total_distance=0,
            total_duration=0,
            estimated_eta=datetime.utcnow(),
            fuel_consumption=0,
            traffic_factor=1.0,
            waypoints=[]
        )
        
        map_filename = route_optimizer.generate_route_map(route_solution)
        assert map_filename == "" 