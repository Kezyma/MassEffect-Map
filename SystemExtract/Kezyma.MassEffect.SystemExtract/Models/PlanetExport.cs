using System.Globalization;

namespace Kezyma.MassEffect.SystemExtract.Models
{
    public class PlanetExport
    {
        public PlanetExport() { }
        public PlanetExport(Dictionary<string, PlanetItem> items)
        {
            ME1 = items.ContainsKey("ME1");
            ME2 = items.ContainsKey("ME2");
            ME3 = items.ContainsKey("ME3");
            var priority = items.OrderByDescending(x => x.Key).Select(x => x.Value).ToList();
            foreach (var p in priority)
            {
                if (string.IsNullOrWhiteSpace(Id)) Id = p.Name?.ToLower().Replace(" ", "-").Replace("'", "") ?? null;
                if (string.IsNullOrWhiteSpace(Name)) Name = p.Name;
                if (string.IsNullOrWhiteSpace(Description)) Description = p.Description?.Replace("\n", "<br/>") ?? null;
                if (!Scale.HasValue && p.Scale.HasValue) Scale = p.Scale.Value;
                if (X == new int() && p.X.HasValue) X = (int)p.X;
                if (Y == new int() && p.Y.HasValue) Y = (int)p.Y;
                if (string.IsNullOrWhiteSpace(Image))
                {
                    switch (p.Type)
                    {
                        default:
                        case "BioPlanet":
                            if (!string.IsNullOrWhiteSpace(p.PlanetMaterial))
                            {
                                Image = $"planet\\{p.PlanetMaterial}.png";
                                Marker = $"planet_marker\\{p.PlanetMaterial}.png";
                            }
                            else if (!string.IsNullOrWhiteSpace(p.TextureImage))
                            {
                                Image = $"object\\{p.TextureImage}.png";
                                Marker = $"object_marker\\{p.TextureImage}.png";
                            }
                            if (string.IsNullOrWhiteSpace(Type))
                            {
                                if (p.Name == "Asteroid Belt" || p.OrbitRing == "OR_ASTEROID") Type = "Asteroid Belt";
                                if (!string.IsNullOrWhiteSpace(p.PlanetType))
                                {
                                    var tInfo = new CultureInfo("en-GB").TextInfo;
                                    Type = tInfo.ToTitleCase(p.PlanetType.Replace("_", " ").ToLower());
                                }
                                if (!string.IsNullOrWhiteSpace(p.Name) && string.IsNullOrWhiteSpace(Type)) Type = "Station";
                                if (!string.IsNullOrWhiteSpace(p.Name) && p.Name.Contains("Fuel Depot")) Type = "Fuel Depot";
                                if (p.Name == "Omega 4 relay") Type = "Mass Relay";
                            }
                            break;
                        case "SFXGalaxyMapMassRelay":
                            Id = "mass-relay";
                            Name = "Mass Relay";
                            Type = "Mass Relay";
                            Image = "object\\MassRelay.png";
                            Marker = "object_marker\\MassRelay.png";
                            break;
                        case "SFXGalaxyMapReaper":
                            Type = "Reaper";
                            break;
                        case "SFXGalaxyMapDestroyedFuelDepot":
                            Type = "Destroyed Fuel Depot";
                            break;
                    }
                }
                AsteroidBelt = AsteroidBelt || p.Name == "Asteroid Belt" || p.OrbitRing == "OR_ASTEROID";
            }
            if (!Scale.HasValue || Scale == 0) Scale = 1;
            if (Type == "Asteroid Belt") Scale = 0;
            if (Type == "Mass Relay" || Type == "Fuel Depot") Scale = 2;
        }
        public PlanetExport(PlanetItem item)
        {
            Id = item.Name?.ToLower().Replace(" ", "-").Replace("'", "") ?? null;
            Name = item.Name;
            Description = item.Description?.Replace("\n", "<br/>") ?? null;
            Scale = item.Scale ?? 1;
            switch (item.Type)
            {
                case "BioPlanet":
                    if (string.IsNullOrWhiteSpace(Image) && !string.IsNullOrWhiteSpace(item.PlanetMaterial))
                    {

                    }
                    if (!string.IsNullOrWhiteSpace(item.PlanetMaterial))
                    {
                        Image = $"planet\\{item.PlanetMaterial}.png";
                        Marker = $"planet_marker\\{item.PlanetMaterial}.png";
                    }
                    else if (!string.IsNullOrWhiteSpace(item.TextureImage))
                    {
                        Image = $"object\\{item.TextureImage}.png";
                        Marker = $"object_marker\\{item.TextureImage}.png";
                    }
                    if (!string.IsNullOrWhiteSpace(item.PlanetType))
                    {
                        var tInfo = new CultureInfo("en-GB").TextInfo;
                        Type = tInfo.ToTitleCase(item.PlanetType.Replace("_", " ").ToLower());
                    }
                    if (!string.IsNullOrWhiteSpace(item.Name) && string.IsNullOrWhiteSpace(Type)) Type = "Station";
                    if (item.Name == "Fuel Depot") Type = "Fuel Depot";
                    if (item.Name == "Omega 4 relay") Type = "Mass Relay";
                    break;
                case "SFXGalaxyMapMassRelay":
                    Id = "mass-relay";
                    Name = "Mass Relay";
                    Type = "Mass Relay";
                    Image = "object\\MassRelay.png";
                    Marker = "object_marker\\MassRelay.png";
                    break;
                case "SFXGalaxyMapReaper":
                    Type = "Reaper";
                    break;
                case "SFXGalaxyMapDestroyedFuelDepot":
                    Type = "Destroyed Fuel Depot";
                    break;
                default:
                    if (item.Name == "Asteroid Belt")
                    {

                    }
                    break;
            }

            if (item.OrbitRing == "OR_ASTEROID") AsteroidBelt = true;
            if (item.Name == "Asteroid Belt") AsteroidBelt = true;

            X = (int)item.X;
            Y = (int)item.Y;
        }


        public string Id { get; set; }
        public string Name { get; set; }
        public float? Scale { get; set; }
        public string Type { get; set; }
        public string Orbits { get; set; }
        public string Description { get; set; }
        public Dictionary<string, string> Stats { get; set; }
        public int X { get; set; }
        public int Y { get; set; }
        public string Marker { get; set; }
        public string Image { get; set; }
        public bool AsteroidBelt { get; set; }
        public bool ME1 { get; set; }
        public bool ME2 { get; set; }
        public bool ME3 { get; set; }
    }
}