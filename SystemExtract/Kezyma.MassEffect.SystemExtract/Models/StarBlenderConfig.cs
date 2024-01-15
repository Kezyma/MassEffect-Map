namespace Kezyma.MassEffect.SystemExtract.Models
{
    public class StarBlenderConfig
    {
        public string Id { get; set; }
        public List<string> Stars { get; set; }

        public string SunColour { get; set; }
        public string StarColour { get; set; }
        public string FlareTint { get; set; }
    }
}