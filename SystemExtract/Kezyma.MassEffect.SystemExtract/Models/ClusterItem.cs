namespace Kezyma.MassEffect.SystemExtract.Models
{
    public class ClusterItem
    {
        public int Ix { get; set; }
        public string Name { get; set; }
        public int? X { get; set; }
        public int? Y { get; set; }
        public string StarColour { get; set; }
        public string StarColour2 { get; set; }
        public float? NebularDensity { get; set; }
        public float? CloudTile { get; set; }
        public float? SphereIntensity { get; set; }
        public float? SphereSize { get; set; }
        public string Texture { get; set; }
        public List<SystemItem> Systems { get; set; }
        public List<string> Connections { get; set; }
    }
}