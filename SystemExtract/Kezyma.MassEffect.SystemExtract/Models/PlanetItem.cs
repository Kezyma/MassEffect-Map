namespace Kezyma.MassEffect.SystemExtract.Models
{
    public class PlanetItem
    {
        public int Ix { get; set; }
        public string Name { get; set; }
        public string PlotLabel { get; set; }
        public string Description { get; set; }
        public string Type { get; set; }
        public int? X { get; set; }
        public int? Y { get; set; }
        public float? Scale { get; set; }
        public string RingColour { get; set; }
        public string PlanetMaterial { get; set; }
        public string CloudMaterial { get; set; }
        public string PreviewImage { get; set; }
        public string TextureImage { get; set; }
        public float? ResourceRichness { get; set; }
        public string PlanetType { get; set; }
        public string OrbitRing { get; set; }
    }
}