class GalaxyMap {

    // Data
    Clusters = null;
    MissingImages = [];
    IconSizes = {};

    // Map Data
    GalaxyMap = null;
    GalaxyMarkers = [];
    GalaxyConnections = [];
    GalaxyRegionLayer = null;
    GalaxyColourLayer = null;
    GalaxyLabelLayer = null;

    ClusterMap = null;
    ClusterMarkers = [];
    CurrentCluster = null;

    SystemMap = null;
    SystemMarkers = [];
    SystemOrbits = [];
    CurrentSystem = null;

    CurrentType = null;
    ShowPopovers = false;

    // Global Settings
    MinZoom = 8;
    MaxZoom = 14;
    MinIconSize = 32;
    MaxIconSize = 128;
    IconZoomMulti = 1.9;
    GalaxyJson = "./js/galaxy.json";
    ImageSwitchFunc = "$(this).attr('src', $(this).attr('default-src'));";

    // Galaxy Map Settings
    GalaxyMapBounds = [[-1,-1],[1,1]];
    GalaxyImg = "img/galaxy.jpg";
    GalaxyRegionImg = "img/galaxy-regions.png";
    GalaxyColourImg = "img/galaxy-colours.png";
    GalaxyLabelsImg = "img/galaxy-labels.png";
    ShowGalaxyRegions = false;
    ShowGalaxyColours = false;
    ShowGalaxyLabels = false;
    ShowGalaxyMarkers = false;
    ShowGalaxyConnections = false;
    RelayConnectionColour = "#FFF";

    // Cluster Map Settings
    ClusterMapBounds = [[-1,-1],[1,1]];
    ShowClusterMarkers = false;
    SystemChangedCluster = false;

    // System Map Settings
    SystemMapBounds = [[-2,-2],[2,2]];
    SystemMapInitialBounds = [[-1,-1], [1,1]];
    PlanetOrbitColour = "#666";
    ShowSystemMarkers = false;
    ShowSystemOrbits = false;

    constructor(galaxyMapId, clusterMapId, systemMapId) {
        var thisObj = this;
        this.GalaxyMapId = galaxyMapId;
        this.ClusterMapId = clusterMapId;
        this.SystemMapId = systemMapId;

        // Generate icon sizes for the maps.
        var x = 1;
        for (var i = this.MinZoom; i < this.MaxZoom; i++) {
            var w = i * x;
            if (w < this.MinIconSize) {
                w = this.MinIconSize;
            }
            if (w > this.MaxIconSize) {
                w = this.MaxIconSize;
            }
            this.IconSizes[i] = [w,w];
            x = x*this.IconZoomMulti;
        }

        // Initialise appropriate map.
        $.getJSON(this.GalaxyJson, function (data) {
            thisObj.Clusters = data;
            var params = new URL(window.location.href).searchParams;
            if (params.has("cluster")) {
                if (params.has("system")) {
                    thisObj.initialiseSystemMap(params.get("system"), params.get("cluster"));
                }
                else {
                    thisObj.initialiseClusterMap(params.get("cluster"));
                }
            }
            else {
                thisObj.initialiseGalaxyMap();
            }

            thisObj.initialiseSearchFunction();
            thisObj.initialiseBrowseFunction();
        });

        $("#object-close-btn").click(function () {
            $("#object-pane").hide();
        });
    }

    initialiseGalaxyMap = () => {
        // Show the map.
        $("#" + this.GalaxyMapId).show();
        $("#" + this.ClusterMapId).hide();
        $("#" + this.SystemMapId).hide();

        if (!this.GalaxyMap) {
            var thisObj = this;

            // Create a new map.
            this.GalaxyMap = L.map(this.GalaxyMapId, { minZoom: this.MinZoom, maxZoom: this.MaxZoom, crd: L.CRS.Simple, maxBounds: this.GalaxyMapBounds });

            // Add main images and overlays.
            var galaxyImg = L.imageOverlay(this.GalaxyImg, this.GalaxyMapBounds);
            this.GalaxyRegionLayer = L.imageOverlay(this.GalaxyRegionImg, this.GalaxyMapBounds);
            this.GalaxyColourLayer = L.imageOverlay(this.GalaxyColourImg, this.GalaxyMapBounds);
            this.GalaxyLabelLayer = L.imageOverlay(this.GalaxyLabelsImg, this.GalaxyMapBounds);

            galaxyImg.addTo(this.GalaxyMap);
            this.GalaxyRegionLayer.addTo(this.GalaxyMap);
            this.GalaxyColourLayer.addTo(this.GalaxyMap);
            this.GalaxyLabelLayer.addTo(this.GalaxyMap);

            // Configure default visibility.
            this.GalaxyMap.fitBounds(this.GalaxyMapBounds);
            this.ShowGalaxyRegions = true;
            this.ShowGalaxyColours = true;
            this.ShowGalaxyLabels = true;

            for (var i in this.Clusters) {
                // Add markers for individual clusters.
                var cluster = this.Clusters[i];
                var marker = L.marker([this.CY(cluster.Y),this.CX(cluster.X)], {
                    icon: L.icon({
                        iconUrl: this.objectImagePath("cluster", cluster, true),
                        iconSize: this.IconSizes[this.GalaxyMap.getZoom()], 
                        className: "galaxy-marker"
                    }),
                    title: cluster.Name,
                    clusterId: cluster.Id,
                    riseOnHover: true
                });
                
                marker.on("click", function () {
                    thisObj.initialiseClusterMap(this.options.clusterId);
                });
                this.GalaxyMarkers.push(marker);
                marker.addTo(this.GalaxyMap);

                // Draw mass relay connections.
                if (cluster.Connections.length > 0) {
                    for (var j in cluster.Connections) {
                        var connId = cluster.Connections[j];
                        var conn = this.Clusters.filter(x => x.Id == connId)[0];
                        if (conn) {
                            var coords = [
                                [ this.CY(cluster.Y), this.CX(cluster.X) ],
                                [ this.CY(conn.Y), this.CX(conn.X) ]
                            ];
                            var line = L.polyline(coords, { color: this.RelayConnectionColour, noClip: true, weight: 1 });
                            this.GalaxyConnections.push(line);
                            line.addTo(this.GalaxyMap);
                        }
                    }
                }
            }
            this.ShowGalaxyConnections = true;
            this.ShowGalaxyMarkers = true;

            // Add custom map controls.
            var controls = new this.galaxyToggleControls();
            controls.addTo(this.GalaxyMap);

            // Enable marker popovers.
            $("#" + this.GalaxyMapId + " .leaflet-marker-icon").popover({
                trigger: "hover"
            });

            // Force popovers to stay open if they have been enabled.
            $("#" + this.GalaxyMapId + " .leaflet-marker-icon").on("hidden.bs.popover", function () {
                if (thisObj.ShowPopovers) {
                   $(this).popover("show");
                }
            });

            // Reposition popovers when the map moves.
            var gmId = this.GalaxyMapId;
            this.GalaxyMap.on("moveend", function () {
                $("#" + gmId + " .leaflet-marker-icon").popover("update");
            });

            // Scale and reposition markers when the map zooms.
            this.GalaxyMap.on("zoomend", function () {
                if (thisObj.GalaxyMap.getZoom() == thisObj.MaxZoom) {
                    // Zoom to cluster if reaching max zoom.
                    thisObj.galaxyZoomToCluster();
                    thisObj.GalaxyMap.zoomOut();
                }
                else {
                    // Resize to current zoom level.
                    thisObj.resizeGalaxyMarkers();
                    $("#" + gmId + " .leaflet-marker-icon").popover("update");
                }
            });
        }

        // Update page settings.
        this.CurrentType = "galaxy";
        this.updateUrlParams("Milky Way", null, null);
        this.disablePopovers();
    };

