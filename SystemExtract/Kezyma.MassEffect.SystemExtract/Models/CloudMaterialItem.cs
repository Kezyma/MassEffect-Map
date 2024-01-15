namespace Kezyma.MassEffect.SystemExtract.Models
{
    public class CloudMaterialItem
    {
        public string Name { get; set; }

        public string Ambient_Min { get; set; }
        public string Atmosphere_Colour { get; set; }
        public string Specular_Color { get; set; }

        public float? Opacity_Offset { get; set; }
        public float? Atmosphere_Tile { get; set; }
        public float? Spec_Power { get; set; }
        public float? PanSpeed_Mult { get; set; }
        public float? CloudOpac { get; set; }

        public string Atmosphere_Normal { get; set; }
    }
}