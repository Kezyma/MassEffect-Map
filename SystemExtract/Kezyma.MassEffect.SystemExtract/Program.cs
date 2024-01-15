using Kezyma.MassEffect.SystemExtract.Models;
using Newtonsoft.Json;
using System.Xml;
using static System.Net.Mime.MediaTypeNames;

namespace Kezyma.MassEffect.SystemExtract
{

    internal class Program
    {
        static void Main(string[] args)
        {
            var me2 = JsonConvert.DeserializeObject<List<ClusterItem>>(File.ReadAllText(Path.GetFullPath("Json\\ME2.json")));
            var me3 = JsonConvert.DeserializeObject<List<ClusterItem>>(File.ReadAllText(Path.GetFullPath("Json\\ME3.json")));
            var me2_mats = JsonConvert.DeserializeObject<List<PlanetMaterialItem>>(File.ReadAllText(Path.GetFullPath("Json\\ME2_MaterialExport.json")));
            var me3_mats = JsonConvert.DeserializeObject<List<PlanetMaterialItem>>(File.ReadAllText(Path.GetFullPath("Json\\ME3_MaterialExport.json")));
            var me2_atmo = JsonConvert.DeserializeObject<List<CloudMaterialItem>>(File.ReadAllText(Path.GetFullPath("Json\\ME2_CloudExport.json")));
            var me3_atmo = JsonConvert.DeserializeObject<List<CloudMaterialItem>>(File.ReadAllText(Path.GetFullPath("Json\\ME3_CloudExport.json")));

            var names = me3.Select(x => x.Name.Replace("Vallhallan", "Valhallan").Replace("Horse Head", "Horsehead"))
                .Concat(me2.Select(x => x.Name.Replace("Vallhallan", "Valhallan").Replace("Horse Head", "Horsehead")))
                .Distinct()
                .ToList();

            var starConfigs = new Dictionary<string, StarBlenderConfig>();
            var planetConfigs = new Dictionary<string, PlanetBlenderConfig>();

            foreach (var cName in names)
            {
                var c2 = me2.FirstOrDefault(x => x.Name.Replace("Vallhallan", "Valhallan").Replace("Horse Head", "Horsehead") == cName);
                var c3 = me3.FirstOrDefault(x => x.Name.Replace("Vallhallan", "Valhallan").Replace("Horse Head", "Horsehead") == cName);
                var sNames = new List<string>();
                if (c2 != null) sNames.AddRange(c2.Systems.Select(x => x.Name.Replace("Vallhallan", "Valhallan").Replace("Horse Head", "Horsehead")));
                if (c3 != null) sNames.AddRange(c3.Systems.Select(x => x.Name.Replace("Vallhallan", "Valhallan").Replace("Horse Head", "Horsehead")));
                sNames = sNames.Distinct().ToList();

                foreach (var sName in sNames)
                {
                    var s2 = c2?.Systems?.FirstOrDefault(x => x.Name.Replace("Vallhallan", "Valhallan").Replace("Horse Head", "Horsehead") == sName);
                    var s3 = c3?.Systems?.FirstOrDefault(x => x.Name.Replace("Vallhallan", "Valhallan").Replace("Horse Head", "Horsehead") == sName);
                    var starItem = new StarBlenderConfig
                    {
                        StarColour = s3?.StarColour ?? s2?.StarColour ?? string.Empty,
                        FlareTint = s3?.FlareTint ?? s2?.FlareTint ?? string.Empty,
                        SunColour = s3?.SunColour ?? s2?.SunColour ?? string.Empty,
                        Stars = new List<string> { s3?.Name ?? s2?.Name ?? string.Empty }
                    };
                    starItem.Id = $"{starItem.StarColour}_{starItem.FlareTint}_{starItem.SunColour}";
                    if (starConfigs.ContainsKey(starItem.Id)) starConfigs[starItem.Id].Stars.Add(s3?.Name ?? s2?.Name ?? string.Empty);
                    else starConfigs.Add(starItem.Id, starItem);

                    var pNames = new List<string>();
                    if (s2 != null) pNames.AddRange(s2.Planets.Where(x => !string.IsNullOrWhiteSpace(x.PlanetMaterial)).Select(x => x.Name));
                    if (s3 != null) pNames.AddRange(s3.Planets.Where(x => !string.IsNullOrWhiteSpace(x.PlanetMaterial)).Select(x => x.Name));
                    pNames = pNames.Distinct().ToList();

                    foreach (var pName in pNames)
                    {
                        var p2 = s2?.Planets?.FirstOrDefault(x => x.Name == pName);
                        var p3 = s3?.Planets?.FirstOrDefault(x => x.Name == pName);
                        PlanetMaterialItem planetItem = null;
                        CloudMaterialItem cloudItem = null;
                        var materialitem = new PlanetBlenderConfig { Planets = new List<string> { p3?.Name ?? p3?.Name ?? string.Empty } };
                        if (p3 != null && !string.IsNullOrWhiteSpace(p3.PlanetMaterial))
                        {
                            planetItem = me3_mats.FirstOrDefault(x => x.Name == p3.PlanetMaterial);
                            materialitem.PlanetMaterial = p3.PlanetMaterial;
                            if (!string.IsNullOrWhiteSpace(p3.CloudMaterial))
                            {
                                cloudItem = me3_atmo.First(x => x.Name == p3.CloudMaterial);
                                materialitem.CloudMaterial = p3.CloudMaterial;
                            }
                        }
                        else if (p2 != null && !string.IsNullOrWhiteSpace(p2.PlanetMaterial))
                        {
                            planetItem = me2_mats.FirstOrDefault(x => x.Name == p2.PlanetMaterial);
                            materialitem.PlanetMaterial = p2.PlanetMaterial;
                            if (!string.IsNullOrWhiteSpace(p2.CloudMaterial))
                            {
                                cloudItem = me2_atmo.First(x => x.Name == p2.CloudMaterial);
                                materialitem.CloudMaterial = p2.CloudMaterial;
                            }
                        }
                        materialitem.RingColour = p3 != null ? p3.RingColour : p2.RingColour;
                        materialitem.Id = materialitem.PlanetMaterial;
                        if (!string.IsNullOrWhiteSpace(materialitem.CloudMaterial)) materialitem.Id += $"-{materialitem.CloudMaterial}";
                        if (!string.IsNullOrWhiteSpace(materialitem.RingColour)) materialitem.Id += $"-Rings_{materialitem.RingColour}";

                        if (planetConfigs.ContainsKey(materialitem.Id)) planetConfigs[materialitem.Id].Planets.Add(p3?.Name ?? p3?.Name ?? string.Empty);
                        else
                        {
                            materialitem.Atmosphere_Color = cloudItem?.Atmosphere_Colour;
                            materialitem.Atmosphere_Color_Intensity = planetItem?.Atmosphere_Color_Intensity;
                            materialitem.Atmosphere_Diffuse = planetItem?.Atmosphere_Diffuse;
                            materialitem.Atmosphere_Normal = cloudItem?.Atmosphere_Normal;
                            materialitem.Atmosphere_Tile = cloudItem?.Atmosphere_Tile;
                            materialitem.Atmos_Ambient_Min = cloudItem?.Ambient_Min;
                            materialitem.Atmos_CloudOpac = cloudItem?.CloudOpac;
                            materialitem.Atmos_Opacity_Offset = cloudItem?.Opacity_Offset;
                            materialitem.Atmos_PanSpeed_Mult = cloudItem?.PanSpeed_Mult;
                            materialitem.Atmos_Specular_Color = cloudItem?.Specular_Color;
                            materialitem.Atmos_Spec_Power = cloudItem?.Spec_Power;
                            materialitem.Base_Heightmap_Black = planetItem?.Base_Heightmap_Black;
                            materialitem.Base_Heightmap_White = planetItem?.Base_Heightmap_White;
                            materialitem.Base_Normal = planetItem?.Base_Normal ?? planetItem?.Normal_Texture;
                            materialitem.Base_Normal_Intensity = planetItem?.Base_Norm_Intensity ?? planetItem?.Normal_Strength;
                            materialitem.Base_Normal_U_Tile = planetItem?.Base_Norm_U_Tile;
                            materialitem.Base_Normal_V_Tile = planetItem?.Base_Norm_V_Tile;
                            materialitem.Base_U_Color = planetItem?.Base_U_Color;
                            materialitem.Base_U_Offset = planetItem?.Base_U_Offset;
                            materialitem.Base_V_Offset = planetItem?.Base_V_Offset;
                            materialitem.Brightness = planetItem?.Brightness;
                            materialitem.Diffuse_Texture = planetItem?.Diffuse_Texture;
                            materialitem.Diff_Color_Gradient_Sheet = planetItem?.Diff_Color_Gradient_Sheet;
                            materialitem.Diff_Desaturation = planetItem?.Diff_Desaturation ?? planetItem?.DiffDesat;
                            materialitem.Diff_Tint = planetItem?.General_Diff_Tint ?? planetItem?.Diff_tint;
                            materialitem.Distortion = planetItem?.Distortion;
                            materialitem.Dnorm_Texture = planetItem?.Dnorm_Texture;
                            materialitem.Halo_Color = planetItem?.Halo_Color;
                            materialitem.Halo_Intensity = planetItem?.Halo_Intensity;
                            materialitem.Opacity_Offset = planetItem?.Opacity_Offset;
                            materialitem.Spec = planetItem?.Spec;
                            materialitem.Specular_Tint = planetItem?.Specular_Tint;
                            materialitem.Spec_Desaturation = planetItem?.Spec_Desaturation ?? planetItem?.SpecDesat;
                            materialitem.Spec_Power = planetItem?.Spec_Power ?? planetItem?.SpecPower;
                            materialitem.SSS_Color = planetItem?.SSS_Color;
                            materialitem.SSS_Width = planetItem?.SSS_Width;
                            materialitem.Tier2_Norm_Intensity = planetItem?.Tier2_Norm_Intensity;
                            materialitem.Detail_Norm_Intensity = planetItem?.Detail_Norm_Intensity ?? planetItem?.Dnorm_Strength;
                            materialitem.Detail_Norm_Tile_U = planetItem?.Detail_Norm_Tile_U;
                            materialitem.Detail_Norm_Tile_V = planetItem?.Detail_Norm_Tile_V;
                            materialitem.GlowColour = planetItem?.GlowColor;
                            materialitem.GlowIntensity = planetItem?.GlowIntensity;
                            materialitem.OuterGlowColour = planetItem?.OuterGlowColor;
                            planetConfigs.Add(materialitem.Id, materialitem);
                        }
                    }
                }
            }

            File.WriteAllText(Path.GetFullPath("D:\\StarBlenderConfigs.json"), JsonConvert.SerializeObject(starConfigs.OrderBy(x => x.Key).Select(x => x.Value).ToArray()));
            File.WriteAllText(Path.GetFullPath("D:\\PlanetBlenderConfigs.json"), JsonConvert.SerializeObject(planetConfigs.OrderBy(x => x.Key).Select(x => x.Value).ToArray()));

            //if (args.Contains("merger"))
            //{
            //    var me1 = File.ReadAllText(Path.GetFullPath("Json\\ME1.json"));
            //    var me2 = File.ReadAllText(Path.GetFullPath("Json\\ME2.json"));
            //    var me3 = File.ReadAllText(Path.GetFullPath("Json\\ME3.json"));

            //    var me1Json = JsonConvert.DeserializeObject<List<ClusterItem>>(me1);
            //    var me2Json = JsonConvert.DeserializeObject<List<ClusterItem>>(me2);
            //    var me3Json = JsonConvert.DeserializeObject<List<ClusterItem>>(me3);

            //    var clusterIds = me1Json.Select(x => x.Name.Replace("Vallhallan", "Valhallan").Replace("Horse Head", "Horsehead")).Concat(me2Json.Select(x => x.Name.Replace("Vallhallan", "Valhallan").Replace("Horse Head", "Horsehead"))).Concat(me3Json.Select(x => x.Name.Replace("Vallhallan", "Valhallan").Replace("Horse Head", "Horsehead"))).Distinct().ToList();
            //    var clusterList = clusterIds.Select(x =>
            //    {
            //        var l = new Dictionary<string, ClusterItem>();
            //        if (me3Json.Any(j => j.Name.Replace("Vallhallan", "Valhallan").Replace("Horse Head", "Horsehead") == x)) l.Add("ME3", me3Json.First(j => j.Name.Replace("Vallhallan", "Valhallan").Replace("Horse Head", "Horsehead") == x));
            //        if (me2Json.Any(j => j.Name.Replace("Vallhallan", "Valhallan").Replace("Horse Head", "Horsehead") == x)) l.Add("ME2", me2Json.First(j => j.Name.Replace("Vallhallan", "Valhallan").Replace("Horse Head", "Horsehead") == x));
            //        if (me1Json.Any(j => j.Name.Replace("Vallhallan", "Valhallan").Replace("Horse Head", "Horsehead") == x)) l.Add("ME1", me1Json.First(j => j.Name.Replace("Vallhallan", "Valhallan").Replace("Horse Head", "Horsehead") == x));
            //        return l;
            //    }).ToList();

            //    var clusterExport = clusterList.Select(x => new ClusterExport(x)).OrderBy(x => x.Name).ToList();
            //    var newJson = JsonConvert.SerializeObject(clusterExport);
            //    File.WriteAllText(Path.GetFullPath("WebInfo.json"), newJson);

            //    var clusterImages = string.Join("\n", clusterExport.Select(x => x.Image));
            //    File.WriteAllText(Path.GetFullPath("ClusterImages.txt"), clusterImages);

            //    var objectImages = string.Join("\n", clusterExport.SelectMany(x => x.Systems.SelectMany(s => s.Planets.Select(p => p.Image))));
            //    File.WriteAllText(Path.GetFullPath("PlanetImages.txt"), objectImages);


            //    foreach (var c in clusterExport) Console.WriteLine(c.Name);
            //    Console.WriteLine($"Count: {clusterExport.Count}");
            //}

        }
    }
}