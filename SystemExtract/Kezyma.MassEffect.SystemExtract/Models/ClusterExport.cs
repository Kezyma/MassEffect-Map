namespace Kezyma.MassEffect.SystemExtract.Models
{
    public class ClusterExport
    {
        public ClusterExport() { }
        public ClusterExport(Dictionary<string, ClusterItem> items)
        {
            ME1 = items.ContainsKey("ME1");
            ME2 = items.ContainsKey("ME2");
            ME3 = items.ContainsKey("ME3");
            var priority = items.OrderByDescending(x => x.Key).Select(x => x.Value).ToList();
            Connections = new List<string>();
            foreach (var p in priority)
            {
                if (string.IsNullOrWhiteSpace(Id)) Id = p.Name.ToLower().Replace(" ", "-").Replace("'", "");
                if (string.IsNullOrWhiteSpace(Name)) Name = p.Name;
                if (X == new int()) X = (int)p.X;
                if (Y == new int()) Y = (int)p.Y;
                if (string.IsNullOrWhiteSpace(Image)) Image = !string.IsNullOrWhiteSpace(p.Texture) ? $"cluster\\{p.Texture}.jpg" : null;
                if (string.IsNullOrWhiteSpace(Marker)) Marker = !string.IsNullOrWhiteSpace(p.Texture) ? $"cluster_marker\\{p.Texture}.png" : null;
            }
            Connections = items.Where(x => x.Key != "ME1").SelectMany(x => x.Value.Connections.Select(x => x.Replace("Vallhallan", "Valhallan").Replace("Horse Head", "Horsehead").ToLower().Replace(" ", "-").Replace("'", ""))).Distinct().ToList();
            var systemIds = priority.SelectMany(x => x.Systems.Select(s => s.Name)).Distinct().ToList();
            var systemItems = systemIds.Select(x =>
            {
                var l = new Dictionary<string, SystemItem>();

                if (ME3 && items["ME3"].Systems.Any(j => j.Name == x)) l.Add("ME3", items["ME3"].Systems.First(j => j.Name == x));
                if (ME2 && items["ME2"].Systems.Any(j => j.Name == x)) l.Add("ME2", items["ME2"].Systems.First(j => j.Name == x));
                if (ME1 && items["ME1"].Systems.Any(j => j.Name == x)) l.Add("ME1", items["ME1"].Systems.First(j => j.Name == x));
                return l;
            });
            Systems = systemItems.Select(x => new SystemExport(x)).ToList();
            Region = "unknown";
        }
        public ClusterExport(ClusterItem item)
        {
            Id = item.Name.ToLower().Replace(" ", "-").Replace("'", "");
            Name = item.Name;
            X = (int)item.X;
            Y = (int)item.Y;
            Image = !string.IsNullOrWhiteSpace(item.Texture) ? $"cluster\\{item.Texture}.jpg" : null;
            Marker = !string.IsNullOrWhiteSpace(item.Texture) ? $"cluster_marker\\{item.Texture}.png" : null;
            Systems = item.Systems.Select(x => new SystemExport(x)).ToList();
            Connections = item.Connections.Select(x => x.ToLower().Replace(" ", "-").Replace("'", "")).ToList();
        }
        public string Id { get; set; }
        public string Name { get; set; }
        public string Region { get; set; }
        public string Galaxy { get; set; }
        public int X { get; set; }
        public int Y { get; set; }
        public string Marker { get; set; }
        public string Image { get; set; }
        public List<SystemExport> Systems { get; set; }
        public List<string> Connections { get; set; }
        public bool ME1 { get; set; }
        public bool ME2 { get; set; }
        public bool ME3 { get; set; }
    }
}