    initialiseClusterMap = (clusterId) => {
        // Show the map.
        $("#" + this.GalaxyMapId).hide();
        $("#" + this.ClusterMapId).show();
        $("#" + this.SystemMapId).hide();

        if (!this.ClusterMap || !this.CurrentCluster || this.CurrentCluster.Id != clusterId || this.SystemChangedCluster) {
            var thisObj = this;
            this.SystemChangedCluster = false;

            // Only load the map if it needs to be loaded again.
            this.CurrentCluster = this.Clusters.filter(x => x.Id == clusterId)[0];
            this.ClusterMarkers = [];

            // Remove the previous cluster map.
            if (this.ClusterMap) {
                this.ClusterMap.remove();
            }

            this.ClusterMap = L.map(this.ClusterMapId, { minZoom: this.MinZoom, maxZoom: this.MaxZoom, crd: L.CRS.Simple, maxBounds: this.ClusterMapBounds });
            var clusterImg = L.imageOverlay(this.objectImagePath("cluster", this.CurrentCluster, false), this.ClusterMapBounds);
            clusterImg.addTo(this.ClusterMap);
            this.ClusterMap.fitBounds(this.ClusterMapBounds);
            this.ClusterMap.zoomIn();

            for (var i in this.CurrentCluster.Systems) {
                var system = this.CurrentCluster.Systems[i];
                var marker = L.marker([this.CY(system.Y), this.CX(system.X)], {
                    icon: L.icon({ 
                        iconUrl: this.objectImagePath("system", system, true), 
                        iconSize: this.IconSizes[this.ClusterMap.getZoom()] 
                    }), 
                    title: system.Name, 
                    systemId: system.Id,
                    clusterId: this.CurrentCluster.Id,
                    riseOnHover: true
                });
                marker.on("click", function () {
                    thisObj.initialiseSystemMap(this.options.systemId, this.options.clusterId);
                });
                this.ClusterMarkers.push(marker);
                marker.addTo(this.ClusterMap);
            }
            this.ShowClusterMarkers = true;

            // Add custom map controls.
            var controls = new this.clusterToggleControls();
            controls.addTo(this.ClusterMap);

            // Enable marker popovers.
            $("#" + this.ClusterMapId + " .leaflet-marker-icon").popover({
                trigger: "hover"
            });

            // Force popovers to stay open if they have been enabled.
            $("#" + this.ClusterMapId + " .leaflet-marker-icon").on("hidden.bs.popover", function () {
                if (thisObj.ShowPopovers) {
                   $(this).popover("show");
                }
            });

            // Reposition popovers when the map moves.
            var cmId = this.ClusterMapId;
            this.ClusterMap.on("moveend", function () {
                $("#" + cmId + " .leaflet-marker-icon").popover("update");
            });

            // Scale and reposition markers when the map zooms.
            this.ClusterMap.on("zoomend", function () {
                if (thisObj.ClusterMap.getZoom() == thisObj.MaxZoom) {
                    // Zoom to system if reaching max zoom.
                    thisObj.clusterZoomToSystem();
                    thisObj.ClusterMap.zoomOut();
                }
                else if (thisObj.ClusterMap.getZoom() == thisObj.MinZoom) {
                    // Return to the galaxy map.
                    thisObj.clusterZoomToGalaxy();
                    thisObj.ClusterMap.zoomIn();
                }
                else {
                    // Resize to current zoom level.
                    thisObj.resizeClusterMarkers();
                    $("#" + cmId + " .leaflet-marker-icon").popover("update");
                }
            });
        }

        // Update page settings.
        this.CurrentType = "cluster";
        this.updateUrlParams(this.CurrentCluster.Name, null, clusterId);
        this.disablePopovers();
    };

