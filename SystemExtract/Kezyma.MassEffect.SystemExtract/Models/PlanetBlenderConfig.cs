namespace Kezyma.MassEffect.SystemExtract.Models
{
    public class PlanetBlenderConfig
    {
        #region Info
        public string Id { get; set; }
        public List<string> Planets { get; set; }
        public string PlanetMaterial { get; set; }
        public string CloudMaterial { get; set; }
        #endregion

        #region Colours
        public string SSS_Color { get; set; }
        public string Halo_Color { get; set; }
        public string Diff_Tint { get; set; }
        public string Specular_Tint { get; set; }
        public string Atmosphere_Color { get; set; }
        public string Atmosphere_Color_Intensity { get; set; }
        public string Atmos_Ambient_Min { get; set; }
        public string Atmos_Specular_Color { get; set; }
        public string RingColour { get; set; }
        public string GlowColour { get; set; }
        public string OuterGlowColour { get; set; }
        #endregion

        #region Files
        public string Base_Normal { get; set; }
        public string Diff_Color_Gradient_Sheet { get; set; }
        public string Diffuse_Texture { get; set; }
        public string Dnorm_Texture { get; set; }
        public string Atmosphere_Diffuse { get; set; }
        public string Atmosphere_Normal { get; set; }
        #endregion

        #region Vals
        public float? Base_U_Color { get; set; }
        public float? Base_Normal_Intensity { get; set; }
        public float? Base_Normal_V_Tile { get; set; }
        public float? Base_Normal_U_Tile { get; set; }
        public float? Base_V_Offset { get; set; }
        public float? Base_U_Offset { get; set; }
        public float? Detail_Norm_Intensity { get; set; }
        public float? Detail_Norm_Tile_V { get; set; }
        public float? Detail_Norm_Tile_U { get; set; }
        public float? SSS_Width { get; set; }
        public float? Spec_Power { get; set; }
        public float? Spec { get; set; }
        public float? Spec_Desaturation { get; set; }
        public float? Diff_Desaturation { get; set; }
        public float? Base_Heightmap_White { get; set; }
        public float? Base_Heightmap_Black { get; set; }
        public float? Opacity_Offset { get; set; }
        public float? Tier2_Norm_Intensity { get; set; }
        public float? Brightness { get; set; }
        public float? Halo_Intensity { get; set; }
        public float? Distortion { get; set; }
        public float? Atmos_Opacity_Offset { get; set; }
        public float? Atmosphere_Tile { get; set; }
        public float? Atmos_Spec_Power { get; set; }
        public float? Atmos_PanSpeed_Mult { get; set; }
        public float? Atmos_CloudOpac { get; set; }
        public float? GlowIntensity { get; set; }
        #endregion
    }
}