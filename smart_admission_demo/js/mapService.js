/* mapService.js - 地图服务(Leaflet 渲染 + Turf 点面判断) */

/*
 * 坐标顺序提醒(关键!容易混淆):
 * - GeoJSON coordinates:[经度, 纬度] (lng, lat)
 * - Leaflet setView / latlng:[纬度, 经度] (lat, lng)
 * - turf.point():[经度, 纬度] (lng, lat)
 * - Leaflet e.latlng → 传给 Turf 时必须转为 [e.latlng.lng, e.latlng.lat]
 */

window.MapService = (function () {
  var _map = null;
  var _selectedLayer = null;
  var _zonesData = null;
  var _zoneLayers = []; // [ { layer: L.Polygon, feature: GeoJSON Feature } ]
  var _onZoneSelected = null;
  var _onNoMatch = null;

  // 初始化地图
  // params = { zones, schools, policies, onZoneSelected, onNoMatch }
  function initMap(params) {
    var container = document.getElementById("mapContainer");
    if (!container) {
      console.error("地图容器 #mapContainer 未找到");
      return;
    }

    _zonesData = (params && params.zones) || {
      type: "FeatureCollection",
      features: [],
    };
    _onZoneSelected = params && params.onZoneSelected;
    _onNoMatch = params && params.onNoMatch;

    // 创建地图(中心使用 [lat, lng])
    _map = L.map(container).setView(
      window.AppConfig.mapCenter,
      window.AppConfig.mapZoom,
    );

    // 加载底图
    L.tileLayer(window.AppConfig.tileUrl, {
      attribution: window.AppConfig.tileAttribution,
      maxZoom: 19,
    }).addTo(_map);

    // 渲染学区
    if (_zonesData.features && _zonesData.features.length > 0) {
      _zonesData.features.forEach(function (feature) {
        addZoneLayer(feature);
      });
      // 自适应视野到所有学区
      try {
        var geoLayer = L.geoJSON(_zonesData);
        _map.fitBounds(geoLayer.getBounds(), { padding: [20, 20] });
      } catch (err) {
        console.warn("fitBounds 失败,使用默认中心:", err);
      }
    } else {
      console.warn("学区数据为空,仅显示底图");
    }

    // 监听地图点击(空白处或学区均会触发,但学区已 stopPropagation)
    _map.on("click", function (e) {
      handleMapClick(e);
    });
  }

  // 添加单个学区图层
  function addZoneLayer(feature) {
    var styles = window.AppConfig.zoneStyle;
    var geoLayer = L.geoJSON(feature, {
      style: function () {
        return styles.default;
      },
    });

    geoLayer.eachLayer(function (l) {
      _zoneLayers.push({ layer: l, feature: feature });

      // hover
      l.on("mouseover", function () {
        if (l !== _selectedLayer) l.setStyle(styles.hover);
      });
      l.on("mouseout", function () {
        if (l !== _selectedLayer) l.setStyle(styles.default);
      });

      // 点击(关键:阻止事件冒泡到 map)
      l.on("click", function (e) {
        L.DomEvent.stopPropagation(e);
        selectLayer(l, feature);
      });
    });

    geoLayer.addTo(_map);
  }

  // 选中某个学区
  function selectLayer(layer, feature) {
    var styles = window.AppConfig.zoneStyle;
    if (_selectedLayer && _selectedLayer !== layer) {
      _selectedLayer.setStyle(styles.default);
    }
    _selectedLayer = layer;
    layer.setStyle(styles.selected);
    if (typeof _onZoneSelected === "function") {
      _onZoneSelected(feature);
    }
  }

  // 处理空白处点击 → Turf 点面判断
  function handleMapClick(e) {
    if (
      !_zonesData ||
      !_zonesData.features ||
      _zonesData.features.length === 0
    ) {
      if (typeof _onNoMatch === "function") _onNoMatch();
      return;
    }

    // Leaflet e.latlng → Turf [lng, lat]
    var pt;
    try {
      pt = turf.point([e.latlng.lng, e.latlng.lat]);
    } catch (err) {
      console.error("turf.point 构造失败:", err);
      if (typeof _onNoMatch === "function") _onNoMatch();
      return;
    }

    var matchedEntry = null;
    for (var i = 0; i < _zoneLayers.length; i++) {
      var entry = _zoneLayers[i];
      try {
        if (turf.booleanPointInPolygon(pt, entry.feature)) {
          matchedEntry = entry;
          break;
        }
      } catch (err) {
        console.warn("booleanPointInPolygon 异常:", err);
      }
    }

    if (matchedEntry) {
      selectLayer(matchedEntry.layer, matchedEntry.feature);
    } else {
      // 取消之前的选中
      if (_selectedLayer) {
        _selectedLayer.setStyle(window.AppConfig.zoneStyle.default);
        _selectedLayer = null;
      }
      if (typeof _onNoMatch === "function") _onNoMatch();
    }
  }

  return {
    initMap: initMap,
  };
})();