    initialiseSystemMap = (systemId, clusterId) => {
        $("#" + this.GalaxyMapId).hide();
        $("#" + this.ClusterMapId).hide();
        $("#" + this.SystemMapId).show();

        if (!this.SystemMap || !this.CurrentSystem || this.CurrentSystem.Id != systemId) {
            var thisObj = this;

            // Only load the map if it needs to be loaded again.
            if (!this.CurrentCluster || this.CurrentCluster.Id != clusterId) {
                this.CurrentCluster = this.Clusters.filter(x => x.Id == clusterId)[0];
                this.SystemChangedCluster = true;
            }
            this.CurrentSystem = this.CurrentCluster.Systems.filter(x => x.Id == systemId)[0];
            this.SystemMarkers = [];
            this.SystemOrbits = [];

            // Remove the previous cluster map.
            if (this.SystemMap) {
                this.SystemMap.remove();
            }

            this.SystemMap = L.map(this.SystemMapId, { minZoom: this.MinZoom, maxZoom: this.MaxZoom, crd: L.CRS.Simple, maxBounds: this.SystemMapBounds });
            var systemImg = L.imageOverlay(this.objectImagePath("system", this.CurrentSystem, false), this.SystemMapBounds);
            systemImg.addTo(this.SystemMap);
            this.SystemMap.fitBounds(this.SystemMapInitialBounds);
            this.SystemMap.zoomIn();

            for (var i in this.CurrentSystem.Planets) {
                var planet = this.CurrentSystem.Planets[i];
                var starScale = planet.Type == "Star";
                var asteroidBelt = planet.AsteroidBelt == true;
                var altScale = this.scaleObjectRadius(planet);
                var scale = this.scaleObjectIcon(planet.Scale, starScale);
                var size = this.IconSizes[this.SystemMap.getZoom()];
                if (planet.Scale > 0) {
                    var marker = L.marker([this.CY(planet.Y), this.CX(planet.X)], {
                        icon: L.icon({ iconUrl: this.objectImagePath("planet", planet, true), iconSize: [ size[0] * scale, size[1] * scale ] }), 
                        title: planet.Name, 
                        planetId: planet.Id,
                        systemId: this.CurrentSystem.Id,
                        clusterId: this.CurrentCluster.Id,
                        star: starScale,
                        scale: scale,
                        riseOnHover: true
                    });
                    marker.on("click", function () {
                        var id = this.options.planetId;
                        var sId = this.options.systemId;
                        var cId = this.options.clusterId;
                        thisObj.initialiseObjectInfoPopup(id, sId, cId);
                    });
                    this.SystemMarkers.push(marker);
                    marker.addTo(this.SystemMap);
                }

                var center = L.latLng(0,0);
                var loc = L.latLng(this.CY(planet.Y), this.CX(planet.X));
                var distance = center.distanceTo(loc);
                if (!Object.hasOwn(planet, "ShowOrbit") || planet.ShowOrbit == true) {
                    if (Object.hasOwn(planet, "Orbits")) {
                        var orb = planet.Orbits;
                        var cen = this.CurrentSystem.Planets.filter(x => x.Id == orb)[0];
                        center = L.latLng(this.CY(cen.Y), this.CX(cen.X));
                        distance = center.distanceTo(loc);
                    }
                    var orbit = L.circle(center, distance, {
                        color: this.PlanetOrbitColour,
                        weight: 1,
                        fill: false,
                        dashArray: asteroidBelt ? "50 25" : null
                    });
                    this.SystemOrbits.push(orbit);
                    orbit.addTo(this.SystemMap);
                }
            }
            this.ShowSystemMarkers = true;
            this.ShowSystemOrbits = true;

            // Add custom map controls.
            var controls = new this.systemToggleControls();
            controls.addTo(this.SystemMap);

            // Enable marker popovers.
            $("#" + this.SystemMapId + " .leaflet-marker-icon").popover({
                trigger: "hover"
            });

            // Force popovers to stay open if they have been enabled.
            $("#" + this.SystemMapId + " .leaflet-marker-icon").on("hidden.bs.popover", function () {
                if (thisObj.ShowPopovers) {
                   $(this).popover("show");
                }
            });

            var smId = this.SystemMapId;
            this.SystemMap.on("moveend", function () {
                $("#" + smId + " .leaflet-marker-icon").popover("update");
            });

            this.SystemMap.on("zoomend", function () {
                if (thisObj.SystemMap.getZoom() == thisObj.MinZoom) {
                    thisObj.systemZoomToCluster();
                    thisObj.SystemMap.zoomIn();
                }
                else {
                    thisObj.resizeSystemMarkers();
                    $("#" + smId + " .leaflet-marker-icon").popover("update");
                }
            });
        }
        
        this.CurrentType = "system";
        this.updateUrlParams(this.CurrentSystem.Name, systemId, clusterId);
        this.disablePopovers();
    };

    initialiseObjectInfoPopup = (planetId, systemId, clusterId) => {
        var c = this.Clusters.filter(x => x.Id == clusterId)[0];
        var s = c.Systems.filter(x => x.Id == systemId)[0];
        var o = s.Planets.filter(x => x.Id == planetId)[0];
        if (o.Description && o.Description != "") {
            $("#object-type").html(o.Type);
            $("#object-img").attr("src", this.objectImagePath("planet", o, false));
            $("#object-title").html(o.Name);
            $("#info-table").remove();
            $("#object-content").html(o.Description);
            if (o.Stats) {
                var statTable = $("<table id='info-table' class='table card-body w-100 m-0 text-desc'></table>");
                var statRows = $("<tbody></tbody>");
                for (var k in o.Stats) {
                    var headRow = $("<tr><td>" + k + "</td><td>" + o.Stats[k] + "</td></tr>");
                    statRows.append(headRow);
                }
                statTable.append(statRows);
                $("#info-body").append(statTable);
            }
            $("#object-pane").show();
        }
    };

