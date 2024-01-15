namespace Kezyma.MassEffect.SystemExtract.Models
{
    public class SystemItem
    {
        public int Ix { get; set; }
        public string Name { get; set; }
        public int? X { get; set; }
        public int? Y { get; set; }
        public bool? ShowNebula { get; set; }
        public float? Scale { get; set; }
        public string SunColour { get; set; }
        public string StarColour { get; set; }
        public string FlareTint { get; set; }
        public List<PlanetItem> Planets { get; set; }
    }
}