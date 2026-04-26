/* config.js - 全局配置(供其它脚本引用) */

window.AppConfig = {
  mapCenter: [36.1947, 117.1297],
  mapZoom: 14,
  tileUrl: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  tileAttribution: "© OpenStreetMap contributors",

  dataPaths: {
    zones: "./data/zones.geojson",
    schools: "./data/schools.json",
    policies: "./data/policies.json",
    materials: "./data/materials.json",
    faq: "./data/faq.json",
  },

  zoneStyle: {
    default: {
      color: "#1E3A5F",
      weight: 2,
      fillColor: "#3388ff",
      fillOpacity: 0.2,
    },
    hover: {
      color: "#1E3A5F",
      weight: 2,
      fillColor: "#3388ff",
      fillOpacity: 0.35,
    },
    selected: {
      color: "#F0A04B",
      weight: 3,
      fillColor: "#F0A04B",
      fillOpacity: 0.45,
    },
  },

  texts: {
    defaultResultTip: "请点击地图上的学区或任意点位以查询学区信息。",
    noMatchTip:
      "该位置暂未匹配到示例学区,请尝试点击地图中彩色边界范围内的位置。",
    loadingTip: "数据加载中…",
    loadErrorTip:
      "数据加载失败。请确认通过 HTTP 服务运行(如 python -m http.server 5500),而不是直接双击 HTML。",
  },
};