    initialiseSearchFunction = () => {
        var thisObj = this;
        var regions = ["Attican Traverse","Earth Alliance Space","Inner Council Space","Outer Council Space","Terminus Systems"];
        var systemGroups = [];
        var objGroups = [];
        for (var ri in regions) {
            var r = regions[ri];
            var cl = this.Clusters.filter(x => x.Region == r).sort(this.searchSortFunction);
            var clusterGrp = $("<optgroup label=\"" + r + "\"></optgroup>");
            for (var ci in cl) {
                var c = cl[ci];
                var cItm = $("<option value='" + c.Id + "' data-content=\"" + c.Name + "<span class='d-none'>" + r + "</span>\" data-group='cluster'>" + c.Name + "</option>");
                clusterGrp.append(cItm);

                if (c.Systems.length > 0) {
                    var systemGrp = $("<optgroup label=\"" + c.Name + "\"></optgroup>");
                    var sl = c.Systems.sort(this.searchSortFunction);
                    for (var si in sl) {
                        var s = sl[si];
                        var sItm = $("<option value='" + s.Id + "' data-content=\"" + s.Name + "<span class='d-none'>" + r + " " + c.Name + "</span>\" data-cluster='" + c.Id + "' data-group='system'></option>");
                        systemGrp.append(sItm);

                        if (Object.hasOwn(s, "Planets")) {
                            var objGroup = $("<optgroup = label='" + s.Name + "'></optgroup>");
                            var ol = s.Planets.sort(this.searchSortFunction);
                            for (var oi in ol) {
                                var o = ol[oi];
                                if (o.Type != "Star" && o.Type != "Asteroid Belt" && o.Name != null && o.Name != "null") {
                                var oItm = $("<option value='" + o.Id + "' data-content=\"" + o.Name + "<span class='d-none'>" + r + " " + c.Name + " " + s.Name + "</span>\" data-cluster='" + c.Id + "' data-system='" + s.Id + "' data-group='planet'></option>")
                                objGroup.append(oItm);
                                }
                            } 
                            objGroups.push(objGroup);
                        }
                    }
                    systemGroups.push(systemGrp);
                }
            }
            $("#galaxy-search").append(clusterGrp);
        }
        for (var sgi in systemGroups) {
            var sg = systemGroups[sgi];
            $("#galaxy-search").append(sg);
        }
        for (var ogi in objGroups) {
            var og = objGroups[ogi];
            $("#galaxy-search").append(og);
        }
        
        $("#galaxy-search").selectpicker();
        $("#galaxy-search-btn").click(function () {
            var val = $('#galaxy-search :selected').val();
            var group = $('#galaxy-search :selected').attr('data-group');
            var clusterId = $('#galaxy-search :selected').attr('data-cluster');
            var systemId = $('#galaxy-search :selected').attr('data-system');
            thisObj.zoomToItem(val, group, systemId, clusterId);
        });
    };

