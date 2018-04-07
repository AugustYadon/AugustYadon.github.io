using System.Collections;
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// By making a main node network you will be able to find your way to any target in the world
/// having sub node networks operated by separate zones allows you to reprocess otherwise static preloaded paths
/// This allows you to account for random objects that may fall, blocking a previously clear path
/// this also can be used to recreate new sections of paths that may have moved. This is great for
/// large areas that have clusters of "obstacles" or mazes to travel through. Many enemies will move through 
/// a maze at a very low cost to the game's efficiency. This would be great to use for swarms, many enemies finding similar paths.
/// </summary>
public class NodeNetwork : MonoBehaviour {

    int nearest_start_node_index;
    int nearest_end_node_index;

    public LayerMask layermask_all;
    public LayerMask layermask_terrain;
    public Transform player_marker;
    LayerMask waypoint_zones;

    Ray to_player;
    public GameObject[] obstacle_zones; //these are colliders that identify a set of nodes that are used to navigate around obstacles
    public Transform[] sub_networks_locations;
    public Transform[] node_network; //these are the node sets that correspond with the obstacle zones... the indexes should correspond
    int NLength;

    int player_prev_node;

    struct DijkNode
    {
        public List<int> nodes;
        public Transform trans;
        public bool finalized;
        public float min_dist;
        public List<Transform> min_path;

        public override string ToString()
        {
            string fullnode = "nodes:[";
            if (nodes.Count != 0)
            {
                for (int i = 0; i < nodes.Count; i++)
                {
                    if (i < nodes.Count - 1) { fullnode = fullnode + nodes[i] + ", "; }
                    else { fullnode = fullnode + nodes[i] + "]\n"; }
                }
            }
            else { fullnode = fullnode + "]\n"; }
            fullnode = fullnode + "trans: " + trans.name + "\n";
            fullnode = fullnode + "finalized: " + finalized + "\n";
            fullnode = fullnode + "min_dist: " + min_dist + "\n";
            fullnode = fullnode + "min_path:[";
            if ((min_path.Count != 0))
            {
                for (int i = 0; i < min_path.Count; i++)
                {
                    if (i < min_path.Count - 1) { fullnode = fullnode + min_path[i] + ", "; }
                    else { fullnode = fullnode + min_path[i] + "]"; }
                }
            }
            else { fullnode = fullnode + "]\n"; }

            return fullnode;
        }
    }

    DijkNode[,] network;


    void Start () {
        NLength = node_network.Length;
        waypoint_zones = LayerMask.NameToLayer("WaypointZone");
        SetNodesOnSurface();
        FillPaths();
    }

    void SetNodesOnSurface()
    {
        RaycastHit hit_var;
        for(int i = 0; i < node_network.Length; i++)
        {
            Ray node_set = new Ray(node_network[i].transform.position,Vector3.down * 10);
            if (Physics.Raycast(node_set,out hit_var, 100, layermask_terrain))
            {
                node_network[i].position = hit_var.point + (0.7f * Vector3.up);
            }
        }
    }

    void FillPaths()
    {
        //instantiate square matrix, contains x^2 total nodes, where x is the number of nodes to start with
        network = new DijkNode[NLength, NLength];
        
        //initialize DijkNodes
        for (int i = 0; i < NLength; i++)                       
        {
            for (int j = 0; j < NLength; j++)                   
            {
                network[i, j].trans = node_network[j];
                network[i, j].min_path = new List<Transform>();
                network[i, j].nodes = new List<int>();

                //in each row, we have one starting node. Hence the min_dist should be 0. 
                if (i == j)                                              
                {
                    network[i, j].min_dist = 0;
                    network[i, j].min_path.Add(network[i, j].trans);
                }
                else { network[i, j].min_dist = float.MaxValue; }
            }
        }


        //find connections between intialized nodes
        for (int i = 0; i < NLength; i++)
        {
            for (int j = i + 1; j < NLength; j++)
            {

                if (!BeamCast(node_network[i], node_network[j], 2f))
                { 
                    for (int k = 0; k < NLength; k++)
                    {
                        network[k, i].nodes.Add(j);
                        network[k, j].nodes.Add(i);
                    }
                    GLDebug.DrawLine(node_network[j].position, node_network[i].position, Color.blue, 1000f, false);
                }
            }
        }

        //Dijkstra inspired algoritm 
        for (int k = 0; k < NLength; k++) 
        {
            //loop NLength times on each row
            for (int c = 0; c < NLength; c++) 
            {
                //initialize values
                int closest_index = -1;
                float closest_dist = float.MaxValue; 
                //Find the current closest node to k-node that has not been processed 
                //(this is why we set k,k min_dist of 0 and all others in the row with MaxValue earlier)
                for (int i = 0; i < NLength; i++)
                {
                    if (!network[k, i].finalized && network[k, i].min_dist < closest_dist)
                    {
                        closest_dist = network[k, i].min_dist;
                        closest_index = i;
                    }

                }
                if (closest_index == -1) { Debug.LogError("Problem with finding path for " + this.gameObject.name); break; } //If this comes up, something is setup wrong...

                for (int a = 0; a < network[k, closest_index].nodes.Count; a++) //iterate through the nodes that have a direct connection
                {
                    //This code can get extremely complex if you don't place values into variables to break up and contain the logic
                    int connected_node_index = network[k, closest_index].nodes[a]; 
                    Vector3 point_A = network[k, closest_index].trans.position;
                    Vector3 point_B = network[k, connected_node_index].trans.position;

                    float new_min = network[k, closest_index].min_dist + Vector3.Distance(point_A, point_B);
                    //make sure to set all info on all connected nodes so the closest one can be processed next
                    if (!network[k, connected_node_index].finalized && network[k, connected_node_index].min_dist > new_min) 
                    {
                        network[k, connected_node_index].min_dist = new_min;
                        network[k, connected_node_index].min_path = new List<Transform>(network[k, closest_index].min_path);
                        network[k, connected_node_index].min_path.Add(network[k, connected_node_index].trans);
                    }
                }

                network[k, closest_index].finalized = true; //mark that it has been processed
            }
        }
    }

