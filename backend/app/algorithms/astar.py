import math
import heapq
from typing import Dict, List, Tuple, Optional, Any

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points on Earth in kilometers.
    Used as both edge cost and the admissible heuristic h(n) in A* search.
    """
    R = 6371.0088  # Earth radius in kilometers

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    return R * c

class GraphNode:
    def __init__(self, node_id: str, lat: float, lng: float, name: str = ""):
        self.id = node_id
        self.lat = lat
        self.lng = lng
        self.name = name

    def __repr__(self):
        return f"Node({self.id}, {self.lat:.4f}, {self.lng:.4f})"

class RoadNetworkGraph:
    """
    Road and walking network graph representation where:
    - Nodes represent road intersections or landmark entrance points.
    - Edges represent navigable road/path segments with geographical distance as weight.
    """
    def __init__(self):
        self.nodes: Dict[str, GraphNode] = {}
        self.adjacency: Dict[str, List[Tuple[str, float]]] = {}  # node_id -> [(neighbor_id, distance_km)]

    def add_node(self, node_id: str, lat: float, lng: float, name: str = "") -> None:
        self.nodes[node_id] = GraphNode(node_id, lat, lng, name)
        if node_id not in self.adjacency:
            self.adjacency[node_id] = []

    def add_edge(self, u: str, v: str, bidirectional: bool = True) -> None:
        if u not in self.nodes or v not in self.nodes:
            return
        node_u = self.nodes[u]
        node_v = self.nodes[v]
        dist = haversine_distance(node_u.lat, node_u.lng, node_v.lat, node_v.lng)
        
        self.adjacency[u].append((v, dist))
        if bidirectional:
            self.adjacency[v].append((u, dist))

    def find_nearest_node(self, lat: float, lng: float) -> Tuple[str, float]:
        """Find the closest graph node to arbitrary coordinate (snap to road graph)."""
        best_node = None
        min_dist = float("inf")
        for node_id, node in self.nodes.items():
            dist = haversine_distance(lat, lng, node.lat, node.lng)
            if dist < min_dist:
                min_dist = dist
                best_node = node_id
        return best_node, min_dist

def astar_search(
    graph: RoadNetworkGraph, 
    start_node_id: str, 
    goal_node_id: str
) -> Tuple[List[str], float]:
    """
    Standard A* algorithm implementation:
    - f(n) = g(n) + h(n)
    - g(n): exact accumulated distance from start node
    - h(n): Haversine distance heuristic from node n to goal (admissible & consistent)
    Returns:
    - path: list of node IDs from start to goal
    - total_cost: total path length in km
    """
    if start_node_id not in graph.nodes or goal_node_id not in graph.nodes:
        return [], 0.0

    goal_node = graph.nodes[goal_node_id]

    # Priority queue stores tuples: (f_score, counter, current_node_id)
    counter = 0
    open_set: List[Tuple[float, int, str]] = []
    
    start_h = haversine_distance(
        graph.nodes[start_node_id].lat, graph.nodes[start_node_id].lng,
        goal_node.lat, goal_node.lng
    )
    heapq.heappush(open_set, (start_h, counter, start_node_id))

    came_from: Dict[str, str] = {}
    g_score: Dict[str, float] = {node_id: float("inf") for node_id in graph.nodes}
    g_score[start_node_id] = 0.0

    f_score: Dict[str, float] = {node_id: float("inf") for node_id in graph.nodes}
    f_score[start_node_id] = start_h

    open_set_hash = {start_node_id}

    while open_set:
        current_f, _, current = heapq.heappop(open_set)
        open_set_hash.discard(current)

        if current == goal_node_id:
            # Reconstruct path
            path = [current]
            while current in came_from:
                current = came_from[current]
                path.append(current)
            path.reverse()
            return path, g_score[goal_node_id]

        curr_node = graph.nodes[current]

        for neighbor, edge_weight in graph.adjacency.get(current, []):
            tentative_g = g_score[current] + edge_weight

            if tentative_g < g_score[neighbor]:
                came_from[neighbor] = current
                g_score[neighbor] = tentative_g
                
                neighbor_node = graph.nodes[neighbor]
                h = haversine_distance(neighbor_node.lat, neighbor_node.lng, goal_node.lat, goal_node.lng)
                f = tentative_g + h
                f_score[neighbor] = f

                if neighbor not in open_set_hash:
                    counter += 1
                    heapq.heappush(open_set, (f, counter, neighbor))
                    open_set_hash.add(neighbor)

    # No route found
    return [], 0.0


def build_maharashtra_network() -> RoadNetworkGraph:
    """
    Constructs a calibrated geographical road network graph for Maharashtra
    linking Pune, Mumbai, Satara, Kolhapur, Konkan, Nashik, Aurangabad, and key landmarks.
    Road intersections, junction nodes, and destination connection corridors.
    """
    g = RoadNetworkGraph()

    # Major Maharashtra City Hubs & Junctions
    junctions = [
        # Pune Hubs
        ("PUN_SHANIWAR", 18.5196, 73.8553, "Shaniwar Wada Junction"),
        ("PUN_SWARGATE", 18.5018, 73.8636, "Swargate Bus Terminal & Road Junction"),
        ("PUN_SHIVAJINAGAR", 18.5314, 73.8446, "Shivajinagar Interchange"),
        ("PUN_KALYANINAGAR", 18.5484, 73.9037, "Aga Khan Palace / Kalyani Nagar Rd"),
        ("PUN_KATRAJ", 18.4575, 73.8587, "Katraj Bypass Junction"),
        ("PUN_KHADAKWASLA", 18.4418, 73.7661, "Khadakwasla Dam Road"),
        ("PUN_SINHAGAD_BASE", 18.3663, 73.7558, "Sinhagad Foothills Junction"),
        ("PUN_SINHAGAD_TOP", 18.3663, 73.7558, "Sinhagad Fort Summit"),
        ("PUN_DAGDUSHETH", 18.5165, 73.8560, "Dagdusheth Ganpati Temple Chowk"),

        # Mumbai Hubs
        ("BOM_GATEWAY", 18.9220, 72.8347, "Gateway of India Plaza"),
        ("BOM_CSMT", 18.9401, 72.8355, "CSMT Railway Junction"),
        ("BOM_CHURCHGATE", 18.9352, 72.8272, "Churchgate Interchange"),
        ("BOM_MARINE_DRIVE", 18.9438, 72.8233, "Marine Drive Promenade"),
        ("BOM_DADAR", 19.0178, 72.8478, "Dadar Central Junction"),
        ("BOM_BANDRA", 19.0596, 72.8295, "Bandra Reclamation"),
        ("BOM_ELEPHANTA_FERRY", 18.9598, 72.9315, "Elephanta Island Jetty"),

        # Mumbai - Pune Expressway Corridor
        ("EXP_VASHI", 19.0771, 72.9986, "Vashi Bridge Toll Plaza"),
        ("EXP_PANVEL", 18.9894, 73.1175, "Panvel Expressway Junction"),
        ("EXP_KHALAPUR", 18.8242, 73.2872, "Khalapur Toll Gate"),
        ("EXP_LONAVALA", 18.7557, 73.4091, "Lonavala Khandala Pass"),
        ("EXP_SOMATNE", 18.7183, 73.6558, "Somatne Phata"),
        ("EXP_WAKAD", 18.5987, 73.7686, "Wakad Hinjawadi Interchange"),

        # Satara & Mahabaleshwar Network
        ("STR_SHIRWAL", 18.1364, 73.9856, "Shirwal NH48 Junction"),
        ("STR_SURUR", 17.9734, 74.0531, "Surur Phata (Mahabaleshwar Turn)"),
        ("STR_SATARA_CITY", 17.6805, 73.9997, "Satara City Center"),
        ("STR_THOSEGHAR", 17.5978, 73.8530, "Thoseghar Waterfalls Gate"),
        ("STR_WAI", 17.9482, 73.8931, "Wai Town Bypass"),
        ("STR_MAHABALESHWAR", 17.9237, 73.6586, "Mahabaleshwar Market Point"),
        ("STR_PRATAPGAD", 17.9351, 73.5786, "Pratapgad Fort Base"),

        # Kolhapur & Sangli Network
        ("KOP_KARAD", 17.2885, 74.1813, "Karad NH48 Junction"),
        ("KOP_KOLHAPUR_CITY", 16.7050, 74.2433, "Kolhapur CBS Junction"),
        ("KOP_MAHALAXMI", 16.6946, 74.2255, "Mahalaxmi Temple Chowk"),
        ("KOP_RANKALA", 16.6908, 74.2152, "Rankala Lake Promenade"),
        ("KOP_PANHALA", 16.8126, 74.1166, "Panhala Fort Entrance"),
        ("SGL_SANGLI_CITY", 16.8524, 74.5815, "Sangli City Junction"),

        # Konkan Coastal Highway Network
        ("KNK_ALIBAG", 18.6584, 72.8773, "Alibag Beach Access"),
        ("KNK_CHIPLUN", 17.5323, 73.5186, "Chiplun NH66 Junction"),
        ("KNK_RATNAGIRI", 16.9902, 73.3120, "Ratnagiri Town"),
        ("KNK_GANPATIPULE", 17.1472, 73.2676, "Ganpatipule Beach Temple"),
        ("KNK_MALVAN", 16.0601, 73.4687, "Malvan Jetty"),
        ("KNK_TARKARLI", 16.0356, 73.4912, "Tarkarli White Sand Beach"),

        # Nashik & North Maharashtra Network
        ("NSK_IGATPURI", 19.6976, 73.5599, "Igatpuri Kasara Ghat"),
        ("NSK_NASHIK_CITY", 19.9975, 73.7898, "Nashik CBS Interchange"),
        ("NSK_PANCHAVATI", 20.0094, 73.7995, "Panchavati Ramkund"),
        ("NSK_TRIMBAKESHWAR", 19.9385, 73.5350, "Trimbakeshwar Temple Entrance"),
        ("NSK_SULA", 20.0053, 73.6876, "Sula Vineyards Gate"),

        # Chhatrapati Sambhaji Nagar (Aurangabad) Network
        ("CSN_AURANGABAD", 19.8762, 75.3433, "Chhatrapati Sambhaji Nagar Center"),
        ("CSN_AJANTA", 20.5519, 75.7033, "Ajanta Caves Entrance"),
        ("CSN_ELLORA", 20.0268, 75.1780, "Ellora Caves Junction")
    ]

    for nid, lat, lng, name in junctions:
        g.add_node(nid, lat, lng, name)

    # Road & Highway Segments (Edges)
    edges = [
        # Pune internal routes
        ("PUN_SHANIWAR", "PUN_DAGDUSHETH"),
        ("PUN_DAGDUSHETH", "PUN_SWARGATE"),
        ("PUN_SHANIWAR", "PUN_SHIVAJINAGAR"),
        ("PUN_SHIVAJINAGAR", "PUN_KALYANINAGAR"),
        ("PUN_SHIVAJINAGAR", "EXP_WAKAD"),
        ("PUN_SWARGATE", "PUN_KATRAJ"),
        ("PUN_SWARGATE", "PUN_KHADAKWASLA"),
        ("PUN_KHADAKWASLA", "PUN_SINHAGAD_BASE"),
        ("PUN_SINHAGAD_BASE", "PUN_SINHAGAD_TOP"),
        ("PUN_KATRAJ", "STR_SHIRWAL"),

        # Mumbai internal routes
        ("BOM_GATEWAY", "BOM_CSMT"),
        ("BOM_CSMT", "BOM_CHURCHGATE"),
        ("BOM_CHURCHGATE", "BOM_MARINE_DRIVE"),
        ("BOM_CSMT", "BOM_DADAR"),
        ("BOM_DADAR", "BOM_BANDRA"),
        ("BOM_GATEWAY", "BOM_ELEPHANTA_FERRY"),

        # Mumbai-Pune Expressway Corridor
        ("BOM_DADAR", "EXP_VASHI"),
        ("EXP_VASHI", "EXP_PANVEL"),
        ("EXP_PANVEL", "EXP_KHALAPUR"),
        ("EXP_KHALAPUR", "EXP_LONAVALA"),
        ("EXP_LONAVALA", "EXP_SOMATNE"),
        ("EXP_SOMATNE", "EXP_WAKAD"),
        ("EXP_WAKAD", "PUN_SHIVAJINAGAR"),

        # Satara Corridor (NH48)
        ("PUN_KATRAJ", "STR_SHIRWAL"),
        ("STR_SHIRWAL", "STR_SURUR"),
        ("STR_SURUR", "STR_WAI"),
        ("STR_WAI", "STR_MAHABALESHWAR"),
        ("STR_MAHABALESHWAR", "STR_PRATAPGAD"),
        ("STR_SURUR", "STR_SATARA_CITY"),
        ("STR_SATARA_CITY", "STR_THOSEGHAR"),

        # Karad - Kolhapur - Sangli Corridor
        ("STR_SATARA_CITY", "KOP_KARAD"),
        ("KOP_KARAD", "KOP_KOLHAPUR_CITY"),
        ("KOP_KARAD", "SGL_SANGLI_CITY"),
        ("SGL_SANGLI_CITY", "KOP_KOLHAPUR_CITY"),
        ("KOP_KOLHAPUR_CITY", "KOP_MAHALAXMI"),
        ("KOP_MAHALAXMI", "KOP_RANKALA"),
        ("KOP_KOLHAPUR_CITY", "KOP_PANHALA"),

        # Konkan Connections
        ("EXP_PANVEL", "KNK_ALIBAG"),
        ("STR_PRATAPGAD", "KNK_CHIPLUN"),
        ("KNK_CHIPLUN", "KNK_RATNAGIRI"),
        ("KNK_RATNAGIRI", "KNK_GANPATIPULE"),
        ("KNK_RATNAGIRI", "KNK_MALVAN"),
        ("KNK_MALVAN", "KNK_TARKARLI"),
        ("KOP_KOLHAPUR_CITY", "KNK_RATNAGIRI"),
        ("KOP_KOLHAPUR_CITY", "KNK_MALVAN"),

        # Nashik Corridor
        ("EXP_PANVEL", "NSK_IGATPURI"),
        ("BOM_DADAR", "NSK_IGATPURI"),
        ("NSK_IGATPURI", "NSK_NASHIK_CITY"),
        ("NSK_NASHIK_CITY", "NSK_PANCHAVATI"),
        ("NSK_NASHIK_CITY", "NSK_TRIMBAKESHWAR"),
        ("NSK_NASHIK_CITY", "NSK_SULA"),
        ("PUN_SHIVAJINAGAR", "NSK_NASHIK_CITY"),

        # Aurangabad / Sambhaji Nagar Corridor
        ("PUN_SHIVAJINAGAR", "CSN_AURANGABAD"),
        ("NSK_NASHIK_CITY", "CSN_AURANGABAD"),
        ("CSN_AURANGABAD", "CSN_ELLORA"),
        ("CSN_AURANGABAD", "CSN_AJANTA")
    ]

    for u, v in edges:
        g.add_edge(u, v, bidirectional=True)

    return g

# Global initialized road graph instance
GLOBAL_ROAD_GRAPH = build_maharashtra_network()

def calculate_astar_route(
    start_lat: float, 
    start_lng: float, 
    end_lat: float, 
    end_lng: float
) -> Dict[str, Any]:
    """
    Computes an exact A* route on the road network:
    1. Snaps start coordinate to the nearest road network node.
    2. Snaps end coordinate to the nearest road network node.
    3. Runs A* graph search with Haversine distance heuristic.
    4. Interpolates full geometry from start point -> start node -> path nodes -> end node -> end point.
    5. Returns ordered coordinates, total distance, duration, and algorithm telemetry.
    """
    g = GLOBAL_ROAD_GRAPH

    # Snap to nearest road graph intersection nodes
    start_node_id, dist_to_start_node = g.find_nearest_node(start_lat, start_lng)
    end_node_id, dist_from_end_node = g.find_nearest_node(end_lat, end_lng)

    if not start_node_id or not end_node_id:
        raise ValueError("Could not snap coordinates to road graph.")

    # Run A* Search
    node_path, graph_dist = astar_search(g, start_node_id, end_node_id)

    # Build sequence of coordinates
    coordinates: List[List[float]] = []
    
    # Prepend exact start location
    coordinates.append([start_lat, start_lng])

    total_dist = dist_to_start_node + graph_dist + dist_from_end_node

    if node_path:
        for nid in node_path:
            node = g.nodes[nid]
            # Avoid duplicate adjacent coordinate if identical
            if coordinates and coordinates[-1] == [node.lat, node.lng]:
                continue
            coordinates.append([node.lat, node.lng])
    else:
        # If nodes are disjoint or direct segment, add destination node
        coordinates.append([g.nodes[start_node_id].lat, g.nodes[start_node_id].lng])
        coordinates.append([g.nodes[end_node_id].lat, g.nodes[end_node_id].lng])

    # Append exact destination location
    if coordinates[-1] != [end_lat, end_lng]:
        coordinates.append([end_lat, end_lng])

    # Estimate travel time based on typical road speed in Maharashtra (~50 km/h avg)
    duration_mins = max(5, int((total_dist / 45.0) * 60))

    return {
        "distance_km": round(total_dist, 2),
        "duration_minutes": duration_mins,
        "steps_count": len(coordinates),
        "coordinates": coordinates,
        "algorithm": "A* (A-Star) with Admissible Haversine Heuristic",
        "graph_source": f"Maharashtra Road Intersections Graph ({len(g.nodes)} Nodes, {sum(len(v) for v in g.adjacency.values()) // 2} Road Segments)"
    }