    initialiseBrowseFunction = () => {
        var thisObj = this;
        var columns = [
            { title: "", orderable: false, width: 72 },
            { title: "Name" },
            { title: "Type" },
            { title: "System" },
            { title: "Cluster" },
            { title: "Region" }
        ];

        var dataSet = [];
        for (var c in this.Clusters) 
        {
            var cluster = this.Clusters[c];
            dataSet.push([
                "<img src='img/" + cluster.Marker + "' default-src='" + this.defaultImagePath("cluster", cluster, true) + "'  style='width:28px;height:28px;' onerror=\"" + this.ImageSwitchFunc + "\" />"
                + "&nbsp;<button class='btn btn-sm btn-outline-info planet-visit-btn' data-val='" + cluster.Id + "' data-group='cluster' data-cluster='' data-system=''><i class='fas fa-angles-right'></i></button>",
                cluster.Name,
                "Cluster",
                "",
                "",
                cluster.Region
            ]);
    
            for (var s in cluster.Systems) 
            {
                var system = cluster.Systems[s];
                dataSet.push([
                    "<img src='img/" + system.Marker + "' default-src='" + this.defaultImagePath("system", system, true) + "'  style='width:28px;height:28px;' onerror=\"" + this.ImageSwitchFunc + "\" />"
                    + "&nbsp;<button class='btn btn-sm btn-outline-info planet-visit-btn' data-val='" + system.Id + "' data-group='system' data-cluster='" + cluster.Id + "' data-system=''><i class='fas fa-angles-right'></i></button>",
                    system.Name,
                    "System",
                    "",
                    cluster.Name,
                    cluster.Region
                ]);
    
                for (var p in system.Planets) 
                {
                    var planet = system.Planets[p];
                    var btn = "<button class='btn btn-sm btn-outline-info planet-visit-btn' data-val='" + planet.Id + "' data-group='planet' data-cluster='" + cluster.Id + "' data-system='" + system.Id + "'><i class='fas fa-angles-right'></i></button>";
                    if (planet.Description) {
                        btn = 
                        "<div class='btn-group btn-group-sm'>" + btn + 
                        "<button class='btn btn-sm btn-outline-info planet-info-btn' data-val='" + planet.Id + "' data-cluster='" + cluster.Id + "' data-system='" + system.Id + "'><i class='fas fa-info'></i></button>" +
                        "</div>";
                    }
                    if (planet.Type != "Asteroid Belt" && planet.Type != "") {
                        dataSet.push([
                            "<img src='img/" + planet.Marker + "' default-src='" + this.defaultImagePath("planet", planet, true) + "'  style='width:28px;height:28px;' onerror=\"" + this.ImageSwitchFunc + "\" />"
                            + "&nbsp;" + btn,      
                            planet.Name,
                            planet.Type,
                            system.Name,
                            cluster.Name,
                            cluster.Region           
                        ]);
                    }
                }
            }
        }

        var table = $("#table-obj").DataTable({
            data: dataSet,
            columns: columns,
            responsive: true,
            autoWidth: false,
            drawCallback: function(settings) {
                $(".planet-visit-btn").click(function () {
                    thisObj.toggleBrowseTable();
                    var val = $(this).data("val");
                    var group = $(this).data("group");
                    var clusterId = $(this).data("cluster");
                    var systemId = $(this).data("system");
                    thisObj.zoomToItem(val, group, systemId, clusterId);
                }); 
                $(".planet-info-btn").click(function () {
                    var val = $(this).data("val");
                    var clusterId = $(this).data("cluster");
                    var systemId = $(this).data("system");
                    thisObj.initialiseObjectInfoPopup(val, systemId, clusterId);
                });
            }
        });

        $('#table-obj thead th').each( function (i) {
            var title = $('#table-obj thead th').eq($(this).index()).text();
            if (title != "Image" && title != "Visit" && title != "") {
                var filter = null;
                if (title == "Type") {
                    filter = $("<select id='type-table-filter' class='form-control form-control-sm col m-1 selectpicker' data-index='" + i + "' data-live-search='true' data-style='btn-outline-secondary bg-dark'></select>");
                    filter.append($("<option value=''>Type</option>"));
                    var typeOpts = dataSet.map(function (d) { return d[2]; }).filter(thisObj.uniqueFilter).filter(x => x != "" && x != null);
                    for (var t in typeOpts) {
                        filter.append($("<option value='" + typeOpts[t] + "'>" + typeOpts[t] + "</option>"));
                    }
                    filter.on('change', function () {
                        table.column($(this).data('index')).search(this.value).draw();
                    });
                }
                else if (title == "System") {
                    filter = $("<select id='system-table-filter' class='form-control form-control-sm col m-1 selectpicker' data-index='" + i + "' data-live-search='true' data-style='btn-outline-secondary bg-dark'></select>");
                    filter.append($("<option value=''>System</option>"));
                    var typeOpts = dataSet.map(function (d) { return d[3]; }).filter(thisObj.uniqueFilter).filter(x => x != "" && x != null);
                    for (var t in typeOpts) {
                        filter.append($("<option value='" + typeOpts[t] + "'>" + typeOpts[t] + "</option>"));
                    }
                    filter.on('change', function () {
                        table.column($(this).data('index')).search(this.value).draw();
                    });
                }
                else if (title == "Cluster") {
                    filter = $("<select id='cluster-table-filter' class='form-control form-control-sm col m-1 selectpicker' data-index='" + i + "' data-live-search='true' data-style='btn-outline-secondary bg-dark'></select>");
                    filter.append($("<option value=''>Cluster</option>"));
                    var typeOpts = dataSet.map(function (d) { return d[4]; }).filter(thisObj.uniqueFilter).filter(x => x != "" && x != null);
                    for (var t in typeOpts) {
                        filter.append($("<option value='" + typeOpts[t] + "'>" + typeOpts[t] + "</option>"));
                    }
                    filter.on('change', function () {
                        table.column($(this).data('index')).search(this.value).draw();
                    });
                }
                else if (title == "Region") {
                    filter = $("<select id='region-table-filter' class='form-control form-control-sm col m-1 selectpicker' data-index='" + i + "' data-live-search='true' data-style='btn-outline-secondary bg-dark'></select>");
                    filter.append($("<option value=''>Region</option>"));
                    var typeOpts = dataSet.map(function (d) { return d[5]; }).filter(thisObj.uniqueFilter).filter(x => x != "" && x != null);
                    for (var t in typeOpts) {
                        filter.append($("<option value='" + typeOpts[t] + "'>" + typeOpts[t] + "</option>"));
                    }
                    filter.on('change', function () {
                        table.column($(this).data('index')).search(this.value).draw();
                    });
                }
                else {
                    filter = $('<input class="form-control form-control-sm col m-1" type="text" placeholder="'+title+'" data-index="'+i+'" />');
                    filter.on('keyup', function () {
                        table.column($(this).data('index')).search(this.value).draw();
                    });
                }
                $("#table-filter").append(filter);
                if (title == "Type") {
                    $("#type-table-filter").selectpicker();
                } 
                if (title == "System") {
                    $("#system-table-filter").selectpicker();
                } 
                if (title == "Cluster") {
                    $("#cluster-table-filter").selectpicker();
                } 
                if (title == "Region") {
                    $("#region-table-filter").selectpicker();
                } 
            }
        });

        $("#table-search-btn").click(function () {
            thisObj.toggleBrowseTable();
        });

        $("#table-close-btn").click(function () {
            thisObj.toggleBrowseTable();
        });
    }
    
    toggleBrowseTable = () => {
        $("#table-pane").toggle();
    };

    uniqueFilter = (value, index, array) => {
        return array.indexOf(value) === index;
    };