    public Transform[] FindPath(Transform Target, Transform Agent)
    {
        //take target as where the agent wants to go (end node), and the agent is the starting position (start node)
        float closest_start_node_dist = float.MaxValue;
        int start_node_index = -1;
        float closest_end_node_dist = float.MaxValue;
        int end_node_index = -1;

        bool player_in_sight_of_node = false;


        //First find the closest node to the target transform whether it is visible or not.
        //priority always given to nodes that have line of sight to the target.
        for (int m = 0; m < NLength; m++)
        { 
            
            float distance_between = (Target.position - node_network[m].position).sqrMagnitude;
            if (!BeamCast(Target, node_network[m],2f))
            {
                if (!player_in_sight_of_node || closest_end_node_dist > distance_between)
                {
                    player_in_sight_of_node = true;
                    closest_end_node_dist = distance_between;
                    end_node_index = m;
                }

            }
            else if(!player_in_sight_of_node) //if player has glitched through wall, just find the closest node to them
            {
                if (closest_end_node_dist > distance_between)
                {
                    closest_end_node_dist = distance_between;
                    end_node_index = m;
                }
            }

        }

        if(end_node_index == -1) { return new Transform[] {Agent}; }

        for (int n = 0; n < NLength; n++)
        {
            if (!BeamCast(Agent, node_network[n], 2f))
            {
                Debug.Log("n: "+n);
                if (closest_start_node_dist > network[n,end_node_index].min_dist)
                {
                    closest_start_node_dist = network[n, end_node_index].min_dist;
                    start_node_index = n;
                }
            }
        }

        if(start_node_index == -1) { return new Transform[] {Agent}; }

        return network[start_node_index, end_node_index].min_path.ToArray();
    }



    public bool BeamCast(Transform target, Transform origin, float width)
    {
        width = width / 2;
        RaycastHit rch;
        Ray close_ray;

        Vector3 ray_direction = target.position - origin.position;

        close_ray = new Ray(origin.position + Vector3.Cross(ray_direction, Vector3.up).normalized * width, ray_direction);
        if (!Physics.Raycast(close_ray, out rch, Vector3.Distance(origin.position, target.position), layermask_all, QueryTriggerInteraction.Ignore))
        {
            close_ray = new Ray(origin.position + Vector3.Cross(ray_direction, Vector3.down).normalized * width, ray_direction);
            if (!Physics.Raycast(close_ray, out rch, Vector3.Distance(origin.position, target.position), layermask_all, QueryTriggerInteraction.Ignore))
            {
                //GLDebug.DrawLine(Agent.position, Agent.position + ray_direction, Color.magenta, 3f, false);
                //GLDebug.DrawLine(Agent.position + Vector3.Cross(ray_direction, Vector3.up).normalized, Agent.position + ray_direction + Vector3.Cross(ray_direction, Vector3.up).normalized, Color.magenta, 3f, false);
                //GLDebug.DrawLine(Agent.position + Vector3.Cross(ray_direction, Vector3.down).normalized, Agent.position + ray_direction + Vector3.Cross(ray_direction, Vector3.down).normalized, Color.magenta, 3f, false);
                return false; //beam not obstructed
            }
        }

        return true; //beam obstructed
    }


}
