namespace Kezyma.MassEffect.SystemExtract.Models
{
    public class SystemExport
    {
        public SystemExport() { }
        public SystemExport(Dictionary<string, SystemItem> items)
        {
            ME1 = items.ContainsKey("ME1");
            ME2 = items.ContainsKey("ME2");
            ME3 = items.ContainsKey("ME3");
            var priority = items.OrderByDescending(x => x.Key).Select(x => x.Value).ToList();
            foreach (var p in priority)
            {
                if (string.IsNullOrWhiteSpace(Id)) Id = p.Name.ToLower().Replace(" ", "-").Replace("'", "");
                if (string.IsNullOrWhiteSpace(Name)) Name = p.Name;
                if (X == new int()) X = (int)p.X;
                if (Y == new int()) Y = (int)p.Y;
                if (!Scale.HasValue && p.Scale.HasValue) Scale = p.Scale.Value;
            }
            if (!Scale.HasValue || Scale == 0) Scale = 1;
            var planetIds = priority.SelectMany(x => x.Planets.Where(x => x.Type != "SFXGalaxyMapReaper" && !string.IsNullOrWhiteSpace(x.Name)).Select(s => s.Name)).Distinct().ToList();
            Planets = new List<PlanetExport>
            {
                new PlanetExport
                {
                    Id = Name.ToLower().Replace(" ", "-").Replace("'", ""),
                    Name = Name,
                    X = 500,
                    Y = 500,
                    Type = "Star",
                    Scale = Scale ?? 1,
                    AsteroidBelt = false,
                    Image = $"star\\{Name.Replace(" ", "-").Replace("'", "")}.png",
                    Marker = $"star_marker\\{Name.Replace(" ", "-").Replace("'", "")}.png"
                }
            };
            var planetItems = planetIds.Select(x =>
            {
                var l = new Dictionary<string, PlanetItem>();
                if (ME3 && items["ME3"].Planets.Any(j => j.Name == x)) l.Add("ME3", items["ME3"].Planets.First(j => j.Name == x));
                if (ME2 && items["ME2"].Planets.Any(j => j.Name == x)) l.Add("ME2", items["ME2"].Planets.First(j => j.Name == x));
                if (ME1 && items["ME1"].Planets.Any(j => j.Name == x)) l.Add("ME1", items["ME1"].Planets.First(j => j.Name == x));
                return l;
            }).ToList();
            foreach (var k in items.Keys)
            {
                var unknownObjects = items[k].Planets.Where(x => x.Type != "SFXGalaxyMapReaper" && string.IsNullOrWhiteSpace(x.Name)).Select(x =>
                {
                    var l = new Dictionary<string, PlanetItem> { { k, x } };
                    return l;
                });
                planetItems.AddRange(unknownObjects);
            }
            Planets.AddRange(planetItems.Select(x => new PlanetExport(x)));
        }

        private static bool IsAsteroidBelt(PlanetItem item)
        {
            if (item.Name == "Asteroid Belt") return true;
            if (item.OrbitRing == "OR_ASTEROID") return true;
            return false;
        }

        public SystemExport(SystemItem item)
        {
            Id = item.Name.ToLower().Replace(" ", "-").Replace("'", "");
            Name = item.Name;
            X = (int)item.X;
            Y = (int)item.Y;
            Planets = new List<PlanetExport>
            {
                new PlanetExport
                {
                    Id = item.Name.ToLower().Replace(" ", "-").Replace("'", ""),
                    Name = item.Name,
                    X = 500,
                    Y = 500,
                    Type = "Star",
                    Scale = item.Scale ?? 1,
                    AsteroidBelt = false,
                    Image = $"star\\{item.Name.Replace(" ", "-").Replace("'", "")}.jpg",
                    Marker = $"star_marker\\{item.Name.Replace(" ", "-").Replace("'", "")}.jpg"
                }
            };
            Planets.AddRange(item.Planets
                .Where(x => x.Type != "SFXGalaxyMapReaper")
                .Select(x => new PlanetExport(x)).ToList());
        }
        public string Id { get; set; }
        public string Name { get; set; }
        public int X { get; set; }
        public int Y { get; set; }
        public float? Scale { get; set; }
        public List<PlanetExport> Planets { get; set; }
        public bool ME1 { get; set; }
        public bool ME2 { get; set; }
        public bool ME3 { get; set; }
    }
}