    zoomToItem = (itemId, itemType, systemId, clusterId) => {
        if (itemId == "") {
            this.initialiseGalaxyMap();
        }
        else if (itemType == "cluster") {
            if (this.CurrentType != "galaxy") {
                this.initialiseGalaxyMap();
            }
            var marker = this.GalaxyMarkers.filter(x => x.options.clusterId == itemId)[0];
            this.GalaxyMap.flyTo(marker.getLatLng(), 12);
            var icon = $(".leaflet-marker-icon[data-bs-original-title='" + marker.options.title + "']");
            icon.popover("show");
        }
        else if (itemType == "system") {
            if (this.CurrentType != "cluster" || !this.CurrentCluster || this.CurrentCluster.Id != clusterId) {
                this.initialiseClusterMap(clusterId);
            }
            var marker = this.ClusterMarkers.filter(x => x.options.systemId == itemId)[0];
            this.ClusterMap.flyTo(marker.getLatLng(), 12);
            var icon = $(".leaflet-marker-icon[data-bs-original-title='" + marker.options.title + "']");
            icon.popover("show");
        }
        else if (itemType == "planet") {
            if (this.CurrentType != "system" || !this.CurrentSystem || this.CurrentSystem.Id != systemId) {
                this.initialiseSystemMap(systemId, clusterId);
            }
            var marker = this.SystemMarkers.filter(x => x.options.planetId == itemId)[0];
            this.SystemMap.flyTo(marker.getLatLng(), 12);
            var icon = $(".leaflet-marker-icon[data-bs-original-title='" + marker.options.title + "']");
            icon.popover("show");
        }
    };

    searchSortFunction = (x, y) => {
        if (x.Name < y.Name) {
            return -1;
        }
        if (x.Name > y.Name) {
            return 1;
        }
        return 0;
    }

    scaleObjectIcon = (scale, starScale) => {
        var multi = ((scale - 1) / 3) + 1;
        if (starScale) {
            multi = scale + 1;
        }
        return multi;
    };

    scaleObjectRadius = (object) => {
        if (Object.hasOwn(object, "Stats") && object.Stats) {
            var r = object.Stats["Radius"];
            if (r) {
                var rs = r.split(" ")[0];
                var rsv = rs.replace(",", "");
                try {
                    var ri = parseInt(rsv);
                    var scale = (((ri - 3000)/2.5)+3000) / 3000;
                    return scale;
                }
                catch {
                    return object.Scale;
                }
            }
        }
        return object.Scale;
    }

    togglePopovers = () => {
        if (this.ShowPopovers) {
            $(".leaflet-marker-icon").popover("hide");
            this.ShowPopovers = false;
        }
        else {
            $(".leaflet-marker-icon").popover("show");
            this.ShowPopovers = true;
        }
    };

    toggleGalaxyRegions = () => {
        if (this.ShowGalaxyRegions) {
            this.GalaxyRegionLayer.remove();
            this.ShowGalaxyRegions = false;
            if (this.ShowGalaxyColours) {
                this.toggleGalaxyColours();
            }
            if (this.ShowGalaxyLabels) {
                this.toggleGalaxyLabels();
            }
        }
        else {
            this.GalaxyRegionLayer.addTo(this.GalaxyMap);
            this.ShowGalaxyRegions = true;
        }
    };

    toggleGalaxyColours = () => {
        if (this.ShowGalaxyColours) {
            this.GalaxyColourLayer.remove();
            this.ShowGalaxyColours = false;
        }
        else {
            this.GalaxyColourLayer.addTo(this.GalaxyMap);
            this.ShowGalaxyColours = true;
            if (!this.ShowGalaxyRegions) {
                this.toggleGalaxyRegions();
            }
        }
    };

    toggleGalaxyLabels = () => {
        if (this.ShowGalaxyLabels) {
            this.GalaxyLabelLayer.remove();
            this.ShowGalaxyLabels = false;
        }
        else {
            this.GalaxyLabelLayer.addTo(this.GalaxyMap);
            this.ShowGalaxyLabels = true;
            if (!this.ShowGalaxyRegions) {
                this.toggleGalaxyRegions();
            }
        }
    };

    toggleGalaxyMarkers = () => {
        if (this.ShowGalaxyMarkers) {
            for (var i in this.GalaxyMarkers) {
                this.GalaxyMarkers[i].remove();
            }
            this.ShowGalaxyMarkers = false;
            if (this.ShowPopovers) {
                this.togglePopovers();
            }
        }
        else {
            for (var i in this.GalaxyMarkers) {
                this.GalaxyMarkers[i].addTo(this.GalaxyMap);
            }
            this.ShowGalaxyMarkers = true;
        }
    };

    toggleGalaxyConnections = () => {
        if (this.ShowGalaxyConnections) {
            for (var i in this.GalaxyConnections) {
                this.GalaxyConnections[i].remove();
            }
            this.ShowGalaxyConnections = false;
        }
        else {
            for (var i in this.GalaxyConnections) {
                this.GalaxyConnections[i].addTo(this.GalaxyMap);
            }
            this.ShowGalaxyConnections = true;
        }
    };
    
    toggleSystemOrbits = () => {
        if (this.ShowSystemOrbits) {
            for (var i in this.SystemOrbits) {
                this.SystemOrbits[i].remove();
            }
            this.ShowSystemOrbits = false;
        }
        else {
            for (var i in this.SystemOrbits) {
                this.SystemOrbits[i].addTo(this.SystemMap);
            }
            this.ShowSystemOrbits = true;
        }
    };

    resizeGalaxyMarkers = () => {
        var zoomLevel = this.GalaxyMap.getZoom();
        var iconSize = this.IconSizes[zoomLevel];
        for (var ix in this.GalaxyMarkers) {
            var icon = this.GalaxyMarkers[ix].getIcon();
            icon.options.iconSize = iconSize;
            this.GalaxyMarkers[ix].setIcon(icon);
        }
    };

