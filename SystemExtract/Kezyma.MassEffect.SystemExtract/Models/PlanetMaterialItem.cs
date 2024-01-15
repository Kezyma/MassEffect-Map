namespace Kezyma.MassEffect.SystemExtract.Models
{
    public class PlanetMaterialItem
    {
        public string Name { get; set; }

        // Vector Parameter
        public string SSS_Color { get; set; }
        public string Halo_Color { get; set; }
        public string General_Diff_Tint { get; set; }
        public string Diff_tint { get; set; }
        public string Specular_Tint { get; set; }
        public string Atmosphere_Color_Intensity { get; set; }
        public string GlowColor { get; set; }
        public string OuterGlowColor { get; set; }

        // Scalar Parameter
        public float? Base_Norm_Intensity { get; set; }
        public float? Base_Norm_V_Tile { get; set; }
        public float? Base_Norm_U_Tile { get; set; }
        public float? Base_V_Offset { get; set; }
        public float? Base_U_Offset { get; set; }
        public float? Detail_Norm_Intensity { get; set; }
        public float? Detail_Norm_Tile_V { get; set; }
        public float? Detail_Norm_Tile_U { get; set; }
        public float? SSS_Width { get; set; }
        public float? Spec_Power { get; set; }
        public float? Spec { get; set; }
        public float? Spec_Desaturation { get; set; }
        public float? Base_U_Color { get; set; }
        public float? Diff_Desaturation { get; set; }
        public float? Base_Heightmap_White { get; set; }
        public float? Base_Heightmap_Black { get; set; }
        public float? Opacity_Offset { get; set; }
        public float? Tier2_Norm_Intensity { get; set; }
        public float? Normal_Strength { get; set; }
        public float? Dnorm_Strength { get; set; }
        public float? Brightness { get; set; }
        public float? Halo_Intensity { get; set; }
        public float? SpecPower { get; set; }
        public float? SpecDesat { get; set; }
        public float? DiffDesat { get; set; }
        public float? Distortion { get; set; }
        public float? GlowIntensity { get; set; }

        // Texture Parameter
        public string Base_Normal { get; set; }
        public string Diff_Color_Gradient_Sheet { get; set; }
        public string Diffuse_Texture { get; set; }
        public string Normal_Texture { get; set; }
        public string Dnorm_Texture { get; set; }
        public string Atmosphere_Diffuse { get; set; }
    }
}