    resizeClusterMarkers = () => {
        var zoomLevel = this.ClusterMap.getZoom();
        var iconSize = this.IconSizes[zoomLevel];
        for (var ix in this.ClusterMarkers) {
            var icon = this.ClusterMarkers[ix].getIcon();
            icon.options.iconSize = iconSize;
            this.ClusterMarkers[ix].setIcon(icon);
        }
    };

    resizeSystemMarkers = () => {
        var zoomLevel = this.SystemMap.getZoom();
        var iconSize = this.IconSizes[zoomLevel];
        for (var ix in this.SystemMarkers) {
            var marker = this.SystemMarkers[ix];
            var icon = marker.getIcon();
            var scale = marker.options.scale;
            icon.options.iconSize =  [iconSize[0] * scale, iconSize[1] * scale];
            marker.setIcon(icon);
        }
    };

    galaxyZoomToCluster = () => {
        var clusterId = this.centralGalaxyMarker();
        this.initialiseClusterMap(clusterId);
    };

    clusterZoomToSystem = () => {
        var systemId = this.centralClusterMarker();
        this.initialiseSystemMap(systemId, this.CurrentCluster.Id);
    };

    clusterZoomToGalaxy = () => {
        this.initialiseGalaxyMap();
    };

    systemZoomToCluster = () => {
        this.initialiseClusterMap(this.CurrentCluster.Id);
    }

    centralGalaxyMarker = () => {
        var closest = 1000000;
        var center = this.GalaxyMap.getBounds();
        var mid = [ (center.getNorth() + center.getSouth())/2, (center.getEast() + center.getWest())/2 ];
        var bestMarker = null;
        for (var m in this.GalaxyMarkers) {
            var dist = this.GalaxyMarkers[m].getLatLng().distanceTo(mid);
            if (dist < closest) {
                closest = dist;
                bestMarker = this.GalaxyMarkers[m];
            }
        }
        return bestMarker.options.clusterId;
    };

    centralClusterMarker = () => {
        var closest = 1000000;
        var center = this.ClusterMap.getBounds();
        var mid = [ (center.getNorth() + center.getSouth())/2, (center.getEast() + center.getWest())/2 ];
        var bestMarker = null;
        for (var m in this.ClusterMarkers) {
            var dist = this.ClusterMarkers[m].getLatLng().distanceTo(mid);
            if (dist < closest) {
                closest = dist;
                bestMarker = this.ClusterMarkers[m];
            }
        }
        return bestMarker.options.systemId;
    };

    updateUrlParams = (name, systemId, clusterId) => {
        var url = new URL(window.location.href);
        if (clusterId) {
            url.searchParams.set("cluster", clusterId);
        }
        else if (url.searchParams.has("cluster")) {
            url.searchParams.delete("cluster"); 
        }
        if (systemId) {
            url.searchParams.set("system", systemId);
        }
        else if (url.searchParams.has("system")) {
            url.searchParams.delete("system"); 
        }
        var newUrl = url.href; 
        window.history.pushState(null, name, newUrl);
    };

    disablePopovers = () => {
        $(".leaflet-marker-icon").popover("hide");
        this.ShowPopovers = false;
    };

    CX = (x) => {
        return ((x / 1000) * 2) - 1;
    };

    CY = (y) => {
        return (1 - ((y / 1000) * 2));
    };

    defaultImagePath = (type, item, marker) => {
        var path = "img\\";
        var mark = marker ? "_marker" : "";
        var def = path + "object" + mark + "\\default.png";
        switch (type) {
            case "cluster":
                def = path + "cluster" + mark + "\\default." + (marker ? "png" : "jpg");
                break;
            case "system":
                def = path + "system" + mark + "\\default." + (marker ? "png" : "jpg");
                break;
            case "planet":
                switch (item.Type) {
                    case "Star":
                        def = path + "star" + mark + "\\default.png";
                        break;
                    case "Garden Planet":
                        def = path + "planet" + mark + "\\default_garden.png";
                        break;
                    case "Giant Ice Planet":
                        def = path + "planet" + mark + "\\default_ice.png";
                        break;
                    case "Moon":
                    case "Planet":
                    case "Rock Planet":
                        def = path + "planet" + mark + "\\default_rocky.png";
                        break;
                    case "Giant Jovian Planet":
                        def = path + "planet" + mark + "\\default_jovian.png";
                        break;
                    case "Post Garden":
                        def = path + "planet" + mark + "\\default_post.png";
                        break;
                    case "Desert Planet":
                        def = path + "planet" + mark + "\\default_desert.png";
                        break;
                    case "Tidal Lock":
                        def = path + "planet" + mark + "\\default_tidal.png";
                        break;
                    case "Ocean Planet":
                        def = path + "planet" + mark + "\\default_ocean.png";
                        break;
                    case "Brown Dwarf":
                    case "Giant Pegasid Planet":
                        def = path + "planet" + mark + "\\default_dwarf.png";
                        break;
                    default:
                        def = path + "object" + mark + "\\default.png";
                        break;
                }
                break;
        }
        return def;
    };

    objectImagePath = (type, item, marker) => {
        var path = "img\\";
        var def = this.defaultImagePath(type, item, marker);
        if ((marker && Object.hasOwn(item, "Marker") && item.Marker != null) || (!marker && Object.hasOwn(item, "Image") && item.Image != null)) {
            
            var dPath = path + (marker ? item.Marker : item.Image);
            if (this.MissingImages.includes(dPath)) {
                return def;
            }
            var http = new XMLHttpRequest();
            http.open('HEAD', dPath, false);
            http.send();
            if (http.status != 404) {
                return dPath;
            }
            else {
                this.MissingImages.push(dPath);
                return def;
            }
        }
        return def;
    };

    galaxyToggleControls = L.Control.extend({
        galaxyMap: this,
        options: { position: 'topleft' },
        onAdd: function (map) {
            var thisObj = this.galaxyMap;
            var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
    
            var labelToggleBtn = L.DomUtil.create('a', 'leaflet-control-button label-toggle-btn', container);
            labelToggleBtn.innerHTML = "<i class='fa-solid fa-tag'></i>";
            labelToggleBtn.title = "Toggle Labels";
            L.DomEvent.disableClickPropagation(labelToggleBtn);
            L.DomEvent.on(labelToggleBtn, 'click', function(){
                thisObj.togglePopovers();
            });
    
            var markerToggleBtn = L.DomUtil.create('a', 'leaflet-control-button label-toggle-btn', container);
            markerToggleBtn.innerHTML = "<i class='fa-solid fa-location-dot'></i>";
            markerToggleBtn.title = "Toggle Markers";
            L.DomEvent.disableClickPropagation(markerToggleBtn);
            L.DomEvent.on(markerToggleBtn, 'click', function(){
                thisObj.toggleGalaxyMarkers();
            });
    
            var connectionToggleBtn = L.DomUtil.create('a', 'leaflet-control-button label-toggle-btn', container);
            connectionToggleBtn.innerHTML = "<i class='fa-solid fa-arrows-up-down'></i>";
            connectionToggleBtn.title = "Toggle Connections";
            L.DomEvent.disableClickPropagation(connectionToggleBtn);
            L.DomEvent.on(connectionToggleBtn, 'click', function(){
                thisObj.toggleGalaxyConnections();
            });
    
            var regionToggleBtn = L.DomUtil.create('a', 'leaflet-control-button label-toggle-btn', container);
            regionToggleBtn.innerHTML = "<i class='fa-regular fa-circle'></i>";
            regionToggleBtn.title = "Toggle Region Outline";
            L.DomEvent.disableClickPropagation(regionToggleBtn);
            L.DomEvent.on(regionToggleBtn, 'click', function(){
                thisObj.toggleGalaxyRegions();
            });
    
            var coloursToggleBtn = L.DomUtil.create('a', 'leaflet-control-button label-toggle-btn', container);
            coloursToggleBtn.innerHTML = "<i class='fa-solid fa-circle'></i>";
            coloursToggleBtn.title = "Toggle Region Colours";
            L.DomEvent.disableClickPropagation(coloursToggleBtn);
            L.DomEvent.on(coloursToggleBtn, 'click', function(){
                thisObj.toggleGalaxyColours();
            });
    
            var labelsToggleBtn = L.DomUtil.create('a', 'leaflet-control-button label-toggle-btn', container);
            labelsToggleBtn.innerHTML = "<i class='fa-solid fa-font'></i>";
            labelsToggleBtn.title = "Toggle Region Labels";
            L.DomEvent.disableClickPropagation(labelsToggleBtn);
            L.DomEvent.on(labelsToggleBtn, 'click', function(){
                thisObj.toggleGalaxyLabels();
            });
    
    
            return container;
        }
    });

    clusterToggleControls = L.Control.extend({
        galaxyMap: this,
        options: {
            position: 'topleft'
        },
        onAdd: function (map) {
            var thisObj = this.galaxyMap;
            var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
    
            var backBtn = L.DomUtil.create('a', 'leaflet-control-button label-toggle-btn', container);
            backBtn.innerHTML = "<i class='fa-solid fa-angles-left'></i>";
            backBtn.title = "Back";
            L.DomEvent.disableClickPropagation(backBtn);
            L.DomEvent.on(backBtn, 'click', function(){
                thisObj.initialiseGalaxyMap();
            });
    
            var labelToggleBtn = L.DomUtil.create('a', 'leaflet-control-button label-toggle-btn', container);
            labelToggleBtn.innerHTML = "<i class='fa-solid fa-tag'></i>";
            labelToggleBtn.title = "Toggle Labels";
            L.DomEvent.disableClickPropagation(labelToggleBtn);
            L.DomEvent.on(labelToggleBtn, 'click', function(){
                thisObj.togglePopovers();
            });
    
            return container;
        }
    });

    systemToggleControls = L.Control.extend({
        galaxyMap: this,
        options: {
            position: 'topleft'
        },
        onAdd: function (map) {
            var thisObj = this.galaxyMap;
            var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
    
            var backBtn = L.DomUtil.create('a', 'leaflet-control-button label-toggle-btn', container);
            backBtn.innerHTML = "<i class='fa-solid fa-angles-left'></i>";
            backBtn.title = "Back";
            L.DomEvent.disableClickPropagation(backBtn);
            L.DomEvent.on(backBtn, 'click', function(){
                thisObj.initialiseClusterMap(thisObj.CurrentCluster.Id);
            });
    
            var labelToggleBtn = L.DomUtil.create('a', 'leaflet-control-button label-toggle-btn', container);
            labelToggleBtn.innerHTML = "<i class='fa-solid fa-tag'></i>";
            labelToggleBtn.title = "Toggle Labels";
            L.DomEvent.disableClickPropagation(labelToggleBtn);
            L.DomEvent.on(labelToggleBtn, 'click', function(){
                thisObj.togglePopovers();
            });
    
            var orbitToggleBtn = L.DomUtil.create('a', 'leaflet-control-button label-toggle-btn', container);
            orbitToggleBtn.innerHTML = "<i class='fa-regular fa-circle'></i>";
            orbitToggleBtn.title = "Toggle Orbits";
            L.DomEvent.disableClickPropagation(orbitToggleBtn);
            L.DomEvent.on(orbitToggleBtn, 'click', function(){
                thisObj.toggleSystemOrbits();
            });
            return container;
        }
    });
}